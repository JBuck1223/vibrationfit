-- Populate background_track URLs in audio_variants table
-- This connects each variant to its actual background music file

UPDATE public.audio_variants
SET background_track = 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3'
WHERE id = 'sleep';

UPDATE public.audio_variants
SET background_track = 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3'
WHERE id = 'meditation';

UPDATE public.audio_variants
SET background_track = 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3'
WHERE id = 'energy';

-- Standard (voice-only) has no background track
UPDATE public.audio_variants
SET background_track = NULL
WHERE id = 'standard';

-- Make background_track required for non-standard variants
ALTER TABLE public.audio_variants
ADD CONSTRAINT audio_variants_background_track_check
CHECK (
  (id = 'standard' AND background_track IS NULL) OR
  (id != 'standard' AND background_track IS NOT NULL)
);

COMMENT ON COLUMN public.audio_variants.background_track IS 'Full URL to the background music track (e.g., https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3)';

