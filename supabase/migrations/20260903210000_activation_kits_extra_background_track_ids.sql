-- Extra background tracks on a saved Activation Kit. Each ID becomes its own mix
-- (sleep, meditation, workout, etc.) generated in the same kit run. The primary
-- mix still uses background_track_id; this array is additional mixes only.
ALTER TABLE public.activation_kits
  ADD COLUMN extra_background_track_ids uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.activation_kits.extra_background_track_ids IS
  'Additional background tracks to mix in the same kit run, one mix per track.';
