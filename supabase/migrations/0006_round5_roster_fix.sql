-- Fixes a bug in get_group_roster (0005): the function's own output
-- column is named user_id (from "returns table(user_id uuid, ...)"),
-- which Postgres treats as an implicit plpgsql variable — so the
-- unqualified "user_id" in the authorization check's WHERE clause was
-- ambiguous against public.memberships.user_id, and every call failed
-- with "column reference user_id is ambiguous", silently returning no
-- rows. Qualifying it as m.user_id resolves it.

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
