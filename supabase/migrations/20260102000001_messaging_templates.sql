-- ============================================================================
-- Messaging Templates Feature
-- Migration: 20260102000001_messaging_templates.sql
-- Description: Database-driven email and SMS templates with scheduling support
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Template status
CREATE TYPE template_status AS ENUM (
  'active',       -- Ready to use
  'draft',        -- Work in progress
  'archived'      -- No longer in use
);

-- Template category
CREATE TYPE template_category AS ENUM (
  'onboarding',
  'sessions',
  'billing',
  'support',
  'marketing',
  'reminders',
  'notifications',
  'household',
  'intensive',
  'other'
);

-- Scheduled message status
CREATE TYPE scheduled_message_status AS ENUM (
  'pending',      -- Waiting to be sent
  'sent',         -- Successfully sent
  'failed',       -- Failed to send
  'cancelled'     -- Cancelled before sending
);

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  slug TEXT UNIQUE NOT NULL,           -- e.g., 'session-invitation'
  name TEXT NOT NULL,                   -- Human-readable name
  description TEXT,                     -- What this template is for
  
  -- Categorization
  category template_category NOT NULL DEFAULT 'other',
  status template_status NOT NULL DEFAULT 'draft',
  
  -- Template content
  subject TEXT NOT NULL,                -- Email subject (supports variables)
  html_body TEXT NOT NULL,              -- HTML email body
  text_body TEXT,                       -- Plain text fallback
  
  -- Variables/triggers documentation
  variables JSONB DEFAULT '[]'::jsonb,  -- Array of variable names
  triggers JSONB DEFAULT '[]'::jsonb,   -- Array of trigger descriptions
  
  -- Usage tracking
  last_sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SMS TEMPLATES TABLE
-- ============================================================================

CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  slug TEXT UNIQUE NOT NULL,           -- e.g., 'session-reminder'
  name TEXT NOT NULL,                   -- Human-readable name
  description TEXT,                     -- What this template is for
  
  -- Categorization
  category template_category NOT NULL DEFAULT 'other',
  status template_status NOT NULL DEFAULT 'draft',
  
  -- Template content
  body TEXT NOT NULL,                   -- SMS body (supports variables, max ~160 chars recommended)
  
  -- Variables/triggers documentation
  variables JSONB DEFAULT '[]'::jsonb,  -- Array of variable names
  triggers JSONB DEFAULT '[]'::jsonb,   -- Array of trigger descriptions
  
  -- Usage tracking
  last_sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SCHEDULED MESSAGES TABLE (for reminders, delayed sends)
-- ============================================================================

CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message type
  message_type TEXT NOT NULL CHECK (message_type IN ('email', 'sms')),
  
  -- Template reference (optional - for tracking)
  email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  sms_template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,
  
  -- Recipient info
  recipient_email TEXT,                 -- For emails
  recipient_phone TEXT,                 -- For SMS
  recipient_name TEXT,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Related entity (for context)
  related_entity_type TEXT,             -- e.g., 'video_session'
  related_entity_id UUID,               -- e.g., session ID
  
  -- Message content (rendered at schedule time)
  subject TEXT,                         -- For emails
  body TEXT NOT NULL,                   -- Email HTML or SMS text
  text_body TEXT,                       -- Email plain text fallback
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,   -- When to send
  status scheduled_message_status NOT NULL DEFAULT 'pending',
  
  -- Execution tracking
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MESSAGE SEND LOG (for tracking all sent messages)
-- ============================================================================

CREATE TABLE message_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message type
  message_type TEXT NOT NULL CHECK (message_type IN ('email', 'sms')),
  
  -- Template reference
  template_slug TEXT,
  template_id UUID,
  
  -- Recipient
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_name TEXT,
  recipient_user_id UUID,
  
  -- Related entity
  related_entity_type TEXT,
  related_entity_id UUID,
  
  -- Content (for audit)
  subject TEXT,
  
  -- Result
  status TEXT NOT NULL,                 -- 'sent', 'failed', 'bounced', etc.
  external_message_id TEXT,             -- SES Message ID, Twilio SID, etc.
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Email templates
CREATE INDEX idx_email_templates_slug ON email_templates(slug);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_status ON email_templates(status);

-- SMS templates
CREATE INDEX idx_sms_templates_slug ON sms_templates(slug);
CREATE INDEX idx_sms_templates_category ON sms_templates(category);
CREATE INDEX idx_sms_templates_status ON sms_templates(status);

-- Scheduled messages
CREATE INDEX idx_scheduled_messages_status ON scheduled_messages(status);
CREATE INDEX idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for);
CREATE INDEX idx_scheduled_messages_entity ON scheduled_messages(related_entity_type, related_entity_id);

-- Send log
CREATE INDEX idx_message_send_log_type ON message_send_log(message_type);
CREATE INDEX idx_message_send_log_template ON message_send_log(template_slug);
CREATE INDEX idx_message_send_log_recipient ON message_send_log(recipient_user_id);
CREATE INDEX idx_message_send_log_entity ON message_send_log(related_entity_type, related_entity_id);
CREATE INDEX idx_message_send_log_sent ON message_send_log(sent_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_messaging_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_timestamp
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_messaging_timestamp();

CREATE TRIGGER update_sms_templates_timestamp
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_messaging_timestamp();

CREATE TRIGGER update_scheduled_messages_timestamp
  BEFORE UPDATE ON scheduled_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messaging_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Note: Uses is_admin() function from admin_roles migration for proper role checking

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_send_log ENABLE ROW LEVEL SECURITY;

-- Email templates: All can read active, admins can manage all
CREATE POLICY "Anyone can read active email templates"
  ON email_templates FOR SELECT
  USING (status = 'active' OR is_admin());

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (is_admin());

-- SMS templates: Same pattern
CREATE POLICY "Anyone can read active sms templates"
  ON sms_templates FOR SELECT
  USING (status = 'active' OR is_admin());

CREATE POLICY "Admins can manage sms templates"
  ON sms_templates FOR ALL
  USING (is_admin());

-- Scheduled messages: Admins only
CREATE POLICY "Admins can manage scheduled messages"
  ON scheduled_messages FOR ALL
  USING (is_admin());

-- Message log: Admins can read, system can insert
CREATE POLICY "Admins can view message log"
  ON message_send_log FOR SELECT
  USING (is_admin());

CREATE POLICY "Authenticated can insert message log"
  ON message_send_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- SEED DEFAULT TEMPLATES
-- ============================================================================

-- Session Invitation Email
INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables, triggers)
VALUES (
  'session-invitation',
  'Session Invitation',
  'Invite a participant to a video session',
  'sessions',
  'active',
  '{{hostName}} has scheduled a session with you!',
  '<!-- HTML content will be populated by the application -->',
  '{{hostName}} has scheduled a session with you on {{scheduledDate}} at {{scheduledTime}}. Join here: {{joinLink}}',
  '["participantName", "hostName", "sessionTitle", "sessionDescription", "scheduledDate", "scheduledTime", "durationMinutes", "joinLink"]'::jsonb,
  '["Admin creates session with participant", "API: POST /api/video/sessions"]'::jsonb
);

-- Session Reminder Email
INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables, triggers)
VALUES (
  'session-reminder',
  'Session Reminder',
  'Reminder sent 15 minutes before a session',
  'reminders',
  'active',
  'Your session with {{hostName}} starts in 15 minutes!',
  '<!-- HTML content will be populated by the application -->',
  'Your session "{{sessionTitle}}" with {{hostName}} starts in 15 minutes. Join here: {{joinLink}}',
  '["participantName", "hostName", "sessionTitle", "scheduledTime", "joinLink"]'::jsonb,
  '["Scheduled: 15 minutes before session", "Cron job trigger"]'::jsonb
);

-- Session Ready Email (when host joins)
INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables, triggers)
VALUES (
  'session-ready',
  'Session Ready - Host Joined',
  'Notification when the host has joined and is ready',
  'notifications',
  'active',
  '{{hostName}} is ready for your session!',
  '<!-- HTML content will be populated by the application -->',
  '{{hostName}} has joined and is ready for your session. Join now: {{joinLink}}',
  '["participantName", "hostName", "sessionTitle", "joinLink"]'::jsonb,
  '["Host joins the video session", "Daily.co webhook or manual trigger"]'::jsonb
);

-- Session Reminder SMS
INSERT INTO sms_templates (slug, name, description, category, status, body, variables, triggers)
VALUES (
  'session-reminder',
  'Session Reminder',
  'SMS reminder 15 minutes before a session',
  'reminders',
  'active',
  'Reminder: Your session with {{hostName}} starts in 15 mins! Join: {{joinLink}}',
  '["participantName", "hostName", "sessionTitle", "joinLink"]'::jsonb,
  '["Scheduled: 15 minutes before session"]'::jsonb
);

-- Session Ready SMS
INSERT INTO sms_templates (slug, name, description, category, status, body, variables, triggers)
VALUES (
  'session-ready',
  'Session Ready - Host Joined',
  'SMS when host is ready',
  'notifications',
  'active',
  '{{hostName}} is ready for you! Join your session now: {{joinLink}}',
  '["participantName", "hostName", "joinLink"]'::jsonb,
  '["Host joins the video session"]'::jsonb
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE email_templates IS 'Database-driven email templates with variable support';
COMMENT ON TABLE sms_templates IS 'Database-driven SMS templates with variable support';
COMMENT ON TABLE scheduled_messages IS 'Queue for scheduled email and SMS messages';
COMMENT ON TABLE message_send_log IS 'Audit log of all sent messages';

COMMENT ON COLUMN email_templates.slug IS 'Unique identifier used in code to reference template';
COMMENT ON COLUMN email_templates.variables IS 'JSON array of variable names like ["userName", "link"]';
COMMENT ON COLUMN scheduled_messages.scheduled_for IS 'When this message should be sent';

