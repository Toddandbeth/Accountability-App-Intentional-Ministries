-- Round 3: reactions on Prayer & Life Updates.
--
-- Deliberately not attributed to who reacted (no per-user tracking, no
-- limit on repeat taps) — just four simple counters per check-in.
--
-- These stay editable even after the week's ratings/prayer_request lock,
-- since a reaction is the group's response to an update, not part of the
-- locked content itself. increment_reaction() is the only path that
-- changes these columns, and it does its own membership check, so the
-- existing "own row only" RLS on weekly_check_ins is untouched — the
-- lock-enforcement trigger just needs to recognize a reaction-only
-- change and let it through regardless of lock state.

alter table public.weekly_check_ins add column reaction_heart_count int not null default 0;
alter table public.weekly_check_ins add column reaction_pray_count int not null default 0;
alter table public.weekly_check_ins add column reaction_thumbsup_count int not null default 0;
alter table public.weekly_check_ins add column reaction_praise_count int not null default 0;

create or replace function public.enforce_week_editable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_only_reactions boolean;
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
      or new.group_id is distinct from old.group_id
      or new.week_start_date is distinct from old.week_start_date then
      raise exception 'user_id, group_id, and week_start_date cannot be changed after the row is created.';
    end if;

    v_only_reactions := (
      new.rating_1 is not distinct from old.rating_1 and
      new.rating_2 is not distinct from old.rating_2 and
      new.rating_3 is not distinct from old.rating_3 and
      new.rating_4 is not distinct from old.rating_4 and
      new.rating_5 is not distinct from old.rating_5 and
      new.prayer_request is not distinct from old.prayer_request
    );

    if v_only_reactions then
      return new;
    end if;
  end if;

  if not public.is_week_editable(new.group_id, new.week_start_date) then
    raise exception 'This week is locked and can no longer be edited.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.increment_reaction(p_checkin_id uuid, p_reaction text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  select group_id into v_group_id from public.weekly_check_ins where id = p_checkin_id;
  if v_group_id is null then
    raise exception 'Check-in not found';
  end if;
  if not public.is_group_member(v_group_id) then
    raise exception 'Not authorized';
  end if;

  if p_reaction = 'heart' then
    update public.weekly_check_ins set reaction_heart_count = reaction_heart_count + 1 where id = p_checkin_id;
  elsif p_reaction = 'pray' then
    update public.weekly_check_ins set reaction_pray_count = reaction_pray_count + 1 where id = p_checkin_id;
  elsif p_reaction = 'thumbsup' then
    update public.weekly_check_ins set reaction_thumbsup_count = reaction_thumbsup_count + 1 where id = p_checkin_id;
  elsif p_reaction = 'praise' then
    update public.weekly_check_ins set reaction_praise_count = reaction_praise_count + 1 where id = p_checkin_id;
  else
    raise exception 'Unknown reaction type';
  end if;
end;
$$;

revoke all on function public.increment_reaction(uuid, text) from public;
grant execute on function public.increment_reaction(uuid, text) to authenticated;
