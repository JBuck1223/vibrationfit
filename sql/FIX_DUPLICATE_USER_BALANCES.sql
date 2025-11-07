-- Fix duplicate rows in user_token_balances view
-- The view was returning multiple rows per user, likely due to duplicate user_profiles

-- First, check for duplicate user_profiles
SELECT 
  user_id,
  COUNT(*) as profile_count
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Fix the view to use DISTINCT ON to ensure one row per user
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

-- Verify the fix
SELECT 
  user_id,
  calculated_balance,
  profile_balance,
  discrepancy,
  total_grants,
  total_usage
FROM user_token_balances
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

