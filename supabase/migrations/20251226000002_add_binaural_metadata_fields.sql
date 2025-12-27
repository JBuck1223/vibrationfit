-- Add binaural metadata fields to audio_background_tracks
-- All values stored as numbers for flexible range queries

-- Add new columns (IF NOT EXISTS)
ALTER TABLE public.audio_background_tracks
ADD COLUMN IF NOT EXISTS frequency_hz integer,
ADD COLUMN IF NOT EXISTS brainwave_hz numeric(5,2);

-- Add indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_audio_background_tracks_frequency ON public.audio_background_tracks(frequency_hz) WHERE frequency_hz IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audio_background_tracks_brainwave ON public.audio_background_tracks(brainwave_hz) WHERE brainwave_hz IS NOT NULL;

