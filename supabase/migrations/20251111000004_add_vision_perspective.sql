-- ============================================================================
-- Migration: Add Perspective Column to Vision Versions
-- Created: 2025-11-11
-- Purpose: Track whether vision was created with singular or plural perspective
-- ============================================================================

-- Add perspective column to vision_versions
ALTER TABLE vision_versions
ADD COLUMN IF NOT EXISTS perspective TEXT DEFAULT 'singular' CHECK (perspective IN ('singular', 'plural'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vision_versions_perspective ON vision_versions(perspective);

-- Add comment
COMMENT ON COLUMN vision_versions.perspective IS 'Whether the vision uses singular (I/my) or plural (we/our) perspective';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_vision_versions_perspective;
-- ALTER TABLE vision_versions DROP COLUMN IF EXISTS perspective;

