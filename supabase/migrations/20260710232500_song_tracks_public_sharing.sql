-- Public song sharing: allow members to share tracks with non-members.
-- share_token: permanent URL-safe token generated on first share (link stays stable across re-shares)
-- is_shared: whether the share link is currently active
-- is_public: whether the track is also listed on the public /music discover page
-- shared_at: when sharing was last enabled

ALTER TABLE public.song_tracks
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_song_tracks_share_token
  ON public.song_tracks (share_token)
  WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_song_tracks_public
  ON public.song_tracks (is_public, shared_at DESC)
  WHERE is_public = true;

COMMENT ON COLUMN public.song_tracks.share_token IS 'URL-safe token for the public share link (/music/[token])';
COMMENT ON COLUMN public.song_tracks.is_shared IS 'Whether the public share link is active';
COMMENT ON COLUMN public.song_tracks.is_public IS 'Whether this track is listed on the public /music discover page';
COMMENT ON COLUMN public.song_tracks.shared_at IS 'When sharing was last enabled';
