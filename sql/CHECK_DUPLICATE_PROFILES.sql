-- Check for duplicate user_profiles rows
SELECT 
  user_id,
  COUNT(*) as profile_count,
  ARRAY_AGG(id ORDER BY updated_at DESC NULLS LAST) as profile_ids,
  ARRAY_AGG(vibe_assistant_tokens_remaining ORDER BY updated_at DESC NULLS LAST) as balances
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY profile_count DESC;

-- If duplicates exist, you may want to keep only the most recent one
-- This query shows which profiles would be kept vs deleted:
WITH ranked_profiles AS (
  SELECT 
    id,
    user_id,
    vibe_assistant_tokens_remaining,
    updated_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC NULLS LAST, id DESC) as rn
  FROM user_profiles
)
SELECT 
  user_id,
  id as profile_id,
  vibe_assistant_tokens_remaining,
  updated_at,
  CASE WHEN rn = 1 THEN 'KEEP' ELSE 'DELETE' END as action
FROM ranked_profiles
WHERE user_id IN (
  SELECT user_id 
  FROM user_profiles 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
)
ORDER BY user_id, rn;

