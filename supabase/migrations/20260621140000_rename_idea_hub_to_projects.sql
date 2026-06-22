-- Migration: Rebase Idea Hub -> real Project Management system
-- Created: 2026-06-21
-- Description: Renames all idea_* tables to project_* (data/FK/index preserving).
--   The UI already lives at /admin/projects; this aligns the underlying tables
--   with a real project management system and prepares for member-facing usage.

-- ============================================================================
-- 1. Rename tables
-- ============================================================================
ALTER TABLE idea_categories          RENAME TO project_categories;
ALTER TABLE idea_projects            RENAME TO projects;
ALTER TABLE idea_tags                RENAME TO project_tags;
ALTER TABLE idea_project_tags        RENAME TO project_tag_links;
ALTER TABLE idea_tasks               RENAME TO project_tasks;
ALTER TABLE idea_comments            RENAME TO project_comments;
ALTER TABLE idea_attachments         RENAME TO project_attachments;
ALTER TABLE idea_custom_field_defs   RENAME TO project_custom_field_defs;
ALTER TABLE idea_custom_field_values RENAME TO project_custom_field_values;
ALTER TABLE idea_project_links       RENAME TO project_links;

-- ============================================================================
-- 2. Rename indexes (cosmetic; data preserved either way)
-- ============================================================================
ALTER INDEX IF EXISTS idx_idea_projects_status              RENAME TO idx_projects_status;
ALTER INDEX IF EXISTS idx_idea_projects_category            RENAME TO idx_projects_category;
ALTER INDEX IF EXISTS idx_idea_projects_priority            RENAME TO idx_projects_priority;
ALTER INDEX IF EXISTS idx_idea_projects_created_by          RENAME TO idx_projects_created_by;
ALTER INDEX IF EXISTS idx_idea_projects_type                RENAME TO idx_projects_type;
ALTER INDEX IF EXISTS idx_idea_projects_life_categories     RENAME TO idx_projects_life_categories;
ALTER INDEX IF EXISTS idx_idea_project_tags_tag             RENAME TO idx_project_tag_links_tag;
ALTER INDEX IF EXISTS idx_idea_tasks_project                RENAME TO idx_project_tasks_project;
ALTER INDEX IF EXISTS idx_idea_tasks_parent                 RENAME TO idx_project_tasks_parent;
ALTER INDEX IF EXISTS idx_idea_comments_project             RENAME TO idx_project_comments_project;
ALTER INDEX IF EXISTS idx_idea_attachments_project          RENAME TO idx_project_attachments_project;
ALTER INDEX IF EXISTS idx_idea_custom_field_values_project  RENAME TO idx_project_custom_field_values_project;
ALTER INDEX IF EXISTS idx_idea_project_links_source         RENAME TO idx_project_links_source;
ALTER INDEX IF EXISTS idx_idea_project_links_target         RENAME TO idx_project_links_target;

-- ============================================================================
-- 3. Recreate subtask-depth function to reference the renamed table
--    (function body resolves table names at execution time)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_subtask_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_task_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM project_tasks WHERE id = NEW.parent_task_id AND parent_task_id IS NOT NULL) THEN
      RAISE EXCEPTION 'Subtasks cannot be nested more than one level deep';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Rename updated_at triggers (cosmetic)
-- ============================================================================
ALTER TRIGGER set_idea_categories_updated_at ON project_categories RENAME TO set_project_categories_updated_at;
ALTER TRIGGER set_idea_projects_updated_at   ON projects           RENAME TO set_projects_updated_at;
ALTER TRIGGER set_idea_tasks_updated_at      ON project_tasks      RENAME TO set_project_tasks_updated_at;
