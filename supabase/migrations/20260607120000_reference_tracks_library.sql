-- Reference Tracks Library
-- Stores every reference track a user has uploaded so they can reuse them across songs.

CREATE TABLE public.reference_tracks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text,
    youtube_url text,
    full_audio_url text NOT NULL,
    clip_url text,
    clip_start numeric DEFAULT 0,
    clip_end numeric DEFAULT 30,
    duration numeric,
    mureka_file_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_reference_tracks_user_id ON public.reference_tracks(user_id);
CREATE INDEX idx_reference_tracks_created ON public.reference_tracks(user_id, created_at DESC);

ALTER TABLE public.reference_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reference tracks"
    ON public.reference_tracks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reference tracks"
    ON public.reference_tracks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reference tracks"
    ON public.reference_tracks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reference tracks"
    ON public.reference_tracks FOR DELETE
    USING (auth.uid() = user_id);
