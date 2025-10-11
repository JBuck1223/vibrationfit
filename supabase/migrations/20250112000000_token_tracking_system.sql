-- ============================================================================
-- TOKEN TRACKING SYSTEM
-- Precise measurement of all AI usage with real OpenAI costs
-- ============================================================================

-- Token transaction types
CREATE TYPE token_action_type AS ENUM (
  'chat',              -- VIVA chat messages
  'refinement',        -- Vision refinement
  'blueprint',         -- Blueprint generation
  'audio_generation',  -- Audio creation (ElevenLabs or OpenAI TTS)
  'transcription',     -- Whisper audio-to-text
  'image_generation',  -- DALL-E vision board/journal images
  'assessment',        -- Assessment-related AI
  'manual_adjustment', -- Admin manual token grants/deductions
  'subscription_grant', -- Initial token grant on subscription
  'renewal_grant',     -- Token reset on annual renewal
  'pack_purchase'      -- Token pack add-on purchase
);

-- ============================================================================
-- TOKEN TRANSACTIONS TABLE
-- Logs every single AI action with precise token usage
-- ============================================================================
CREATE TABLE token_transactions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  action_type token_action_type NOT NULL,
  tokens_used INTEGER NOT NULL, -- Can be negative for grants (e.g., -5000000 = grant 5M)
  tokens_remaining INTEGER NOT NULL, -- Snapshot of balance after transaction
  
  -- Cost tracking (for analytics)
  estimated_cost_usd DECIMAL(10, 6), -- Actual $ cost (e.g., 0.002340)
  
  -- OpenAI API details (when applicable)
  openai_model TEXT, -- e.g., 'gpt-4-turbo', 'gpt-4o', 'whisper-1', 'dall-e-3'
  prompt_tokens INTEGER, -- Input tokens (for chat/completion)
  completion_tokens INTEGER, -- Output tokens (for chat/completion)
  
  -- Context metadata
  metadata JSONB DEFAULT '{}', -- Flexible storage for action-specific data
  -- Examples:
  -- Chat: { conversation_id, message_id, category }
  -- Refinement: { vision_id, category, instruction_length }
  -- Image: { prompt, size, quality }
  -- Audio: { duration_seconds, voice_id }
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_action_type ON token_transactions(action_type);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX idx_token_transactions_user_action ON token_transactions(user_id, action_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own token transactions
CREATE POLICY "Users can view own token transactions"
  ON token_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert transactions (API routes)
CREATE POLICY "Service role can insert token transactions"
  ON token_transactions
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's token usage summary
CREATE OR REPLACE FUNCTION get_user_token_summary(p_user_id UUID)
RETURNS TABLE (
  total_tokens_used BIGINT,
  total_cost_usd DECIMAL,
  tokens_by_action JSONB,
  recent_transactions JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total tokens used (sum of all positive values)
    COALESCE(SUM(CASE WHEN tokens_used > 0 THEN tokens_used ELSE 0 END), 0)::BIGINT,
    
    -- Total cost
    COALESCE(SUM(estimated_cost_usd), 0)::DECIMAL,
    
    -- Breakdown by action type
    (
      SELECT jsonb_object_agg(action_type, token_sum)
      FROM (
        SELECT 
          action_type::TEXT,
          SUM(CASE WHEN tokens_used > 0 THEN tokens_used ELSE 0 END) as token_sum
        FROM token_transactions
        WHERE user_id = p_user_id
        GROUP BY action_type
      ) action_breakdown
    ),
    
    -- Recent transactions (last 10)
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'action_type', action_type,
          'tokens_used', tokens_used,
          'tokens_remaining', tokens_remaining,
          'created_at', created_at,
          'metadata', metadata
        )
        ORDER BY created_at DESC
      )
      FROM (
        SELECT *
        FROM token_transactions
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    )
  FROM token_transactions
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================================================
-- UPDATE MEMBERSHIP TIERS FOR TOKEN ALLOCATIONS
-- ============================================================================

-- Update membership_tiers to include token allocations
ALTER TABLE membership_tiers 
ADD COLUMN IF NOT EXISTS annual_token_grant INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_token_grant INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month'; -- 'month', 'year', '28-day'

-- Update existing tiers with new token allocations
-- Infinite Annual: 5M tokens/year
UPDATE membership_tiers 
SET 
  annual_token_grant = 5000000,
  billing_interval = 'year'
WHERE tier_type = 'infinite' AND name LIKE '%Annual%';

-- Infinite Monthly: 600K tokens/28 days
UPDATE membership_tiers 
SET 
  monthly_token_grant = 600000,
  billing_interval = '28-day'
WHERE tier_type = 'infinite' AND name LIKE '%Monthly%';

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE token_transactions IS 'Tracks all AI token usage with real OpenAI costs for precise COGS measurement';
COMMENT ON COLUMN token_transactions.tokens_used IS 'Actual tokens used (positive) or granted (negative for grants)';
COMMENT ON COLUMN token_transactions.estimated_cost_usd IS 'Real OpenAI API cost in USD for analytics';
COMMENT ON COLUMN token_transactions.metadata IS 'Flexible JSONB for action-specific context';
COMMENT ON FUNCTION get_user_token_summary IS 'Returns comprehensive token usage analytics for a user';

