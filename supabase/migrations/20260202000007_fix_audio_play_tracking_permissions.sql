-- Fix missing GRANT EXECUTE permissions for audio play tracking functions
-- The original migration (20250204000000) created these functions but never granted
-- execute permissions to the authenticated role, causing silent failures when
-- tracking audio plays from the client.

-- Grant execute permission for incrementing play count
GRANT EXECUTE ON FUNCTION increment_audio_play(UUID) TO authenticated;

-- Grant execute permission for getting user's total audio plays
GRANT EXECUTE ON FUNCTION get_user_total_audio_plays(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION increment_audio_play(UUID) IS 'Increments the play count for a specific audio track. Called when user listens to 80%+ of a track.';
COMMENT ON FUNCTION get_user_total_audio_plays(UUID) IS 'Returns the total number of audio plays (activations) for a user across all their tracks.';
