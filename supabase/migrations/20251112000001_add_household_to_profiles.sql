-- Add household-related fields to user_profiles table
-- This allows users to be linked to households and manage token sharing preferences

-- =====================================================================
-- 1. ADD COLUMNS TO USER_PROFILES
-- =====================================================================

-- Add household relationship columns
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_household_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allow_shared_tokens BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.household_id IS 'Reference to the household this user belongs to (NULL for users not in a household)';
COMMENT ON COLUMN user_profiles.is_household_admin IS 'True if this user is the admin of their household';
COMMENT ON COLUMN user_profiles.allow_shared_tokens IS 'User preference: allow using household shared tokens when personal tokens run out';

-- =====================================================================
-- 2. CREATE INDEXES
-- =====================================================================

-- Index for quick household member lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_household_id ON user_profiles(household_id);

-- Index for finding household admins
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_household_admin ON user_profiles(is_household_admin) WHERE is_household_admin = TRUE;

-- =====================================================================
-- 3. ADD CONSTRAINTS
-- =====================================================================

-- Ensure household admin logic is consistent
-- (User should be admin of their household OR not have is_household_admin flag)
-- Note: This will be enforced by application logic and database functions

-- =====================================================================
-- 4. UPDATE EXISTING USERS (MIGRATION LOGIC)
-- =====================================================================

-- For existing users without households, create individual solo households
-- This ensures backward compatibility

DO $$
DECLARE
  user_record RECORD;
  new_household_id UUID;
  existing_household_id UUID;
BEGIN
  -- Loop through all users who don't have a household yet
  FOR user_record IN 
    SELECT 
      up.user_id,
      up.first_name,
      au.email
    FROM user_profiles up
    INNER JOIN auth.users au ON au.id = up.user_id
    WHERE up.household_id IS NULL
  LOOP
    -- Check if a household already exists with this user as admin
    SELECT id INTO existing_household_id
    FROM households
    WHERE admin_user_id = user_record.user_id
    LIMIT 1;
    
    -- If household already exists (created by webhook), use that
    IF existing_household_id IS NOT NULL THEN
      new_household_id := existing_household_id;
      RAISE NOTICE 'Found existing household % for user %', new_household_id, user_record.user_id;
    ELSE
      -- Create a solo household for this user
      INSERT INTO households (
        admin_user_id,
        name,
        plan_type,
        subscription_status,
        max_members,
        shared_tokens_enabled
      ) VALUES (
        user_record.user_id,
        COALESCE(user_record.first_name || '''s Account', user_record.email || '''s Account', 'My Account'),
        'solo',
        'active', -- Assume existing users are active
        1, -- Solo plan = 1 member
        FALSE -- Solo doesn't need token sharing
      )
      RETURNING id INTO new_household_id;
      
      RAISE NOTICE 'Created new household % for user %', new_household_id, user_record.user_id;
    END IF;

    -- Create household_members record if it doesn't exist
    INSERT INTO household_members (
      household_id,
      user_id,
      role,
      status,
      allow_shared_tokens,
      joined_at,
      accepted_at
    ) VALUES (
      new_household_id,
      user_record.user_id,
      'admin',
      'active',
      TRUE,
      NOW(),
      NOW()
    )
    ON CONFLICT (household_id, user_id) DO NOTHING;

    -- Update user_profiles with household info
    UPDATE user_profiles
    SET 
      household_id = new_household_id,
      is_household_admin = TRUE,
      allow_shared_tokens = TRUE,
      updated_at = NOW()
    WHERE user_id = user_record.user_id;

    RAISE NOTICE 'Created solo household for user: %', user_record.user_id;
  END LOOP;

  RAISE NOTICE 'Migration complete: All existing users now have households';
END $$;

-- =====================================================================
-- 5. FUNCTION: Auto-assign new users to solo households
-- =====================================================================

-- Function to automatically create a solo household when a new user signs up
CREATE OR REPLACE FUNCTION create_solo_household_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Only create household if user doesn't already have one
  IF NEW.household_id IS NULL THEN
    -- Create solo household
    INSERT INTO households (
      admin_user_id,
      name,
      plan_type,
      subscription_status,
      max_members,
      shared_tokens_enabled
    ) VALUES (
      NEW.user_id,
      COALESCE(NEW.first_name || '''s Account', NEW.email || '''s Account', 'My Account'),
      'solo',
      'trialing', -- New users start in trial
      1,
      FALSE
    )
    RETURNING id INTO new_household_id;

    -- Create household_members record
    INSERT INTO household_members (
      household_id,
      user_id,
      role,
      status,
      allow_shared_tokens,
      joined_at,
      accepted_at
    ) VALUES (
      new_household_id,
      NEW.user_id,
      'admin',
      'active',
      TRUE,
      NOW(),
      NOW()
    );

    -- Update the new user_profile record
    NEW.household_id := new_household_id;
    NEW.is_household_admin := TRUE;
    NEW.allow_shared_tokens := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create household on user_profile insert
CREATE TRIGGER auto_create_solo_household
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_solo_household_for_new_user();

-- =====================================================================
-- 6. VALIDATION QUERIES (for testing)
-- =====================================================================

-- Verify all users have households
DO $$
DECLARE
  users_without_households INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_without_households
  FROM user_profiles
  WHERE household_id IS NULL;

  IF users_without_households > 0 THEN
    RAISE WARNING 'Found % users without households', users_without_households;
  ELSE
    RAISE NOTICE 'All users have households ✓';
  END IF;
END $$;

-- Verify household membership consistency
DO $$
DECLARE
  inconsistent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM user_profiles up
  LEFT JOIN household_members hm ON hm.user_id = up.user_id AND hm.household_id = up.household_id
  WHERE up.household_id IS NOT NULL AND hm.id IS NULL;

  IF inconsistent_count > 0 THEN
    RAISE WARNING 'Found % users with household_id but no household_members record', inconsistent_count;
  ELSE
    RAISE NOTICE 'Household membership is consistent ✓';
  END IF;
END $$;

-- =====================================================================
-- GRANTS
-- =====================================================================

GRANT EXECUTE ON FUNCTION create_solo_household_for_new_user TO authenticated;

-- =====================================================================
-- ROLLBACK (commented out - for reference)
-- =====================================================================

-- To rollback this migration:
-- DROP TRIGGER IF EXISTS auto_create_solo_household ON user_profiles;
-- DROP FUNCTION IF EXISTS create_solo_household_for_new_user();
-- DROP INDEX IF EXISTS idx_user_profiles_household_id;
-- DROP INDEX IF EXISTS idx_user_profiles_is_household_admin;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS household_id;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_household_admin;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS allow_shared_tokens;

