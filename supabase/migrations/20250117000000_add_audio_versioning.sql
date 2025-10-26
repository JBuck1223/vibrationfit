-- Add audio versioning system for life vision audio tracks
-- This allows multiple sets of audio tracks per vision (e.g., sleep versions, different background tracks)

-- STEP 1: Create audio_sets table first
-- Create audio_sets table to track metadata about audio sets
CREATE TABLE IF NOT EXISTS public.audio_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vision_id UUID NOT NULL REFERENCES public.vision_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Sleep Edition", "Energy Mix", "Standard Version"
  description TEXT,
  variant TEXT, -- 'standard', 'sleep', 'energy', 'meditation', etc.
  voice_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB, -- Additional metadata like background music, tempo, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note: Unique constraint and audio_tracks indexes will be added after audio_set_id column exists

-- Create indexes for audio_sets
CREATE INDEX IF NOT EXISTS idx_audio_sets_vision_id ON public.audio_sets(vision_id);
CREATE INDEX IF NOT EXISTS idx_audio_sets_user_id ON public.audio_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_sets_is_active ON public.audio_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_audio_sets_variant ON public.audio_sets(variant);

-- Enable RLS on audio_sets
ALTER TABLE public.audio_sets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audio_sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audio_sets' AND policyname = 'Users can select their own audio sets'
  ) THEN
    CREATE POLICY "Users can select their own audio sets" ON public.audio_sets
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audio_sets' AND policyname = 'Users can insert their own audio sets'
  ) THEN
    CREATE POLICY "Users can insert their own audio sets" ON public.audio_sets
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audio_sets' AND policyname = 'Users can update their own audio sets'
  ) THEN
    CREATE POLICY "Users can update their own audio sets" ON public.audio_sets
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audio_sets' AND policyname = 'Users can delete their own audio sets'
  ) THEN
    CREATE POLICY "Users can delete their own audio sets" ON public.audio_sets
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Add trigger for updated_at on audio_sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_audio_sets_updated_at'
  ) THEN
    CREATE TRIGGER trigger_audio_sets_updated_at
    BEFORE UPDATE ON public.audio_sets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- STEP 2: Add audio_set_id column to audio_tracks (nullable first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'audio_tracks' AND column_name = 'audio_set_id'
  ) THEN
    ALTER TABLE public.audio_tracks
      ADD COLUMN audio_set_id UUID;
  END IF;
END
$$;

-- STEP 3: Create default audio sets for existing tracks and populate audio_set_id
DO $$
DECLARE
  vision RECORD;
  default_set_id UUID;
  track_voice_id TEXT;
BEGIN
  -- Loop through each distinct vision_id that has audio tracks
  FOR vision IN 
    SELECT DISTINCT vision_id, user_id FROM public.audio_tracks WHERE audio_set_id IS NULL
  LOOP
    -- Get voice_id from first track for this vision
    SELECT voice_id INTO track_voice_id 
    FROM public.audio_tracks 
    WHERE vision_id = vision.vision_id AND audio_set_id IS NULL
    LIMIT 1;
    
    -- Create default audio set for this vision
    INSERT INTO public.audio_sets (id, vision_id, user_id, name, description, variant, voice_id)
    VALUES (
      gen_random_uuid(),
      vision.vision_id,
      vision.user_id,
      'Standard Version',
      'Default audio version for this vision',
      'standard',
      COALESCE(track_voice_id, 'alloy')
    )
    RETURNING id INTO default_set_id;
    
    -- Update all tracks for this vision to use the default audio_set_id
    UPDATE public.audio_tracks 
    SET audio_set_id = default_set_id 
    WHERE vision_id = vision.vision_id AND audio_set_id IS NULL;
  END LOOP;
END
$$;

-- STEP 4: Make audio_set_id NOT NULL now that it's populated
DO $$
BEGIN
  ALTER TABLE public.audio_tracks
    ALTER COLUMN audio_set_id SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if already NOT NULL
    NULL;
END
$$;

-- STEP 5: Create indexes for audio_tracks with audio_set_id
CREATE INDEX IF NOT EXISTS idx_audio_tracks_audio_set_id ON public.audio_tracks(audio_set_id);
CREATE INDEX IF NOT EXISTS idx_audio_tracks_vision_id_audio_set_id ON public.audio_tracks(vision_id, audio_set_id);

-- STEP 6: Drop old unique constraint and add new one with audio_set_id
DO $$
BEGIN
  -- Drop existing unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'audio_tracks_vision_id_section_key_content_hash_key'
  ) THEN
    ALTER TABLE public.audio_tracks
      DROP CONSTRAINT audio_tracks_vision_id_section_key_content_hash_key;
  END IF;
  
  -- Add new unique constraint that includes audio_set_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'audio_tracks_vision_audio_set_section_content_unique'
  ) THEN
    ALTER TABLE public.audio_tracks
      ADD CONSTRAINT audio_tracks_vision_audio_set_section_content_unique
      UNIQUE (vision_id, audio_set_id, section_key, content_hash);
  END IF;
END
$$;

-- STEP 7: Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'audio_tracks_audio_set_id_fkey'
  ) THEN
    ALTER TABLE public.audio_tracks
      ADD CONSTRAINT audio_tracks_audio_set_id_fkey
      FOREIGN KEY (audio_set_id) REFERENCES public.audio_sets(id) ON DELETE CASCADE;
  END IF;
END
$$;

COMMENT ON TABLE public.audio_sets IS 'Audio version sets for life visions - allows multiple audio variants per vision';
COMMENT ON COLUMN public.audio_sets.variant IS 'Type of audio variant (standard, sleep, energy, meditation, etc.)';
COMMENT ON COLUMN public.audio_sets.metadata IS 'Additional metadata like background music, tempo, fade effects, etc.';
COMMENT ON COLUMN public.audio_tracks.audio_set_id IS 'References the audio_set this track belongs to';
