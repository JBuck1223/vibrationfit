-- Migration: Member-facing RLS for the project management system
-- Created: 2026-06-21
-- Description: The existing admin policies (renamed with their tables) still grant
--   admins/super_admins full access. This migration adds ownership policies so
--   members can manage their OWN projects (created_by = auth.uid()) and the child
--   rows beneath them, plus read access to the shared lookup tables.

-- ============================================================================
-- projects: owner can manage own
-- ============================================================================
CREATE POLICY "Members manage own projects"
  ON projects FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- Child tables: ownership derived from the parent project
-- ============================================================================
CREATE POLICY "Members manage own project_tasks"
  ON project_tasks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_tasks.project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_tasks.project_id AND p.created_by = auth.uid()));

CREATE POLICY "Members manage own project_comments"
  ON project_comments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_comments.project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_comments.project_id AND p.created_by = auth.uid()));

CREATE POLICY "Members manage own project_attachments"
  ON project_attachments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_attachments.project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_attachments.project_id AND p.created_by = auth.uid()));

CREATE POLICY "Members manage own project_custom_field_values"
  ON project_custom_field_values FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_custom_field_values.project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_custom_field_values.project_id AND p.created_by = auth.uid()));

CREATE POLICY "Members manage own project_tag_links"
  ON project_tag_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_tag_links.project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_tag_links.project_id AND p.created_by = auth.uid()));

CREATE POLICY "Members manage own project_links"
  ON project_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_links.source_project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_links.source_project_id AND p.created_by = auth.uid()));

-- ============================================================================
-- Shared lookup tables: any authenticated member can READ (writes stay admin-only)
-- ============================================================================
CREATE POLICY "Authenticated can read project_categories"
  ON project_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read project_tags"
  ON project_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read project_custom_field_defs"
  ON project_custom_field_defs FOR SELECT TO authenticated USING (true);
