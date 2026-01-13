-- Move date_of_birth from user_profiles to user_accounts
-- Migration: 20260108000002_move_dob_to_user_accounts.sql

-- Step 1: Add date_of_birth column to user_accounts (if not exists)
ALTER TABLE public.user_accounts 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN public.user_accounts.date_of_birth IS 'User date of birth - account-level demographic data';

-- Step 2: Migrate existing date_of_birth data from user_profiles to user_accounts
-- Uses the most recent active profile's date_of_birth for each user
UPDATE public.user_accounts ua
SET date_of_birth = (
  SELECT up.date_of_birth
  FROM public.user_profiles up
  WHERE up.user_id = ua.id
    AND up.date_of_birth IS NOT NULL
  ORDER BY up.is_active DESC NULLS LAST, up.updated_at DESC NULLS LAST
  LIMIT 1
)
WHERE ua.date_of_birth IS NULL;

-- Step 3: Drop date_of_birth column from user_profiles
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS date_of_birth;
