-- Migration: Sync auth.users.email with user_profiles.email
-- Date: 2025-12-13
-- Description: user_profiles is source of truth - sync TO auth.users when profile email changes

-- Step 1: Populate user_profiles.email from auth.users for any that are missing
UPDATE user_profiles
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = user_profiles.user_id
)
WHERE email IS NULL AND user_id IS NOT NULL;

-- Step 2: Create function to sync auth.users when user_profiles.email changes
CREATE OR REPLACE FUNCTION sync_auth_users_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users email when user_profiles email changes
  -- Note: This updates Supabase Auth, which may trigger other auth flows
  UPDATE auth.users
  SET email = NEW.email,
      updated_at = NOW()
  WHERE id = NEW.user_id
    AND email IS DISTINCT FROM NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger on user_profiles table
DROP TRIGGER IF EXISTS trigger_sync_auth_email ON user_profiles;
CREATE TRIGGER trigger_sync_auth_email
  AFTER UPDATE OF email ON user_profiles
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email AND NEW.email IS NOT NULL)
  EXECUTE FUNCTION sync_auth_users_email();

-- Step 4: Ensure new profiles get email from auth.users initially
CREATE OR REPLACE FUNCTION set_initial_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- On new profile creation, pull email from auth.users if not provided
  IF NEW.email IS NULL THEN
    NEW.email := (
      SELECT email 
      FROM auth.users 
      WHERE id = NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for new profiles
DROP TRIGGER IF EXISTS trigger_set_initial_email ON user_profiles;
CREATE TRIGGER trigger_set_initial_email
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_profile_email();

-- Verification: Show any mismatches (should be 0 after this migration)
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM user_profiles up
  INNER JOIN auth.users au ON au.id = up.user_id
  WHERE up.email IS DISTINCT FROM au.email;
  
  RAISE NOTICE 'Email mismatches found: %', mismatch_count;
END $$;

