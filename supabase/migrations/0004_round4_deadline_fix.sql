-- Round 4 (urgent): move the deadline from "11:59 PM the day before the
-- meeting day" to "11:59 PM on the meeting day itself".
--
-- Concretely, for a Monday-meeting group: the week that starts Monday
-- Aug 3 previously locked at 11:59 PM Sunday Aug 9 — meaning the instant
-- Monday Aug 10 began, current_week_start() started returning Aug 10 (a
-- fresh, blank week), so the leader walking into the Aug 10 meeting saw
-- an empty dashboard instead of the results from the week the group had
-- just lived through.
--
-- Fix, in two parts that have to move together:
--
-- 1. week_deadline_for: a week's deadline is now 7 days after its start
--    (the next occurrence of the meeting day), not 6.
--
-- 2. current_week_start: today being the meeting day no longer means
--    "today starts a new week" — it now means "today is the last day of
--    the week that started 7 days ago" (diff of 0 is treated as 7). The
--    week doesn't actually roll over to a new one until the day *after*
--    the meeting day. Every other day's calculation is unchanged.
--
-- Everything downstream (is_week_editable, the write-lock trigger, the
-- staged meeting-day-change promotion logic) calls these two functions
-- rather than duplicating the math, so fixing it here is sufficient.

create or replace function public.week_deadline_for(p_week_start date, p_timezone text)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select ((p_week_start + 7)::text || ' 23:59:59')::timestamp at time zone p_timezone;
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
  -- today being the meeting day means today is the *last* day of the
  -- week that started 7 days ago, not the first day of a new one.
  if v_diff = 0 then
    v_diff := 7;
  end if;
  return v_today - v_diff;
end;
$$;
