-- Migration: Project Hub - item type + life-category tagging
-- Created: 2026-06-04
-- Description: Adds a `type` column to segregate rich Projects from simple Lists,
--   and a `life_categories` text[] column for multi-tagging items with the
--   canonical VibrationFit life/vision categories (health, money, family, etc.).
--   Tables keep their original `idea_*` names for backwards compatibility; all
--   user-facing terminology now uses "Project" / "List".

-- ============================================================================
-- 1. type: 'project' (rich) | 'list' (simple checklist)
-- ============================================================================
ALTER TABLE idea_projects
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'project'
    CHECK (type IN ('project', 'list'));

CREATE INDEX IF NOT EXISTS idx_idea_projects_type ON idea_projects(type);

-- ============================================================================
-- 2. life_categories: array of life-category keys (multi-tag)
--    Keys match src/lib/design-system/vision-categories.ts LIFE_CATEGORY_KEYS:
--    fun, health, travel, love, family, social, home, work, money, stuff,
--    giving, spirituality
-- ============================================================================
ALTER TABLE idea_projects
  ADD COLUMN IF NOT EXISTS life_categories TEXT[] NOT NULL DEFAULT '{}';

-- GIN index for fast "contains" filtering by life category
CREATE INDEX IF NOT EXISTS idx_idea_projects_life_categories
  ON idea_projects USING GIN (life_categories);

COMMENT ON COLUMN idea_projects.type IS 'project = rich item; list = simple checklist';
COMMENT ON COLUMN idea_projects.life_categories IS 'Array of VibrationFit life-category keys for cross-cutting tagging';
