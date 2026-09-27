-- Optional display name for each mix on a saved Activation Kit.
-- Index 0 is the primary mix (background_track_id). Later indexes match
-- extra_background_track_ids. An empty string keeps the generated name.
ALTER TABLE public.activation_kits
  ADD COLUMN mix_names text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.activation_kits.mix_names IS
  'Display name for each mix. Index 0 is the primary mix; later indexes match extra_background_track_ids.';
