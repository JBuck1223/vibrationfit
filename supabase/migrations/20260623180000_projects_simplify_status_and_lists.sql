-- Migration: Simplify Projects — Remove Lists + Collapse Status Pipeline
-- Created: 2026-06-23
-- Description:
--   1. Convert all list-type rows to project type
--   2. Collapse 6-stage status pipeline to 3 states (active/done/archived)
--   3. Add sort_order column for drag-and-drop reordering (replaces priority)

-- ============================================================================
-- 1. Convert lists → projects
-- ============================================================================
UPDATE projects SET type = 'project' WHERE type = 'list';

-- ============================================================================
-- 2. Collapse pipeline statuses into 'active'
-- ============================================================================
UPDATE projects SET status = 'active'
  WHERE status IN ('idea', 'planned', 'in_progress', 'review');

-- ============================================================================
-- 3. Replace status CHECK constraint (old 6-stage → new 3-state)
--    Original constraint auto-named idea_projects_status_check (inline def)
-- ============================================================================
ALTER TABLE projects DROP CONSTRAINT IF EXISTS idea_projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('active', 'done', 'archived'));

-- Also update the default from 'idea' to 'active'
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'active';

-- ============================================================================
-- 4. Add sort_order for drag-and-drop reordering
-- ============================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Seed sort_order from created_at (most recent = highest number within each user)
UPDATE projects SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY created_by ORDER BY created_at) AS rn
  FROM projects
) sub
WHERE projects.id = sub.id;
