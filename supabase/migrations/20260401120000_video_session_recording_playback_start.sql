-- Skip N seconds at the start when playing session recordings in-app (S3 URL unchanged).

ALTER TABLE public.video_sessions
  ADD COLUMN IF NOT EXISTS recording_playback_start_seconds integer;

COMMENT ON COLUMN public.video_sessions.recording_playback_start_seconds IS
  'Seconds to skip from the beginning when playing recording_url in the app (pleasantries, etc.). NULL or 0 = from start.';

ALTER TABLE public.video_sessions
  DROP CONSTRAINT IF EXISTS video_sessions_recording_playback_start_seconds_check;

ALTER TABLE public.video_sessions
  ADD CONSTRAINT video_sessions_recording_playback_start_seconds_check
  CHECK (recording_playback_start_seconds IS NULL OR recording_playback_start_seconds >= 0);
