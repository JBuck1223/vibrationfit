-- =============================================================================
-- Migration: Migrate V3 data from refinements to life_vision_category_state
-- Purpose: Move V3-specific data to clean table
-- Date: 2025-11-11
-- Prerequisites: 003_create_life_vision_category_state.sql must be run first
-- =============================================================================

-- =============================================================================
-- 1. Migrate V3 data from refinements table
-- =============================================================================

-- Insert V3 data into new clean table
-- Takes most recent entry per user/category with V3 data
INSERT INTO life_vision_category_state (
  user_id,
  category,
  transcript,
  ai_summary,
  ideal_state,
  blueprint_data,
  created_at,
  updated_at
)
SELECT DISTINCT ON (user_id, category)
  user_id,
  category,
  transcript,
  ai_summary,
  ideal_state,
  blueprint_data,
  created_at,
  created_at as updated_at
FROM refinements
WHERE 
  -- Only migrate rows that have V3 data
  (ai_summary IS NOT NULL 
   OR ideal_state IS NOT NULL 
   OR blueprint_data IS NOT NULL
   OR transcript IS NOT NULL)
  -- Exclude old vibe-assistant operations
  AND (operation_type IS NULL OR operation_type != 'refine_vision')
ORDER BY user_id, category, created_at DESC
ON CONFLICT (user_id, category) DO UPDATE SET
  transcript = COALESCE(EXCLUDED.transcript, life_vision_category_state.transcript),
  ai_summary = COALESCE(EXCLUDED.ai_summary, life_vision_category_state.ai_summary),
  ideal_state = COALESCE(EXCLUDED.ideal_state, life_vision_category_state.ideal_state),
  blueprint_data = COALESCE(EXCLUDED.blueprint_data, life_vision_category_state.blueprint_data),
  updated_at = NOW();

-- =============================================================================
-- 2. Add migration marker to refinements table
-- =============================================================================

-- Add column to track which rows were migrated
ALTER TABLE refinements 
  ADD COLUMN IF NOT EXISTS migrated_to_v3 BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN refinements.migrated_to_v3 IS 'TRUE if this row was migrated to life_vision_category_state';

-- Mark migrated rows
UPDATE refinements r
SET migrated_to_v3 = TRUE
WHERE EXISTS (
  SELECT 1 FROM life_vision_category_state lv
  WHERE lv.user_id = r.user_id 
    AND lv.category = r.category
);

-- =============================================================================
-- 3. Log migration results
-- =============================================================================

-- Display migration statistics
DO $$
DECLARE
  migrated_count INT;
  users_count INT;
  categories_count INT;
  marked_count INT;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM life_vision_category_state;
  SELECT COUNT(DISTINCT user_id) INTO users_count FROM life_vision_category_state;
  SELECT COUNT(DISTINCT category) INTO categories_count FROM life_vision_category_state;
  SELECT COUNT(*) INTO marked_count FROM refinements WHERE migrated_to_v3 = TRUE;
  
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Migration Complete: refinements → life_vision_category_state';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Migrated rows: %', migrated_count;
  RAISE NOTICE 'Affected users: %', users_count;
  RAISE NOTICE 'Categories migrated: %', categories_count;
  RAISE NOTICE 'Marked in refinements: %', marked_count;
  RAISE NOTICE '=================================================================';
END $$;

-- =============================================================================
-- 4. Verification queries
-- =============================================================================

-- Compare counts (should match for V3 data)
SELECT 
  'refinements (marked)' as source,
  COUNT(*) as rows,
  COUNT(DISTINCT user_id) as users,
  COUNT(DISTINCT category) as categories
FROM refinements
WHERE migrated_to_v3 = TRUE

UNION ALL

SELECT 
  'life_vision_category_state' as source,
  COUNT(*) as rows,
  COUNT(DISTINCT user_id) as users,
  COUNT(DISTINCT category) as categories
FROM life_vision_category_state;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =============================================================================

-- To rollback this migration, run:
--
-- DELETE FROM life_vision_category_state;
-- ALTER TABLE refinements DROP COLUMN IF EXISTS migrated_to_v3;
--
-- Note: This doesn't restore deleted data from refinements if columns were dropped.
-- Make sure to run 006_cleanup_rollback.sql if you dropped columns from refinements.

