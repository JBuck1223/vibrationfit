BEGIN;

-- 1. Add 'complaint' and 'clicked' to email_messages status constraint
ALTER TABLE public.email_messages DROP CONSTRAINT IF EXISTS email_messages_status_check;
ALTER TABLE public.email_messages
    ADD CONSTRAINT email_messages_status_check
    CHECK (status = ANY (ARRAY[
        'sent'::text, 'delivered'::text, 'failed'::text,
        'bounced'::text, 'opened'::text, 'received'::text,
        'clicked'::text, 'complaint'::text
    ]));

-- 2. Add bounce_type and clicked_at to email_messages
ALTER TABLE public.email_messages ADD COLUMN IF NOT EXISTS bounce_type text;
ALTER TABLE public.email_messages ADD COLUMN IF NOT EXISTS clicked_at timestamp with time zone;

-- 3. Create email_suppressions table
CREATE TABLE IF NOT EXISTS public.email_suppressions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    email text NOT NULL,
    reason text NOT NULL CHECK (reason IN ('hard_bounce', 'complaint', 'manual')),
    source_message_id uuid REFERENCES public.email_messages(id) ON DELETE SET NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_suppressions_email
    ON public.email_suppressions (lower(email));

-- 4. Add sender_email to scheduled_messages
ALTER TABLE public.scheduled_messages ADD COLUMN IF NOT EXISTS sender_email text;

-- 5. Create blast_segments table
CREATE TABLE IF NOT EXISTS public.blast_segments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    filters jsonb NOT NULL DEFAULT '{}'::jsonb,
    exclude_segment_id uuid REFERENCES public.blast_segments(id) ON DELETE SET NULL,
    recipient_count integer,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blast_segments_created_at
    ON public.blast_segments (created_at DESC);

COMMIT;
