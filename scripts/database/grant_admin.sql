-- =====================================================================
-- Grant Admin Access to Users
-- =====================================================================
-- Run this in Supabase SQL Editor to grant admin access

-- Grant admin to both accounts
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email IN ('buckinghambliss@gmail.com', 'jordan@vibrationfit.com');

-- Verify it worked
SELECT 
  id,
  email,
  raw_user_meta_data ->> 'is_admin' as is_admin
FROM auth.users
WHERE email IN ('buckinghambliss@gmail.com', 'jordan@vibrationfit.com');

-- =====================================================================
-- To revoke admin:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data - 'is_admin'
-- WHERE email = 'buckinghambliss@gmail.com';
-- =====================================================================

