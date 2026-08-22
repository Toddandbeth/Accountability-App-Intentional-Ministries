-- Round 13: genuinely editable one-word category label, independent of the
-- question title. Previously the dashboard/goals label was derived by
-- splitting label_short on its em-dash, so an admin editing the title had
-- no way to change the one-word label shown elsewhere.

alter table public.group_questions
  add column short_label text not null default '';

-- Backfill existing rows: prefer the text before the title's em-dash (the
-- convention every default/customized title so far has followed), falling
-- back to the slot's original default word for anything that doesn't match.
update public.group_questions
set short_label = coalesce(
  nullif(trim(split_part(label_short, '—', 1)), ''),
  case slot_number
    when 1 then 'God'
    when 2 then 'Family'
    when 3 then 'Work'
    when 4 then 'Personal'
    when 5 then 'Purity'
  end
)
where short_label = '';

create or replace function public.seed_default_questions(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_questions (group_id, short_label, label_short, label_description, slot_number, goal_enabled)
  values
    (p_group_id, 'God', 'God — My Daily Walk with God',
      'My daily walk with God as shown through my prayer life, time in Scripture, involvement in church community, serving others, spiritual conversations, and a consistent heart of gratitude.',
      1, false),
    (p_group_id, 'Family', 'Family — Loving and Leading My Family',
      'Loving and leading my family through intentional time together, healthy communication, resolving conflict with grace, serving and encouraging one another, protecting family priorities, and making God a clear priority in our home.',
      2, false),
    (p_group_id, 'Work', 'Work — Honoring God Through My Work',
      'My approach to work as reflected in maintaining healthy balance, pursuing growth and excellence, leading with integrity and influence, building positive workplace relationships, making ethical decisions, finding satisfaction in my work, and living out my faith on the job.',
      3, false),
    (p_group_id, 'Personal', 'Personal — Stewarding My Personal Life',
      'How I steward my personal life as reflected in caring for my physical and emotional health, managing my time and priorities well, pursuing personal growth, nurturing relationships, handling finances responsibly, and practicing gratitude and contentment.',
      4, false),
    (p_group_id, 'Purity', 'Purity — Purity and Moral Integrity',
      'My commitment to purity as reflected in guarding my thoughts, resisting temptation, maintaining moral integrity, choosing positive influences, being discerning with media, seeking accountability, and establishing healthy boundaries.',
      5, false);
end;
$$;
