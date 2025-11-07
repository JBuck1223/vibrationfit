-- Fix the token calculation - the issue is likely double-counting
-- Let's check what's actually happening

-- First, let's see what records exist
SELECT 
  'token_transactions grants' AS source,
  COUNT(*) AS count,
  SUM(tokens_used) AS total_tokens
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
  AND tokens_used > 0

UNION ALL

SELECT 
  'token_usage grants' AS source,
  COUNT(*) AS count,
  SUM(tokens_used) AS total_tokens
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
  AND tokens_used > 0

UNION ALL

SELECT 
  'token_transactions deductions' AS source,
  COUNT(*) AS count,
  SUM(ABS(tokens_used)) AS total_tokens
FROM token_transactions
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND (action_type = 'admin_deduct' OR tokens_used < 0)

UNION ALL

SELECT 
  'token_usage AI operations' AS source,
  COUNT(*) AS count,
  SUM(tokens_used) AS total_tokens
FROM token_usage
WHERE user_id = '720adebb-e6c0-4f6c-a5fc-164d128e083a'
  AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
  AND tokens_used > 0
  AND success = true;

-- The problem: We're counting grants from BOTH token_transactions AND token_usage
-- But if a grant is recorded in BOTH tables (which happens with unified tracking),
-- we're double-counting!

-- Fix: Only count grants from token_transactions (source of truth for financial transactions)
-- Only use token_usage grants if there are NO token_transactions records

-- Recreate the view with correct logic
CREATE OR REPLACE VIEW untracked_token_changes AS
SELECT DISTINCT
  up.user_id,
  up.vibe_assistant_tokens_remaining AS current_balance,
  -- Calculate expected balance:
  -- Grants: Prefer token_transactions, fallback to token_usage if no transactions exist
  COALESCE((
    SELECT SUM(tokens_used)
    FROM token_transactions
    WHERE user_id = up.user_id
      AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tokens_used > 0
  ), (
    -- Fallback: Only use token_usage grants if NO token_transactions exist
    SELECT SUM(tokens_used)
    FROM token_usage
    WHERE user_id = up.user_id
      AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
      AND tokens_used > 0
      AND NOT EXISTS (
        SELECT 1 FROM token_transactions WHERE user_id = up.user_id
      )
  ), 0) -
  -- Deductions from token_transactions
  COALESCE((
    SELECT SUM(ABS(tokens_used))
    FROM token_transactions
    WHERE user_id = up.user_id
      AND (action_type = 'admin_deduct' OR tokens_used < 0)
  ), 0) -
  -- AI Usage from token_usage (subtracts tokens)
  COALESCE((
    SELECT SUM(tokens_used)
    FROM token_usage
    WHERE user_id = up.user_id
      AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
      AND tokens_used > 0
      AND success = true
  ), 0) AS expected_balance,
  -- Calculate discrepancy
  up.vibe_assistant_tokens_remaining - (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), (
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
        AND NOT EXISTS (
          SELECT 1 FROM token_transactions WHERE user_id = up.user_id
        )
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  ) AS discrepancy
FROM user_profiles up
WHERE ABS(up.vibe_assistant_tokens_remaining - (
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_transactions
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
    ), (
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
        AND tokens_used > 0
        AND NOT EXISTS (
          SELECT 1 FROM token_transactions WHERE user_id = up.user_id
        )
    ), 0) -
    COALESCE((
      SELECT SUM(ABS(tokens_used))
      FROM token_transactions
      WHERE user_id = up.user_id
        AND (action_type = 'admin_deduct' OR tokens_used < 0)
    ), 0) -
    COALESCE((
      SELECT SUM(tokens_used)
      FROM token_usage
      WHERE user_id = up.user_id
        AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
        AND tokens_used > 0
        AND success = true
    ), 0)
  )) > 0;

