-- Supporting index for the /audio/music browse-by-artist roll-up.
-- GET /api/music/artists scans all member-library tracks (in_member_library = true
-- AND mp3_url IS NOT NULL) and groups by user_id with distinct song_id. This partial
-- covering index lets that roll-up run as an index-only scan over just the relevant
-- rows, instead of touching the full song_tracks table as it scales to thousands.

CREATE INDEX IF NOT EXISTS idx_song_tracks_artist_rollup
  ON public.song_tracks (user_id, song_id)
  WHERE in_member_library = true AND mp3_url IS NOT NULL;

COMMENT ON INDEX public.idx_song_tracks_artist_rollup IS
  'Covers the global artist roll-up for /audio/music browse (member-library tracks grouped by user_id).';
