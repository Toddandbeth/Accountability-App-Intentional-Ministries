-- Round 14 fix: profiles has a column-level UPDATE grant for the
-- authenticated role (see 0001_init.sql), and welcome_email_sent_at
-- (added in 0013) was never added to it. Every check-in page visit's
-- claim-then-send update was silently failing with "permission denied
-- for table profiles" as a result — the welcome email never had a chance
-- to send, independent of any Resend API key issue.

grant update (welcome_email_sent_at) on public.profiles to authenticated;
