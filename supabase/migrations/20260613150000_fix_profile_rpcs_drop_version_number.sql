-- Fix profile draft RPCs that still reference the removed user_profiles.version_number column.
--
-- Background:
--   user_profiles.version_number no longer exists; version numbers are derived
--   dynamically via get_profile_version_number()/calculate_version_number().
--   The commit_draft_as_active() and create_draft_from_version() functions were
--   never updated and still write to version_number, so they fail at runtime with:
--     ERROR: 42703 column "version_number" of relation "user_profiles" does not exist
--   This blocked committing a profile draft (and creating a draft via the
--   versions RPC). These definitions remove all version_number references.

-- ---------------------------------------------------------------------------
-- commit_draft_as_active: promote a draft to the active version
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.commit_draft_as_active(p_draft_profile_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  draft_exists BOOLEAN;
BEGIN
  -- Verify the draft exists and belongs to the user
  SELECT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = p_draft_profile_id AND user_id = p_user_id AND is_draft = true
  ) INTO draft_exists;

  IF NOT draft_exists THEN
    RAISE EXCEPTION 'Draft profile not found or access denied';
  END IF;

  -- Deactivate current active version (do this first so the single-active
  -- partial unique index is never violated mid-commit)
  UPDATE user_profiles
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true AND is_draft = false;

  -- Commit the draft as the new active version
  UPDATE user_profiles
  SET
    is_draft = false,
    is_active = true,
    updated_at = NOW()
  WHERE id = p_draft_profile_id AND user_id = p_user_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.commit_draft_as_active(p_draft_profile_id uuid, p_user_id uuid)
  IS 'Commits a draft as the new active version (version_number is derived dynamically, not stored).';

-- ---------------------------------------------------------------------------
-- create_draft_from_version: clone an existing version into a new draft
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_draft_from_version(p_source_profile_id uuid, p_user_id uuid, p_version_notes text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_profile_id UUID;
  sql_text TEXT;
BEGIN
  -- Only one draft per user is allowed; remove any existing draft first
  DELETE FROM user_profiles
  WHERE user_id = p_user_id AND is_draft = true;

  -- Build dynamic column list, excluding identity/versioning/calculated columns
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO sql_text
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name NOT IN ('id', 'completion_percentage', 'user_id', 'version_number', 'is_draft', 'is_active', 'version_notes', 'parent_version_id', 'created_at', 'updated_at');

  EXECUTE format('
    INSERT INTO user_profiles (
      user_id, is_draft, is_active, version_notes, parent_version_id,
      %s,
      created_at, updated_at
    )
    SELECT
      %L as user_id,
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
  ', sql_text, p_user_id, p_version_notes, p_source_profile_id, sql_text, p_source_profile_id, p_user_id) INTO new_profile_id;

  IF new_profile_id IS NULL THEN
    RAISE EXCEPTION 'Source profile not found or access denied';
  END IF;

  RETURN new_profile_id;
EXCEPTION
  WHEN undefined_column THEN
    -- Retry excluding completion_percentage as well (in case it was already dropped)
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO sql_text
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name NOT IN ('id', 'user_id', 'version_number', 'is_draft', 'is_active', 'version_notes', 'parent_version_id', 'created_at', 'updated_at');

    EXECUTE format('
      INSERT INTO user_profiles (
        user_id, is_draft, is_active, version_notes, parent_version_id,
        %s,
        created_at, updated_at
      )
      SELECT
        %L as user_id,
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
    ', sql_text, p_user_id, p_version_notes, p_source_profile_id, sql_text, p_source_profile_id, p_user_id) INTO new_profile_id;

    IF new_profile_id IS NULL THEN
      RAISE EXCEPTION 'Source profile not found or access denied';
    END IF;

    RETURN new_profile_id;
END;
$$;

COMMENT ON FUNCTION public.create_draft_from_version(p_source_profile_id uuid, p_user_id uuid, p_version_notes text)
  IS 'Creates a draft version from an existing version (version_number is derived dynamically, not stored).';
