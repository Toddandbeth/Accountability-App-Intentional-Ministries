-- Round 6: persistent Goals.
--
-- One record per person per group per question slot. Unlike
-- weekly_check_ins, a goal has no week, no lock, no deadline — it just
-- sits there until the member changes it. Visibility mirrors the Round 5
-- weekly_check_ins policy: your own rows are always readable regardless
-- of membership status, and any active group member can read anyone
-- else's goals in that group (they're shown on the dashboard's expanded
-- row, same as Prayer & Life Updates). Writes are restricted to your own
-- row, and only while you're still an active member of that group.

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  question_slot int not null check (question_slot between 1 and 5),
  goal_text text,
  updated_at timestamptz not null default now(),
  unique (user_id, group_id, question_slot)
);

create or replace function public.touch_goal_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger goals_touch_updated_at
  before update on public.goals
  for each row execute function public.touch_goal_updated_at();

alter table public.goals enable row level security;

create policy goals_select on public.goals
  for select using (
    user_id = auth.uid()
    or public.is_group_member(group_id)
  );

create policy goals_insert_own on public.goals
  for insert with check (user_id = auth.uid() and public.is_group_member(group_id));

create policy goals_update_own on public.goals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.goals to authenticated;
