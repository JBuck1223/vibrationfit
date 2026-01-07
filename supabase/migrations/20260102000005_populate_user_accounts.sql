-- ============================================================================
-- Populate User Accounts from Existing Data
-- Migration: 20260102000005_populate_user_accounts.sql
-- Description: Ensures all auth.users have matching user_accounts records
--              and copies data from user_profiles if columns still exist
-- ============================================================================

-- Step 1: Create user_accounts for all auth.users that don't have one
INSERT INTO user_accounts (id, email, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM user_accounts ua WHERE ua.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Copy data from user_profiles if those columns still exist
DO $$
BEGIN
  -- Check if first_name column exists in user_profiles
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'first_name' 
    AND table_schema = 'public'
  ) THEN
    -- Update user_accounts with data from active user_profiles
    UPDATE user_accounts ua
    SET 
      first_name = COALESCE(up.first_name, ua.first_name),
      last_name = COALESCE(up.last_name, ua.last_name),
      email = COALESCE(up.email, ua.email),
      phone = COALESCE(up.phone, ua.phone),
      profile_picture_url = COALESCE(up.profile_picture_url, ua.profile_picture_url)
    FROM user_profiles up
    WHERE up.user_id = ua.id
      AND up.is_active = TRUE
      AND up.is_draft = FALSE;
      
    RAISE NOTICE 'Updated user_accounts from user_profiles (first_name column exists)';
  ELSE
    RAISE NOTICE 'first_name column does not exist in user_profiles - skipping data copy';
  END IF;

  -- Check if sms_opt_in column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'sms_opt_in' 
    AND table_schema = 'public'
  ) THEN
    UPDATE user_accounts ua
    SET 
      sms_opt_in = COALESCE(up.sms_opt_in, ua.sms_opt_in, FALSE),
      sms_opt_in_date = COALESCE(up.sms_opt_in_date, ua.sms_opt_in_date),
      sms_opt_in_ip = COALESCE(up.sms_opt_in_ip, ua.sms_opt_in_ip)
    FROM user_profiles up
    WHERE up.user_id = ua.id
      AND up.is_active = TRUE
      AND up.is_draft = FALSE;
      
    RAISE NOTICE 'Updated SMS opt-in data from user_profiles';
  END IF;

  -- Check if household_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'household_id' 
    AND table_schema = 'public'
  ) THEN
    UPDATE user_accounts ua
    SET 
      household_id = COALESCE(up.household_id, ua.household_id),
      is_household_admin = COALESCE(up.is_household_admin, ua.is_household_admin, FALSE),
      allow_shared_tokens = COALESCE(up.allow_shared_tokens, ua.allow_shared_tokens, TRUE)
    FROM user_profiles up
    WHERE up.user_id = ua.id
      AND up.is_active = TRUE
      AND up.is_draft = FALSE;
      
    RAISE NOTICE 'Updated household data from user_profiles';
  END IF;

  -- Check if date_of_birth column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'date_of_birth' 
    AND table_schema = 'public'
  ) THEN
    UPDATE user_accounts ua
    SET 
      date_of_birth = COALESCE(up.date_of_birth, ua.date_of_birth)
    FROM user_profiles up
    WHERE up.user_id = ua.id
      AND up.is_active = TRUE
      AND up.is_draft = FALSE;
      
    RAISE NOTICE 'Updated date_of_birth from user_profiles';
  END IF;
END $$;

-- Step 3: Set admin roles
UPDATE user_accounts 
SET role = 'super_admin' 
WHERE email IN ('buckinghambliss@gmail.com', 'admin@vibrationfit.com')
  AND role = 'member';

-- Step 4: Verify results
DO $$
DECLARE
  total_accounts INTEGER;
  accounts_with_names INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_accounts FROM user_accounts;
  SELECT COUNT(*) INTO accounts_with_names FROM user_accounts WHERE first_name IS NOT NULL;
  
  RAISE NOTICE 'User accounts total: %, with names: %', total_accounts, accounts_with_names;
END $$;


