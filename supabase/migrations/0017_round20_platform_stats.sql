-- Round 20: properly-defined System-Wide Stats, plus the one schema
-- addition it needs — status_changed_at, so "new approved vs. removed
-- members within a period" can tell WHEN a removal happened, not just
-- that a row currently says removed. A trigger keeps it in sync
-- automatically regardless of which code path changes status, rather
-- than relying on every future status-changing RPC to remember to set it.

alter table public.memberships
  add column status_changed_at timestamptz not null default now();

create or replace function public.touch_membership_status_changed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger memberships_touch_status_changed_at
  before update on public.memberships
  for each row execute function public.touch_membership_status_changed_at();

-- Replaces the vague Round 3 version (active_groups / total_participants /
-- check_ins_last_7_days) with the precisely-defined metric set from the
-- Round 20 spec. Still aggregate-only — never touches individual ratings,
-- prayer/life update content, or names.
create or replace function public.get_platform_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  v_active_groups int;
  v_total_active_memberships int;
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  select count(*) into v_active_groups from public.groups where is_active = true;
  select count(*) into v_total_active_memberships from public.memberships where status = 'active';

  select jsonb_build_object(
    -- Reach
    'unique_active_users', (select count(distinct user_id) from public.memberships where status = 'active'),
    'total_active_memberships', v_total_active_memberships,
    'active_groups', v_active_groups,
    'deactivated_groups', (select count(*) from public.groups where is_active = false),
    'avg_group_size', case when v_active_groups > 0
      then round(v_total_active_memberships::numeric / v_active_groups, 1)
      else 0 end,

    -- Engagement: current snapshot completion rate, for each active
    -- group's own most recently locked week (the max week_start_date
    -- strictly before that group's currently-open week) — a group with
    -- no locked week yet (brand new) simply doesn't contribute.
    'checkin_completion_rate', (
      with locked as (
        select g.id as group_id,
          (select max(wc.week_start_date) from public.weekly_check_ins wc
            where wc.group_id = g.id and wc.week_start_date < g.current_week_start_date) as locked_week
        from public.groups g
        where g.is_active = true and g.current_week_start_date is not null
      ),
      counted as (
        select
          (select count(*) from public.memberships m where m.group_id = l.group_id and m.status = 'active') as possible,
          (select count(*) from public.weekly_check_ins wc where wc.group_id = l.group_id and wc.week_start_date = l.locked_week) as submitted
        from locked l
        where l.locked_week is not null
      )
      select case when coalesce(sum(possible), 0) > 0
        then round(100.0 * sum(submitted) / sum(possible), 1)
        else null end
      from counted
    ),

    -- Same underlying weekly series for all three trend buckets — the
    -- client groups/windows this one array by week, month, or year
    -- rather than three separate queries. "Possible" uses each check-in's
    -- group's CURRENT active-membership count as a consistent, simple
    -- approximation (not a full historical reconstruction), so every
    -- point in the series is computed the same way.
    'weekly_trend', (
      with week_group as (
        select wc.week_start_date, wc.group_id, count(*) as submitted,
          (select count(*) from public.memberships m where m.group_id = wc.group_id and m.status = 'active') as possible
        from public.weekly_check_ins wc
        group by wc.week_start_date, wc.group_id
      )
      select coalesce(jsonb_agg(t order by t.week_start_date), '[]'::jsonb)
      from (
        select week_start_date, sum(submitted) as submitted, sum(possible) as possible
        from week_group
        group by week_start_date
      ) t
    ),

    -- Health signals. Raw status-change events (not pre-aggregated) so
    -- the client can count new-approved vs. removed within whichever
    -- period the trend selector has active, the same "one dataset, many
    -- windows" approach as the trend above.
    'membership_status_events', (
      select coalesce(jsonb_agg(jsonb_build_object('status', status, 'status_changed_at', status_changed_at)), '[]'::jsonb)
      from public.memberships
      where status in ('active', 'removed')
    ),
    'pending_requests', (select count(*) from public.memberships where status = 'pending'),

    -- Depth of use
    'pct_checkins_with_prayer_update', (
      select case when count(*) > 0
        then round(100.0 * count(*) filter (where prayer_request is not null and length(trim(prayer_request)) > 0) / count(*), 1)
        else null end
      from public.weekly_check_ins
    ),
    'pct_active_members_with_goal', (
      select case when count(*) > 0
        then round(100.0 * count(*) filter (
          where exists (
            select 1 from public.goals g
            where g.user_id = m.user_id and g.group_id = m.group_id
              and g.goal_text is not null and length(trim(g.goal_text)) > 0
          )
        ) / count(*), 1)
        else null end
      from public.memberships m
      where m.status = 'active'
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_platform_stats() from public;
grant execute on function public.get_platform_stats() to authenticated;
