-- Intentional Ministries Accountability App — initial schema
-- Tables map 1:1 to the Data Model section of the blueprint.

create extension if not exists pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  cell_phone text,
  profile_image_url text,
  active_group_id uuid, -- FK added below, after groups exists
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  slug text not null unique,
  meeting_day int not null check (meeting_day between 0 and 6), -- 0=Sunday .. 6=Saturday (Postgres DOW)
  timezone text not null default 'America/Chicago',
  creator_id uuid not null references public.profiles (id),
  is_active boolean not null default true,
  resource_link_url text,
  resource_link_label text,
  -- meeting-day change is staged, not applied immediately, so an
  -- in-progress week is never disturbed (see set_group_meeting_day below)
  pending_meeting_day int check (pending_meeting_day between 0 and 6),
  pending_meeting_day_effective_after date,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_active_group_id_fkey
  foreign key (active_group_id) references public.groups (id) on delete set null;

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  role text not null check (role in ('admin', 'member')) default 'member',
  status text not null check (status in ('active', 'inactive', 'pending', 'removed')) default 'pending',
  joined_at timestamptz not null default now(),
  unique (user_id, group_id)
);

create index memberships_group_status_idx on public.memberships (group_id, status);

create table public.group_questions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  label_short text not null,
  label_description text not null,
  slot_number int not null check (slot_number between 1 and 5),
  goal_enabled boolean not null default false,
  unique (group_id, slot_number)
);

create table public.weekly_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  week_start_date date not null,
  rating_1 int check (rating_1 between 1 and 5),
  rating_2 int check (rating_2 between 1 and 5),
  rating_3 int check (rating_3 between 1 and 5),
  rating_4 int check (rating_4 between 1 and 5),
  rating_5 int check (rating_5 between 1 and 5),
  prayer_request text,
  updated_at timestamptz not null default now(),
  unique (user_id, group_id, week_start_date)
);

create index weekly_check_ins_group_week_idx on public.weekly_check_ins (group_id, week_start_date);

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER — used inside RLS policies
-- to avoid recursive policy evaluation on the memberships table)
-- ============================================================

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where group_id = p_group_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where group_id = p_group_id and user_id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.shares_group_with(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships m1
    join public.memberships m2 on m1.group_id = m2.group_id
    where m1.user_id = auth.uid() and m1.status = 'active'
      and m2.user_id = p_user_id and m2.status = 'active'
  );
$$;

-- lets a group admin read the profile of anyone with a membership row
-- (including 'pending') in a group they admin — needed so the approve/deny
-- screen can show a requester's name before they're an active member
create or replace function public.admin_can_see_profile(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships target
    where target.user_id = p_user_id
      and public.is_group_admin(target.group_id)
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_admin(uuid) from public;
revoke all on function public.shares_group_with(uuid) from public;
revoke all on function public.admin_can_see_profile(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_admin(uuid) to authenticated;
grant execute on function public.shares_group_with(uuid) to authenticated;
grant execute on function public.admin_can_see_profile(uuid) to authenticated;

-- ============================================================
-- WEEK / DEADLINE LOGIC — single source of truth, used by both
-- the app (via RPC) and the write-time lock trigger below.
-- ============================================================

-- Deadline for a given week, given the week's start date and a timezone
-- directly (defined first since current_week_start below depends on it).
create or replace function public.week_deadline_for(p_week_start date, p_timezone text)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select ((p_week_start + 6)::text || ' 23:59:59')::timestamp at time zone p_timezone;
$$;

create or replace function public.current_week_start(p_group_id uuid)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meeting_day int;
  v_timezone text;
  v_pending_day int;
  v_pending_effective_after date;
  v_pending_deadline timestamptz;
  v_today date;
  v_dow int;
  v_diff int;
begin
  select meeting_day, timezone, pending_meeting_day, pending_meeting_day_effective_after
    into v_meeting_day, v_timezone, v_pending_day, v_pending_effective_after
    from public.groups where id = p_group_id;

  if v_meeting_day is null then
    raise exception 'Group % not found', p_group_id;
  end if;

  -- Lazily promote a staged meeting-day change once the week it was
  -- requested during has locked. Never touches an in-progress week.
  if v_pending_day is not null then
    v_pending_deadline := public.week_deadline_for(v_pending_effective_after, v_timezone);
    if now() >= v_pending_deadline then
      update public.groups
        set meeting_day = v_pending_day,
            pending_meeting_day = null,
            pending_meeting_day_effective_after = null
        where id = p_group_id;
      v_meeting_day := v_pending_day;
    end if;
  end if;

  v_today := (now() at time zone v_timezone)::date;
  v_dow := extract(dow from v_today)::int;
  v_diff := (v_dow - v_meeting_day + 7) % 7;
  return v_today - v_diff;
end;
$$;

create or replace function public.week_deadline(p_group_id uuid, p_week_start date)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select public.week_deadline_for(p_week_start, timezone) from public.groups where id = p_group_id;
$$;

create or replace function public.is_week_editable(p_group_id uuid, p_week_start date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_week_start <> public.current_week_start(p_group_id) then
    return false;
  end if;
  return now() < public.week_deadline(p_group_id, p_week_start);
end;
$$;

revoke all on function public.current_week_start(uuid) from public;
revoke all on function public.week_deadline_for(date, text) from public;
revoke all on function public.week_deadline(uuid, date) from public;
revoke all on function public.is_week_editable(uuid, date) from public;
grant execute on function public.current_week_start(uuid) to authenticated;
grant execute on function public.week_deadline(uuid, date) to authenticated;
grant execute on function public.is_week_editable(uuid, date) to authenticated;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1) create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) generate a unique group code + slug before insert
create or replace function public.set_group_code_and_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt int := 0;
  v_code text;
  v_base_slug text;
begin
  if new.code is null then
    loop
      v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      exit when not exists (select 1 from public.groups where code = v_code);
      v_attempt := v_attempt + 1;
      if v_attempt > 20 then
        raise exception 'Could not generate a unique group code';
      end if;
    end loop;
    new.code := v_code;
  end if;

  if new.slug is null then
    v_base_slug := lower(regexp_replace(new.name, '[^a-zA-Z0-9]+', '-', 'g'));
    new.slug := v_base_slug || '-' || lower(substr(md5(random()::text), 1, 5));
  end if;

  return new;
end;
$$;

create trigger groups_before_insert
  before insert on public.groups
  for each row execute function public.set_group_code_and_slug();

-- 3) seed the group's 5 default questions right after it's created
create or replace function public.seed_default_questions(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_questions (group_id, label_short, label_description, slot_number, goal_enabled)
  values
    (p_group_id, 'God — My Daily Walk with God',
      'My daily walk with God as shown through my prayer life, time in Scripture, involvement in church community, serving others, spiritual conversations, and a consistent heart of gratitude.',
      1, false),
    (p_group_id, 'Family — Loving and Leading My Family',
      'Loving and leading my family through intentional time together, healthy communication, resolving conflict with grace, serving and encouraging one another, protecting family priorities, and making God a clear priority in our home.',
      2, false),
    (p_group_id, 'Work — Honoring God Through My Work',
      'My approach to work as reflected in maintaining healthy balance, pursuing growth and excellence, leading with integrity and influence, building positive workplace relationships, making ethical decisions, finding satisfaction in my work, and living out my faith on the job.',
      3, false),
    (p_group_id, 'Personal — Stewarding My Personal Life',
      'How I steward my personal life as reflected in caring for my physical and emotional health, managing my time and priorities well, pursuing personal growth, nurturing relationships, handling finances responsibly, and practicing gratitude and contentment.',
      4, false),
    (p_group_id, 'Purity — Purity and Moral Integrity',
      'My commitment to purity as reflected in guarding my thoughts, resisting temptation, maintaining moral integrity, choosing positive influences, being discerning with media, seeking accountability, and establishing healthy boundaries.',
      5, false);
end;
$$;

create or replace function public.seed_default_questions_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_questions(new.id);
  return new;
end;
$$;

create trigger groups_after_insert_seed_questions
  after insert on public.groups
  for each row execute function public.seed_default_questions_trigger();

-- seed_default_questions is only meant to run via the trigger above or
-- the reset_group_questions RPC below — not called directly by clients.
revoke all on function public.seed_default_questions(uuid) from public;

-- 4) enforce the deadline/lock server-side on every check-in write, and
-- (on UPDATE) that the row's identity columns never change — otherwise a
-- user could "move" their own row into another group/week via UPDATE
-- instead of INSERT. This is done here via a trigger, not column-level
-- GRANTs, because upsert's INSERT ... ON CONFLICT DO UPDATE requires
-- table-level UPDATE privilege in Postgres regardless of column grants.
create or replace function public.enforce_week_editable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
      or new.group_id is distinct from old.group_id
      or new.week_start_date is distinct from old.week_start_date then
      raise exception 'user_id, group_id, and week_start_date cannot be changed after the row is created.';
    end if;
  end if;

  if not public.is_week_editable(new.group_id, new.week_start_date) then
    raise exception 'This week is locked and can no longer be edited.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger weekly_check_ins_enforce_lock
  before insert or update on public.weekly_check_ins
  for each row execute function public.enforce_week_editable();

-- 5) keep active_group_id honest — must be one of the user's own active memberships
create or replace function public.validate_active_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.active_group_id is not null and
     (new.active_group_id is distinct from old.active_group_id) then
    if not exists (
      select 1 from public.memberships
      where user_id = new.id and group_id = new.active_group_id and status = 'active'
    ) then
      raise exception 'Cannot set active_group_id to a group you are not an active member of';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_validate_active_group
  before update on public.profiles
  for each row execute function public.validate_active_group();

-- 6) auto-select a newly-approved membership's group as the user's active
-- group, but only if they don't already have one — an admin approving a
-- join request shouldn't silently switch a member away from a group
-- they're already actively using.
create or replace function public.set_active_group_on_first_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' and old.status is distinct from 'active' then
    update public.profiles
      set active_group_id = new.group_id
      where id = new.user_id and active_group_id is null;
  end if;
  return new;
end;
$$;

create trigger memberships_set_active_group
  after update on public.memberships
  for each row execute function public.set_active_group_on_first_approval();

-- ============================================================
-- RPCs — bundle multi-step / privileged operations that RLS
-- alone can't safely express as plain table writes
-- ============================================================

create or replace function public.create_group(p_name text, p_meeting_day int, p_timezone text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Group name is required';
  end if;
  if p_meeting_day < 0 or p_meeting_day > 6 then
    raise exception 'Invalid meeting day';
  end if;

  insert into public.groups (name, meeting_day, timezone, creator_id)
  values (trim(p_name), p_meeting_day, coalesce(p_timezone, 'America/Chicago'), auth.uid())
  returning id into v_group_id;

  insert into public.memberships (user_id, group_id, role, status)
  values (auth.uid(), v_group_id, 'admin', 'active');

  update public.profiles set active_group_id = v_group_id where id = auth.uid();

  return v_group_id;
end;
$$;

create or replace function public.join_group_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_existing public.memberships;
begin
  select id into v_group_id from public.groups
    where code = upper(trim(p_code)) and is_active = true;

  if v_group_id is null then
    raise exception 'Invalid group code';
  end if;

  select * into v_existing from public.memberships
    where user_id = auth.uid() and group_id = v_group_id;

  if found then
    if v_existing.status = 'removed' or v_existing.status = 'inactive' then
      update public.memberships set status = 'pending', joined_at = now() where id = v_existing.id;
    elsif v_existing.status = 'active' then
      raise exception 'You are already a member of this group';
    else
      raise exception 'You already have a pending request for this group';
    end if;
  else
    insert into public.memberships (user_id, group_id, role, status)
    values (auth.uid(), v_group_id, 'member', 'pending');
  end if;

  return v_group_id;
end;
$$;

create or replace function public.reset_group_questions(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Not authorized';
  end if;
  delete from public.group_questions where group_id = p_group_id;
  perform public.seed_default_questions(p_group_id);
end;
$$;

create or replace function public.set_group_meeting_day(p_group_id uuid, p_new_day int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_meeting_day int;
  v_current_week date;
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Not authorized';
  end if;
  if p_new_day < 0 or p_new_day > 6 then
    raise exception 'Invalid meeting day';
  end if;

  select meeting_day into v_current_meeting_day from public.groups where id = p_group_id;
  if v_current_meeting_day = p_new_day then
    -- no-op, and clears any previously staged change back to the current value
    update public.groups
      set pending_meeting_day = null, pending_meeting_day_effective_after = null
      where id = p_group_id;
    return;
  end if;

  v_current_week := public.current_week_start(p_group_id);

  update public.groups
    set pending_meeting_day = p_new_day,
        pending_meeting_day_effective_after = v_current_week
    where id = p_group_id;
end;
$$;

revoke all on function public.create_group(text, int, text) from public;
revoke all on function public.join_group_by_code(text) from public;
revoke all on function public.reset_group_questions(uuid) from public;
revoke all on function public.set_group_meeting_day(uuid, int) from public;
grant execute on function public.create_group(text, int, text) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;
grant execute on function public.reset_group_questions(uuid) to authenticated;
grant execute on function public.set_group_meeting_day(uuid, int) to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;
alter table public.group_questions enable row level security;
alter table public.weekly_check_ins enable row level security;

-- profiles: your own row, anyone you share an active group with, or
-- (for admins) anyone with a pending/inactive membership in a group you admin
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.shares_group_with(id)
    or public.admin_can_see_profile(id)
  );

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- column-level grant: direct client updates can't touch active_group_id's
-- guard rails or... (active_group_id itself is fine to expose; it's
-- validated by the trigger above). No column restriction needed here.

-- groups: only active members can read; direct writes limited to
-- non-structural fields, everything else goes through the RPCs above
create policy groups_select on public.groups
  for select using (public.is_group_member(id));

create policy groups_update_admin on public.groups
  for update using (public.is_group_admin(id)) with check (public.is_group_admin(id));

-- memberships: see your own row (any status), or the full roster of a
-- group you're an active member of (is_group_admin implies is_group_member,
-- since admin also requires status = 'active', so this alone covers both
-- regular members and admins needing to see the other active members —
-- e.g. for the dashboard roster)
create policy memberships_select on public.memberships
  for select using (user_id = auth.uid() or public.is_group_member(group_id));

-- approve/deny/promote — admins may update role/status of memberships in their group
create policy memberships_update_admin on public.memberships
  for update using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));

-- group_questions: members read, admins write
create policy group_questions_select on public.group_questions
  for select using (public.is_group_member(group_id));

create policy group_questions_write_admin on public.group_questions
  for all using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));

-- weekly_check_ins: you can always read your own rows (any week — this is
-- what powers personal history). For other members' rows: admins can read
-- any week (the leader-only member history view), but a regular member can
-- only read the group's *current* week (the dashboard) — past weeks of
-- someone else's check-ins are leader-only, not general group browsing.
-- Writes: a user can only write their own row, and only while the week is
-- still editable (enforced again, authoritatively, by the trigger above).
create policy weekly_check_ins_select on public.weekly_check_ins
  for select using (
    user_id = auth.uid()
    or public.is_group_admin(group_id)
    or (public.is_group_member(group_id) and week_start_date = public.current_week_start(group_id))
  );

create policy weekly_check_ins_insert_own on public.weekly_check_ins
  for insert with check (user_id = auth.uid() and public.is_group_member(group_id));

create policy weekly_check_ins_update_own on public.weekly_check_ins
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- COLUMN-LEVEL PRIVILEGES
-- direct client writes to `groups` may only touch these columns;
-- meeting_day / pending_* / code / slug / creator_id / is_active
-- are only ever changed by the SECURITY DEFINER functions above,
-- which run as the table owner and are unaffected by this grant.
-- ============================================================

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke update on public.groups from authenticated;
grant update (name, timezone, resource_link_url, resource_link_label) on public.groups to authenticated;
revoke insert, delete on public.groups from authenticated;
revoke insert, delete on public.memberships from authenticated;
revoke insert, update, delete on public.profiles from authenticated;
grant update (first_name, last_name, cell_phone, profile_image_url, active_group_id) on public.profiles to authenticated;

-- weekly_check_ins keeps the full table-level UPDATE grant from above
-- (unlike groups/profiles) because the app upserts check-ins, and
-- Postgres requires table-level UPDATE privilege for the
-- INSERT ... ON CONFLICT DO UPDATE path regardless of column grants.
-- Identity-column immutability is enforced by the trigger instead
-- (see enforce_week_editable / weekly_check_ins_enforce_lock above).
