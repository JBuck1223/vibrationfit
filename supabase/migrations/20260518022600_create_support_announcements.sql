-- Support Announcements table
-- Admin-authored posts visible to all members (how-tos, updates, known issues)

CREATE TABLE IF NOT EXISTS support_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'update',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_announcements_published ON support_announcements (published_at DESC NULLS LAST);
CREATE INDEX idx_support_announcements_category ON support_announcements (category);
CREATE INDEX idx_support_announcements_pinned ON support_announcements (is_pinned) WHERE is_pinned = true;

ALTER TABLE support_announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read published announcements
CREATE POLICY "Users can view published announcements"
  ON support_announcements FOR SELECT
  TO authenticated
  USING (published_at IS NOT NULL);

-- Admins can do everything (using the is_admin check pattern from your existing CRM policies)
CREATE POLICY "Admins can manage announcements"
  ON support_announcements FOR ALL
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

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_support_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_support_announcements_updated_at
  BEFORE UPDATE ON support_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_support_announcements_updated_at();
