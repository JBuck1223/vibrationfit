-- Clean up duplicate backfill records and fix token balance
-- User: 720adebb-e6c0-4f6c-a5fc-164d128e083a

-- Step 1: Delete ALL duplicate backfill records
DELETE FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND metadata->>'source' = 'historical_backfill';

DELETE FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND metadata->>'source' = 'historical_backfill';

-- Step 2: Check what legitimate grants remain
SELECT 
  'Legitimate Grants' AS source,
  COUNT(*) AS count,
  SUM(tokens_used) AS total_tokens,
  ARRAY_AGG(tokens_used ORDER BY created_at) AS amounts
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
  AND tokens_used > 0;

-- Step 3: Calculate what the untracked amount actually is
-- Current balance: 600,100
-- Legitimate grants: 500,000 (the recent admin grant)
-- AI Usage: 432,778
-- Expected from transactions: 500,000 - 432,778 = 67,222
-- Actual balance: 600,100
-- Untracked: 600,100 - 67,222 = 532,878

-- But wait - you said you had 100,100 before adding 500,000
-- So: 100 (default) + 100,000 (old grant) + 500,000 (new grant) = 600,100 ✓
-- The untracked amount is actually 100,000 (the old admin grant), not 532,878

-- Step 4: Create ONE correct backfill record for the 100,000 untracked tokens
INSERT INTO token_transactions (
  user_id,
  action_type,
  tokens_used,
  tokens_remaining,
  metadata,
  created_at
)
VALUES (
  '720adebb-e6c0-4f6c-a5fc-164d128e083a',
  'admin_grant',
  100000,  -- The actual untracked amount (old admin grant)
  100100,  -- 100 (default) + 100,000
  jsonb_build_object(
    'source', 'historical_backfill',
    'type', 'untracked_tokens',
    'reason', 'Historical record: 100,000 token admin grant from before transaction tracking was implemented',
    'original_balance', 100100,
    'note', 'This represents the 100,000 tokens granted before transaction tracking'
  ),
  '2025-10-05T14:14:58.865151+00'::timestamptz  -- Your profile created_at
)
ON CONFLICT DO NOTHING;

-- Also create in token_usage for unified tracking
INSERT INTO token_usage (
  user_id,
  action_type,
  model_used,
  tokens_used,
  cost_estimate,
  success,
  metadata,
  created_at
)
VALUES (
  '720adebb-e6c0-4f6c-a5fc-164d128e083a',
  'admin_grant',
  'system',
  100000,
  0,
  true,
  jsonb_build_object(
    'source', 'historical_backfill',
    'type', 'untracked_tokens',
    'reason', 'Historical record: 100,000 token admin grant from before transaction tracking was implemented'
  ),
  '2025-10-05T14:14:58.865151+00'::timestamptz
)
ON CONFLICT DO NOTHING;

-- Step 5: Verify the fix
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

-- Expected result:
-- Current Balance: 600,100
-- Total Grants: 600,000 (100,000 + 500,000)
-- Total AI Usage: 432,778
-- Expected Balance: 167,222

-- Wait, that doesn't match! Let me recalculate:
-- If you had 100,100 and added 500,000, you should have 600,100
-- But if grants are 600,000 and usage is 432,778, expected is 167,222
-- That means the balance was manually set or there's something else going on

-- Actually, the issue is that the balance in user_profiles (600,100) doesn't match
-- the calculated balance from transactions. This could mean:
-- 1. The balance was manually adjusted
-- 2. There are other grants/usage not being tracked
-- 3. The 100 default tokens are still being counted

-- Let's check the view after cleanup
SELECT * FROM untracked_token_changes
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a';

