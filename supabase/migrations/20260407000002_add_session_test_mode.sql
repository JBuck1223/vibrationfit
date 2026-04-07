-- Add test_mode flag to video_sessions
-- When true, all notifications for this session are sent only to the creating admin
ALTER TABLE video_sessions
  ADD COLUMN IF NOT EXISTS test_mode boolean NOT NULL DEFAULT false;
