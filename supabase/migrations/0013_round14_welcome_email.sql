-- Round 14 (email branding, part 2): the welcome email from Round 6, now
-- unblocked by the Resend setup. Tracks whether a profile has already
-- received it, so it fires exactly once per user regardless of how many
-- times they load the check-in page.
--
-- Backfilled to created_at (not left null) for every existing profile, so
-- this doesn't blast a welcome email to the whole current user base the
-- next time they open the app — only genuinely new signups after this
-- migration have a null value and trigger a send.

alter table public.profiles
  add column welcome_email_sent_at timestamptz;

update public.profiles
set welcome_email_sent_at = created_at
where welcome_email_sent_at is null;
