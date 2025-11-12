-- Debug the token discrepancy for a specific user
-- Replace USER_ID with the actual user_id

-- Check current balance
SELECT 
  user_id,
  vibe_assistant_tokens_remaining,
  vibe_assistant_tokens_used,
  created_at
FROM user_profiles
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

-- Check all token_transactions
SELECT 
  id,
  action_type,
  tokens_used,
  tokens_remaining,
  created_at,
  metadata
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
ORDER BY created_at;

-- Check all token_usage grants
SELECT 
  id,
  action_type,
  tokens_used,
  created_at,
  metadata
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
ORDER BY created_at;

-- Check all token_usage (AI operations)
SELECT 
  id,
  action_type,
  tokens_used,
  created_at
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
ORDER BY created_at;

-- Calculate manually
SELECT 
  'Grants from token_transactions' AS source,
  SUM(tokens_used) AS total
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
  AND tokens_used > 0

UNION ALL

SELECT 
  'Deductions from token_transactions' AS source,
  SUM(ABS(tokens_used)) AS total
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND (action_type = 'admin_deduct' OR tokens_used < 0)

UNION ALL

SELECT 
  'Grants from token_usage' AS source,
  SUM(tokens_used) AS total
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
  AND tokens_used > 0

UNION ALL

SELECT 
  'AI Usage from token_usage' AS source,
  SUM(tokens_used) AS total
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
  AND tokens_used > 0;

