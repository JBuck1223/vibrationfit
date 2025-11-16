-- Add play count tracking to audio tracks
-- This migration adds a simple counter column to track how many times each audio track
-- has been played to completion (80%+ listened)

-- Add play_count column to audio_tracks table
ALTER TABLE audio_tracks
ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for faster queries when calculating user totals
CREATE INDEX IF NOT EXISTS idx_audio_tracks_play_count ON audio_tracks(user_id, play_count);

-- Create function to increment play count for a specific track
CREATE OR REPLACE FUNCTION increment_audio_play(
  p_track_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE audio_tracks 
  SET play_count = play_count + 1 
  WHERE id = p_track_id; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get total audio plays for a user
CREATE OR REPLACE FUNCTION get_user_total_audio_plays(
  p_user_id UUID
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(play_count), 0)::INTEGER
    FROM audio_tracks
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON COLUMN audio_tracks.play_count IS 'Number of times this track was played to 80%+ completion';
COMMENT ON FUNCTION increment_audio_play IS 'Increments the play count for a specific audio track';
COMMENT ON FUNCTION get_user_total_audio_plays IS 'Returns the total number of audio plays (activations) for a user';

