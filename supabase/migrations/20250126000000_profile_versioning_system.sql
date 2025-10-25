-- ============================================================================
-- Profile Versioning System Migration
-- ============================================================================
-- This migration adds robust versioning capabilities to the user_profiles table
-- implementing Active/Draft/Complete state management with proper constraints

-- Drop existing unique constraints that might conflict
DROP INDEX IF EXISTS idx_user_profiles_one_active_per_user;
DROP INDEX IF EXISTS idx_user_profiles_one_draft_per_user;

-- Add versioning fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS version_notes TEXT,
ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES user_profiles(id);

-- Add completion percentage field for better UX
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_version_number ON user_profiles(user_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_draft ON user_profiles(user_id, is_draft);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_parent_version ON user_profiles(parent_version_id);

-- ============================================================================
-- BUSINESS RULES CONSTRAINTS
-- ============================================================================

-- Ensure only one active version per user (excluding drafts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_one_active_per_user 
  ON user_profiles(user_id) 
  WHERE is_active = true AND is_draft = false;

-- Ensure only one draft version per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_one_draft_per_user 
  ON user_profiles(user_id) 
  WHERE is_draft = true;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get the next version number for a user
CREATE OR REPLACE FUNCTION get_next_version_number(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  RETURN next_version;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- Function to set a version as active (and deactivate others)
CREATE OR REPLACE FUNCTION set_version_active(p_profile_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Check if the profile exists and belongs to the user
  SELECT EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = p_profile_id AND user_id = p_user_id
  ) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RETURN false;
  END IF;
  
  -- Deactivate all other active versions for this user
  UPDATE user_profiles 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true AND is_draft = false;
  
  -- Set the specified version as active
  UPDATE user_profiles 
  SET is_active = true, is_draft = false, updated_at = NOW()
  WHERE id = p_profile_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to create a draft from an existing version
CREATE OR REPLACE FUNCTION create_draft_from_version(p_source_profile_id UUID, p_user_id UUID, p_version_notes TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_profile_id UUID;
  source_profile RECORD;
  next_version INTEGER;
BEGIN
  -- Get the source profile data
  SELECT * INTO source_profile
  FROM user_profiles
  WHERE id = p_source_profile_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source profile not found or access denied';
  END IF;
  
  -- Get next version number
  next_version := get_next_version_number(p_user_id);
  
  -- Delete any existing draft for this user
  DELETE FROM user_profiles 
  WHERE user_id = p_user_id AND is_draft = true;
  
  -- Create new draft version
  INSERT INTO user_profiles (
    user_id,
    version_number,
    is_draft,
    is_active,
    version_notes,
    parent_version_id,
    completion_percentage,
    -- Copy all profile data fields
    profile_picture_url,
    date_of_birth,
    gender,
    ethnicity,
    relationship_status,
    relationship_length,
    partner_name,
    has_children,
    number_of_children,
    children_ages,
    units,
    height,
    weight,
    exercise_frequency,
    living_situation,
    time_at_location,
    city,
    state,
    postal_code,
    country,
    employment_type,
    occupation,
    company,
    time_in_role,
    currency,
    household_income,
    savings_retirement,
    assets_equity,
    consumer_debt,
    education_level,
    current_story,
    desired_story,
    -- Life category stories
    health_vitality_story,
    romance_partnership_story,
    family_parenting_story,
    career_work_story,
    money_wealth_story,
    home_environment_story,
    fun_recreation_story,
    travel_adventure_story,
    social_friends_story,
    possessions_lifestyle_story,
    spirituality_growth_story,
    giving_legacy_story,
    -- Structured fields
    hobbies,
    leisure_time_weekly,
    travel_frequency,
    passport,
    countries_visited,
    close_friends_count,
    social_preference,
    lifestyle_category,
    primary_vehicle,
    spiritual_practice,
    meditation_frequency,
    personal_growth_focus,
    volunteer_status,
    charitable_giving,
    legacy_mindset,
    -- Media and notes
    progress_photos,
    story_recordings,
    -- Token tracking fields
    vibe_assistant_tokens_used,
    vibe_assistant_tokens_remaining,
    vibe_assistant_total_cost,
    token_rollover_cycles,
    token_last_drip_date,
    auto_topup_enabled,
    auto_topup_pack_id,
    storage_quota_gb,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    next_version,
    true,  -- is_draft
    false, -- is_active
    p_version_notes,
    p_source_profile_id, -- parent_version_id
    source_profile.completion_percentage,
    -- Copy all fields from source
    source_profile.profile_picture_url,
    source_profile.date_of_birth,
    source_profile.gender,
    source_profile.ethnicity,
    source_profile.relationship_status,
    source_profile.relationship_length,
    source_profile.partner_name,
    source_profile.has_children,
    source_profile.number_of_children,
    source_profile.children_ages,
    source_profile.units,
    source_profile.height,
    source_profile.weight,
    source_profile.exercise_frequency,
    source_profile.living_situation,
    source_profile.time_at_location,
    source_profile.city,
    source_profile.state,
    source_profile.postal_code,
    source_profile.country,
    source_profile.employment_type,
    source_profile.occupation,
    source_profile.company,
    source_profile.time_in_role,
    source_profile.currency,
    source_profile.household_income,
    source_profile.savings_retirement,
    source_profile.assets_equity,
    source_profile.consumer_debt,
    source_profile.education_level,
    source_profile.current_story,
    source_profile.desired_story,
    source_profile.health_vitality_story,
    source_profile.romance_partnership_story,
    source_profile.family_parenting_story,
    source_profile.career_work_story,
    source_profile.money_wealth_story,
    source_profile.home_environment_story,
    source_profile.fun_recreation_story,
    source_profile.travel_adventure_story,
    source_profile.social_friends_story,
    source_profile.possessions_lifestyle_story,
    source_profile.spirituality_growth_story,
    source_profile.giving_legacy_story,
    source_profile.hobbies,
    source_profile.leisure_time_weekly,
    source_profile.travel_frequency,
    source_profile.passport,
    source_profile.countries_visited,
    source_profile.close_friends_count,
    source_profile.social_preference,
    source_profile.lifestyle_category,
    source_profile.primary_vehicle,
    source_profile.spiritual_practice,
    source_profile.meditation_frequency,
    source_profile.personal_growth_focus,
    source_profile.volunteer_status,
    source_profile.charitable_giving,
    source_profile.legacy_mindset,
    source_profile.progress_photos,
    source_profile.story_recordings,
    source_profile.vibe_assistant_tokens_used,
    source_profile.vibe_assistant_tokens_remaining,
    source_profile.vibe_assistant_total_cost,
    source_profile.token_rollover_cycles,
    source_profile.token_last_drip_date,
    source_profile.auto_topup_enabled,
    source_profile.auto_topup_pack_id,
    source_profile.storage_quota_gb,
    NOW(),
    NOW()
  ) RETURNING id INTO new_profile_id;
  
  RETURN new_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Function to commit a draft as the new active version
CREATE OR REPLACE FUNCTION commit_draft_as_active(p_draft_profile_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  draft_profile RECORD;
  next_version INTEGER;
BEGIN
  -- Get the draft profile
  SELECT * INTO draft_profile
  FROM user_profiles
  WHERE id = p_draft_profile_id AND user_id = p_user_id AND is_draft = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft profile not found or access denied';
  END IF;
  
  -- Get next version number
  next_version := get_next_version_number(p_user_id);
  
  -- Deactivate current active version
  UPDATE user_profiles 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true AND is_draft = false;
  
  -- Commit the draft as the new active version
  UPDATE user_profiles 
  SET 
    is_draft = false,
    is_active = true,
    version_number = next_version,
    updated_at = NOW()
  WHERE id = p_draft_profile_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA MIGRATION
-- ============================================================================

-- Set existing profiles as active (non-draft) if they don't have versioning fields set
UPDATE user_profiles 
SET 
  is_active = true,
  is_draft = false,
  version_number = 1,
  completion_percentage = 0
WHERE is_active IS NULL OR is_draft IS NULL;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN user_profiles.version_number IS 'Sequential version number for this user';
COMMENT ON COLUMN user_profiles.is_draft IS 'True if this is a work-in-progress draft version';
COMMENT ON COLUMN user_profiles.is_active IS 'True if this is the current active version (only one per user)';
COMMENT ON COLUMN user_profiles.version_notes IS 'Optional notes about this version';
COMMENT ON COLUMN user_profiles.parent_version_id IS 'Reference to the version this was created from';
COMMENT ON COLUMN user_profiles.completion_percentage IS 'Profile completion percentage (0-100)';

COMMENT ON FUNCTION get_next_version_number(UUID) IS 'Gets the next version number for a user';
COMMENT ON FUNCTION set_version_active(UUID, UUID) IS 'Sets a version as active and deactivates others';
COMMENT ON FUNCTION create_draft_from_version(UUID, UUID, TEXT) IS 'Creates a draft version from an existing version';
COMMENT ON FUNCTION commit_draft_as_active(UUID, UUID) IS 'Commits a draft as the new active version';
