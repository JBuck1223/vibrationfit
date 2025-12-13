-- Create audio_voice_clones table for ElevenLabs voice cloning
-- Drop table if it exists to start fresh
DROP TABLE IF EXISTS public.audio_voice_clones CASCADE;

CREATE TABLE public.audio_voice_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- ElevenLabs data
  elevenlabs_voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  
  -- Audio sample storage
  sample_audio_url TEXT,
  sample_duration_seconds INTEGER,
  
  -- Metadata
  provider TEXT DEFAULT 'elevenlabs',
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE UNIQUE INDEX idx_audio_voice_clones_user_active 
  ON public.audio_voice_clones(user_id) 
  WHERE is_active = true;

CREATE INDEX idx_audio_voice_clones_user_id 
  ON public.audio_voice_clones(user_id);

CREATE INDEX idx_audio_voice_clones_elevenlabs_id 
  ON public.audio_voice_clones(elevenlabs_voice_id);

-- RLS
ALTER TABLE public.audio_voice_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice clones" 
  ON public.audio_voice_clones
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice clones" 
  ON public.audio_voice_clones
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice clones" 
  ON public.audio_voice_clones
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice clones" 
  ON public.audio_voice_clones
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE public.audio_voice_clones IS 'Stores user voice clones from ElevenLabs for personalized TTS generation';





