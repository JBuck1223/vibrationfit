-- Debug Vibe Assistant Allowance System
-- Check if the required tables and functions exist

-- 1. Check if user_profiles table has Vibe Assistant columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name LIKE '%vibe_assistant%'
ORDER BY column_name;

-- 2. Check if membership_tiers table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'membership_tiers';

-- 3. Check if vibe_assistant_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'vibe_assistant_logs';

-- 4. Check if the allowance function exists
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'get_vibe_assistant_allowance';

-- 5. Check a specific user's profile data
-- Replace 'your-user-id' with an actual user ID from your auth.users table
SELECT id, email, vibe_assistant_tokens_used, vibe_assistant_tokens_remaining, 
       vibe_assistant_total_cost, membership_tier_id
FROM user_profiles 
LIMIT 5;

-- 6. Check membership tiers data
SELECT * FROM membership_tiers;

-- 7. Test the allowance function with a real user ID
-- Replace 'your-user-id' with an actual user ID
-- SELECT * FROM get_vibe_assistant_allowance('your-user-id');
