-- Public sharing for official music catalog tracks.
-- Any track on /audio/music (member library or official catalog) can be shared
-- publicly; catalog rows get their own share token for the /music/[token] page.

ALTER TABLE public.music_catalog
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_music_catalog_share_token
  ON public.music_catalog (share_token)
  WHERE share_token IS NOT NULL;

COMMENT ON COLUMN public.music_catalog.share_token IS 'URL-safe token for the public share link (/music/[token])';
