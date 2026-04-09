-- Migration: Idea Hub - Admin Project Management System
-- Created: 2026-04-09
-- Description: Full project/idea management for the admin panel with categories,
--   tags, sub-tasks, comments, attachments, custom fields, and project linking.

-- ============================================================================
-- 1. idea_categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#39FF14',
  icon TEXT NOT NULL DEFAULT 'Lightbulb',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_idea_categories_updated_at
  BEFORE UPDATE ON idea_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE idea_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_categories"
  ON idea_categories FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_categories"
  ON idea_categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. idea_projects
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES idea_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'planned', 'in_progress', 'review', 'done', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_idea_projects_status ON idea_projects(status);
CREATE INDEX idx_idea_projects_category ON idea_projects(category_id);
CREATE INDEX idx_idea_projects_priority ON idea_projects(priority);
CREATE INDEX idx_idea_projects_created_by ON idea_projects(created_by);

CREATE TRIGGER set_idea_projects_updated_at
  BEFORE UPDATE ON idea_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE idea_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_projects"
  ON idea_projects FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_projects"
  ON idea_projects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. idea_tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#00FFFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE idea_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_tags"
  ON idea_tags FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_tags"
  ON idea_tags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. idea_project_tags (join table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_project_tags (
  project_id UUID NOT NULL REFERENCES idea_projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES idea_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE INDEX idx_idea_project_tags_tag ON idea_project_tags(tag_id);

ALTER TABLE idea_project_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_project_tags"
  ON idea_project_tags FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_project_tags"
  ON idea_project_tags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. idea_tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES idea_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_idea_tasks_project ON idea_tasks(project_id);

CREATE TRIGGER set_idea_tasks_updated_at
  BEFORE UPDATE ON idea_tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE idea_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_tasks"
  ON idea_tasks FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_tasks"
  ON idea_tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. idea_comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES idea_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'comment'
    CHECK (type IN ('comment', 'status_change', 'system')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_idea_comments_project ON idea_comments(project_id);

ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_comments"
  ON idea_comments FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_comments"
  ON idea_comments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 7. idea_attachments
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES idea_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_idea_attachments_project ON idea_attachments(project_id);

ALTER TABLE idea_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_attachments"
  ON idea_attachments FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_attachments"
  ON idea_attachments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 8. idea_custom_field_defs
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_custom_field_defs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text', 'number', 'date', 'select', 'url', 'boolean')),
  options JSONB,
  category_id UUID REFERENCES idea_categories(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE idea_custom_field_defs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_custom_field_defs"
  ON idea_custom_field_defs FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_custom_field_defs"
  ON idea_custom_field_defs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 9. idea_custom_field_values
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES idea_projects(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES idea_custom_field_defs(id) ON DELETE CASCADE,
  value TEXT,
  UNIQUE (project_id, field_id)
);

CREATE INDEX idx_idea_custom_field_values_project ON idea_custom_field_values(project_id);

ALTER TABLE idea_custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_custom_field_values"
  ON idea_custom_field_values FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_custom_field_values"
  ON idea_custom_field_values FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 10. idea_project_links
-- ============================================================================
CREATE TABLE IF NOT EXISTS idea_project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id UUID NOT NULL REFERENCES idea_projects(id) ON DELETE CASCADE,
  target_project_id UUID NOT NULL REFERENCES idea_projects(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'related'
    CHECK (link_type IN ('related', 'blocks', 'blocked_by', 'parent', 'child')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_project_id, target_project_id),
  CHECK (source_project_id != target_project_id)
);

CREATE INDEX idx_idea_project_links_source ON idea_project_links(source_project_id);
CREATE INDEX idx_idea_project_links_target ON idea_project_links(target_project_id);

ALTER TABLE idea_project_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage idea_project_links"
  ON idea_project_links FOR ALL
  TO authenticated
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

CREATE POLICY "Service role full access on idea_project_links"
  ON idea_project_links FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Seed default categories
-- ============================================================================
INSERT INTO idea_categories (name, color, icon, sort_order)
VALUES
  ('Feature', '#39FF14', 'Cpu', 0),
  ('Course', '#00FFFF', 'GraduationCap', 1),
  ('Social Media', '#BF00FF', 'Share2', 2),
  ('Marketing', '#FFFF00', 'Megaphone', 3)
ON CONFLICT DO NOTHING;
