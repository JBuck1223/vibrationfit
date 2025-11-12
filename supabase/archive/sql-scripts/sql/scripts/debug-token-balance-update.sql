-- ============================================================================
-- Debug Token Balance Update Issues
-- ============================================================================
-- Run this to diagnose why token balances aren't updating

-- Replace 'USER_ID_HERE' with actual user ID
\set user_id 'USER_ID_HERE'

-- 1. Check if user_profiles row exists
SELECT 
  user_id,
  vibe_assistant_tokens_remaining,
  vibe_assistant_tokens_used,
  vibe_assistant_total_cost,
  created_at,
  updated_at
FROM user_profiles
WHERE user_id = :'user_id';

-- 2. Check token_usage records
SELECT 
  COUNT(*) as total_records,
  SUM(tokens_used) as total_tokens_used,
  SUM(CASE WHEN success = true THEN tokens_used ELSE 0 END) as successful_tokens,
  SUM(CASE WHEN success = false THEN tokens_used ELSE 0 END) as failed_tokens,
  COUNT(CASE WHEN success = false THEN 1 END) as failed_count
FROM token_usage
WHERE user_id = :'user_id';

-- 3. Check for records with 0 tokens (won't update balance)
SELECT 
  action_type,
  COUNT(*) as count_zero_tokens,
  COUNT(*) FILTER (WHERE tokens_used = 0) as zero_token_records
FROM token_usage
WHERE user_id = :'user_id'
GROUP BY action_type
ORDER BY count_zero_tokens DESC;

-- 4. Check recent token_usage records
SELECT 
  id,
  action_type,
  tokens_used,
  input_tokens,
  output_tokens,
  success,
  created_at
FROM token_usage
WHERE user_id = :'user_id'
ORDER BY created_at DESC
LIMIT 20;

-- 5. Calculate what the balance SHOULD be
WITH usage_summary AS (
  SELECT 
    SUM(CASE WHEN action_type = 'admin_grant' AND success = true THEN tokens_used ELSE 0 END) as total_grants,
    SUM(CASE WHEN action_type = 'admin_deduct' AND success = true THEN tokens_used ELSE 0 END) as total_deductions,
    SUM(CASE WHEN action_type NOT IN ('admin_grant', 'admin_deduct') AND success = true THEN tokens_used ELSE 0 END) as total_usage
  FROM token_usage
  WHERE user_id = :'user_id'
),
current_balance AS (
  SELECT 
    COALESCE(vibe_assistant_tokens_remaining, 0) as current_remaining,
    COALESCE(vibe_assistant_tokens_used, 0) as current_used
  FROM user_profiles
  WHERE user_id = :'user_id'
)
SELECT 
  cb.current_remaining as current_remaining,
  cb.current_used as current_used,
  us.total_grants,
  us.total_deductions,
  us.total_usage,
  (us.total_grants - us.total_deductions - us.total_usage) as calculated_remaining,
  (us.total_deductions + us.total_usage) as calculated_used,
  (cb.current_remaining - (us.total_grants - us.total_deductions - us.total_usage)) as discrepancy_remaining,
  (cb.current_used - (us.total_deductions + us.total_usage)) as discrepancy_used
FROM current_balance cb
CROSS JOIN usage_summary us;

-- 6. Check for records that should have updated balance but didn't
SELECT 
  tu.id,
  tu.action_type,
  tu.tokens_used,
  tu.success,
  tu.created_at,
  CASE 
    WHEN tu.success = false THEN 'Failed - balance not updated'
    WHEN tu.tokens_used = 0 THEN 'Zero tokens - balance not updated'
    ELSE 'Should have updated balance'
  END as status
FROM token_usage tu
WHERE tu.user_id = :'user_id'
  AND tu.created_at > (SELECT updated_at FROM user_profiles WHERE user_id = :'user_id')
ORDER BY tu.created_at DESC;

