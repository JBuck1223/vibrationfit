-- Story Behind the Song: members record a video or audio telling the story
-- behind a completed song. Media is stored in S3 (songs folder); the URL and
-- type live on the songs row.

ALTER TABLE public.songs
    ADD COLUMN IF NOT EXISTS story_media_url text,
    ADD COLUMN IF NOT EXISTS story_media_type text,
    ADD COLUMN IF NOT EXISTS story_recorded_at timestamp with time zone;

ALTER TABLE public.songs
    ADD CONSTRAINT songs_story_media_type_check
    CHECK (story_media_type IS NULL OR story_media_type = ANY (ARRAY['video'::text, 'audio'::text]));
