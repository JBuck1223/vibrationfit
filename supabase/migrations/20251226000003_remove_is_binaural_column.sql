-- Clean up old columns from initial migration
-- We now use numeric values only: frequency_hz and brainwave_hz

-- Drop old columns if they exist
ALTER TABLE public.audio_background_tracks
DROP COLUMN IF EXISTS is_binaural,
DROP COLUMN IF EXISTS brainwave_state,
DROP COLUMN IF EXISTS binaural_beat_hz;

-- Remove old indexes if they exist
DROP INDEX IF EXISTS idx_audio_background_tracks_binaural;

