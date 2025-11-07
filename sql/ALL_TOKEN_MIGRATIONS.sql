-- ============================================================================
-- ALL TOKEN SYSTEM MIGRATIONS - Run in Order
-- ============================================================================
-- Date: February 3, 2025
-- Purpose: Fix token tracking, add missing action types, enhance transactions
--
-- Run these migrations in order:
-- 1. Add frequency_flip and transcription action types
-- 2. Add subscription/trial grant action types  
-- 3. Enhance token_transactions table with payment fields
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Add frequency_flip and transcription action types
-- ============================================================================
-- Migration: Add frequency_flip and transcription action types to token_usage table
-- These action types were added to the TypeScript interface but missing from the database constraint

-- Drop the existing constraint
ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

-- Add the updated constraint with frequency_flip and transcription included
ALTER TABLE token_usage 
  ADD CONSTRAINT token_usage_action_type_check 
  CHECK (action_type IN (
    'assessment_scoring',
    'vision_generation', 
    'vision_refinement',
    'blueprint_generation',
    'chat_conversation',
    'audio_generation',
    'image_generation',
    'transcription',
    'admin_grant',
    'admin_deduct',
    'life_vision_category_summary',
    'life_vision_master_assembly',
    'prompt_suggestions',
    'frequency_flip'
  ));

-- ============================================================================
-- MIGRATION 2: Add subscription and trial grant action types
-- ============================================================================
-- Migration: Add subscription_grant, trial_grant, and token_pack_purchase action types
-- Also updates grant_annual_tokens() and grant_trial_tokens() RPC functions

-- Drop the existing constraint
ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

-- Add the updated constraint with subscription/trial grants included
ALTER TABLE token_usage 
  ADD CONSTRAINT token_usage_action_type_check 
  CHECK (action_type IN (
    'assessment_scoring',
    'vision_generation', 
    'vision_refinement',
    'blueprint_generation',
    'chat_conversation',
    'audio_generation',
    'image_generation',
    'transcription',
    'admin_grant',
    'admin_deduct',
    'subscription_grant',
    'trial_grant',
    'token_pack_purchase',
    'life_vision_category_summary',
    'life_vision_master_assembly',
    'prompt_suggestions',
    'frequency_flip'
  ));

-- Update grant_annual_tokens() to also write to token_usage
CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_grant_amount INTEGER := 5000000; -- 5M tokens
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- For annual, we REPLACE the balance (not add)
  -- This is because annual resets each year
  v_new_balance := v_grant_amount;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_rollover_cycles = 0, -- Reset rollover for annual
    token_last_drip_date = NOW(),
    storage_quota_gb = 100 -- Set annual storage quota
  WHERE user_id = p_user_id;
  
  -- Record in token_transactions (legacy - keep for backward compatibility)
  INSERT INTO token_transactions (
    user_id,
    transaction_type,
    token_amount,
    balance_before,
    balance_after,
    source,
    created_at
  ) VALUES (
    p_user_id,
    'grant',
    v_grant_amount,
    v_current_balance,
    v_new_balance,
    'subscription',
    NOW()
  );
  
  -- NEW: Also record in token_usage for unified tracking
  INSERT INTO token_usage (
    user_id,
    action_type,
    model_used,
    tokens_used,
    input_tokens,
    output_tokens,
    cost_estimate,
    success,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'subscription_grant',
    'subscription',
    v_grant_amount,
    0,
    0,
    0, -- Subscription grants have no AI cost
    true,
    jsonb_build_object(
      'subscription_id', p_subscription_id,
      'plan', 'vision_pro_annual',
      'grant_type', 'full_year_upfront',
      'balance_before', v_current_balance,
      'balance_after', v_new_balance
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', v_grant_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_annual_tokens IS 'Grant 5M tokens immediately for annual subscriptions. Now tracks in both token_transactions (legacy) and token_usage (unified).';

-- Create/Update grant_trial_tokens() to write to token_usage
CREATE OR REPLACE FUNCTION grant_trial_tokens(
  p_user_id UUID,
  p_trial_amount INTEGER DEFAULT 100000 -- Default 100k trial tokens
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Add trial tokens to existing balance
  v_new_balance := v_current_balance + p_trial_amount;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record in token_usage for unified tracking
  INSERT INTO token_usage (
    user_id,
    action_type,
    model_used,
    tokens_used,
    input_tokens,
    output_tokens,
    cost_estimate,
    success,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'trial_grant',
    'trial',
    p_trial_amount,
    0,
    0,
    0, -- Trial grants have no cost
    true,
    jsonb_build_object(
      'grant_type', 'trial',
      'balance_before', v_current_balance,
      'balance_after', v_new_balance
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', p_trial_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_trial_tokens IS 'Grant trial tokens to users. Tracks in token_usage for unified tracking.';

-- Migrate existing token_transactions to token_usage (optional - for historical data)
INSERT INTO token_usage (
  user_id,
  action_type,
  model_used,
  tokens_used,
  input_tokens,
  output_tokens,
  cost_estimate,
  success,
  metadata,
  created_at
)
SELECT 
  user_id,
  CASE 
    WHEN transaction_type LIKE '%annual%' OR transaction_type LIKE '%subscription%' THEN 'subscription_grant'
    WHEN transaction_type LIKE '%trial%' THEN 'trial_grant'
    ELSE 'admin_grant'
  END as action_type,
  COALESCE(source, 'unknown') as model_used,
  ABS(token_amount) as tokens_used, -- Convert to positive
  0 as input_tokens,
  0 as output_tokens,
  0 as cost_estimate,
  true as success,
  jsonb_build_object(
    'migrated_from', 'token_transactions',
    'original_transaction_type', transaction_type,
    'balance_before', balance_before,
    'balance_after', balance_after
  ) as metadata,
  created_at
FROM token_transactions
WHERE token_amount > 0 -- Only grants (positive amounts)
  AND NOT EXISTS (
    -- Don't duplicate if already in token_usage
    SELECT 1 FROM token_usage tu
    WHERE tu.user_id = token_transactions.user_id
      AND tu.created_at = token_transactions.created_at
      AND tu.tokens_used = ABS(token_transactions.token_amount)
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION 3: Enhance token_transactions table with payment fields
-- ============================================================================
-- Migration: Add payment-related columns to existing token_transactions table
-- Don't recreate - just add missing columns if they don't exist

-- Add payment-related columns if they don't exist
DO $$ 
BEGIN
  -- Add amount_paid_cents if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'amount_paid_cents') THEN
    ALTER TABLE token_transactions ADD COLUMN amount_paid_cents INTEGER;
  END IF;
  
  -- Add currency if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'currency') THEN
    ALTER TABLE token_transactions ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;
  
  -- Add stripe_payment_intent_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE token_transactions ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
  
  -- Add stripe_session_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'stripe_session_id') THEN
    ALTER TABLE token_transactions ADD COLUMN stripe_session_id TEXT;
  END IF;
  
  -- Add subscription_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'subscription_id') THEN
    ALTER TABLE token_transactions ADD COLUMN subscription_id UUID REFERENCES customer_subscriptions(id);
  END IF;
  
  -- Add token_pack_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'token_pack_id') THEN
    ALTER TABLE token_transactions ADD COLUMN token_pack_id TEXT;
  END IF;
  
  -- Add metadata if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'metadata') THEN
    ALTER TABLE token_transactions ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  
  -- Add notes if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'notes') THEN
    ALTER TABLE token_transactions ADD COLUMN notes TEXT;
  END IF;
  
  -- Add created_by if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'created_by') THEN
    ALTER TABLE token_transactions ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_token_transactions_stripe_payment ON token_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_token_transactions_subscription ON token_transactions(subscription_id) WHERE subscription_id IS NOT NULL;

-- Add constraint for transaction_type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'token_transactions_transaction_type_check'
  ) THEN
    ALTER TABLE token_transactions 
    ADD CONSTRAINT token_transactions_transaction_type_check 
    CHECK (transaction_type IN ('grant', 'purchase', 'deduction', 'refund', 'transfer'));
  END IF;
END $$;

-- Add constraint for source if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'token_transactions_source_check'
  ) THEN
    ALTER TABLE token_transactions 
    ADD CONSTRAINT token_transactions_source_check 
    CHECK (source IN ('admin', 'subscription', 'trial', 'token_pack', 'stripe', 'refund', 'transfer'));
  END IF;
END $$;

COMMENT ON TABLE token_transactions IS 'Financial transactions: grants, purchases, deductions. Separate from token_usage (AI operations) and token_drips (subscription drips).';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All migrations applied successfully!
-- 
-- Summary:
-- ✅ Added frequency_flip and transcription action types
-- ✅ Added subscription_grant, trial_grant, token_pack_purchase action types
-- ✅ Updated grant_annual_tokens() to write to token_usage
-- ✅ Updated grant_trial_tokens() to write to token_usage
-- ✅ Enhanced token_transactions table with payment fields
-- ✅ Migrated historical token_transactions → token_usage
-- ============================================================================

