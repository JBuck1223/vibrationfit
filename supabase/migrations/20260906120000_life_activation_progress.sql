-- Life Activation onboarding + optional Platform Training
-- Replaces the locked 72-hour Intensive as the post-purchase path.

CREATE TABLE IF NOT EXISTS public.life_activation_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  source_activation_id uuid REFERENCES public.activations (id) ON DELETE SET NULL,
  draft_vision_id uuid REFERENCES public.vision_versions (id) ON DELETE SET NULL,
  active_vision_id uuid REFERENCES public.vision_versions (id) ON DELETE SET NULL,
  kit_run_id uuid,
  onboarding_step text NOT NULL DEFAULT 'welcome',
  onboarding jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding_started_at timestamptz,
  onboarding_completed_at timestamptz,
  training_step text,
  training jsonb NOT NULL DEFAULT '{}'::jsonb,
  training_started_at timestamptz,
  training_completed_at timestamptz,
  training_dismissed_at timestamptz,
  intensive_checklist_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_life_activation_progress_user_id
  ON public.life_activation_progress (user_id);

ALTER TABLE public.life_activation_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "life_activation_progress_owner_select"
  ON public.life_activation_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "life_activation_progress_owner_insert"
  ON public.life_activation_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "life_activation_progress_owner_update"
  ON public.life_activation_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "life_activation_progress_service_all"
  ON public.life_activation_progress FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER PUBLICATION supabase_realtime ADD TABLE public.life_activation_progress;

ALTER TABLE public.intensive_checklist
  ADD COLUMN IF NOT EXISTS migrated_to_life_activation boolean NOT NULL DEFAULT false;

ALTER TABLE public.journey_events DROP CONSTRAINT IF EXISTS journey_events_event_type_check;
ALTER TABLE public.journey_events ADD CONSTRAINT journey_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'email_captured', 'cart_created', 'checkout_started', 'purchase_completed',
    'activation_started', 'current_state_completed', 'dream_layer_completed',
    'category_confirmed', 'activation_ready', 'activation_opened',
    'activation_entered', 'activation_enriched', 'inspired_step_saved',
    'story_viewed', 'audio_played', 'song_played', 'assets_downloaded',
    'paid_offer_clicked', 'converted_to_paid',
    'activation_oriented', 'activation_resume_email_sent', 'activation_resumed',
    'activation_intake_ready', 'activation_generate_failed', 'offer_video_viewed',
    'life_activation_started', 'life_vision_committed',
    'life_activation_started_community', 'life_activation_completed',
    'platform_training_started', 'platform_training_completed'
  ]));
