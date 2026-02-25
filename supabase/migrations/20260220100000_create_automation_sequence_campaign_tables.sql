-- ============================================================
-- Database-Driven Automation Engine
-- Creates: automation_rules, sequences, sequence_steps,
--          sequence_enrollments, messaging_campaigns
-- ============================================================

-- -------------------------------------------------------
-- 1. automation_rules  (single-fire event triggers)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    event_name text NOT NULL,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    channel text NOT NULL CHECK (channel IN ('email', 'sms')),
    template_id uuid NOT NULL,
    delay_minutes integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'paused' NOT NULL CHECK (status IN ('active', 'paused', 'archived')),
    total_sent integer DEFAULT 0 NOT NULL,
    last_sent_at timestamp with time zone,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_automation_rules_event ON public.automation_rules (event_name, status);
CREATE INDEX idx_automation_rules_status ON public.automation_rules (status);

COMMENT ON TABLE public.automation_rules IS 'Single-fire automation rules: one event triggers one template send';

-- -------------------------------------------------------
-- 2. sequences  (multi-step drip containers)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    trigger_event text NOT NULL,
    trigger_conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    exit_events jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'paused' NOT NULL CHECK (status IN ('active', 'paused', 'archived')),
    total_enrolled integer DEFAULT 0 NOT NULL,
    total_completed integer DEFAULT 0 NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_sequences_trigger ON public.sequences (trigger_event, status);
CREATE INDEX idx_sequences_status ON public.sequences (status);

COMMENT ON TABLE public.sequences IS 'Multi-step drip sequence containers with trigger and exit events';

-- -------------------------------------------------------
-- 3. sequence_steps  (ordered steps within a sequence)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sequence_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sequence_id uuid NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
    step_order integer NOT NULL,
    channel text NOT NULL CHECK (channel IN ('email', 'sms')),
    template_id uuid NOT NULL,
    delay_minutes integer DEFAULT 0 NOT NULL,
    delay_from text DEFAULT 'previous_step' NOT NULL CHECK (delay_from IN ('enrollment', 'previous_step')),
    subject_override text,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'paused')),
    total_sent integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (sequence_id, step_order)
);

CREATE INDEX idx_sequence_steps_sequence ON public.sequence_steps (sequence_id, step_order);

COMMENT ON TABLE public.sequence_steps IS 'Ordered steps within a drip sequence, each linking to a template';

-- -------------------------------------------------------
-- 4. sequence_enrollments  (user progress tracking)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sequence_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sequence_id uuid NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    email text,
    phone text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    current_step_order integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    next_step_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancel_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX idx_sequence_enrollments_unique
    ON public.sequence_enrollments (sequence_id, email)
    WHERE status = 'active';

CREATE INDEX idx_sequence_enrollments_next ON public.sequence_enrollments (status, next_step_at)
    WHERE status = 'active';

CREATE INDEX idx_sequence_enrollments_sequence ON public.sequence_enrollments (sequence_id, status);
CREATE INDEX idx_sequence_enrollments_user ON public.sequence_enrollments (user_id) WHERE user_id IS NOT NULL;

COMMENT ON TABLE public.sequence_enrollments IS 'Tracks each user/lead progress through a drip sequence';

-- -------------------------------------------------------
-- 5. messaging_campaigns  (bulk/scheduled sends)
--    Completely separate from marketing_campaigns
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messaging_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    channel text NOT NULL CHECK (channel IN ('email', 'sms')),
    template_id uuid NOT NULL,
    audience_filter jsonb DEFAULT '{}'::jsonb NOT NULL,
    audience_count integer DEFAULT 0 NOT NULL,
    scheduled_for timestamp with time zone,
    status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    sent_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_messaging_campaigns_status ON public.messaging_campaigns (status);
CREATE INDEX idx_messaging_campaigns_scheduled ON public.messaging_campaigns (scheduled_for)
    WHERE status = 'scheduled';

COMMENT ON TABLE public.messaging_campaigns IS 'One-time or scheduled bulk email/SMS sends with audience filtering';

-- -------------------------------------------------------
-- 6. Updated-at triggers
-- -------------------------------------------------------
CREATE TRIGGER update_automation_rules_timestamp
    BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();

CREATE TRIGGER update_sequences_timestamp
    BEFORE UPDATE ON public.sequences
    FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();

CREATE TRIGGER update_sequence_steps_timestamp
    BEFORE UPDATE ON public.sequence_steps
    FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();

CREATE TRIGGER update_sequence_enrollments_timestamp
    BEFORE UPDATE ON public.sequence_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();

CREATE TRIGGER update_messaging_campaigns_timestamp
    BEFORE UPDATE ON public.messaging_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();

-- -------------------------------------------------------
-- 7. RLS policies (admin-only for all tables)
-- -------------------------------------------------------
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on automation_rules"
    ON public.automation_rules FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on sequences"
    ON public.sequences FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on sequence_steps"
    ON public.sequence_steps FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on sequence_enrollments"
    ON public.sequence_enrollments FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on messaging_campaigns"
    ON public.messaging_campaigns FOR ALL
    USING (true) WITH CHECK (true);
