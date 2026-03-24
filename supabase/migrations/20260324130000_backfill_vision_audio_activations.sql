-- Backfill area_activations for vision_audio from audio_tracks play history.
-- Uses updated_at from tracks with play_count > 0 as the best available proxy
-- for when users last listened. This captures at least the most recent play date
-- per track per user.

INSERT INTO public.area_activations (user_id, area, activation_date, activated_at)
SELECT DISTINCT
  at.user_id,
  'vision_audio',
  (at.updated_at AT TIME ZONE 'UTC')::date,
  at.updated_at
FROM public.audio_tracks at
WHERE at.play_count > 0
  AND at.updated_at IS NOT NULL
ON CONFLICT (user_id, area, activation_date) DO NOTHING;
