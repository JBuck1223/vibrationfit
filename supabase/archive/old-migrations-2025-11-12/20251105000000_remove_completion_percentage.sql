-- ============================================================================
-- Remove completion_percentage Column
-- ============================================================================
-- This migration removes the completion_percentage column from user_profiles
-- since it's always calculated on-the-fly and doesn't need to be stored.

-- First, update create_draft_from_version function to not reference completion_percentage
-- This must be done BEFORE dropping the column
-- We'll use INSERT ... SELECT with dynamic column handling
CREATE OR REPLACE FUNCTION create_draft_from_version(
  p_source_profile_id UUID,
  p_user_id UUID,
  p_version_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_profile_id UUID;
  next_version INTEGER;
  sql_text TEXT;
BEGIN
  -- Get next version number
  next_version := get_next_version_number(p_user_id);
  
  -- Delete any existing draft for this user
  DELETE FROM user_profiles 
  WHERE user_id = p_user_id AND is_draft = true;
  
  -- Build dynamic INSERT statement that excludes completion_percentage
  -- Get all column names except completion_percentage and versioning fields
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO sql_text
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name NOT IN ('id', 'completion_percentage', 'user_id', 'version_number', 'is_draft', 'is_active', 'version_notes', 'parent_version_id', 'created_at', 'updated_at');
  
  -- Execute dynamic INSERT
  EXECUTE format('
    INSERT INTO user_profiles (
      user_id, version_number, is_draft, is_active, version_notes, parent_version_id,
      %s,
      created_at, updated_at
    )
    SELECT 
      %L as user_id,
      %s as version_number,
      true as is_draft,
      false as is_active,
      %L as version_notes,
      %L as parent_version_id,
      %s,
      NOW() as created_at,
      NOW() as updated_at
    FROM user_profiles
    WHERE id = %L AND user_id = %L
    RETURNING id
  ', sql_text, p_user_id, next_version, p_version_notes, p_source_profile_id, sql_text, p_source_profile_id, p_user_id) INTO new_profile_id;
  
  IF new_profile_id IS NULL THEN
    RAISE EXCEPTION 'Source profile not found or access denied';
  END IF;
  
  RETURN new_profile_id;
EXCEPTION
  WHEN undefined_column THEN
    -- If completion_percentage doesn't exist (already dropped), exclude it from the column list
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO sql_text
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name NOT IN ('id', 'user_id', 'version_number', 'is_draft', 'is_active', 'version_notes', 'parent_version_id', 'created_at', 'updated_at');
    
    EXECUTE format('
      INSERT INTO user_profiles (
        user_id, version_number, is_draft, is_active, version_notes, parent_version_id,
        %s,
        created_at, updated_at
      )
      SELECT 
        %L as user_id,
        %s as version_number,
        true as is_draft,
        false as is_active,
        %L as version_notes,
        %L as parent_version_id,
        %s,
        NOW() as created_at,
        NOW() as updated_at
      FROM user_profiles
      WHERE id = %L AND user_id = %L
      RETURNING id
    ', sql_text, p_user_id, next_version, p_version_notes, p_source_profile_id, sql_text, p_source_profile_id, p_user_id) INTO new_profile_id;
    
    IF new_profile_id IS NULL THEN
      RAISE EXCEPTION 'Source profile not found or access denied';
    END IF;
    
    RETURN new_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update commit_draft_as_active function to not use SELECT *
CREATE OR REPLACE FUNCTION commit_draft_as_active(p_draft_profile_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  draft_exists BOOLEAN;
  next_version INTEGER;
BEGIN
  -- Verify the draft exists (don't need full SELECT * - just check existence)
  SELECT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = p_draft_profile_id AND user_id = p_user_id AND is_draft = true
  ) INTO draft_exists;
  
  IF NOT draft_exists THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now drop the column
ALTER TABLE user_profiles DROP COLUMN IF EXISTS completion_percentage;

-- Remove comment if it exists (using DO block to avoid error if comment doesn't exist)
DO $$ 
BEGIN
  COMMENT ON COLUMN user_profiles.completion_percentage IS NULL;
EXCEPTION
  WHEN undefined_column THEN
    NULL; -- Column doesn't exist, which is fine
END $$;
