-- Optional public reply posted on the triggering comment after the DM
-- (private reply) is sent successfully, e.g. "Just sent it over -- check
-- your DMs!". Only used by comment_keyword rules.
alter table public.meta_automation_rules
  add column if not exists public_reply_text text;
