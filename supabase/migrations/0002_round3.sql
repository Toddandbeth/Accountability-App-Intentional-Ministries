-- Round 3: platform admin, Group Update (replaces the per-group resource
-- link), and the stats/RPC plumbing they need.

-- ============================================================
-- PLATFORM ADMIN
-- ============================================================

alter table public.profiles add column platform_admin boolean not null default false;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select platform_admin from public.profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

-- Single-row table for the ministry-wide resource link. The boolean PK
-- trick (id must be true) enforces at most one row.
create table public.platform_settings (
  id boolean primary key default true,
  resource_link_url text,
  resource_link_label text,
  constraint platform_settings_singleton check (id)
);

insert into public.platform_settings (id) values (true);

alter table public.platform_settings enable row level security;

-- Any signed-in user can read it (shown app-wide); only a platform admin
-- can change it.
create policy platform_settings_select on public.platform_settings
  for select to authenticated using (true);

create policy platform_settings_update_admin on public.platform_settings
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select on public.platform_settings to authenticated;
grant update (resource_link_url, resource_link_label) on public.platform_settings to authenticated;

-- Aggregate-only stats for the platform admin's "System-Wide Stats" box.
-- Deliberately returns counts only — never touches individual ratings,
-- prayer/life update content, or names.
create or replace function public.get_platform_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  select jsonb_build_object(
    'active_groups', (select count(*) from public.groups where is_active = true),
    'total_participants', (select count(*) from public.memberships where status = 'active'),
    'check_ins_last_7_days', (select count(*) from public.weekly_check_ins where updated_at >= now() - interval '7 days')
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_platform_stats() from public;
grant execute on function public.get_platform_stats() to authenticated;

-- ============================================================
-- GROUP UPDATE — replaces resource_link_url / resource_link_label
-- ============================================================

alter table public.groups add column group_update_link_url text;
alter table public.groups add column group_update_text text;
alter table public.groups add column group_update_flag boolean not null default false;

-- carry forward whatever link was already set; there's no equivalent slot
-- for the old label, so that part doesn't migrate
update public.groups set group_update_link_url = resource_link_url;

alter table public.groups drop column resource_link_url;
alter table public.groups drop column resource_link_label;

-- re-grant the direct-update column list without the dropped columns;
-- group_update_flag is only ever set/cleared via the RPCs below
revoke update on public.groups from authenticated;
grant update (name, timezone, group_update_link_url, group_update_text) on public.groups to authenticated;

create or replace function public.post_group_update(p_group_id uuid, p_link_url text, p_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Not authorized';
  end if;
  if p_text is not null and length(p_text) > 500 then
    raise exception 'Update text is too long';
  end if;

  update public.groups
    set group_update_link_url = p_link_url,
        group_update_text = p_text,
        group_update_flag = true
    where id = p_group_id;
end;
$$;

create or replace function public.mark_group_update_seen(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Not authorized';
  end if;

  update public.groups
    set group_update_flag = false
    where id = p_group_id and group_update_flag = true;
end;
$$;

revoke all on function public.post_group_update(uuid, text, text) from public;
revoke all on function public.mark_group_update_seen(uuid) from public;
grant execute on function public.post_group_update(uuid, text, text) to authenticated;
grant execute on function public.mark_group_update_seen(uuid) to authenticated;
