-- ============================================================================
-- Calculate Version Number by Date (Chronological Order)
-- ============================================================================
-- This migration adds a function to calculate version numbers based on
-- chronological order (created_at) instead of stored version_number.
-- This ensures version numbers are always sequential (1, 2, 3...) without gaps
-- even when versions are deleted.

-- Function to calculate version number based on chronological order
CREATE OR REPLACE FUNCTION calculate_version_number(p_profile_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  profile_created_at TIMESTAMP WITH TIME ZONE;
  version_num INTEGER;
BEGIN
  -- Get the created_at timestamp for this profile
  SELECT created_at INTO profile_created_at
  FROM user_profiles
  WHERE id = p_profile_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Count how many profiles were created before or at the same time as this one
  -- Order: oldest first = version 1, newest = highest version
  -- This ensures sequential numbering even after deletions
  SELECT COUNT(*) INTO version_num
  FROM user_profiles
  WHERE user_id = p_user_id
    AND created_at <= profile_created_at
    AND id != p_profile_id; -- Don't count self (will add 1 below)
  
  -- Add 1 because we want 1-based indexing
  RETURN version_num + 1;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get version number for a profile (for use in queries)
CREATE OR REPLACE FUNCTION get_profile_version_number(p_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  profile_user_id UUID;
  version_num INTEGER;
BEGIN
  -- Get the user_id for this profile
  SELECT user_id INTO profile_user_id
  FROM user_profiles
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate version number
  SELECT calculate_version_number(p_profile_id, profile_user_id) INTO version_num;
  
  RETURN version_num;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION calculate_version_number(UUID, UUID) IS 'Calculates version number based on chronological order (created_at) for a user. Returns sequential numbers (1, 2, 3...) without gaps even after deletions.';
COMMENT ON FUNCTION get_profile_version_number(UUID) IS 'Gets the calculated version number for a profile based on chronological order.';

