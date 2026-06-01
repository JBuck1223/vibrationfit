-- Add replay_viewed_at column to track when a user watched the session replay
-- This is distinct from attended (which means they joined the live call)

ALTER TABLE video_session_participants
  ADD COLUMN IF NOT EXISTS replay_viewed_at TIMESTAMPTZ;
