CREATE INDEX IF NOT EXISTS idx_vibrational_event_sources_key
    ON public.vibrational_event_sources (source_key);
-- -----------------------------------------------------------------------------
-- Vibrational System Core Tables
-- -----------------------------------------------------------------------------

-- SCENES TABLE ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    essence_word TEXT,
    emotional_valence TEXT NOT NULL CHECK (emotional_valence IN ('below_green_line', 'near_green_line', 'above_green_line')),
    created_from TEXT NOT NULL CHECK (created_from IN ('ai_suggested', 'user_written', 'hybrid')),
    related_vision_id UUID REFERENCES public.vision_versions (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenes_user_category ON public.scenes (user_id, category);
CREATE INDEX IF NOT EXISTS idx_scenes_category_created_at ON public.scenes (category, created_at DESC);

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'scenes'
          AND policyname = 'Users can view their scenes'
    ) THEN
        CREATE POLICY "Users can view their scenes" ON public.scenes
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'scenes'
          AND policyname = 'Users can insert their scenes'
    ) THEN
        CREATE POLICY "Users can insert their scenes" ON public.scenes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'scenes'
          AND policyname = 'Users can update their scenes'
    ) THEN
        CREATE POLICY "Users can update their scenes" ON public.scenes
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_on_scenes ON public.scenes;
CREATE TRIGGER set_updated_at_on_scenes
    BEFORE UPDATE ON public.scenes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- VIBRATIONAL EVENTS TABLE -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vibrational_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id UUID,
    raw_text TEXT,
    emotional_valence TEXT NOT NULL CHECK (emotional_valence IN ('below_green_line', 'near_green_line', 'above_green_line')),
    dominant_emotions TEXT[] DEFAULT ARRAY[]::TEXT[],
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 10),
    essence_word TEXT,
    is_contrast BOOLEAN NOT NULL DEFAULT FALSE,
    summary_in_their_voice TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vibrational_events_user_category_created_at
    ON public.vibrational_events (user_id, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibrational_events_category_created_at
    ON public.vibrational_events (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibrational_events_source
    ON public.vibrational_events (source_type, source_id);

ALTER TABLE public.vibrational_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'vibrational_events'
          AND policyname = 'Users can view their vibrational events'
    ) THEN
        CREATE POLICY "Users can view their vibrational events" ON public.vibrational_events
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'vibrational_events'
          AND policyname = 'Users can insert their vibrational events'
    ) THEN
        CREATE POLICY "Users can insert their vibrational events" ON public.vibrational_events
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- EMOTIONAL SNAPSHOTS TABLE ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emotional_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    current_valence TEXT NOT NULL CHECK (current_valence IN ('below_green_line', 'near_green_line', 'above_green_line')),
    trending_direction TEXT NOT NULL CHECK (trending_direction IN ('up', 'down', 'stable')),
    avg_intensity NUMERIC,
    dominant_essence_words TEXT[] DEFAULT ARRAY[]::TEXT[],
    primary_essence TEXT,
    last_event_at TIMESTAMPTZ,
    event_count_7d INTEGER DEFAULT 0,
    event_count_30d INTEGER DEFAULT 0,
    last_scene_id UUID REFERENCES public.scenes (id) ON DELETE SET NULL,
    last_vision_id UUID REFERENCES public.vision_versions (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_emotional_snapshots_user_category
    ON public.emotional_snapshots (user_id, category);

ALTER TABLE public.emotional_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'emotional_snapshots'
          AND policyname = 'Users can view their emotional snapshots'
    ) THEN
        CREATE POLICY "Users can view their emotional snapshots" ON public.emotional_snapshots
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'emotional_snapshots'
          AND policyname = 'Users can upsert their emotional snapshots'
    ) THEN
        CREATE POLICY "Users can upsert their emotional snapshots" ON public.emotional_snapshots
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their emotional snapshots" ON public.emotional_snapshots
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_on_emotional_snapshots ON public.emotional_snapshots;
CREATE TRIGGER set_updated_at_on_emotional_snapshots
    BEFORE UPDATE ON public.emotional_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ABUNDANCE EVENTS TABLE -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.abundance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value_type TEXT NOT NULL CHECK (value_type IN ('money', 'value')),
    amount NUMERIC(12,2),
    vision_category TEXT,
    entry_category TEXT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abundance_events_user_date
    ON public.abundance_events (user_id, date DESC);

ALTER TABLE public.abundance_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'abundance_events'
          AND policyname = 'Users can view their abundance events'
    ) THEN
        CREATE POLICY "Users can view their abundance events" ON public.abundance_events
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'abundance_events'
          AND policyname = 'Users can insert their abundance events'
    ) THEN
        CREATE POLICY "Users can insert their abundance events" ON public.abundance_events
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'abundance_events'
          AND policyname = 'Users can update their abundance events'
    ) THEN
        CREATE POLICY "Users can update their abundance events" ON public.abundance_events
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Ensure the shared updated_at trigger function exists only once
COMMENT ON FUNCTION public.set_updated_at() IS 'Sets updated_at timestamp to now() before update triggers.';

-- VIBRATIONAL EVENT SOURCES TABLE -------------------------------------------
CREATE TABLE IF NOT EXISTS public.vibrational_event_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_category TEXT,
    field_map JSONB NOT NULL DEFAULT '{}'::jsonb,
    analyzer_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vibrational_event_sources_enabled
    ON public.vibrational_event_sources (enabled);

ALTER TABLE public.vibrational_event_sources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'vibrational_event_sources'
          AND policyname = 'Admins can manage vibrational sources'
    ) THEN
        CREATE POLICY "Admins can manage vibrational sources" ON public.vibrational_event_sources
            USING (auth.uid() IS NOT NULL)
            WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'vibrational_event_sources'
          AND policyname = 'Users can view enabled vibrational sources'
    ) THEN
        CREATE POLICY "Users can view enabled vibrational sources" ON public.vibrational_event_sources
            FOR SELECT
            USING (
                enabled = TRUE OR auth.uid() IS NOT NULL
            );
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_on_vibrational_event_sources ON public.vibrational_event_sources;
CREATE TRIGGER set_updated_at_on_vibrational_event_sources
    BEFORE UPDATE ON public.vibrational_event_sources
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

