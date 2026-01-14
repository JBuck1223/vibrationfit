-- Migration: Rename binaural solfeggio tracks to 'solfeggio_binaural' category
-- This distinguishes them from pure solfeggio tones and future non-solfeggio binaurals

-- Update tracks that are solfeggio-based AND have brainwave entrainment
UPDATE audio_background_tracks 
SET category = 'solfeggio_binaural' 
WHERE category = 'solfeggio' 
  AND brainwave_hz IS NOT NULL;

-- Verify the split:
-- solfeggio = pure tones only (no brainwave modulation)
-- solfeggio_binaural = solfeggio carrier + brainwave entrainment
-- binaural = future non-solfeggio binaural beats
