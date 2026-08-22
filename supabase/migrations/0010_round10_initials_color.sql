-- Round 10: lets a member without a profile photo pick their own
-- initials-circle color, so members without photos aren't all visually
-- identical on the dashboard.

alter table public.profiles add column if not exists initials_circle_color text;

grant update (first_name, last_name, cell_phone, profile_image_url, initials_circle_color, active_group_id)
  on public.profiles to authenticated;
