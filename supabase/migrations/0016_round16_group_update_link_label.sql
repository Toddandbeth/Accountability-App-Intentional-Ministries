-- Round 16: the leader's Group Update link currently displays as the raw
-- URL (long, ugly, overflows the screen). Adds a separate clickable label
-- field — only the label displays, underlined; the raw URL is never shown
-- to the group. Display-side "both or neither" enforcement (don't show a
-- lone label or a lone raw URL) lives in the app, not here, so a leader
-- filling these in one at a time across saves never loses a partial value.

alter table public.groups add column group_update_link_label text;

drop function if exists public.post_group_update(uuid, text, text);

create or replace function public.post_group_update(
  p_group_id uuid,
  p_link_url text,
  p_link_label text,
  p_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Not authorized';
  end if;
  if p_text is not null and length(p_text) > 500 then
    raise exception 'Update text is too long';
  end if;

  update public.groups
    set group_update_link_url = p_link_url,
        group_update_link_label = p_link_label,
        group_update_text = p_text,
        group_update_flag = true
    where id = p_group_id;
end;
$$;

revoke all on function public.post_group_update(uuid, text, text, text) from public;
grant execute on function public.post_group_update(uuid, text, text, text) to authenticated;
