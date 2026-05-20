-- Song Studio: songs + song_tracks tables
-- Songs hold lyrics + Song Essence; song_tracks hold individual Mureka outputs.

-- ============================================================================
-- SONGS TABLE
-- ============================================================================

CREATE TABLE public.songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type text NOT NULL,
    entity_id text NOT NULL DEFAULT gen_random_uuid()::text,
    title text,
    lyrics text,
    song_essence jsonb,
    style_prompt text,
    source text DEFAULT 'ai_generated'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    generation_count integer DEFAULT 0 NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT songs_entity_type_check CHECK (entity_type = ANY (ARRAY['life_vision'::text, 'vision_board_item'::text, 'journal_entry'::text, 'custom'::text])),
    CONSTRAINT songs_source_check CHECK (source = ANY (ARRAY['ai_generated'::text, 'user_written'::text, 'ai_assisted'::text])),
    CONSTRAINT songs_status_check CHECK (status = ANY (ARRAY['draft'::text, 'generating_lyrics'::text, 'lyrics_complete'::text, 'generating_music'::text, 'completed'::text, 'failed'::text]))
);

CREATE INDEX idx_songs_user_id ON public.songs(user_id);
CREATE INDEX idx_songs_entity ON public.songs(user_id, entity_type, entity_id);
CREATE INDEX idx_songs_status ON public.songs(user_id, status);

-- ============================================================================
-- SONG TRACKS TABLE
-- ============================================================================

CREATE TABLE public.song_tracks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mureka_task_id text,
    mureka_song_id text,
    title text,
    version text DEFAULT '1'::text NOT NULL,
    mp3_url text,
    s3_key text,
    cover_url text,
    cover_s3_key text,
    duration_ms integer,
    genres text[] DEFAULT '{}'::text[],
    moods text[] DEFAULT '{}'::text[],
    is_favorite boolean DEFAULT false NOT NULL,
    stems_url text,
    stems_s3_key text,
    status text DEFAULT 'generating'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT song_tracks_status_check CHECK (status = ANY (ARRAY['generating'::text, 'completed'::text, 'failed'::text]))
);

CREATE INDEX idx_song_tracks_song_id ON public.song_tracks(song_id);
CREATE INDEX idx_song_tracks_user_id ON public.song_tracks(user_id);
CREATE INDEX idx_song_tracks_favorites ON public.song_tracks(user_id, is_favorite) WHERE is_favorite = true;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_tracks ENABLE ROW LEVEL SECURITY;

-- Songs: users can only access their own
CREATE POLICY "Users can view their own songs"
    ON public.songs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own songs"
    ON public.songs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own songs"
    ON public.songs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own songs"
    ON public.songs FOR DELETE
    USING (auth.uid() = user_id);

-- Song tracks: users can only access their own
CREATE POLICY "Users can view their own song tracks"
    ON public.song_tracks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own song tracks"
    ON public.song_tracks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own song tracks"
    ON public.song_tracks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own song tracks"
    ON public.song_tracks FOR DELETE
    USING (auth.uid() = user_id);

-- Service role bypass for API routes
CREATE POLICY "Service role full access to songs"
    ON public.songs FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to song tracks"
    ON public.song_tracks FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_songs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER songs_updated_at
    BEFORE UPDATE ON public.songs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_songs_updated_at();
