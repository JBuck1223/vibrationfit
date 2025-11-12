-- =============================================================================
-- ROLLBACK Migration: Restore from backups if needed
-- Purpose: Emergency rollback for 003-005 migrations
-- Date: 2025-11-11
-- WARNING: Only use this if you need to undo the cleanup!
-- =============================================================================

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================
-- This file provides rollback procedures if migrations 003-005 need to be undone.
-- Run these commands in order if you need to restore the old schema.
--
-- Before running, make sure the backup tables exist:
-- - vision_versions_backup_20251111
-- - refinements_backup_20251111

-- =============================================================================
-- 1. Rollback: Restore vision_versions from backup
-- =============================================================================

-- Drop current table
DROP TABLE IF EXISTS vision_versions CASCADE;

-- Restore from backup
ALTER TABLE vision_versions_backup_20251111 RENAME TO vision_versions;

-- Recreate indexes (simplified - adjust as needed)
CREATE INDEX IF NOT EXISTS idx_vision_versions_vibe_assistant_refinements 
  ON vision_versions(vibe_assistant_refinements_count);
  
CREATE INDEX IF NOT EXISTS idx_vision_versions_last_refinement 
  ON vision_versions(last_vibe_assistant_refinement);

-- =============================================================================
-- 2. Rollback: Restore refinements from backup
-- =============================================================================

-- Drop current table
DROP TABLE IF EXISTS refinements CASCADE;

-- Restore from backup
ALTER TABLE refinements_backup_20251111 RENAME TO refinements;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_refinements_user_id ON refinements(user_id);
CREATE INDEX IF NOT EXISTS idx_refinements_vision_id ON refinements(vision_id);
CREATE INDEX IF NOT EXISTS idx_refinements_created_at ON refinements(created_at);
CREATE INDEX IF NOT EXISTS idx_refinements_operation_type ON refinements(operation_type);
CREATE INDEX IF NOT EXISTS idx_refinements_category ON refinements(category);
CREATE INDEX IF NOT EXISTS idx_refinements_viva_notes ON refinements USING GIN (to_tsvector('english', viva_notes));
CREATE INDEX IF NOT EXISTS idx_refinements_blueprint_data ON refinements USING GIN (blueprint_data);
CREATE INDEX IF NOT EXISTS idx_refinements_transcript ON refinements USING GIN (to_tsvector('english', transcript));
CREATE INDEX IF NOT EXISTS idx_refinements_ai_summary ON refinements USING GIN (to_tsvector('english', ai_summary));

-- =============================================================================
-- 3. Rollback: Remove life_vision_category_state (optional)
-- =============================================================================

-- Only run this if you want to completely undo the new table
-- DROP TABLE IF EXISTS life_vision_category_state CASCADE;

-- =============================================================================
-- 4. Verification
-- =============================================================================

-- Verify restoration
SELECT 
  'vision_versions' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'vision_versions' AND table_schema = 'public'

UNION ALL

SELECT 
  'refinements' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'refinements' AND table_schema = 'public';

-- Should show:
-- vision_versions: 39 columns (if restored)
-- refinements: 25 columns (if restored)

-- =============================================================================
-- NOTES
-- =============================================================================

-- After rollback, you'll need to:
-- 1. Restore API endpoints from git history:
--    git checkout HEAD~N src/app/api/vibe-assistant/
--    git checkout HEAD~N src/app/api/vision/generate/
--    git checkout HEAD~N src/app/api/vision/chat/
--    git checkout HEAD~N src/app/api/vision/conversation/
--
-- 2. Restore frontend pages from git history:
--    git checkout HEAD~N src/app/dashboard/vibe-assistant-usage/
--    git checkout HEAD~N src/app/life-vision/[id]/refine/
--
-- 3. Update V3 code to use 'refinements' table again instead of 'life_vision_category_state'

