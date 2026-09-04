-- Conversational Activation intake + delivery states + eval columns.
-- Do not edit COMPLETE_SCHEMA_DUMP.sql; the user regenerates it.

-- ---------------------------------------------------------------------------
-- activations: new statuses + conversation + eval fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.activations DROP CONSTRAINT activations_status_check;
ALTER TABLE public.activations ADD CONSTRAINT activations_status_check
  CHECK (status = ANY (ARRAY[
    'started', 'oriented', 'current_state', 'dream', 'category_confirmed',
    'generating', 'ready', 'opened', 'entered'
  ]));

ALTER TABLE public.activations
  ADD COLUMN IF NOT EXISTS conversation jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS intake_turn_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intake_ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS needs_support boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resume_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz;

-- ---------------------------------------------------------------------------
-- journey_events: first-class activation_id + new event types
-- ---------------------------------------------------------------------------
ALTER TABLE public.journey_events
  ADD COLUMN IF NOT EXISTS activation_id uuid REFERENCES public.activations(id) ON DELETE SET NULL;

UPDATE public.journey_events
SET activation_id = (event_data->>'activation_id')::uuid
WHERE activation_id IS NULL
  AND event_data ? 'activation_id'
  AND event_data->>'activation_id' ~* '^[0-9a-f-]{36}$';

CREATE INDEX IF NOT EXISTS idx_journey_events_activation_id
  ON public.journey_events (activation_id);

ALTER TABLE public.journey_events DROP CONSTRAINT journey_events_event_type_check;
ALTER TABLE public.journey_events ADD CONSTRAINT journey_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'email_captured', 'cart_created', 'checkout_started', 'purchase_completed',
    'activation_started', 'current_state_completed', 'dream_layer_completed',
    'category_confirmed', 'activation_ready', 'activation_opened',
    'activation_entered', 'activation_enriched', 'inspired_step_saved',
    'story_viewed', 'audio_played', 'song_played', 'assets_downloaded',
    'paid_offer_clicked', 'converted_to_paid',
    'activation_oriented', 'activation_resume_email_sent', 'activation_resumed',
    'activation_intake_ready', 'activation_generate_failed', 'offer_video_viewed'
  ]));

-- ---------------------------------------------------------------------------
-- VIVA tool: Activation chat uses the same model as /viva coach
-- ---------------------------------------------------------------------------
INSERT INTO public.ai_tools (tool_key, tool_name, description, model_name, temperature, is_active)
VALUES (
  'activation_chat',
  'Activation Conversational Intake',
  'Bounded VIVA chat that gathers contrast, desire, and category for the public Activation',
  'gpt-5.6-terra',
  0.8,
  true
)
ON CONFLICT (tool_key) DO UPDATE SET
  model_name = EXCLUDED.model_name,
  description = EXCLUDED.description,
  is_active = true,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Resume email template
-- ---------------------------------------------------------------------------
INSERT INTO public.email_templates (
  slug, name, description, category, status, subject, html_body, text_body, variables, triggers
)
VALUES (
  'activation-begun',
  'Your Activation has begun',
  'Sent when a free Activation is created so the visitor can return on any device',
  'marketing',
  'active',
  'Your Activation has begun',
  $html$
<p>Hi {{firstName}},</p>
<p>Your Activation is underway. This is your door back in — open it on this device or any other.</p>
<p style="margin:28px 0;">
  <a href="{{resumeUrl}}" style="display:inline-block;background:#39FF14;color:#000;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:999px;">
    Continue My Activation
  </a>
</p>
<p>If you did not start an Activation, you can ignore this email.</p>
<p>VIVA<br/>Vibration Fit</p>
$html$,
  $text$Hi {{firstName}},

Your Activation is underway. Continue here:
{{resumeUrl}}

If you did not start an Activation, you can ignore this email.

VIVA
Vibration Fit
$text$,
  '["firstName", "resumeUrl"]'::jsonb,
  '["activation_started"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
