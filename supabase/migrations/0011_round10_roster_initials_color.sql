-- Round 10: the roster view should show the same initials-circle color
-- customization as everywhere else, not just the plain default.

drop function if exists public.get_group_roster(uuid);

create or replace function public.get_group_roster(p_group_id uuid)
returns table(
  user_id uuid,
  first_name text,
  last_name text,
  profile_image_url text,
  initials_circle_color text
)
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
    select p.id, p.first_name, p.last_name, p.profile_image_url, p.initials_circle_color
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.group_id = p_group_id
    order by m.joined_at;
end;
$$;

revoke all on function public.get_group_roster(uuid) from public;
grant execute on function public.get_group_roster(uuid) to authenticated;
