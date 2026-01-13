-- Set default profile picture URL for user_accounts
-- Migration: 20260108000003_default_profile_picture.sql

-- Step 1: Set default value for new rows
ALTER TABLE public.user_accounts
ALTER COLUMN profile_picture_url SET DEFAULT 'https://media.vibrationfit.com/site-assets/brand/default-profile-image/default-profile-image.jpg';

-- Step 2: Update existing rows that have NULL profile_picture_url
UPDATE public.user_accounts
SET profile_picture_url = 'https://media.vibrationfit.com/site-assets/brand/default-profile-image/default-profile-image.jpg'
WHERE profile_picture_url IS NULL;

COMMENT ON COLUMN public.user_accounts.profile_picture_url IS 'User profile picture URL - defaults to brand default image';
