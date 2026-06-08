-- User-selected life category tags for a song. Independent of the song's source
-- entity so a song generated from one category can still be tagged with others.
-- Copied to music_catalog.tags when the track is shared (heart = share).

ALTER TABLE public.songs
ADD COLUMN IF NOT EXISTS life_categories text[] DEFAULT '{}'::text[] NOT NULL;

COMMENT ON COLUMN public.songs.life_categories IS
  'Life category keys (e.g. money, fun) the creator tagged the song with; used for music_catalog filtering when shared.';
