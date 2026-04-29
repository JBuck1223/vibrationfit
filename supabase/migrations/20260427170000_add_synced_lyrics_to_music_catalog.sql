-- Add synced lyrics support to music_catalog
-- synced_lyrics: JSONB blob with timed line/word data for Spotify-style display
-- plain_lyrics: raw lyrics text pasted by admin, kept for re-alignment

ALTER TABLE public.music_catalog
  ADD COLUMN IF NOT EXISTS synced_lyrics jsonb,
  ADD COLUMN IF NOT EXISTS plain_lyrics text;

COMMENT ON COLUMN public.music_catalog.synced_lyrics IS 'Timed lyrics JSON with line-level and word-level timestamps for synced display';
COMMENT ON COLUMN public.music_catalog.plain_lyrics IS 'Raw lyrics text pasted by admin, stored for re-alignment';
