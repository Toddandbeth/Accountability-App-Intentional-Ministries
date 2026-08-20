-- Round 8: no short weeks, ever — revises Round 7's meeting-day-change
-- formula.
--
-- Round 7's rule ("next occurrence of the new meeting day strictly after
-- today") could produce a short week — e.g. changing to a day 2 days
-- away. Real use showed that's unwanted: a short notice period makes it
-- more likely the group simply won't gather in time. New rule: the
-- resulting lock date is always at least 7 full days from the day the
-- currently open week originally started — take that start date, add 7
-- to get a floor, then find the next occurrence of the newly chosen
-- meeting day on or after that floor (inclusive — if the floor itself
-- already falls on the new meeting day, that's the answer, exactly 7
-- days out).
--
-- This only changes set_group_meeting_day. The normal weekly cycle
-- (ensure_current_week's rollover and first-time initialization) is
-- unaffected — those establish a fresh, always meeting-day-aligned week
-- with a plain 7-day span, which was never the thing producing short
-- weeks; only a live admin change was. They keep using
-- next_occurrence_strictly_after, unchanged.
--
-- Verified by hand against all three worked examples in the blueprint
-- (week started Monday):
--   -> Tuesday: floor = next Monday, next Tuesday on/after it = 8 days out.
--   -> Saturday: floor = next Monday, next Saturday on/after it = 12 days out.
--   -> Monday (itself): floor = next Monday, which already matches =
--      exactly 7 days out, the shortest ever allowed.

-- Smallest date on or after p_floor whose day-of-week is p_day_of_week —
-- inclusive, unlike next_occurrence_strictly_after. If p_floor already
-- falls on that weekday, p_floor itself is the answer.
create or replace function public.next_occurrence_on_or_after(p_floor date, p_day_of_week int)
returns date
language sql
immutable
as $$
  select p_floor + ((p_day_of_week - extract(dow from p_floor)::int + 7) % 7);
$$;

-- No longer needs the "no real change" special case Round 7 had: under
-- this floor-based formula, re-submitting the same meeting day lands
-- back on exactly the same deadline the week would already have in
-- steady state, so there's nothing left to special-case around.
create or replace function public.set_group_meeting_day(p_group_id uuid, p_new_day int)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text;
  v_week_start date;
  v_floor date;
  v_new_deadline_date date;
  v_new_deadline timestamptz;
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Not authorized';
  end if;
  if p_new_day < 0 or p_new_day > 6 then
    raise exception 'Invalid meeting day';
  end if;

  -- Catch up any pending rollover first, so the floor below is computed
  -- from whichever week is actually open right now.
  perform public.ensure_current_week(p_group_id);

  select current_week_start_date, timezone into v_week_start, v_timezone
    from public.groups where id = p_group_id;

  v_floor := v_week_start + 7;
  v_new_deadline_date := public.next_occurrence_on_or_after(v_floor, p_new_day);
  v_new_deadline := public.week_deadline_for(v_new_deadline_date, v_timezone);

  update public.groups
    set meeting_day = p_new_day,
        current_week_deadline = v_new_deadline
    where id = p_group_id;

  return v_new_deadline_date;
end;
$$;
