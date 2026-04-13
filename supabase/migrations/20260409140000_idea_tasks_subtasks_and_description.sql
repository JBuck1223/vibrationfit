-- Migration: Idea Hub - Add subtasks and task descriptions
-- Created: 2026-04-09
-- Description: Adds parent_task_id for one-level subtask nesting and description
--   field for detailed task instructions/acceptance criteria.

ALTER TABLE idea_tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES idea_tasks(id) ON DELETE CASCADE;
ALTER TABLE idea_tasks ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_idea_tasks_parent ON idea_tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Enforce one-level nesting: a subtask's parent cannot itself have a parent
CREATE OR REPLACE FUNCTION check_subtask_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_task_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM idea_tasks WHERE id = NEW.parent_task_id AND parent_task_id IS NOT NULL) THEN
      RAISE EXCEPTION 'Subtasks cannot be nested more than one level deep';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_subtask_depth
  BEFORE INSERT OR UPDATE ON idea_tasks
  FOR EACH ROW EXECUTE FUNCTION check_subtask_depth();
