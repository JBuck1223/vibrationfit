-- Life Vision Audio System: audio_tracks table and vision_versions updates
-- Idempotent migration with safe guards

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audio_generation_status') THEN
    CREATE TYPE audio_generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.audio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_id UUID NOT NULL REFERENCES public.vision_versions(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL, -- e.g., 'meta_introduction', 'health', 'wealth', etc.
  content_hash TEXT NOT NULL, -- sha256 of normalized text content
  text_content TEXT NOT NULL,
  voice_id TEXT NOT NULL, -- ElevenLabs voice id used
  s3_bucket TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  status audio_generation_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vision_id, section_key, content_hash)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_audio_tracks_updated_at'
  ) THEN
    CREATE TRIGGER trigger_audio_tracks_updated_at
    BEFORE UPDATE ON public.audio_tracks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_audio_tracks_user_id ON public.audio_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_tracks_vision_id ON public.audio_tracks(vision_id);
CREATE INDEX IF NOT EXISTS idx_audio_tracks_status ON public.audio_tracks(status);
CREATE INDEX IF NOT EXISTS idx_audio_tracks_section_key ON public.audio_tracks(section_key);

ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audio_tracks' AND policyname = 'Users can select their own audio tracks'
  ) THEN
    CREATE POLICY "Users can select their own audio tracks" ON public.audio_tracks
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audio_tracks' AND policyname = 'Users can insert their own audio tracks'
  ) THEN
    CREATE POLICY "Users can insert their own audio tracks" ON public.audio_tracks
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audio_tracks' AND policyname = 'Users can update their own audio tracks'
  ) THEN
    CREATE POLICY "Users can update their own audio tracks" ON public.audio_tracks
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audio_tracks' AND policyname = 'Users can delete their own audio tracks'
  ) THEN
    CREATE POLICY "Users can delete their own audio tracks" ON public.audio_tracks
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'last_audio_generated_at'
  ) THEN
    ALTER TABLE public.vision_versions
      ADD COLUMN last_audio_generated_at TIMESTAMPTZ;
  END IF;
END
$$;

COMMENT ON TABLE public.audio_tracks IS 'AI-narrated audio tracks for life visions (per section)';
COMMENT ON COLUMN public.audio_tracks.section_key IS 'Section identity (2 meta + 12 categories)';
COMMENT ON COLUMN public.audio_tracks.content_hash IS 'SHA-256 of normalized text content for regeneration control';
