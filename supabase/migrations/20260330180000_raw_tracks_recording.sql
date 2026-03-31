-- Add columns to video_session_recordings for raw-tracks support
-- Each raw-tracks recording produces separate audio/video files per participant

ALTER TABLE public.video_session_recordings
  ADD COLUMN IF NOT EXISTS recording_type text DEFAULT 'cloud',
  ADD COLUMN IF NOT EXISTS track_type text,
  ADD COLUMN IF NOT EXISTS participant_session_id text,
  ADD COLUMN IF NOT EXISTS participant_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.video_session_recordings.recording_type IS 'cloud = composited MP4, raw-tracks = individual webm per participant';
COMMENT ON COLUMN public.video_session_recordings.track_type IS 'For raw-tracks: video or audio';
COMMENT ON COLUMN public.video_session_recordings.participant_session_id IS 'Daily.co participant session ID for this track';
COMMENT ON COLUMN public.video_session_recordings.participant_user_id IS 'Our user ID matched to this participant track';

CREATE INDEX IF NOT EXISTS idx_video_recordings_participant
  ON public.video_session_recordings (participant_user_id)
  WHERE participant_user_id IS NOT NULL;
