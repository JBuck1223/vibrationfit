-- Check where a user's tokens came from
-- Replace 'USER_ID_HERE' with the actual user_id

-- Check token_transactions for grants/purchases
SELECT 
  id,
  action_type,
  tokens_used,
  tokens_remaining,
  amount_paid_cents,
  created_at,
  metadata
FROM token_transactions
WHERE user_id = 'USER_ID_HERE'  -- Replace with actual user_id
ORDER BY created_at ASC;

-- Check token_usage for grants
SELECT 
  id,
  action_type,
  tokens_used,
  created_at,
  metadata
FROM token_usage
WHERE user_id = 'USER_ID_HERE'  -- Replace with actual user_id
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
ORDER BY created_at ASC;

-- Check current user_profiles balance
SELECT 
  user_id,
  vibe_assistant_tokens_remaining,
  vibe_assistant_tokens_used,
  created_at,
  updated_at
FROM user_profiles
WHERE user_id = 'USER_ID_HERE';  -- Replace with actual user_id

