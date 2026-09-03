-- Activation Kits: saved per-member presets that auto-generate vision assets
-- (voice tracks, audio mixes, board images) after a Life Vision is committed
-- as active. A kit is a reusable settings preset; a kit run is one execution
-- against a specific committed vision, with per-asset orchestration state
-- (same asset_status pattern as public.activations).
-- NOTE: supabase/COMPLETE_SCHEMA_DUMP.sql is stale for these tables; the user
-- regenerates it after this migration is applied.

-- ---------------------------------------------------------------------------
-- Saved kit presets (multiple per user, one default)
-- ---------------------------------------------------------------------------
CREATE TABLE public.activation_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name text NOT NULL DEFAULT 'My Activation Kit',
  is_default boolean NOT NULL DEFAULT false,

  -- Which assets this kit generates
  include_voice boolean NOT NULL DEFAULT true,
  include_mix boolean NOT NULL DEFAULT true,
  include_board boolean NOT NULL DEFAULT true,

  -- Voice settings ("voice" or composite "voice__vibe", see voice-vibes.ts)
  voice_id text NOT NULL DEFAULT 'nova',

  -- Mix preset (background + ratios + optional binaural layer)
  background_track_id uuid REFERENCES public.audio_background_tracks(id) ON DELETE SET NULL,
  voice_volume integer NOT NULL DEFAULT 70
    CHECK (voice_volume >= 0 AND voice_volume <= 100),
  bg_volume integer NOT NULL DEFAULT 30
    CHECK (bg_volume >= 0 AND bg_volume <= 100),
  binaural_track_id uuid REFERENCES public.audio_background_tracks(id) ON DELETE SET NULL,
  binaural_volume integer NOT NULL DEFAULT 0
    CHECK (binaural_volume >= 0 AND binaural_volume <= 30),
  mix_output_format text NOT NULL DEFAULT 'both'
    CHECK (mix_output_format = ANY (ARRAY['individual', 'combined', 'both'])),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One default kit per user
CREATE UNIQUE INDEX idx_activation_kits_one_default
  ON public.activation_kits(user_id) WHERE is_default;
CREATE INDEX idx_activation_kits_user ON public.activation_kits(user_id, created_at DESC);

CREATE TRIGGER activation_kits_set_updated_at
  BEFORE UPDATE ON public.activation_kits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.activation_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own activation kits"
  ON public.activation_kits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create own activation kits"
  ON public.activation_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own activation kits"
  ON public.activation_kits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can delete own activation kits"
  ON public.activation_kits FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Kit runs (one per commit-triggered generation)
-- ---------------------------------------------------------------------------
CREATE TABLE public.activation_kit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_id uuid NOT NULL REFERENCES public.vision_versions(id) ON DELETE CASCADE,
  kit_id uuid REFERENCES public.activation_kits(id) ON DELETE SET NULL,

  -- Snapshot of the settings this run executed with (kit rows can change later)
  settings jsonb NOT NULL DEFAULT '{}',

  -- Overall status; per-asset detail lives in asset_status
  status text NOT NULL DEFAULT 'running'
    CHECK (status = ANY (ARRAY['running', 'completed', 'partial', 'failed'])),

  -- { [voice|mix|board]: { state: pending|generating|ready|failed,
  --                        retry_count, error_message, ... } }
  asset_status jsonb NOT NULL DEFAULT '{}',

  -- Output refs
  voice_audio_set_id uuid REFERENCES public.audio_sets(id) ON DELETE SET NULL,
  mix_audio_set_id uuid REFERENCES public.audio_sets(id) ON DELETE SET NULL,
  mix_batch_id uuid REFERENCES public.audio_generation_batches(id) ON DELETE SET NULL,
  manifestation_ids uuid[] NOT NULL DEFAULT '{}',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_activation_kit_runs_user ON public.activation_kit_runs(user_id, created_at DESC);
CREATE INDEX idx_activation_kit_runs_vision ON public.activation_kit_runs(vision_id);

CREATE TRIGGER activation_kit_runs_set_updated_at
  BEFORE UPDATE ON public.activation_kit_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.activation_kit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own kit runs"
  ON public.activation_kit_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create own kit runs"
  ON public.activation_kit_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own kit runs"
  ON public.activation_kit_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can delete own kit runs"
  ON public.activation_kit_runs FOR DELETE
  USING (auth.uid() = user_id);

-- Realtime: the vision page progress card lights up as assets finish
ALTER PUBLICATION supabase_realtime ADD TABLE public.activation_kits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activation_kit_runs;
