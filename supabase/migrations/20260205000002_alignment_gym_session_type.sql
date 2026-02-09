-- Migration: Add alignment_gym session type + highlighted_message_id to video_session_messages
-- 
-- 1) New session type for Alignment Gym (unlimited participants)
-- 2) highlighted_message_id on video_sessions for pinned chat messages

-- Add 'alignment_gym' to the video_session_type enum
ALTER TYPE public.video_session_type ADD VALUE IF NOT EXISTS 'alignment_gym';

-- Add highlighted_message_id to video_sessions for the host-pinned chat highlight
ALTER TABLE public.video_sessions
  ADD COLUMN IF NOT EXISTS highlighted_message_id uuid REFERENCES public.video_session_messages(id) ON DELETE SET NULL;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_video_sessions_highlighted_msg 
  ON public.video_sessions USING btree (highlighted_message_id) 
  WHERE highlighted_message_id IS NOT NULL;

COMMENT ON COLUMN public.video_sessions.highlighted_message_id IS 'Currently highlighted/pinned chat message displayed to all participants';
