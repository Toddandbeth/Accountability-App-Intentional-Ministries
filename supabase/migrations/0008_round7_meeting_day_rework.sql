-- Round 7: meeting-day-change rework, plus the crash it was causing.
--
-- Supersedes the "stage a pending_meeting_day, promote it once the
-- current week locks" mechanism from 0001/0004 entirely. That mechanism
-- is gone — pending_meeting_day / pending_meeting_day_effective_after
-- are dropped, and with them the whole "snapshot and defer" class of bug
-- (including whatever was causing the forced-logout crash when changing
-- the meeting day, since that code path no longer exists).
--
-- New rule: a meeting-day change applies immediately to the currently
-- open week. The week's start date never moves once set — only its
-- deadline does, recalculated as the next occurrence of the (new)
-- meeting day strictly after *today* (never today itself). That "never
-- today" clause is what makes changing the meeting day to today's own
-- weekday push a full week out instead of locking immediately, and it's
-- also what makes changing it to 2 days from now produce a real short
-- week instead of an edge-case crash.
--
-- This requires the current week's start/deadline to become stateful
-- (columns on groups, lazily advanced on read) instead of purely
-- derived from meeting_day + now() — a derived formula can't tell the
-- difference between "meeting_day changed mid-week" and "a new week
-- naturally began," which is exactly what this rule needs to
-- distinguish.
--
-- Verified by hand against the two worked examples in the blueprint:
--   Meeting day Monday, current week in progress, today is Tuesday.
--   1. Admin changes meeting day to Tuesday (today's own weekday):
--      next Tuesday strictly after today is a full week out -> the
--      current week stretches to an 8-day week.
--   2. Admin changes meeting day to Thursday (2 days away):
--      next Thursday strictly after today is in 2 days -> the current
--      week shortens to lock this Thursday.

alter table public.groups add column if not exists current_week_start_date date;
alter table public.groups add column if not exists current_week_deadline timestamptz;

alter table public.groups drop column if exists pending_meeting_day;
alter table public.groups drop column if exists pending_meeting_day_effective_after;

-- Pure "date -> that date's 23:59:59 in this timezone" conversion. Round 4
-- baked a "+7 days" into this function; that's gone now, since callers
-- compute the target deadline date themselves via
-- next_occurrence_strictly_after and just need it converted to a
-- timestamptz here. Renaming the parameter (p_week_start -> p_deadline_date,
-- since it's no longer a week start) requires a drop first — Postgres
-- won't let CREATE OR REPLACE rename an existing function's parameter.
drop function if exists public.week_deadline_for(date, text);

create or replace function public.week_deadline_for(p_deadline_date date, p_timezone text)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select (p_deadline_date::text || ' 23:59:59')::timestamp at time zone p_timezone;
$$;

-- Smallest date strictly after p_after whose day-of-week is
-- p_day_of_week. "Strictly after" is the whole point — if p_after
-- already falls on that weekday, this returns 7 days later, not
-- p_after itself.
create or replace function public.next_occurrence_strictly_after(p_after date, p_day_of_week int)
returns date
language sql
immutable
as $$
  select p_after + (
    case when ((p_day_of_week - extract(dow from p_after)::int + 7) % 7) = 0
      then 7
      else ((p_day_of_week - extract(dow from p_after)::int + 7) % 7)
    end
  );
$$;

-- Reads (and, if needed, advances) a group's current week. This is the
-- one place week rollover happens — every public accessor below goes
-- through it, so there's a single implementation, not several that can
-- drift out of sync.
create or replace function public.ensure_current_week(p_group_id uuid)
returns table(week_start date, deadline timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meeting_day int;
  v_timezone text;
  v_week_start date;
  v_deadline timestamptz;
  v_today date;
  v_dow int;
  v_diff int;
  v_rollover_date date;
  v_changed boolean := false;
begin
  select meeting_day, timezone, current_week_start_date, current_week_deadline
    into v_meeting_day, v_timezone, v_week_start, v_deadline
    from public.groups where id = p_group_id;

  if v_meeting_day is null then
    raise exception 'Group % not found', p_group_id;
  end if;

  if v_week_start is null then
    -- Nothing established yet (brand new group, or a row from before
    -- these columns existed): start the first week on the most recent
    -- occurrence of the meeting day on or before today, so a group's
    -- first week begins right away rather than waiting up to 7 days.
    v_today := (now() at time zone v_timezone)::date;
    v_dow := extract(dow from v_today)::int;
    v_diff := (v_dow - v_meeting_day + 7) % 7;
    v_week_start := v_today - v_diff;
    v_deadline := public.week_deadline_for(
      public.next_occurrence_strictly_after(v_week_start, v_meeting_day), v_timezone
    );
    v_changed := true;
  end if;

  -- Catch up any number of missed rollovers (e.g. nobody opened the app
  -- for a few weeks). Each new week starts on the date the previous
  -- deadline fell on, since that date is itself always a meeting-day
  -- occurrence by construction.
  while now() >= v_deadline loop
    v_rollover_date := (v_deadline at time zone v_timezone)::date;
    v_week_start := v_rollover_date;
    v_deadline := public.week_deadline_for(
      public.next_occurrence_strictly_after(v_week_start, v_meeting_day), v_timezone
    );
    v_changed := true;
  end loop;

  if v_changed then
    update public.groups
      set current_week_start_date = v_week_start,
          current_week_deadline = v_deadline
      where id = p_group_id;
  end if;

  week_start := v_week_start;
  deadline := v_deadline;
  return next;
end;
$$;

create or replace function public.current_week_start(p_group_id uuid)
returns date
language sql
security definer
set search_path = public
as $$
  select week_start from public.ensure_current_week(p_group_id);
$$;

drop function if exists public.week_deadline(uuid, date);

create or replace function public.week_deadline(p_group_id uuid)
returns timestamptz
language sql
security definer
set search_path = public
as $$
  select deadline from public.ensure_current_week(p_group_id);
$$;

create or replace function public.is_week_editable(p_group_id uuid, p_week_start date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week record;
begin
  select * into v_week from public.ensure_current_week(p_group_id);
  return p_week_start = v_week.week_start and now() < v_week.deadline;
end;
$$;

drop function if exists public.set_group_meeting_day(uuid, int);

-- Returns the date the current week will now lock on, so the UI can
-- show the leader the actual resulting date without recomputing it
-- client-side (and without any client/server timezone mismatch, since
-- this returns a plain date, not a timestamp to be reformatted).
create or replace function public.set_group_meeting_day(p_group_id uuid, p_new_day int)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text;
  v_current_meeting_day int;
  v_current_deadline timestamptz;
  v_today date;
  v_new_deadline_date date;
  v_new_deadline timestamptz;
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Not authorized';
  end if;
  if p_new_day < 0 or p_new_day > 6 then
    raise exception 'Invalid meeting day';
  end if;

  -- Catch up any pending rollover first, so what follows always modifies
  -- whichever week is actually open right now.
  perform public.ensure_current_week(p_group_id);

  select meeting_day, timezone, current_week_deadline
    into v_current_meeting_day, v_timezone, v_current_deadline
    from public.groups where id = p_group_id;

  if v_current_meeting_day = p_new_day then
    -- No real change. Deliberately not recomputing the deadline here —
    -- if today already IS the meeting day, recomputing would push the
    -- deadline out a full week for no reason.
    return (v_current_deadline at time zone v_timezone)::date;
  end if;

  v_today := (now() at time zone v_timezone)::date;
  v_new_deadline_date := public.next_occurrence_strictly_after(v_today, p_new_day);
  v_new_deadline := public.week_deadline_for(v_new_deadline_date, v_timezone);

  update public.groups
    set meeting_day = p_new_day,
        current_week_deadline = v_new_deadline
    where id = p_group_id;

  return v_new_deadline_date;
end;
$$;

revoke all on function public.set_group_meeting_day(uuid, int) from public;
revoke all on function public.week_deadline(uuid) from public;
grant execute on function public.set_group_meeting_day(uuid, int) to authenticated;
grant execute on function public.week_deadline(uuid) to authenticated;
