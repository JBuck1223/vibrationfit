-- Fix balance to match transaction history
-- User: 720adebb-e6c0-4f6c-a5fc-164d128e083a
-- Current: 600,100
-- Expected: 167,222 (600,000 grants - 432,778 usage)
-- Discrepancy: 432,878 (balance was never decremented when tokens were used)

-- Step 1: Verify the calculation
SELECT 
  'Current Balance' AS metric,
  vibe_assistant_tokens_remaining AS value
FROM user_profiles
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'

UNION ALL

SELECT 
  'Total Grants' AS metric,
  COALESCE(SUM(tokens_used), 0) AS value
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
  AND tokens_used > 0

UNION ALL

SELECT 
  'Total AI Usage' AS metric,
  COALESCE(SUM(tokens_used), 0) AS value
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
  AND tokens_used > 0
  AND success = true

UNION ALL

SELECT 
  'Expected Balance' AS metric,
  (
    SELECT COALESCE(SUM(tokens_used), 0)
    FROM token_transactions
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tokens_used > 0
  ) - (
    SELECT COALESCE(SUM(tokens_used), 0)
    FROM token_usage
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
      AND tokens_used > 0
      AND success = true
  ) AS value;

-- Step 2: Update the balance to match transactions
-- This sets the balance to: Grants - Usage = 600,000 - 432,778 = 167,222
UPDATE user_profiles
SET 
  vibe_assistant_tokens_remaining = (
    SELECT COALESCE(SUM(tokens_used), 0)
    FROM token_transactions
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tokens_used > 0
  ) - (
    SELECT COALESCE(SUM(tokens_used), 0)
    FROM token_usage
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
      AND tokens_used > 0
      AND success = true
  ),
  updated_at = NOW()
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

-- Step 3: Verify the fix
SELECT 
  'Updated Balance' AS metric,
  vibe_assistant_tokens_remaining AS value
FROM user_profiles
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'

UNION ALL

SELECT 
  'Expected Balance' AS metric,
  (
    SELECT COALESCE(SUM(tokens_used), 0)
    FROM token_transactions
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tokens_used > 0
  ) - (
    SELECT COALESCE(SUM(tokens_used), 0)
    FROM token_usage
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
      AND tokens_used > 0
      AND success = true
  ) AS value;

-- Step 4: Check the view (should show 0 discrepancy now)
SELECT * FROM untracked_token_changes
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

