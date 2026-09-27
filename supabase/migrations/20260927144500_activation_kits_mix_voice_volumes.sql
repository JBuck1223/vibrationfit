-- Voice/background balance for each mix on a saved Activation Kit.
-- Index 0 is the primary mix. Later indexes match extra_background_track_ids.
-- Background percent is 100 minus the voice percent. An empty array keeps
-- the shared voice_volume / bg_volume for every mix.
ALTER TABLE public.activation_kits
  ADD COLUMN mix_voice_volumes integer[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.activation_kits.mix_voice_volumes IS
  'Voice percent for each mix. Index 0 is the primary mix; later indexes match extra_background_track_ids. Background percent is 100 minus this value.';
