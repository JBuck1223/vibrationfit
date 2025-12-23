-- Migration: Enforce single active/draft vision per user/household
-- Date: 2025-12-23
-- Description: Add constraints and functions to ensure:
--              - Only 1 is_active=true vision per user (personal) or household_id (household)
--              - Only 1 is_draft=true vision per user (personal) or household_id (household)

-- ============================================================================
-- PART 1: Clean up any existing violations (if any)
-- ============================================================================

-- For personal visions: ensure only the most recent is_active=true per user
WITH ranked_personal AS (
  SELECT 
    id,
    user_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY created_at DESC
    ) as rn
  FROM vision_versions
  WHERE 
    is_active = true 
    AND household_id IS NULL
    AND is_draft = false
)
UPDATE vision_versions
SET is_active = false, updated_at = NOW()
WHERE id IN (
  SELECT id FROM ranked_personal WHERE rn > 1
);

-- For household visions: ensure only the most recent is_active=true per household
WITH ranked_household AS (
  SELECT 
    id,
    household_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY household_id 
      ORDER BY created_at DESC
    ) as rn
  FROM vision_versions
  WHERE 
    is_active = true 
    AND household_id IS NOT NULL
    AND is_draft = false
)
UPDATE vision_versions
SET is_active = false, updated_at = NOW()
WHERE id IN (
  SELECT id FROM ranked_household WHERE rn > 1
);

-- ============================================================================
-- PART 2: Clean up any existing draft violations (if any)
-- ============================================================================

-- For personal drafts: ensure only the most recent is_draft=true per user
WITH ranked_personal_drafts AS (
  SELECT 
    id,
    user_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY created_at DESC
    ) as rn
  FROM vision_versions
  WHERE 
    is_draft = true 
    AND household_id IS NULL
)
UPDATE vision_versions
SET is_draft = false, updated_at = NOW()
WHERE id IN (
  SELECT id FROM ranked_personal_drafts WHERE rn > 1
);

-- For household drafts: ensure only the most recent is_draft=true per household
WITH ranked_household_drafts AS (
  SELECT 
    id,
    household_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY household_id 
      ORDER BY created_at DESC
    ) as rn
  FROM vision_versions
  WHERE 
    is_draft = true 
    AND household_id IS NOT NULL
)
UPDATE vision_versions
SET is_draft = false, updated_at = NOW()
WHERE id IN (
  SELECT id FROM ranked_household_drafts WHERE rn > 1
);

-- ============================================================================
-- PART 3: Add unique partial indexes to enforce constraints
-- ============================================================================

-- Unique index: Only one active personal vision per user
-- (where household_id IS NULL and is_draft = false)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vision_versions_one_active_per_user
ON vision_versions (user_id)
WHERE is_active = true AND household_id IS NULL AND is_draft = false;

-- Unique index: Only one active household vision per household
-- (where household_id IS NOT NULL and is_draft = false)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vision_versions_one_active_per_household
ON vision_versions (household_id)
WHERE is_active = true AND household_id IS NOT NULL AND is_draft = false;

-- Unique index: Only one draft personal vision per user
-- (where household_id IS NULL and is_draft = true)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vision_versions_one_draft_per_user
ON vision_versions (user_id)
WHERE is_draft = true AND household_id IS NULL;

-- Unique index: Only one draft household vision per household
-- (where household_id IS NOT NULL and is_draft = true)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vision_versions_one_draft_per_household
ON vision_versions (household_id)
WHERE is_draft = true AND household_id IS NOT NULL;

-- ============================================================================
-- PART 4: Create helper function to set vision as active
-- ============================================================================

-- Function to set a vision as active (deactivating others in same scope)
CREATE OR REPLACE FUNCTION set_vision_active(
  p_vision_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_vision RECORD;
  v_household_id UUID;
BEGIN
  -- Get the vision to activate
  SELECT id, user_id, household_id, is_draft
  INTO v_vision
  FROM vision_versions
  WHERE id = p_vision_id;
  
  -- Verify vision exists
  IF v_vision.id IS NULL THEN
    RAISE EXCEPTION 'Vision not found: %', p_vision_id;
  END IF;
  
  -- Verify user has access (either owner or household member)
  IF v_vision.household_id IS NOT NULL THEN
    -- For household visions, check membership
    IF NOT is_active_household_member(v_vision.household_id, p_user_id) THEN
      RAISE EXCEPTION 'User % does not have access to household vision %', p_user_id, p_vision_id;
    END IF;
  ELSE
    -- For personal visions, check ownership
    IF v_vision.user_id != p_user_id THEN
      RAISE EXCEPTION 'User % does not own personal vision %', p_user_id, p_vision_id;
    END IF;
  END IF;
  
  -- Cannot set a draft as active
  IF v_vision.is_draft = true THEN
    RAISE EXCEPTION 'Cannot set draft vision as active. Commit it first.';
  END IF;
  
  -- Deactivate other visions in the same scope
  IF v_vision.household_id IS NOT NULL THEN
    -- Deactivate other household visions
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE 
      household_id = v_vision.household_id
      AND is_active = true
      AND is_draft = false
      AND id != p_vision_id;
  ELSE
    -- Deactivate other personal visions for this user
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE 
      user_id = v_vision.user_id
      AND household_id IS NULL
      AND is_active = true
      AND is_draft = false
      AND id != p_vision_id;
  END IF;
  
  -- Activate the target vision
  UPDATE vision_versions
  SET is_active = true, updated_at = NOW()
  WHERE id = p_vision_id;
  
  RETURN true;
END;
$$;

-- Add comment
COMMENT ON FUNCTION set_vision_active(UUID, UUID) IS 
  'Sets a vision as active, automatically deactivating others in the same scope (personal or household)';

-- ============================================================================
-- PART 5: Create function to commit draft vision as active
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
  -- Get the draft vision
  SELECT id, user_id, household_id, is_draft
  INTO v_draft
  FROM vision_versions
  WHERE id = p_draft_vision_id AND is_draft = true;
  
  -- Verify draft exists
  IF v_draft.id IS NULL THEN
    RAISE EXCEPTION 'Draft vision not found: %', p_draft_vision_id;
  END IF;
  
  -- Verify user has access
  IF v_draft.household_id IS NOT NULL THEN
    -- For household visions, check membership
    IF NOT is_active_household_member(v_draft.household_id, p_user_id) THEN
      RAISE EXCEPTION 'User % does not have access to household draft %', p_user_id, p_draft_vision_id;
    END IF;
  ELSE
    -- For personal visions, check ownership
    IF v_draft.user_id != p_user_id THEN
      RAISE EXCEPTION 'User % does not own draft vision %', p_user_id, p_draft_vision_id;
    END IF;
  END IF;
  
  -- Deactivate other active visions in the same scope
  IF v_draft.household_id IS NOT NULL THEN
    -- Deactivate other household visions
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE 
      household_id = v_draft.household_id
      AND is_active = true
      AND is_draft = false
      AND id != p_draft_vision_id;
  ELSE
    -- Deactivate other personal visions
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE 
      user_id = v_draft.user_id
      AND household_id IS NULL
      AND is_active = true
      AND is_draft = false
      AND id != p_draft_vision_id;
  END IF;
  
  -- Convert draft to active version (update in place)
  UPDATE vision_versions
  SET 
    is_draft = false,
    is_active = true,
    updated_at = NOW()
  WHERE id = p_draft_vision_id;
  
  RETURN true;
END;
$$;

-- Add comment
COMMENT ON FUNCTION commit_vision_draft_as_active(UUID, UUID) IS 
  'Commits a draft vision as the new active version, deactivating others in the same scope (personal or household)';

-- ============================================================================
-- PART 6: Update schema comments
-- ============================================================================

COMMENT ON COLUMN vision_versions.is_active IS 
  'True if this is the current active version. Only one active per user (personal) or per household (household visions). Enforced by unique partial indexes.';

COMMENT ON COLUMN vision_versions.is_draft IS 
  'True if this is a work-in-progress draft version. Only one draft per user (personal) or per household (household visions). Enforced by unique partial indexes.';

COMMENT ON COLUMN vision_versions.household_id IS 
  'If set, this is a household vision shared among household members. If NULL, this is a personal vision.';

