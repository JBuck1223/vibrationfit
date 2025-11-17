/**
 * Create ideal_state_prompts table
 * 
 * Stores AI-generated ideal state prompts from Step 2 of Life Vision creation flow
 * Used for fine-tuning analysis and prompt caching
 */

-- Create ideal_state_prompts table
CREATE TABLE IF NOT EXISTS public.ideal_state_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  prompts jsonb NOT NULL DEFAULT '[]'::jsonb,
  encouragement text,
  model_used text,
  tokens_used integer DEFAULT 0,
  response_time_ms integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ideal_state_prompts_user_category 
  ON public.ideal_state_prompts(user_id, category);

CREATE INDEX IF NOT EXISTS idx_ideal_state_prompts_created 
  ON public.ideal_state_prompts(created_at DESC);

-- Enable RLS
ALTER TABLE public.ideal_state_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own prompts"
  ON public.ideal_state_prompts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts"
  ON public.ideal_state_prompts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.ideal_state_prompts TO authenticated;
GRANT SELECT ON public.ideal_state_prompts TO service_role;

-- Add comments
COMMENT ON TABLE public.ideal_state_prompts IS 'Stores AI-generated ideal state prompts from Step 2 (Unleash Imagination) for fine-tuning analysis and prompt caching';
COMMENT ON COLUMN public.ideal_state_prompts.prompts IS 'Array of generated prompts: [{title, prompt, focus}]';
COMMENT ON COLUMN public.ideal_state_prompts.encouragement IS 'Encouragement message from VIVA';
COMMENT ON COLUMN public.ideal_state_prompts.response_time_ms IS 'API response time in milliseconds';

/**
 * Rollback
 */
-- DROP TABLE IF EXISTS public.ideal_state_prompts CASCADE;

