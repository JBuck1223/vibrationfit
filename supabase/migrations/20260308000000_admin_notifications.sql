-- Admin Notifications table
-- Database-driven notification center for the admin dashboard

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_admin_notifications_unread ON admin_notifications (is_read, created_at DESC)
  WHERE is_read = false;
CREATE INDEX idx_admin_notifications_type ON admin_notifications (type, created_at DESC);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read admin_notifications"
  ON admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.is_super_admin = true
    )
  );

CREATE POLICY "Admin update admin_notifications"
  ON admin_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.is_super_admin = true
    )
  );

-- Service role can insert (from API routes / webhooks)
CREATE POLICY "Service role insert admin_notifications"
  ON admin_notifications FOR INSERT
  WITH CHECK (true);

-- Enable Realtime for live bell updates
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
