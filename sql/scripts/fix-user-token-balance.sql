-- ============================================================================
-- Fix User Token Balance - Reconcile from token_usage records
-- ============================================================================
-- This script recalculates a user's token balance from their token_usage records
-- Run this AFTER fixing the trackTokenUsage function

-- Replace 'USER_ID_HERE' with actual user ID
\set user_id 'USER_ID_HERE'

-- Step 1: Calculate what the balance SHOULD be from token_usage
WITH token_calculations AS (
  SELECT 
    -- Total grants (adds to remaining)
    SUM(CASE WHEN action_type = 'admin_grant' AND success = true THEN tokens_used ELSE 0 END) as total_grants,
    
    -- Total deductions (subtracts from remaining, adds to used)
    SUM(CASE WHEN action_type = 'admin_deduct' AND success = true THEN tokens_used ELSE 0 END) as total_deductions,
    
    -- Total regular usage (subtracts from remaining, adds to used)
    SUM(CASE 
      WHEN action_type NOT IN ('admin_grant', 'admin_deduct') 
      AND success = true 
      AND tokens_used > 0 
      THEN tokens_used 
      ELSE 0 
    END) as total_usage,
    
    -- Total cost
    SUM(CASE WHEN success = true THEN cost_estimate ELSE 0 END) as total_cost_cents
  FROM token_usage
  WHERE user_id = :'user_id'
),
starting_balance AS (
  -- Get the initial balance (before any usage)
  -- This is typically 100 for new users, but check admin_grant records
  SELECT COALESCE(
    (SELECT tokens_used FROM token_usage 
     WHERE user_id = :'user_id' 
     AND action_type = 'admin_grant' 
     ORDER BY created_at ASC LIMIT 1),
    100
  ) as initial_remaining
)
SELECT 
  sb.initial_remaining as starting_tokens,
  tc.total_grants,
  tc.total_deductions,
  tc.total_usage,
  tc.total_cost_cents,
  -- Calculate expected remaining: start + grants - deductions - usage
  (sb.initial_remaining + tc.total_grants - tc.total_deductions - tc.total_usage) as calculated_remaining,
  -- Calculate expected used: deductions + usage
  (tc.total_deductions + tc.total_usage) as calculated_used
FROM starting_balance sb
CROSS JOIN token_calculations tc;

-- Step 2: Update user_profiles with calculated values
-- UNCOMMENT AND RUN AFTER VERIFYING STEP 1 RESULTS

/*
WITH token_calculations AS (
  SELECT 
    SUM(CASE WHEN action_type = 'admin_grant' AND success = true THEN tokens_used ELSE 0 END) as total_grants,
    SUM(CASE WHEN action_type = 'admin_deduct' AND success = true THEN tokens_used ELSE 0 END) as total_deductions,
    SUM(CASE 
      WHEN action_type NOT IN ('admin_grant', 'admin_deduct') 
      AND success = true 
      AND tokens_used > 0 
      THEN tokens_used 
      ELSE 0 
    END) as total_usage,
    SUM(CASE WHEN success = true THEN cost_estimate ELSE 0 END) as total_cost_cents
  FROM token_usage
  WHERE user_id = :'user_id'
),
starting_balance AS (
  SELECT COALESCE(
    (SELECT tokens_used FROM token_usage 
     WHERE user_id = :'user_id' 
     AND action_type = 'admin_grant' 
     ORDER BY created_at ASC LIMIT 1),
    100
  ) as initial_remaining
)
UPDATE user_profiles
SET
  vibe_assistant_tokens_remaining = GREATEST(0, 
    (SELECT initial_remaining FROM starting_balance) + 
    (SELECT total_grants FROM token_calculations) - 
    (SELECT total_deductions FROM token_calculations) - 
    (SELECT total_usage FROM token_calculations)
  ),
  vibe_assistant_tokens_used = 
    (SELECT total_deductions FROM token_calculations) + 
    (SELECT total_usage FROM token_calculations),
  vibe_assistant_total_cost = (SELECT total_cost_cents FROM token_calculations) / 100.0,
  updated_at = NOW()
WHERE user_id = :'user_id';
*/

-- Step 3: Verify the update
SELECT 
  user_id,
  vibe_assistant_tokens_remaining,
  vibe_assistant_tokens_used,
  vibe_assistant_total_cost,
  updated_at
FROM user_profiles
WHERE user_id = :'user_id';

