-- Music Catalog: VibrationFit's published music with streaming platform links
-- These are distributed songs live on Spotify, Amazon Music, Apple Music, etc.

CREATE TABLE public.music_catalog (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    artist text NOT NULL DEFAULT 'VibrationFit',
    album text,
    track_number integer,
    genre text,
    tags text[],
    release_date date,
    duration_seconds integer,

    -- Media
    artwork_url text,
    preview_url text,

    -- Streaming platform links
    spotify_url text,
    apple_music_url text,
    amazon_music_url text,
    youtube_music_url text,
    tidal_url text,
    deezer_url text,
    soundcloud_url text,

    -- Metadata
    description text,
    isrc text,

    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_music_catalog_album ON public.music_catalog (album);
CREATE INDEX idx_music_catalog_active ON public.music_catalog (is_active);
CREATE INDEX idx_music_catalog_featured ON public.music_catalog (is_featured) WHERE is_featured = true;
CREATE INDEX idx_music_catalog_sort ON public.music_catalog (sort_order);

-- RLS
ALTER TABLE public.music_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active music"
    ON public.music_catalog FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Service role has full access to music catalog"
    ON public.music_catalog FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Table comment
COMMENT ON TABLE public.music_catalog IS 'VibrationFit published music catalog with streaming platform links';
COMMENT ON COLUMN public.music_catalog.preview_url IS 'S3 URL for in-app audio preview/playback';
COMMENT ON COLUMN public.music_catalog.isrc IS 'International Standard Recording Code for the track';
