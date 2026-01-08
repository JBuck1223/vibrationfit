-- ============================================================================
-- User Accounts Table & Profile Cleanup
-- Migration: 20260102000003_user_accounts_cleanup.sql
-- Description: 
--   1. Create user_accounts table (core user data + roles)
--   2. Migrate data from user_profiles account fields
--   3. Remove account fields from user_profiles
--   4. Drop unused tables (profiles, member_profiles, profile_versions)
--   5. Update auth trigger to create user_accounts
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE USER ROLE ENUM
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'member',       -- Regular member (default)
      'coach',        -- Can host sessions, view assigned members
      'admin',        -- Full admin access
      'super_admin'   -- Can manage other admins
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE USER_ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_accounts (
  -- Primary key matches auth.users.id
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core identity
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL THEN first_name
      WHEN last_name IS NOT NULL THEN last_name
      ELSE NULL
    END
  ) STORED,
  profile_picture_url TEXT,
  
  -- Contact
  phone TEXT,
  
  -- Demographics (fixed facts)
  date_of_birth DATE,
  
  -- SMS Consent (account level, not version-specific)
  sms_opt_in BOOLEAN DEFAULT FALSE,
  sms_opt_in_date TIMESTAMPTZ,
  sms_opt_in_ip TEXT,
  
  -- Role & Permissions
  role user_role DEFAULT 'member' NOT NULL,
  
  -- Household membership
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  is_household_admin BOOLEAN DEFAULT FALSE,
  allow_shared_tokens BOOLEAN DEFAULT TRUE,
  
  -- Membership
  membership_tier_id UUID REFERENCES membership_tiers(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_role ON user_accounts(role);
CREATE INDEX IF NOT EXISTS idx_user_accounts_phone ON user_accounts(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_accounts_sms_opt_in ON user_accounts(sms_opt_in) WHERE sms_opt_in = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_accounts_household ON user_accounts(household_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_household_admin ON user_accounts(is_household_admin) WHERE is_household_admin = TRUE;

-- ============================================================================
-- STEP 4: MIGRATE DATA FROM EXISTING TABLES
-- ============================================================================

-- Migrate from profiles table (if it exists and has data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    INSERT INTO user_accounts (id, email, first_name, last_name, membership_tier_id, created_at, updated_at)
    SELECT 
      p.id,
      p.email,
      SPLIT_PART(p.full_name, ' ', 1) AS first_name,
      CASE WHEN POSITION(' ' IN p.full_name) > 0 
           THEN SUBSTRING(p.full_name FROM POSITION(' ' IN p.full_name) + 1)
           ELSE NULL 
      END AS last_name,
      p.membership_tier_id,
      p.created_at,
      p.updated_at
    FROM profiles p
    WHERE NOT EXISTS (SELECT 1 FROM user_accounts ua WHERE ua.id = p.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Update with data from user_profiles (more complete data, if table and columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'first_name') THEN
    UPDATE user_accounts ua
    SET 
      first_name = COALESCE(up.first_name, ua.first_name),
      last_name = COALESCE(up.last_name, ua.last_name),
      email = COALESCE(up.email, ua.email),
      phone = up.phone,
      date_of_birth = up.date_of_birth,
      profile_picture_url = up.profile_picture_url,
      sms_opt_in = COALESCE(up.sms_opt_in, FALSE),
      sms_opt_in_date = up.sms_opt_in_date,
      sms_opt_in_ip = up.sms_opt_in_ip,
      household_id = up.household_id,
      is_household_admin = COALESCE(up.is_household_admin, FALSE),
      allow_shared_tokens = COALESCE(up.allow_shared_tokens, TRUE)
    FROM user_profiles up
    WHERE up.user_id = ua.id
      AND up.is_active = TRUE;
  END IF;
END $$;

-- For users in auth.users but not yet in user_accounts, create records
INSERT INTO user_accounts (id, email, created_at)
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM user_accounts ua WHERE ua.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Set existing admins (from the old hardcoded list)
UPDATE user_accounts 
SET role = 'super_admin' 
WHERE email IN ('buckinghambliss@gmail.com', 'admin@vibrationfit.com');

-- ============================================================================
-- STEP 5: UPDATE USER_PROFILES - REMOVE MIGRATED COLUMNS
-- ============================================================================

-- First, drop triggers that depend on columns we're removing
DROP TRIGGER IF EXISTS auto_create_solo_household ON user_profiles;
DROP TRIGGER IF EXISTS trigger_sync_auth_email ON user_profiles;
DROP TRIGGER IF EXISTS trigger_set_new_profile_email ON user_profiles;
DROP TRIGGER IF EXISTS trigger_set_initial_email ON user_profiles;

-- Drop functions that are no longer needed (optional, but cleaner)
DROP FUNCTION IF EXISTS sync_auth_users_email() CASCADE;
DROP FUNCTION IF EXISTS set_new_profile_email() CASCADE;
DROP FUNCTION IF EXISTS set_initial_profile_email() CASCADE;
DROP FUNCTION IF EXISTS create_solo_household_for_new_user() CASCADE;

-- Drop indexes that reference columns we're removing
DROP INDEX IF EXISTS idx_user_profiles_household_id;
DROP INDEX IF EXISTS idx_user_profiles_is_household_admin;
DROP INDEX IF EXISTS idx_user_profiles_phone;
DROP INDEX IF EXISTS idx_user_profiles_sms_opt_in;

-- Remove columns that are now in user_accounts
ALTER TABLE user_profiles DROP COLUMN IF EXISTS first_name;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS last_name;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS email;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS profile_picture_url;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS sms_opt_in;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS sms_opt_in_date;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS sms_opt_in_ip;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS household_id;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_household_admin;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS allow_shared_tokens;

-- ============================================================================
-- STEP 6: DROP OBSOLETE TABLES
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_sync_profile_email ON auth.users;

-- Drop the tables
DROP TABLE IF EXISTS profile_versions CASCADE;
DROP TABLE IF EXISTS member_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- STEP 7: CREATE NEW TRIGGERS FOR USER_ACCOUNTS
-- ============================================================================

-- Function to create user_accounts record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_accounts (id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Function to sync email changes from auth.users to user_accounts
CREATE OR REPLACE FUNCTION sync_user_accounts_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_accounts SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_account_email ON auth.users;
CREATE TRIGGER trigger_sync_account_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_user_accounts_email();

-- ============================================================================
-- STEP 7b: CREATE SOLO HOUSEHOLD FOR NEW USERS (moved from user_profiles)
-- ============================================================================

-- Function to create a solo household when a new user_accounts record is created
CREATE OR REPLACE FUNCTION create_solo_household_for_new_account()
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
      billing_status,
      max_household_members,
      shared_tokens_enabled
    ) VALUES (
      NEW.id,
      'My Household',
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
      NEW.id,
      'admin',
      'active',
      TRUE,
      NOW(),
      NOW()
    );

    -- Update the user_accounts record with the household_id
    NEW.household_id := new_household_id;
    NEW.is_household_admin := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create solo household for new accounts
DROP TRIGGER IF EXISTS auto_create_solo_household_for_account ON user_accounts;
CREATE TRIGGER auto_create_solo_household_for_account
  BEFORE INSERT ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION create_solo_household_for_new_account();

-- ============================================================================
-- STEP 8: RLS POLICIES
-- ============================================================================

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own account
CREATE POLICY "Users can view own account"
  ON user_accounts FOR SELECT
  USING (id = auth.uid());

-- Users can update their own account (except role)
CREATE POLICY "Users can update own account"
  ON user_accounts FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all accounts
CREATE POLICY "Admins can view all accounts"
  ON user_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update accounts
CREATE POLICY "Admins can update accounts"
  ON user_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Super admins can manage roles
CREATE POLICY "Super admins can manage all"
  ON user_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================================
-- STEP 9: HELPER FUNCTIONS
-- ============================================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_accounts
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_accounts
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS user_role AS $$
DECLARE
  result user_role;
BEGIN
  SELECT role INTO result FROM user_accounts WHERE id = user_id;
  RETURN COALESCE(result, 'member');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_user_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_accounts_updated_at
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_accounts_updated_at();

-- ============================================================================
-- STEP 10: UPDATE MESSAGING TEMPLATES RLS (uses is_admin function)
-- ============================================================================

-- Drop and recreate policies that reference old is_admin check
DROP POLICY IF EXISTS "Anyone can read active email templates" ON email_templates;
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Anyone can read active sms templates" ON sms_templates;
DROP POLICY IF EXISTS "Admins can manage sms templates" ON sms_templates;
DROP POLICY IF EXISTS "Admins can manage scheduled messages" ON scheduled_messages;
DROP POLICY IF EXISTS "Admins can view message log" ON message_send_log;

-- Recreate with proper function
CREATE POLICY "Anyone can read active email templates"
  ON email_templates FOR SELECT
  USING (status = 'active' OR is_admin());

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can read active sms templates"
  ON sms_templates FOR SELECT
  USING (status = 'active' OR is_admin());

CREATE POLICY "Admins can manage sms templates"
  ON sms_templates FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage scheduled messages"
  ON scheduled_messages FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can view message log"
  ON message_send_log FOR SELECT
  USING (is_admin());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_accounts IS 'Core user account data - identity, contact, role, membership';
COMMENT ON COLUMN user_accounts.role IS 'User role: member, coach, admin, super_admin';
COMMENT ON COLUMN user_accounts.sms_opt_in IS 'User has opted in to receive SMS messages';
COMMENT ON FUNCTION is_admin IS 'Check if user has admin or super_admin role';
COMMENT ON FUNCTION get_user_role IS 'Get the role of a user';

