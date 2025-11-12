-- =============================================================================
-- Migration: Drop deprecated columns from vision_versions and refinements
-- Purpose: Clean up technical debt, save 40-50% storage space
-- Date: 2025-11-11
-- Prerequisites: 004_migrate_v3_data.sql must be run first
-- WARNING: This is destructive! Create backups before running!
-- =============================================================================

-- =============================================================================
-- 1. Create backup tables (OPTIONAL but RECOMMENDED)
-- =============================================================================

CREATE TABLE IF NOT EXISTS vision_versions_backup_20251111 AS 
SELECT * FROM vision_versions;

CREATE TABLE IF NOT EXISTS refinements_backup_20251111 AS 
SELECT * FROM refinements;

COMMENT ON TABLE vision_versions_backup_20251111 IS 'Backup before dropping deprecated columns';
COMMENT ON TABLE refinements_backup_20251111 IS 'Backup before dropping deprecated columns';

-- =============================================================================
-- 2. Drop deprecated columns from vision_versions
-- =============================================================================

-- Drop vibe-assistant columns (3)
ALTER TABLE vision_versions
  DROP COLUMN IF EXISTS vibe_assistant_refinements_count,
  DROP COLUMN IF EXISTS last_vibe_assistant_refinement,
  DROP COLUMN IF EXISTS vibe_assistant_refinement_notes;

-- Drop old conversation system columns (3)
ALTER TABLE vision_versions
  DROP COLUMN IF EXISTS ai_generated,
  DROP COLUMN IF EXISTS conversation_count,
  DROP COLUMN IF EXISTS emotional_patterns,
  DROP COLUMN IF EXISTS cross_category_themes;

-- Drop associated indexes
DROP INDEX IF EXISTS idx_vision_versions_vibe_assistant_refinements;
DROP INDEX IF EXISTS idx_vision_versions_last_refinement;

-- Update table comment
COMMENT ON TABLE vision_versions IS 'V3 Life Vision versions - cleaned 2025-11-11 (removed 7 deprecated columns)';

-- =============================================================================
-- 3. Drop deprecated columns from refinements
-- =============================================================================

-- Drop token tracking columns (4) - V3 uses token_usage table instead
ALTER TABLE refinements
  DROP COLUMN IF EXISTS input_tokens,
  DROP COLUMN IF EXISTS output_tokens,
  DROP COLUMN IF EXISTS total_tokens,
  DROP COLUMN IF EXISTS cost_usd;

-- Drop vibe-assistant parameter columns (5)
ALTER TABLE refinements
  DROP COLUMN IF EXISTS refinement_percentage,
  DROP COLUMN IF EXISTS tonality,
  DROP COLUMN IF EXISTS word_count_target,
  DROP COLUMN IF EXISTS emotional_intensity,
  DROP COLUMN IF EXISTS instructions;

-- Drop operation result columns (3)
ALTER TABLE refinements
  DROP COLUMN IF EXISTS processing_time_ms,
  DROP COLUMN IF EXISTS success,
  DROP COLUMN IF EXISTS error_message;

-- Drop V3 columns (4) - now in life_vision_category_state
ALTER TABLE refinements
  DROP COLUMN IF EXISTS transcript,
  DROP COLUMN IF EXISTS ai_summary,
  DROP COLUMN IF EXISTS ideal_state,
  DROP COLUMN IF EXISTS blueprint_data;

-- Drop associated indexes
DROP INDEX IF EXISTS idx_refinements_viva_notes;
DROP INDEX IF EXISTS idx_refinements_blueprint_data;
DROP INDEX IF EXISTS idx_refinements_transcript;
DROP INDEX IF EXISTS idx_refinements_ai_summary;

-- Update table comment
COMMENT ON TABLE refinements IS 'LEGACY: Old vibe-assistant operations. V3 data moved to life_vision_category_state. Cleaned 2025-11-11 (removed 16 deprecated columns)';

-- =============================================================================
-- 4. Mark legacy tables for future evaluation
-- =============================================================================

COMMENT ON TABLE vision_conversations IS 'LEGACY: Old conversation-based vision gen. May be removable after audit.';

-- Note: ai_conversations and conversation_sessions are used by /viva, so keeping them

-- =============================================================================
-- 5. Display cleanup results
-- =============================================================================

DO $$
DECLARE
  vv_col_count INT;
  ref_col_count INT;
  vv_backup_count INT;
  ref_backup_count INT;
BEGIN
  -- Count remaining columns
  SELECT COUNT(*) INTO vv_col_count 
  FROM information_schema.columns 
  WHERE table_name = 'vision_versions' AND table_schema = 'public';
  
  SELECT COUNT(*) INTO ref_col_count 
  FROM information_schema.columns 
  WHERE table_name = 'refinements' AND table_schema = 'public';
  
  -- Count backup rows
  SELECT COUNT(*) INTO vv_backup_count FROM vision_versions_backup_20251111;
  SELECT COUNT(*) INTO ref_backup_count FROM refinements_backup_20251111;
  
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Cleanup Complete: Deprecated columns dropped';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'vision_versions: % columns remaining (was 39, dropped 7)', vv_col_count;
  RAISE NOTICE 'refinements: % columns remaining (was 25, dropped 16)', ref_col_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Backups created:';
  RAISE NOTICE '  vision_versions_backup_20251111: % rows', vv_backup_count;
  RAISE NOTICE '  refinements_backup_20251111: % rows', ref_backup_count;
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Space savings estimate: 40-50%% reduction in vision-related storage';
  RAISE NOTICE '=================================================================';
END $$;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =============================================================================

-- To rollback this migration, run:
--
-- 1. Restore from backups:
-- DROP TABLE vision_versions;
-- ALTER TABLE vision_versions_backup_20251111 RENAME TO vision_versions;
-- 
-- DROP TABLE refinements;
-- ALTER TABLE refinements_backup_20251111 RENAME TO refinements;
--
-- 2. Recreate indexes (see COMPLETE_SCHEMA_DUMP.sql for original definitions)
--
-- 3. Or use 006_cleanup_rollback.sql for automated rollback

