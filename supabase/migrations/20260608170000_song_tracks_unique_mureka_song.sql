-- Prevent duplicate track inserts when the client polls Mureka multiple times
-- after a task completes. Each Mureka song should map to exactly one track row
-- per song.

CREATE UNIQUE INDEX IF NOT EXISTS idx_song_tracks_unique_mureka_song
ON public.song_tracks (song_id, mureka_song_id)
WHERE mureka_song_id IS NOT NULL;
