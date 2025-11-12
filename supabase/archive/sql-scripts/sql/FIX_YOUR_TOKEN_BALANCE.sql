-- Fix token balance for user 720adebb-e6c0-4f6c-a5fc-164d128e083a
-- Current: 600,100 tokens
-- Grants: 3,164,390 tokens
-- Usage: 432,778 tokens
-- Expected: 3,164,390 - 432,778 = 2,731,612 tokens

-- Step 1: See all grant transactions
SELECT 
  id,
  action_type,
  tokens_used,
  tokens_remaining,
  created_at,
  metadata->>'source' AS source,
  metadata->>'reason' AS reason
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
ORDER BY created_at;

-- Step 2: Identify which are legitimate vs backfill duplicates
-- You should have:
-- - 1x 500,000 admin_grant (the recent one you added)
-- - Possibly 1x 100,000 admin_grant (the old one)
-- - Possibly 1x backfill record
-- But you have 6 records totaling 3,164,390 - that's way too many!

-- Step 3: Delete ALL backfill records (they're duplicates/inflated)
DELETE FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND metadata->>'source' = 'historical_backfill';

DELETE FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND metadata->>'source' = 'historical_backfill';

-- Step 4: Now see what legitimate grants remain
SELECT 
  'Remaining Grants' AS source,
  COUNT(*) AS count,
  SUM(tokens_used) AS total_tokens
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
  AND tokens_used > 0;

-- Step 5: Calculate what the balance SHOULD be
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

-- Step 6: If the expected balance is correct, update the profile
-- UNCOMMENT THIS AFTER VERIFYING THE EXPECTED BALANCE IS CORRECT:
/*
UPDATE user_profiles
SET vibe_assistant_tokens_remaining = (
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
)
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';
*/

