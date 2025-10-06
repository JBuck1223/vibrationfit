-- Reset Vibe Assistant tokens for a specific user
-- Replace 'your-user-id' with the actual user ID

-- Option 1: Reset tokens for a specific user
UPDATE user_profiles 
SET 
  vibe_assistant_tokens_used = 0,
  vibe_assistant_tokens_remaining = 100,
  vibe_assistant_total_cost = 0.00,
  vibe_assistant_monthly_reset_date = CURRENT_TIMESTAMP
WHERE id = 'your-user-id';

-- Option 2: Reset tokens for all users (use with caution)
-- UPDATE user_profiles 
-- SET 
--   vibe_assistant_tokens_used = 0,
--   vibe_assistant_tokens_remaining = 100,
--   vibe_assistant_total_cost = 0.00,
--   vibe_assistant_monthly_reset_date = CURRENT_TIMESTAMP;

-- Check the result
SELECT id, email, vibe_assistant_tokens_used, vibe_assistant_tokens_remaining, 
       vibe_assistant_total_cost, membership_tier_id
FROM user_profiles 
WHERE id = 'your-user-id';
