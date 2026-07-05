-- Multi-account support for the Meta DM automation.
-- Switches from a single env-configured account to a meta_accounts table
-- using the "Instagram API with Instagram Login" flow: each connected IG
-- account (Jordan, Vanessa, VibrationFit) has its own long-lived token,
-- refreshed by a daily cron. Rules and message logs are scoped per account
-- (account_id null on a rule = applies to all accounts).

create table if not exists public.meta_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'instagram'
    check (platform in ('instagram', 'facebook')),
  -- IG professional account ID; matches webhook entry.id
  ig_user_id text not null unique,
  username text,
  access_token text not null,
  token_expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meta_accounts enable row level security;

alter table public.meta_automation_rules
  add column if not exists account_id uuid
    references public.meta_accounts(id) on delete cascade;

alter table public.meta_messages
  add column if not exists account_id uuid
    references public.meta_accounts(id) on delete set null;

create index if not exists meta_messages_account_idx
  on public.meta_messages (account_id, created_at desc);
