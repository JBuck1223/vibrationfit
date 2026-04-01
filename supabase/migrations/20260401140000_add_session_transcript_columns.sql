-- Add transcript columns to video_sessions for session transcription + key points

ALTER TABLE public.video_sessions
  ADD COLUMN IF NOT EXISTS transcript_text TEXT,
  ADD COLUMN IF NOT EXISTS transcript_segments JSONB,
  ADD COLUMN IF NOT EXISTS transcript_key_points JSONB,
  ADD COLUMN IF NOT EXISTS transcribed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.video_sessions.transcript_text IS 'Plain-text transcript of the session recording';
COMMENT ON COLUMN public.video_sessions.transcript_segments IS 'Whisper segments with speaker diarization, timestamps';
COMMENT ON COLUMN public.video_sessions.transcript_key_points IS 'GPT-extracted key points, summary, and themes';
COMMENT ON COLUMN public.video_sessions.transcribed_at IS 'When the transcription was generated';
