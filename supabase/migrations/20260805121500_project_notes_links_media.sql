-- Migration: Project notes, reference links, and note/task-scoped media
-- Created: 2026-08-05
-- Description: Adds dated notes (project- or task-scoped), external reference
--   links (bookmarks, distinct from the inter-project project_links table),
--   and extends project_attachments so media can attach to a task or ride
--   along with a note. RLS mirrors the existing projects pattern:
--   admin ALL + service_role ALL + owner (via parent project) + household
--   collaborators (can_collaborate_on_project).

-- ============================================================================
-- 1. project_notes
-- ============================================================================
CREATE TABLE project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  -- User-editable date the note is about (can be backdated); created_at
  -- remains the automatic record timestamp.
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_notes_project ON project_notes(project_id);
CREATE INDEX idx_project_notes_task ON project_notes(task_id) WHERE task_id IS NOT NULL;

CREATE TRIGGER set_project_notes_updated_at
  BEFORE UPDATE ON project_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage project_notes"
  ON project_notes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access on project_notes"
  ON project_notes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Members manage own project_notes"
  ON project_notes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_notes.project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_notes.project_id AND p.created_by = auth.uid()));

CREATE POLICY "household_can_manage_project_notes"
  ON project_notes FOR ALL TO authenticated
  USING (public.can_collaborate_on_project(project_id, auth.uid()))
  WITH CHECK (public.can_collaborate_on_project(project_id, auth.uid()));

-- ============================================================================
-- 2. project_reference_links (external URL bookmarks; project_links is the
--    existing inter-project relationship table)
-- ============================================================================
CREATE TABLE project_reference_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_reference_links_project ON project_reference_links(project_id);
CREATE INDEX idx_project_reference_links_task ON project_reference_links(task_id) WHERE task_id IS NOT NULL;

ALTER TABLE project_reference_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage project_reference_links"
  ON project_reference_links FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access on project_reference_links"
  ON project_reference_links FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Members manage own project_reference_links"
  ON project_reference_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_reference_links.project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_reference_links.project_id AND p.created_by = auth.uid()));

CREATE POLICY "household_can_manage_project_reference_links"
  ON project_reference_links FOR ALL TO authenticated
  USING (public.can_collaborate_on_project(project_id, auth.uid()))
  WITH CHECK (public.can_collaborate_on_project(project_id, auth.uid()));

-- ============================================================================
-- 3. project_attachments: optional task and note scoping
--    (project_id stays required, so existing RLS policies keep covering
--    every row; deleting a note or task cascades its media rows)
-- ============================================================================
ALTER TABLE project_attachments
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES project_notes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_project_attachments_task
  ON project_attachments(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_attachments_note
  ON project_attachments(note_id) WHERE note_id IS NOT NULL;

COMMENT ON COLUMN project_attachments.task_id IS
  'NULL = project-level. Set = attached to a specific task.';
COMMENT ON COLUMN project_attachments.note_id IS
  'NULL = direct upload. Set = uploaded as part of a note; deleted with the note.';
