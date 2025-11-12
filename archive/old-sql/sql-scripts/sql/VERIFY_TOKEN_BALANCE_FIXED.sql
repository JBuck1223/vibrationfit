-- Verify token balance is now correct
-- User: 720adebb-e6c0-4f6c-a5fc-164d128e083a

-- Check current balance
SELECT 
  user_id,
  vibe_assistant_tokens_remaining AS current_balance,
  vibe_assistant_tokens_used,
  updated_at
FROM user_profiles
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

-- Check discrepancy (should be 0 now)
SELECT 
  user_id,
  current_balance,
  expected_balance,
  discrepancy
FROM untracked_token_changes
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

-- Summary of all transactions
SELECT 
  'Grants' AS type,
  COUNT(*) AS count,
  SUM(tokens_used) AS total_tokens
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
  AND tokens_used > 0

UNION ALL

SELECT 
  'AI Usage' AS type,
  COUNT(*) AS count,
  SUM(tokens_used) AS total_tokens
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
  AND tokens_used > 0
  AND success = true

UNION ALL

SELECT 
  'Balance' AS type,
  1 AS count,
  vibe_assistant_tokens_remaining AS total_tokens
FROM user_profiles
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

-- Final verification: balance should equal grants - usage
SELECT 
  CASE 
    WHEN (
      (SELECT COALESCE(SUM(tokens_used), 0) FROM token_transactions 
       WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
       AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
       AND tokens_used > 0) -
      (SELECT COALESCE(SUM(tokens_used), 0) FROM token_usage 
       WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
       AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
       AND tokens_used > 0 AND success = true) =
      (SELECT vibe_assistant_tokens_remaining FROM user_profiles 
       WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a')
    THEN 'Balance matches transactions'
    ELSE 'Balance does NOT match transactions'
  END AS status;

