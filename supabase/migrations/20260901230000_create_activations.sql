-- Activation Experience (public lead magnet + member activations).
-- One row per Activation: the funnel record that ties the user's Current State
-- and Dream Layer input to the generated proof object (vision, story,
-- incantation, SparkQuery) and background enrichment (audio, song,
-- manifestation images). Assets live in their own tables; this row holds refs
-- plus a per-asset status machine for the idempotent orchestrator.
-- NOTE: supabase/COMPLETE_SCHEMA_DUMP.sql is stale for this table; the user
-- regenerates it after this migration is applied.

CREATE TABLE public.activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Funnel status. Enrichment is tracked per-asset in asset_status, never here.
  status text NOT NULL DEFAULT 'started' CHECK (status = ANY (ARRAY[
    'started', 'current_state', 'dream', 'category_confirmed',
    'generating', 'ready', 'entered'
  ])),

  -- Inputs (the single source object)
  current_state text,
  dream_response jsonb, -- { want, why, feel, become }
  category text CHECK (category IS NULL OR category = ANY (ARRAY[
    'fun', 'health', 'travel', 'love', 'family', 'social',
    'home', 'work', 'money', 'stuff', 'giving', 'spirituality'
  ])),
  desired_emotional_state text,

  -- Structured vision object
  reflection text,          -- "Here's what I'm hearing..."
  vision_statement text,    -- "Life I Choose"

  -- Generated asset refs (assets live in their own tables)
  story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  incantation_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  spark_query_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  song_id uuid REFERENCES public.songs(id) ON DELETE SET NULL,
  audio_set_id uuid REFERENCES public.audio_sets(id) ON DELETE SET NULL,
  audio_track_id uuid REFERENCES public.audio_tracks(id) ON DELETE SET NULL,
  manifestation_ids uuid[] NOT NULL DEFAULT '{}',

  -- Per-asset orchestration state:
  -- { [asset]: { state: pending|generating|ready|failed, retry_count, error_message } }
  asset_status jsonb NOT NULL DEFAULT '{}',

  -- Optional post-entry action (never a commitment, no deadline semantics)
  inspired_next_step text,

  ready_at timestamptz,
  entered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activations_user ON public.activations(user_id, created_at DESC);
CREATE INDEX idx_activations_status ON public.activations(status);

CREATE TRIGGER activations_set_updated_at
  BEFORE UPDATE ON public.activations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Owner-only RLS (service role bypasses for the orchestrator's background work)
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own activations"
  ON public.activations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create own activations"
  ON public.activations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own activations"
  ON public.activations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can delete own activations"
  ON public.activations FOR DELETE
  USING (auth.uid() = user_id);

-- Realtime: the Immersion screen lights up as background assets finish
ALTER PUBLICATION supabase_realtime ADD TABLE public.activations;

-- Funnel events for the Activation experience
ALTER TABLE public.journey_events DROP CONSTRAINT journey_events_event_type_check;
ALTER TABLE public.journey_events ADD CONSTRAINT journey_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'email_captured', 'cart_created', 'checkout_started', 'purchase_completed',
    'activation_started', 'current_state_completed', 'dream_layer_completed',
    'category_confirmed', 'activation_ready', 'activation_opened',
    'activation_entered', 'activation_enriched', 'inspired_step_saved',
    'story_viewed', 'audio_played', 'song_played', 'assets_downloaded',
    'paid_offer_clicked', 'converted_to_paid'
  ]));

-- Activation is a new lead type
ALTER TABLE public.leads DROP CONSTRAINT leads_type_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_type_check
  CHECK (type = ANY (ARRAY['contact', 'demo', 'intensive_intake', 'activation']));
