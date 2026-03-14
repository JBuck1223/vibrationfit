-- Allow video_sessions to be created without a Daily.co room.
-- Rooms are now created on-demand when the first person joins.
ALTER TABLE video_sessions ALTER COLUMN daily_room_name DROP NOT NULL;
ALTER TABLE video_sessions ALTER COLUMN daily_room_url DROP NOT NULL;
