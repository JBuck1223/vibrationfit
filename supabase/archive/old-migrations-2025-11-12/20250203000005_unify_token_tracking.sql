-- ============================================================================
-- Unify Token Transaction Tracking
-- ============================================================================
-- This migration ensures ALL token grants/purchases are tracked in token_usage
-- Currently, subscription grants go to token_transactions (legacy)
-- This adds them to token_usage for unified tracking

-- Step 1: Add new action types for subscription and trial grants
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
    'subscription_grant',      -- NEW: Annual/28-day subscription grants
    'trial_grant',             -- NEW: Trial token grants
    'token_pack_purchase',     -- NEW: More specific than admin_grant
    'life_vision_category_summary',
    'life_vision_master_assembly',
    'prompt_suggestions',
    'frequency_flip'
  ));

-- Step 2: Update grant_annual_tokens() to also write to token_usage
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
    'annual_subscription_grant',
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

-- Step 3: Create/Update grant_trial_tokens() to write to token_usage
-- Check if function exists first
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

-- Step 4: Migrate existing token_transactions to token_usage (optional - for historical data)
-- This creates records in token_usage for any grants that were only in token_transactions
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

-- Step 5: Update token pack purchases to use more specific action type
-- Note: This is optional - admin_grant works fine, but token_pack_purchase is more specific
-- You can update the webhook code to use 'token_pack_purchase' instead of 'admin_grant'

