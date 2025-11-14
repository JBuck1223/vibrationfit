-- =====================================================================
-- Grant Admin Access to User
-- =====================================================================
-- Run this in Supabase SQL Editor to make yourself admin

-- Replace 'your-email@example.com' with your actual email
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'buckinghambliss@gmail.com';

-- Verify it worked
SELECT 
  id,
  email,
  raw_user_meta_data ->> 'is_admin' as is_admin
FROM auth.users
WHERE email = 'buckinghambliss@gmail.com';

-- =====================================================================
-- To revoke admin:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data - 'is_admin'
-- WHERE email = 'buckinghambliss@gmail.com';
-- =====================================================================

