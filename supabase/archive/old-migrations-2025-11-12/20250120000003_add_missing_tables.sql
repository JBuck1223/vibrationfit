-- ============================================================================
-- Add Missing Tables and Features
-- ============================================================================
-- This migration adds only the missing pieces that don't exist in production

-- Add token tracking fields to user_profiles if they don't exist
DO $$ 
BEGIN
  -- Add vibe_assistant_tokens_used column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' 
                 AND column_name = 'vibe_assistant_tokens_used') THEN
    ALTER TABLE user_profiles ADD COLUMN vibe_assistant_tokens_used INTEGER DEFAULT 0;
  END IF;
  
  -- Add vibe_assistant_tokens_remaining column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' 
                 AND column_name = 'vibe_assistant_tokens_remaining') THEN
    ALTER TABLE user_profiles ADD COLUMN vibe_assistant_tokens_remaining INTEGER DEFAULT 100;
  END IF;
  
  -- Add vibe_assistant_total_cost column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' 
                 AND column_name = 'vibe_assistant_total_cost') THEN
    ALTER TABLE user_profiles ADD COLUMN vibe_assistant_total_cost DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create token_usage table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS token_usage (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'assessment_scoring',
    'vision_generation', 
    'vision_refinement',
    'blueprint_generation',
    'chat_conversation',
    'audio_generation',
    'image_generation'
  )),
  
  -- Model and usage details
  model_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_estimate NUMERIC(10, 4) DEFAULT 0, -- in cents
  
  -- Status and metadata
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for token_usage (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_action_type ON token_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_token_usage_model_used ON token_usage(model_used);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_created ON token_usage(user_id, created_at DESC);

-- Enable Row Level Security for token_usage
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for token_usage (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own token usage' AND tablename = 'token_usage') THEN
    CREATE POLICY "Users can view their own token usage"
      ON token_usage FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert token usage' AND tablename = 'token_usage') THEN
    CREATE POLICY "System can insert token usage"
      ON token_usage FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Add AI scoring fields to assessment_responses if the table exists
DO $$ 
BEGIN
  -- Check if assessment_responses table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_responses') THEN
    -- Add is_custom_response column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessment_responses' 
                   AND column_name = 'is_custom_response') THEN
      ALTER TABLE assessment_responses ADD COLUMN is_custom_response BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add ai_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessment_responses' 
                   AND column_name = 'ai_score') THEN
      ALTER TABLE assessment_responses ADD COLUMN ai_score INTEGER;
    END IF;
    
    -- Add ai_green_line column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessment_responses' 
                   AND column_name = 'ai_green_line') THEN
      ALTER TABLE assessment_responses ADD COLUMN ai_green_line TEXT;
    END IF;
  END IF;
END $$;

-- Comments
COMMENT ON TABLE token_usage IS 'Tracks AI token usage and costs for each user action';
