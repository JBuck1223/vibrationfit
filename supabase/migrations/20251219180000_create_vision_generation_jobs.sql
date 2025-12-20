-- Create vision_generation_jobs table for background vision assembly
-- Allows browser-independent processing of vision categories

CREATE TABLE IF NOT EXISTS public.vision_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Progress tracking
  total_categories INT DEFAULT 12 NOT NULL,
  categories_completed INT DEFAULT 0 NOT NULL,
  categories_failed INT DEFAULT 0 NOT NULL,
  current_category TEXT,
  
  -- Status: pending, processing, completed, partial_success, failed
  status TEXT DEFAULT 'pending' NOT NULL,
  error_message TEXT,
  
  -- Results
  vision_id UUID REFERENCES public.vision_versions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_polled_at TIMESTAMPTZ,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'partial_success', 'failed')),
  CONSTRAINT valid_category_counts CHECK (
    categories_completed >= 0 AND 
    categories_failed >= 0 AND
    (categories_completed + categories_failed) <= total_categories
  )
);

-- Add comments
COMMENT ON TABLE public.vision_generation_jobs IS 'Tracks vision generation jobs for background processing';
COMMENT ON COLUMN public.vision_generation_jobs.status IS 'pending: created | processing: in progress | completed: all succeeded | partial_success: some failed | failed: all failed';
COMMENT ON COLUMN public.vision_generation_jobs.current_category IS 'The category currently being processed (e.g., "fun", "health")';
COMMENT ON COLUMN public.vision_generation_jobs.last_polled_at IS 'Last time UI checked status (for stale job detection)';

-- Create indexes
CREATE INDEX idx_vision_jobs_user ON public.vision_generation_jobs(user_id, created_at DESC);
CREATE INDEX idx_vision_jobs_status ON public.vision_generation_jobs(status, created_at DESC);
CREATE INDEX idx_vision_jobs_pending ON public.vision_generation_jobs(status, created_at ASC) 
  WHERE status IN ('pending', 'processing');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_vision_generation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vision_generation_jobs_updated_at
  BEFORE UPDATE ON public.vision_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vision_generation_jobs_updated_at();

-- Enable RLS
ALTER TABLE public.vision_generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own jobs
CREATE POLICY "Users can view own vision generation jobs"
  ON public.vision_generation_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can create own vision generation jobs"
  ON public.vision_generation_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can update jobs (for background worker)
CREATE POLICY "Service role can update vision generation jobs"
  ON public.vision_generation_jobs
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Users can update their own jobs (for polling timestamp)
CREATE POLICY "Users can update own vision generation jobs"
  ON public.vision_generation_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

