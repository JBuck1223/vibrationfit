-- Campaign tracking: link email_messages to campaigns, add click tracking,
-- and extend messaging_campaigns for inline-composed blasts.

BEGIN;

-- 1. email_messages: add campaign_id FK and clicked_at column
ALTER TABLE public.email_messages
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.messaging_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS clicked_at  timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_email_messages_campaign_id
  ON public.email_messages (campaign_id) WHERE campaign_id IS NOT NULL;

-- 2. email_messages: expand status check to include 'clicked'
ALTER TABLE public.email_messages
  DROP CONSTRAINT email_messages_status_check;

ALTER TABLE public.email_messages
  ADD CONSTRAINT email_messages_status_check
  CHECK (status = ANY (ARRAY[
    'sent'::text, 'delivered'::text, 'failed'::text,
    'bounced'::text, 'opened'::text, 'received'::text,
    'clicked'::text
  ]));

-- 3. messaging_campaigns: make template_id nullable, add inline-compose columns
ALTER TABLE public.messaging_campaigns
  ALTER COLUMN template_id DROP NOT NULL;

ALTER TABLE public.messaging_campaigns
  ADD COLUMN IF NOT EXISTS subject   text,
  ADD COLUMN IF NOT EXISTS text_body text,
  ADD COLUMN IF NOT EXISTS sender_id text,
  ADD COLUMN IF NOT EXISTS error_log text;

-- 4. scheduled_message_status enum: add 'processing' value for duplicate-send locking
ALTER TYPE public.scheduled_message_status ADD VALUE IF NOT EXISTS 'processing';

COMMIT;
