-- Clean up duplicate backfill records
-- The backfill may have run multiple times, creating duplicate records

-- First, see what backfill records exist
SELECT 
  id,
  user_id,
  action_type,
  tokens_used,
  tokens_remaining,
  created_at,
  metadata->>'source' AS source,
  metadata->>'reason' AS reason
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
ORDER BY created_at;

-- Check for duplicate backfill records (same user, same source, similar amounts)
SELECT 
  user_id,
  action_type,
  COUNT(*) AS duplicate_count,
  SUM(tokens_used) AS total_tokens,
  ARRAY_AGG(id ORDER BY created_at) AS transaction_ids,
  ARRAY_AGG(tokens_used ORDER BY created_at) AS token_amounts,
  ARRAY_AGG(created_at ORDER BY created_at) AS created_dates
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND metadata->>'source' = 'historical_backfill'
GROUP BY user_id, action_type
HAVING COUNT(*) > 1;

-- Delete duplicate backfill records, keeping only the first one
-- This will keep the oldest backfill record and delete newer duplicates
DELETE FROM token_transactions
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, action_type 
        ORDER BY created_at ASC
      ) AS rn
    FROM token_transactions
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND metadata->>'source' = 'historical_backfill'
  ) t
  WHERE rn > 1  -- Keep first, delete rest
);

-- Also check token_usage for duplicate backfills
SELECT 
  id,
  user_id,
  action_type,
  tokens_used,
  created_at,
  metadata->>'source' AS source
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND metadata->>'source' = 'historical_backfill'
ORDER BY created_at;

-- Delete duplicate backfill records from token_usage
DELETE FROM token_usage
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, action_type 
        ORDER BY created_at ASC
      ) AS rn
    FROM token_usage
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND action_type = 'admin_grant'
      AND metadata->>'source' = 'historical_backfill'
  ) t
  WHERE rn > 1  -- Keep first, delete rest
);

-- Now recalculate: what should the balance be?
SELECT 
  'Current Balance' AS source,
  vibe_assistant_tokens_remaining AS tokens
FROM user_profiles
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'

UNION ALL

SELECT 
  'Total Grants' AS source,
  SUM(tokens_used) AS tokens
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
  AND tokens_used > 0

UNION ALL

SELECT 
  'Total AI Usage' AS source,
  SUM(tokens_used) AS tokens
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
  AND tokens_used > 0
  AND success = true

UNION ALL

SELECT 
  'Expected Balance' AS source,
  (
    SELECT SUM(tokens_used)
    FROM token_transactions
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tokens_used > 0
  ) - (
    SELECT SUM(tokens_used)
    FROM token_usage
    WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
      AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
      AND tokens_used > 0
      AND success = true
  ) AS tokens;

