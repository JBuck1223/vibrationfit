-- Meta (Instagram + Facebook) DM automation: keyword-triggered auto-replies
-- for DMs and comment-to-DM private replies, ManyChat-style but self-hosted.
-- Rules are managed from the admin panel; the /api/webhooks/meta route matches
-- inbound events against active rules and sends replies via the Graph API.
-- Only the service role touches these tables, so RLS is enabled with no
-- public policies (deny-by-default for anon/authenticated).

create table if not exists public.meta_automation_rules (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'both'
    check (platform in ('instagram', 'facebook', 'both')),
  trigger_type text not null
    check (trigger_type in ('dm_keyword', 'comment_keyword')),
  keyword text not null,
  match_type text not null default 'contains'
    check (match_type in ('exact', 'contains')),
  reply_text text not null,
  reply_link text,
  -- Optional IG media ID / FB post ID to scope comment rules to one post.
  media_id text,
  is_active boolean not null default true,
  hit_count integer not null default 0,
  last_hit_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meta_automation_rules_active_idx
  on public.meta_automation_rules (is_active, trigger_type);

create table if not exists public.meta_messages (
  id uuid primary key default gen_random_uuid(),
  platform text not null
    check (platform in ('instagram', 'facebook')),
  -- IGSID / PSID of the counterparty (or comment author).
  sender_id text not null,
  sender_username text,
  direction text not null
    check (direction in ('inbound', 'outbound')),
  message_type text not null default 'dm'
    check (message_type in ('dm', 'comment')),
  body text,
  rule_id uuid references public.meta_automation_rules(id) on delete set null,
  -- Graph API message/comment ID, used to dedupe webhook retries.
  external_message_id text unique,
  -- Future CRM matching (mirrors sms_messages linkage).
  user_id uuid references auth.users(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists meta_messages_platform_created_idx
  on public.meta_messages (platform, created_at desc);

create index if not exists meta_messages_sender_idx
  on public.meta_messages (sender_id, created_at desc);

alter table public.meta_automation_rules enable row level security;
alter table public.meta_messages enable row level security;

-- Atomic hit counter used by the webhook route when a rule fires.
create or replace function public.increment_meta_rule_hit(p_rule_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.meta_automation_rules
  set hit_count = hit_count + 1,
      last_hit_at = now()
  where id = p_rule_id;
$$;
