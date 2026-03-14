ALTER TABLE video_sessions
  ADD COLUMN IF NOT EXISTS feedback_rating smallint CHECK (feedback_rating BETWEEN 1 AND 5);
