-- Create audio_generation_batches table for tracking audio generation requests
-- This provides full observability into multi-track audio generation jobs

CREATE TABLE IF NOT EXISTS public.audio_generation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vision_id UUID REFERENCES public.vision_versions(id) ON DELETE CASCADE NOT NULL,
  
  -- What was requested
  audio_set_ids UUID[] NOT NULL DEFAULT '{}',  -- Links to audio_sets created
  variant_ids TEXT[] NOT NULL,                 -- ['standard', 'sleep', 'meditation', 'energy']
  voice_id TEXT NOT NULL,
  sections_requested JSONB NOT NULL,           -- [{ sectionKey, text }]
  
  -- Progress tracking
  total_tracks_expected INT NOT NULL,          -- Usually 14 per variant (12 categories + intro/outro)
  tracks_completed INT DEFAULT 0 NOT NULL,
  tracks_failed INT DEFAULT 0 NOT NULL,
  tracks_pending INT DEFAULT 0 NOT NULL,
  
  -- Status: pending, processing, completed, partial_success, failed
  status TEXT DEFAULT 'pending' NOT NULL,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'partial_success', 'failed')),
  CONSTRAINT valid_track_counts CHECK (
    tracks_completed >= 0 AND 
    tracks_failed >= 0 AND 
    tracks_pending >= 0 AND
    (tracks_completed + tracks_failed + tracks_pending) <= total_tracks_expected
  )
);

-- Add comments
COMMENT ON TABLE public.audio_generation_batches IS 'Tracks audio generation requests for full observability and retry logic';
COMMENT ON COLUMN public.audio_generation_batches.audio_set_ids IS 'Array of audio_sets.id created in this batch';
COMMENT ON COLUMN public.audio_generation_batches.variant_ids IS 'Audio variants requested (standard, sleep, meditation, energy)';
COMMENT ON COLUMN public.audio_generation_batches.sections_requested IS 'Array of {sectionKey, text} pairs that were requested for generation';
COMMENT ON COLUMN public.audio_generation_batches.status IS 'pending: created, not started | processing: in progress | completed: all succeeded | partial_success: some failed | failed: all failed';

-- Create indexes
CREATE INDEX idx_audio_batches_user_vision ON public.audio_generation_batches(user_id, vision_id);
CREATE INDEX idx_audio_batches_status ON public.audio_generation_batches(status, created_at DESC);
CREATE INDEX idx_audio_batches_created_at ON public.audio_generation_batches(created_at DESC);
CREATE INDEX idx_audio_batches_user_status ON public.audio_generation_batches(user_id, status, created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_audio_generation_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_audio_generation_batches_updated_at
  BEFORE UPDATE ON public.audio_generation_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audio_generation_batches_updated_at();

-- Enable RLS
ALTER TABLE public.audio_generation_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own batches
CREATE POLICY "Users can view own audio generation batches"
  ON public.audio_generation_batches
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own batches
CREATE POLICY "Users can create own audio generation batches"
  ON public.audio_generation_batches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can update batches (for API)
CREATE POLICY "Service role can update audio generation batches"
  ON public.audio_generation_batches
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Users can update their own batches (for client-side status)
CREATE POLICY "Users can update own audio generation batches"
  ON public.audio_generation_batches
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to audio generation batches"
  ON public.audio_generation_batches
  USING (auth.role() = 'service_role');


