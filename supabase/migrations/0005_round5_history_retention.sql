-- Round 5: history access and data retention.
--
-- Four related changes:
-- 1. Open 6-week history to all active group members (was leader-only).
-- 2. Guarantee a user can always read their own historical check-ins,
--    regardless of current membership status (removed, etc.).
-- 3. Deactivated groups unlock a name/photo-only roster for anyone who
--    was ever a member — never their private weekly content.
-- 4. A personal "hide this group from my list" preference.
--
-- Design note: rather than broadening the sensitive groups/memberships/
-- profiles SELECT policies directly (which would risk leaking live
-- content — e.g. Group Update text — to removed members), the retention
-- and roster cases are served by narrow, explicit RPCs that return only
-- the specific safe fields each case needs. The one direct RLS change
-- is on weekly_check_ins, which is the actual feature being opened up.

-- ============================================================
-- 1 & 2. weekly_check_ins: any active member sees the whole group's
-- current *and past* weeks (not just the current week); everyone can
-- always read their own rows regardless of membership status.
-- ============================================================

drop policy weekly_check_ins_select on public.weekly_check_ins;

create policy weekly_check_ins_select on public.weekly_check_ins
  for select using (
    user_id = auth.uid()
    or public.is_group_member(group_id)
  );

-- ============================================================
-- 3. Deactivated-group roster + basic group info for anyone who was
-- ever a member (any status) — name/photo only, never private content.
-- ============================================================

-- (groups.is_active already exists from 0001; nothing to add there.)

create or replace function public.get_group_basic_info(p_group_id uuid)
returns table(id uuid, name text, is_active boolean)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name, g.is_active
  from public.groups g
  where g.id = p_group_id
    and exists (
      select 1 from public.memberships m
      where m.group_id = g.id and m.user_id = auth.uid()
    );
$$;

create or replace function public.get_group_roster(p_group_id uuid)
returns table(user_id uuid, first_name text, last_name text, profile_image_url text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.groups where id = p_group_id and is_active = false) then
    raise exception 'Group is still active';
  end if;
  if not exists (
    select 1 from public.memberships m
    where m.group_id = p_group_id and m.user_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  return query
    select p.id, p.first_name, p.last_name, p.profile_image_url
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.group_id = p_group_id
    order by m.joined_at;
end;
$$;

create or replace function public.set_group_active(p_group_id uuid, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Not authorized';
  end if;
  update public.groups set is_active = p_is_active where id = p_group_id;
end;
$$;

revoke all on function public.get_group_basic_info(uuid) from public;
revoke all on function public.get_group_roster(uuid) from public;
revoke all on function public.set_group_active(uuid, boolean) from public;
grant execute on function public.get_group_basic_info(uuid) to authenticated;
grant execute on function public.get_group_roster(uuid) to authenticated;
grant execute on function public.set_group_active(uuid, boolean) to authenticated;

-- ============================================================
-- 4. Hide-from-my-list preference
-- ============================================================

alter table public.memberships add column hidden_by_user boolean not null default false;

-- Scoped RPC rather than a broadened RLS/column-grant: this only ever
-- touches hidden_by_user on the caller's own row, so there's no risk of
-- it becoming a path to self-promote role or un-remove status the way a
-- general "update your own membership row" policy would.
create or replace function public.set_membership_hidden(p_membership_id uuid, p_hidden boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.memberships
    set hidden_by_user = p_hidden
    where id = p_membership_id and user_id = auth.uid();
$$;

revoke all on function public.set_membership_hidden(uuid, boolean) from public;
grant execute on function public.set_membership_hidden(uuid, boolean) to authenticated;
