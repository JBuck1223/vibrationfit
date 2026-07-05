-- Email confirmation + contact memory for the Meta DM automation.
--
-- 1. meta_flow_state.awaiting gains 'email_confirm': after someone types an
--    email, we echo it back with a Yes button before saving (ManyChat-style).
-- 2. meta_contacts remembers each sender's confirmed email per account, so
--    returning people are asked "Is <email> the best email to send it over
--    to?" instead of being asked to type it again.

alter table public.meta_flow_state
  drop constraint if exists meta_flow_state_awaiting_check;

alter table public.meta_flow_state
  add constraint meta_flow_state_awaiting_check
  check (awaiting in ('email', 'email_confirm'));

create table if not exists public.meta_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.meta_accounts(id) on delete cascade,
  sender_id text not null,
  username text,
  email text,
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, sender_id)
);

alter table public.meta_contacts enable row level security;
