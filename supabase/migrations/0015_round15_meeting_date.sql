-- Round 15: the dashboard and check-in headers show "Week of [start
-- date]" — backward-looking and not what a user actually needs. This
-- returns the current week's meeting/lock date instead (the same value
-- week_deadline() already computes, just narrowed to a plain date in the
-- group's own timezone so the client can display it without redoing that
-- conversion itself).

create or replace function public.current_meeting_date(p_group_id uuid)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text;
  v_deadline timestamptz;
begin
  select timezone into v_timezone from public.groups where id = p_group_id;
  select deadline into v_deadline from public.ensure_current_week(p_group_id);
  return (v_deadline at time zone v_timezone)::date;
end;
$$;

revoke all on function public.current_meeting_date(uuid) from public;
grant execute on function public.current_meeting_date(uuid) to authenticated;
