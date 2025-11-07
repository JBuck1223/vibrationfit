-- ============================================================================
-- Remove Default 100 Tokens and Make System Ignore user_profiles Balance
-- ============================================================================
-- The vibe_assistant_tokens_remaining field in user_profiles is unreliable
-- All balances should be calculated from token_transactions and token_usage

-- Step 1: Remove default 100 tokens completely
ALTER TABLE user_profiles 
  ALTER COLUMN vibe_assistant_tokens_remaining SET DEFAULT 0;

-- Step 2: Remove any remaining 100 token defaults from existing profiles
-- (Only if they have no transaction records - these are truly default 100s)
UPDATE user_profiles up
SET vibe_assistant_tokens_remaining = 0
WHERE up.vibe_assistant_tokens_remaining = 100
  AND NOT EXISTS (
    SELECT 1 
    FROM token_transactions tt 
    WHERE tt.user_id = up.user_id
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM token_usage tu 
    WHERE tu.user_id = up.user_id 
      AND tu.action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tu.tokens_used > 0
  );

-- Step 3: Create a function to calculate balance from transactions (source of truth)
CREATE OR REPLACE FUNCTION calculate_token_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_grants INTEGER;
  v_usage INTEGER;
  v_deductions INTEGER;
BEGIN
  -- Get total grants from token_transactions (source of truth)
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_grants
  FROM token_transactions
  WHERE user_id = p_user_id
    AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
    AND tokens_used > 0;

  -- Get total AI usage from token_usage
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_usage
  FROM token_usage
  WHERE user_id = p_user_id
    AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
    AND tokens_used > 0
    AND success = true;

  -- Get deductions from token_transactions
  SELECT COALESCE(SUM(ABS(tokens_used)), 0) INTO v_deductions
  FROM token_transactions
  WHERE user_id = p_user_id
    AND (action_type = 'admin_deduct' OR tokens_used < 0);

  -- Return calculated balance (grants - usage - deductions)
  RETURN GREATEST(0, v_grants - v_usage - v_deductions);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_token_balance IS 'Calculates token balance from transactions/usage. Source of truth - ignores user_profiles.vibe_assistant_tokens_remaining';

-- Step 4: Create a view that always uses calculated balance
CREATE OR REPLACE VIEW user_token_balances AS
SELECT DISTINCT ON (up.user_id)
  up.user_id,
  calculate_token_balance(up.user_id) AS calculated_balance,
  up.vibe_assistant_tokens_remaining AS profile_balance,
  calculate_token_balance(up.user_id) - up.vibe_assistant_tokens_remaining AS discrepancy,
  -- Show breakdown
  (
    SELECT COALESCE(SUM(tokens_used), 0)
    FROM token_transactions
    WHERE user_id = up.user_id
      AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tokens_used > 0
  ) AS total_grants,
  (
    SELECT COALESCE(SUM(tokens_used), 0)
    FROM token_usage
    WHERE user_id = up.user_id
      AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
      AND tokens_used > 0
      AND success = true
  ) AS total_usage
FROM user_profiles up
ORDER BY up.user_id, up.updated_at DESC NULLS LAST;

COMMENT ON VIEW user_token_balances IS 'Always use calculated_balance - ignore profile_balance. Shows discrepancy between calculated and stored balance.';

-- Step 5: Update your specific user's balance to match calculated
UPDATE user_profiles
SET 
  vibe_assistant_tokens_remaining = calculate_token_balance('720adebb-e6c0-4f6c-a5fc-164d128e083a'),
  updated_at = NOW()
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

-- Step 6: Verify
SELECT 
  user_id,
  calculated_balance,
  profile_balance,
  discrepancy,
  total_grants,
  total_usage
FROM user_token_balances
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

