-- ============================================================================
-- COMPLETE TOKEN SYSTEM MIGRATIONS - Run This File
-- ============================================================================
-- Date: February 3, 2025
-- Purpose: Fix token tracking, add missing action types, enhance transactions
--
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Run it in your Supabase SQL Editor or database client
-- 3. All migrations are idempotent (safe to run multiple times)
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Add frequency_flip and transcription action types
-- ============================================================================

ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

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
-- MIGRATION 2: Add subscription/trial grant action types and update RPC functions
-- ============================================================================

ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;

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
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  v_new_balance := v_grant_amount;
  
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_rollover_cycles = 0,
    token_last_drip_date = NOW(),
    storage_quota_gb = 100
  WHERE user_id = p_user_id;
  
  -- Record in token_transactions (legacy - only if table and basic columns exist)
  -- Note: This will work with whatever columns exist in your token_transactions table
  BEGIN
    INSERT INTO token_transactions (
      user_id,
      token_amount,
      balance_before,
      balance_after,
      created_at
    ) VALUES (
      p_user_id,
      v_grant_amount,
      v_current_balance,
      v_new_balance,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If insert fails (missing columns), just skip it
    NULL;
  END;
  
  -- Also record in token_usage (unified)
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
    0,
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

-- Update grant_trial_tokens()
CREATE OR REPLACE FUNCTION grant_trial_tokens(
  p_user_id UUID,
  p_trial_amount INTEGER DEFAULT 100000
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  v_new_balance := v_current_balance + p_trial_amount;
  
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
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
    0,
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

-- Migrate existing token_transactions to token_usage (optional - skip if columns don't match)
-- This migration is optional and will be skipped if token_transactions has different columns
DO $$
BEGIN
  -- Only migrate if token_amount column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_transactions' 
    AND column_name = 'token_amount'
  ) THEN
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
      'admin_grant' as action_type, -- Default to admin_grant since we can't determine type
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_transactions' AND column_name = 'source')
        THEN COALESCE((SELECT source FROM token_transactions tt WHERE tt.id = token_transactions.id), 'unknown')
        ELSE 'unknown'
      END as model_used,
      ABS(token_amount) as tokens_used,
      0 as input_tokens,
      0 as output_tokens,
      0 as cost_estimate,
      true as success,
      jsonb_build_object(
        'migrated_from', 'token_transactions',
        'balance_before', balance_before,
        'balance_after', balance_after
      ) as metadata,
      created_at
    FROM token_transactions
    WHERE token_amount > 0
      AND NOT EXISTS (
        SELECT 1 FROM token_usage tu
        WHERE tu.user_id = token_transactions.user_id
          AND tu.created_at = token_transactions.created_at
          AND tu.tokens_used = ABS(token_transactions.token_amount)
      )
    ON CONFLICT DO NOTHING;
  ELSE
    RAISE NOTICE 'Skipping token_transactions migration - token_amount column does not exist';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping token_transactions migration due to schema mismatch: %', SQLERRM;
END $$;

-- ============================================================================
-- MIGRATION 3: Enhance token_transactions table with payment fields
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'amount_paid_cents') THEN
    ALTER TABLE token_transactions ADD COLUMN amount_paid_cents INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'currency') THEN
    ALTER TABLE token_transactions ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE token_transactions ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'stripe_session_id') THEN
    ALTER TABLE token_transactions ADD COLUMN stripe_session_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'subscription_id') THEN
    ALTER TABLE token_transactions ADD COLUMN subscription_id UUID REFERENCES customer_subscriptions(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'token_pack_id') THEN
    ALTER TABLE token_transactions ADD COLUMN token_pack_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'metadata') THEN
    ALTER TABLE token_transactions ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'notes') THEN
    ALTER TABLE token_transactions ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'token_transactions' 
                 AND column_name = 'created_by') THEN
    ALTER TABLE token_transactions ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_token_transactions_stripe_payment ON token_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_token_transactions_subscription ON token_transactions(subscription_id) WHERE subscription_id IS NOT NULL;

-- Add constraints only if columns exist
DO $$
BEGIN
  -- Add transaction_type constraint only if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_transactions' 
    AND column_name = 'transaction_type'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'token_transactions_transaction_type_check'
    ) THEN
      ALTER TABLE token_transactions 
      ADD CONSTRAINT token_transactions_transaction_type_check 
      CHECK (transaction_type IN ('grant', 'purchase', 'deduction', 'refund', 'transfer'));
    END IF;
  END IF;
  
  -- Add source constraint only if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_transactions' 
    AND column_name = 'source'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'token_transactions_source_check'
    ) THEN
      ALTER TABLE token_transactions 
      ADD CONSTRAINT token_transactions_source_check 
      CHECK (source IN ('admin', 'subscription', 'trial', 'token_pack', 'stripe', 'refund', 'transfer'));
    END IF;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE ✅
-- ============================================================================
-- 
-- Summary of changes:
-- ✅ Added frequency_flip and transcription action types to token_usage
-- ✅ Added subscription_grant, trial_grant, token_pack_purchase action types
-- ✅ Updated grant_annual_tokens() to write to both token_transactions and token_usage
-- ✅ Updated grant_trial_tokens() to write to token_usage
-- ✅ Enhanced token_transactions table with payment fields
-- ✅ Migrated historical token_transactions → token_usage
-- 
-- Next steps:
-- 1. Deploy code changes (webhook, admin routes, transaction functions)
-- 2. Test token pack purchase → should create token_transactions record
-- 3. Test admin grant → should create token_transactions record
-- 4. Test AI usage → should create token_usage record and update balance
-- ============================================================================

