-- ============================================================================
-- Add is_active and is_draft fields to vision_versions table
-- ============================================================================
-- This migration adds versioning fields to vision_versions to match the
-- profile versioning system pattern. This allows for better version management
-- and ensures we can reliably identify active visions and drafts.

-- Add versioning fields
ALTER TABLE vision_versions
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vision_versions_is_draft ON vision_versions(user_id, is_draft);
CREATE INDEX IF NOT EXISTS idx_vision_versions_is_active ON vision_versions(user_id, is_active);

-- Migrate existing data based on status field
-- Set is_draft = true where status = 'draft'
UPDATE vision_versions
SET is_draft = true
WHERE status = 'draft' AND (is_draft IS NULL OR is_draft = false);

-- Set is_active = true for the most recent non-draft vision per user
-- This ensures at least one active vision per user if they have any visions
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM vision_versions LOOP
    -- Find the most recent non-draft vision for this user
    UPDATE vision_versions
    SET is_active = true,
        is_draft = false
    WHERE id = (
      SELECT id
      FROM vision_versions
      WHERE user_id = user_record.user_id
        AND (status != 'draft' OR status IS NULL)
        AND (is_active IS NULL OR is_active = false)
      ORDER BY created_at DESC
      LIMIT 1
    );
  END LOOP;
END $$;

-- If no active vision exists for a user, set the most recent vision as active
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM vision_versions LOOP
    -- Check if user has any active vision
    IF NOT EXISTS (
      SELECT 1 FROM vision_versions
      WHERE user_id = user_record.user_id
        AND is_active = true
    ) THEN
      -- Set the most recent vision as active
      UPDATE vision_versions
      SET is_active = true,
          is_draft = false
      WHERE id = (
        SELECT id
        FROM vision_versions
        WHERE user_id = user_record.user_id
        ORDER BY created_at DESC
        LIMIT 1
      );
    END IF;
  END LOOP;
END $$;

-- Set default values for any NULL values
UPDATE vision_versions
SET is_draft = COALESCE(is_draft, false),
    is_active = COALESCE(is_active, false)
WHERE is_draft IS NULL OR is_active IS NULL;

-- Add comments
COMMENT ON COLUMN vision_versions.is_draft IS 'True if this is a work-in-progress draft version';
COMMENT ON COLUMN vision_versions.is_active IS 'True if this is the current active version (only one per user)';

