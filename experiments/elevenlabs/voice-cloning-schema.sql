-- Voice Cloning Schema (ElevenLabs)
-- This schema was never implemented but was planned for voice cloning feature
-- Archived on December 6, 2025

-- Table to store cloned voices
CREATE TABLE IF NOT EXISTS audio_voice_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Voice metadata
  name TEXT NOT NULL, -- User-friendly name for the voice
  description TEXT,
  
  -- ElevenLabs integration
  elevenlabs_voice_id TEXT NOT NULL UNIQUE, -- The ID returned by ElevenLabs API
  model_id TEXT NOT NULL DEFAULT 'eleven_turbo_v2_5', -- Which model to use
  
  -- Sample audio used for cloning
  sample_audio_url TEXT, -- S3 URL to the original sample
  sample_s3_key TEXT,
  sample_duration_seconds INTEGER,
  
  -- Preview audio (generated with cloned voice)
  preview_audio_url TEXT,
  preview_s3_key TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_voice_clones_user_id ON audio_voice_clones(user_id);
CREATE INDEX idx_voice_clones_status ON audio_voice_clones(status);
CREATE INDEX idx_voice_clones_elevenlabs_voice_id ON audio_voice_clones(elevenlabs_voice_id);

-- RLS Policies
ALTER TABLE audio_voice_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice clones"
  ON audio_voice_clones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice clones"
  ON audio_voice_clones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice clones"
  ON audio_voice_clones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice clones"
  ON audio_voice_clones FOR DELETE
  USING (auth.uid() = user_id);

-- Updated trigger
CREATE TRIGGER update_voice_clones_updated_at
  BEFORE UPDATE ON audio_voice_clones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notes:
-- - This table was never created in production
-- - Voice cloning was removed before implementation
-- - Kept here for reference if feature is restored
-- - ElevenLabs API supports voice cloning via:
--   POST /v1/voices/add
--   with audio samples (1-30 seconds recommended)

