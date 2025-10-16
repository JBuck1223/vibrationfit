-- ============================================================================
-- Token Tracking System
-- ============================================================================
-- This migration creates the token_usage table for tracking AI token consumption

-- Create token usage tracking table
CREATE TABLE token_usage (
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

-- Create indexes for performance
CREATE INDEX idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX idx_token_usage_action_type ON token_usage(action_type);
CREATE INDEX idx_token_usage_model_used ON token_usage(model_used);
CREATE INDEX idx_token_usage_created_at ON token_usage(created_at DESC);
CREATE INDEX idx_token_usage_user_created ON token_usage(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own token usage
CREATE POLICY "Users can view their own token usage"
  ON token_usage FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert token usage records
CREATE POLICY "System can insert token usage"
  ON token_usage FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE token_usage IS 'Tracks AI token usage and costs for each user action';
COMMENT ON COLUMN token_usage.cost_estimate IS 'Estimated cost in cents based on model pricing';
COMMENT ON COLUMN token_usage.metadata IS 'Additional context about the AI request/response';
