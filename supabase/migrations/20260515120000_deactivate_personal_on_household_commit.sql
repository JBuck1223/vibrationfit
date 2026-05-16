-- Migration: Deactivate personal active vision when committing/activating household vision
-- Date: 2026-05-15
-- Description: When a household member commits or activates a household vision, also
--              deactivate their personal active visions so users only have one active
--              vision from their perspective.

-- ============================================================================
-- PART 1: Clean up existing cross-scope violations
-- ============================================================================

-- For users with both an active personal and active household vision, keep household active
WITH dual_active AS (
  SELECT
    personal.id AS personal_id
  FROM vision_versions personal
  INNER JOIN vision_versions household
    ON household.user_id = personal.user_id
    AND household.household_id IS NOT NULL
    AND household.is_active = true
    AND household.is_draft = false
  WHERE
    personal.household_id IS NULL
    AND personal.is_active = true
    AND personal.is_draft = false
)
UPDATE vision_versions
SET is_active = false, updated_at = NOW()
WHERE id IN (SELECT personal_id FROM dual_active);

-- ============================================================================
-- PART 2: Update set_vision_active to cross-deactivate personal visions
-- ============================================================================

CREATE OR REPLACE FUNCTION set_vision_active(
  p_vision_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_vision RECORD;
BEGIN
  SELECT id, user_id, household_id, is_draft
  INTO v_vision
  FROM vision_versions
  WHERE id = p_vision_id;

  IF v_vision.id IS NULL THEN
    RAISE EXCEPTION 'Vision not found: %', p_vision_id;
  END IF;

  IF v_vision.household_id IS NOT NULL THEN
    IF NOT is_active_household_member(v_vision.household_id, p_user_id) THEN
      RAISE EXCEPTION 'User % does not have access to household vision %', p_user_id, p_vision_id;
    END IF;
  ELSE
    IF v_vision.user_id != p_user_id THEN
      RAISE EXCEPTION 'User % does not own personal vision %', p_user_id, p_vision_id;
    END IF;
  END IF;

  IF v_vision.is_draft = true THEN
    RAISE EXCEPTION 'Cannot set draft vision as active. Commit it first.';
  END IF;

  IF v_vision.household_id IS NOT NULL THEN
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE
      household_id = v_vision.household_id
      AND is_active = true
      AND is_draft = false
      AND id != p_vision_id;

    -- Household activation supersedes personal active visions for this user
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE
      user_id = p_user_id
      AND household_id IS NULL
      AND is_active = true
      AND is_draft = false;
  ELSE
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE
      user_id = v_vision.user_id
      AND household_id IS NULL
      AND is_active = true
      AND is_draft = false
      AND id != p_vision_id;
  END IF;

  UPDATE vision_versions
  SET is_active = true, updated_at = NOW()
  WHERE id = p_vision_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION set_vision_active(UUID, UUID) IS
  'Sets a vision as active, deactivating others in the same scope. Household activation also deactivates the user''s personal active visions.';

-- ============================================================================
-- PART 3: Update commit_vision_draft_as_active with same cross-scope logic
-- ============================================================================

CREATE OR REPLACE FUNCTION commit_vision_draft_as_active(
  p_draft_vision_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_draft RECORD;
BEGIN
  SELECT id, user_id, household_id, is_draft
  INTO v_draft
  FROM vision_versions
  WHERE id = p_draft_vision_id AND is_draft = true;

  IF v_draft.id IS NULL THEN
    RAISE EXCEPTION 'Draft vision not found: %', p_draft_vision_id;
  END IF;

  IF v_draft.household_id IS NOT NULL THEN
    IF NOT is_active_household_member(v_draft.household_id, p_user_id) THEN
      RAISE EXCEPTION 'User % does not have access to household draft %', p_user_id, p_draft_vision_id;
    END IF;
  ELSE
    IF v_draft.user_id != p_user_id THEN
      RAISE EXCEPTION 'User % does not own draft vision %', p_user_id, p_draft_vision_id;
    END IF;
  END IF;

  IF v_draft.household_id IS NOT NULL THEN
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE
      household_id = v_draft.household_id
      AND is_active = true
      AND is_draft = false
      AND id != p_draft_vision_id;

    -- Household commit supersedes personal active visions for this user
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE
      user_id = p_user_id
      AND household_id IS NULL
      AND is_active = true
      AND is_draft = false;
  ELSE
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE
      user_id = v_draft.user_id
      AND household_id IS NULL
      AND is_active = true
      AND is_draft = false
      AND id != p_draft_vision_id;
  END IF;

  UPDATE vision_versions
  SET
    is_draft = false,
    is_active = true,
    updated_at = NOW()
  WHERE id = p_draft_vision_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION commit_vision_draft_as_active(UUID, UUID) IS
  'Commits a draft vision as active. Household commits also deactivate the user''s personal active visions.';
