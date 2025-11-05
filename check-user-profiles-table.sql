-- Check if user_profiles table exists and view its structure
-- Run this in Supabase SQL Editor

-- 1. Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_profiles'
);

-- 2. List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Check user_profiles columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Check RLS policies on user_profiles
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- 5. Test query (replace YOUR_USER_ID with your actual user ID)
SELECT first_name, profile_picture_url, vibe_assistant_tokens_remaining, is_active
FROM user_profiles 
WHERE user_id = auth.uid() 
AND is_active = true;

