-- ============================================================================
-- Reconcile User Token Balance Script
-- ============================================================================
-- This script helps reconcile a user's token balance against their actual usage
-- Run this to see discrepancies and optionally fix them

-- ============================================================================
-- STEP 1: View Current Balance vs Calculated Balance
-- ============================================================================
-- Replace 'USER_ID_HERE' with the actual user_id UUID

WITH user_balance AS (
  SELECT 
    user_id,
    vibe_assistant_tokens_remaining AS current_remaining,
    vibe_assistant_tokens_used AS current_used,
    vibe_assistant_total_cost AS current_cost_cents
  FROM user_profiles
  WHERE user_id = 'USER_ID_HERE' -- REPLACE THIS
),
calculated_usage AS (
  SELECT 
    user_id,
    -- Calculate total tokens used (only successful operations)
    SUM(CASE WHEN success = true THEN tokens_used ELSE 0 END) AS calculated_used,
    -- Calculate total cost
    SUM(CASE WHEN success = true THEN cost_estimate ELSE 0 END) AS calculated_cost_cents,
    -- Count operations
    COUNT(*) AS total_operations,
    SUM(CASE WHEN success = true THEN 1 ELSE 0 END) AS successful_operations,
    SUM(CASE WHEN success = false THEN 1 ELSE 0 END) AS failed_operations
  FROM token_usage
  WHERE user_id = 'USER_ID_HERE' -- REPLACE THIS
  GROUP BY user_id
),
admin_adjustments AS (
  SELECT 
    user_id,
    SUM(CASE WHEN action_type = 'admin_grant' THEN tokens_used ELSE 0 END) AS total_grants,
    SUM(CASE WHEN action_type = 'admin_deduct' THEN tokens_used ELSE 0 END) AS total_deductions
  FROM token_usage
  WHERE user_id = 'USER_ID_HERE' -- REPLACE THIS
    AND action_type IN ('admin_grant', 'admin_deduct')
  GROUP BY user_id
)
SELECT 
  ub.user_id,
  -- Current balances (from user_profiles)
  ub.current_remaining AS "Current Remaining (in DB)",
  ub.current_used AS "Current Used (in DB)",
  ub.current_cost_cents AS "Current Cost (cents, in DB)",
  
  -- Calculated from token_usage
  COALESCE(cu.calculated_used, 0) AS "Calculated Used (from token_usage)",
  COALESCE(cu.calculated_cost_cents, 0) AS "Calculated Cost (cents, from token_usage)",
  COALESCE(cu.total_operations, 0) AS "Total Operations",
  COALESCE(cu.successful_operations, 0) AS "Successful Operations",
  COALESCE(cu.failed_operations, 0) AS "Failed Operations",
  
  -- Admin adjustments
  COALESCE(aa.total_grants, 0) AS "Total Admin Grants",
  COALESCE(aa.total_deductions, 0) AS "Total Admin Deductions",
  
  -- Discrepancies
  (ub.current_used - COALESCE(cu.calculated_used, 0)) AS "Used Discrepancy",
  (ub.current_cost_cents - COALESCE(cu.calculated_cost_cents, 0)) AS "Cost Discrepancy"
FROM user_balance ub
LEFT JOIN calculated_usage cu ON ub.user_id = cu.user_id
LEFT JOIN admin_adjustments aa ON ub.user_id = aa.user_id;

-- ============================================================================
-- STEP 2: View Detailed Usage Breakdown by Action Type
-- ============================================================================

SELECT 
  action_type,
  model_used,
  COUNT(*) AS operation_count,
  SUM(CASE WHEN success = true THEN tokens_used ELSE 0 END) AS total_tokens_used,
  SUM(CASE WHEN success = true THEN cost_estimate ELSE 0 END) AS total_cost_cents,
  MIN(created_at) AS first_usage,
  MAX(created_at) AS last_usage
FROM token_usage
WHERE user_id = 'USER_ID_HERE' -- REPLACE THIS
GROUP BY action_type, model_used
ORDER BY total_tokens_used DESC;

-- ============================================================================
-- STEP 3: View Recent Token Usage (Last 50 operations)
-- ============================================================================

SELECT 
  created_at,
  action_type,
  model_used,
  tokens_used,
  input_tokens,
  output_tokens,
  cost_estimate,
  success,
  error_message,
  metadata
FROM token_usage
WHERE user_id = 'USER_ID_HERE' -- REPLACE THIS
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- STEP 4: Calculate What Balance SHOULD Be
-- ============================================================================
-- This assumes you know the initial grant amount
-- Replace INITIAL_GRANT_AMOUNT with the user's initial token grant

WITH usage_summary AS (
  SELECT 
    user_id,
    SUM(CASE WHEN success = true AND action_type NOT IN ('admin_grant', 'admin_deduct') THEN tokens_used ELSE 0 END) AS total_used,
    SUM(CASE WHEN action_type = 'admin_grant' THEN tokens_used ELSE 0 END) AS total_grants,
    SUM(CASE WHEN action_type = 'admin_deduct' THEN tokens_used ELSE 0 END) AS total_deductions,
    SUM(CASE WHEN success = true THEN cost_estimate ELSE 0 END) AS total_cost_cents
  FROM token_usage
  WHERE user_id = 'USER_ID_HERE' -- REPLACE THIS
  GROUP BY user_id
)
SELECT 
  user_id,
  5000000 AS initial_grant, -- REPLACE WITH ACTUAL INITIAL GRANT
  COALESCE(us.total_grants, 0) AS admin_grants,
  COALESCE(us.total_used, 0) AS tokens_used,
  COALESCE(us.total_deductions, 0) AS admin_deductions,
  (5000000 + COALESCE(us.total_grants, 0) - COALESCE(us.total_used, 0) - COALESCE(us.total_deductions, 0)) AS calculated_remaining,
  COALESCE(us.total_cost_cents, 0) AS calculated_total_cost_cents
FROM usage_summary us;

-- ============================================================================
-- STEP 5: UPDATE Balance Based on Calculated Usage (USE WITH CAUTION!)
-- ============================================================================
-- ⚠️ WARNING: This will overwrite the current balance in user_profiles
-- ⚠️ Make sure you've reviewed the discrepancies first!
-- ⚠️ Replace USER_ID_HERE and INITIAL_GRANT_AMOUNT before running

/*
WITH calculated_balance AS (
  SELECT 
    user_id,
    SUM(CASE WHEN success = true AND action_type NOT IN ('admin_grant', 'admin_deduct') THEN tokens_used ELSE 0 END) AS total_used,
    SUM(CASE WHEN action_type = 'admin_grant' THEN tokens_used ELSE 0 END) AS total_grants,
    SUM(CASE WHEN action_type = 'admin_deduct' THEN tokens_used ELSE 0 END) AS total_deductions,
    SUM(CASE WHEN success = true THEN cost_estimate ELSE 0 END) AS total_cost_cents
  FROM token_usage
  WHERE user_id = 'USER_ID_HERE' -- REPLACE THIS
  GROUP BY user_id
)
UPDATE user_profiles
SET 
  vibe_assistant_tokens_used = COALESCE(cb.total_used, 0),
  vibe_assistant_tokens_remaining = GREATEST(0, 
    5000000 + -- REPLACE WITH ACTUAL INITIAL GRANT
    COALESCE(cb.total_grants, 0) - 
    COALESCE(cb.total_used, 0) - 
    COALESCE(cb.total_deductions, 0)
  ),
  vibe_assistant_total_cost = COALESCE(cb.total_cost_cents, 0) / 100.0 -- Convert cents to dollars
FROM calculated_balance cb
WHERE user_profiles.user_id = cb.user_id
  AND user_profiles.user_id = 'USER_ID_HERE'; -- REPLACE THIS
*/

-- ============================================================================
-- STEP 6: Find Users with Balance Discrepancies (Admin View)
-- ============================================================================
-- This helps identify all users who might have balance issues

WITH user_balances AS (
  SELECT 
    up.user_id,
    up.vibe_assistant_tokens_remaining AS current_remaining,
    up.vibe_assistant_tokens_used AS current_used
  FROM user_profiles up
),
calculated_balances AS (
  SELECT 
    tu.user_id,
    SUM(CASE WHEN tu.success = true AND tu.action_type NOT IN ('admin_grant', 'admin_deduct') THEN tu.tokens_used ELSE 0 END) AS calculated_used,
    SUM(CASE WHEN tu.action_type = 'admin_grant' THEN tu.tokens_used ELSE 0 END) AS total_grants,
    SUM(CASE WHEN tu.action_type = 'admin_deduct' THEN tu.tokens_used ELSE 0 END) AS total_deductions
  FROM token_usage tu
  GROUP BY tu.user_id
)
SELECT 
  ub.user_id,
  ub.current_remaining,
  ub.current_used,
  COALESCE(cb.calculated_used, 0) AS calculated_used,
  COALESCE(cb.total_grants, 0) AS total_grants,
  COALESCE(cb.total_deductions, 0) AS total_deductions,
  ABS(ub.current_used - COALESCE(cb.calculated_used, 0)) AS discrepancy
FROM user_balances ub
LEFT JOIN calculated_balances cb ON ub.user_id = cb.user_id
WHERE ABS(ub.current_used - COALESCE(cb.calculated_used, 0)) > 100 -- Only show discrepancies > 100 tokens
ORDER BY discrepancy DESC
LIMIT 50;

