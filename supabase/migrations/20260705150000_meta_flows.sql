-- Flow support for the Meta DM automation.
-- A rule can now carry a multi-step flow (jsonb) instead of a single reply:
--   flow.steps[] = { id, type: 'message' | 'capture_email', ... }
--   - message: text, link?, buttons?: [{ label, goto }] (sent as IG quick replies)
--   - capture_email: prompt, success_text?, goto? — saves the reply to leads
-- meta_flow_state tracks per-conversation progress for steps that wait on
-- a typed reply (email capture). Button taps carry their target step in the
-- quick-reply payload, so they need no state.

alter table public.meta_automation_rules
  add column if not exists flow jsonb;

create table if not exists public.meta_flow_state (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.meta_accounts(id) on delete cascade,
  sender_id text not null,
  rule_id uuid not null references public.meta_automation_rules(id) on delete cascade,
  step_id text not null,
  awaiting text not null default 'email'
    check (awaiting in ('email')),
  attempts integer not null default 0,
  collected jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, sender_id)
);

alter table public.meta_flow_state enable row level security;
