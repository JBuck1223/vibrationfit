-- Display / metadata: "Vibration Fit" as the artist (two words)

UPDATE public.music_catalog
SET
  artist = 'Vibration Fit',
  updated_at = now()
WHERE artist = 'VibrationFit';

ALTER TABLE public.music_catalog
  ALTER COLUMN artist SET DEFAULT 'Vibration Fit';
