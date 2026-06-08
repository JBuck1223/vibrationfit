-- Life categories selected by creator at submission time (used for music_catalog tags on approval)

ALTER TABLE public.song_publish_requests
ADD COLUMN IF NOT EXISTS life_categories text[] DEFAULT '{}'::text[] NOT NULL;

COMMENT ON COLUMN public.song_publish_requests.life_categories IS
  'Life category keys (e.g. money, fun) chosen by the creator at submission; copied to music_catalog.tags on approval.';
