-- Email messages table for CRM conversation tracking
-- Stores both outbound (sent via SES) and inbound (synced via IMAP from Google Workspace)

CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Association
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT, -- For non-registered users
  
  -- Email Details
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  cc_emails TEXT[], -- Array of CC addresses
  bcc_emails TEXT[], -- Array of BCC addresses
  subject TEXT NOT NULL,
  body_text TEXT, -- Plain text version
  body_html TEXT, -- HTML version
  
  -- Direction
  direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  
  -- Status & Tracking
  status TEXT CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened')) DEFAULT 'sent',
  
  -- Provider IDs
  ses_message_id TEXT, -- AWS SES Message ID
  imap_message_id TEXT, -- IMAP Message-ID header (for deduplication)
  imap_uid INTEGER, -- IMAP UID
  
  -- Metadata
  is_reply BOOLEAN DEFAULT false,
  reply_to_message_id UUID REFERENCES email_messages(id), -- Thread parent
  thread_id TEXT, -- For grouping conversation threads
  
  -- Attachments (if any)
  has_attachments BOOLEAN DEFAULT false,
  attachment_urls TEXT[], -- S3 URLs if we store attachments
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_email_user_id ON email_messages(user_id);
CREATE INDEX idx_email_direction ON email_messages(direction);
CREATE INDEX idx_email_created_at ON email_messages(created_at DESC);
CREATE INDEX idx_email_thread_id ON email_messages(thread_id);
CREATE INDEX idx_email_imap_id ON email_messages(imap_message_id); -- For deduplication
CREATE INDEX idx_email_ses_id ON email_messages(ses_message_id);

-- RLS Policies
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emails" ON email_messages
  FOR SELECT USING (
    auth.uid() = user_id 
    OR guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all emails" ON email_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email IN ('buckinghambliss@gmail.com', 'admin@vibrationfit.com')
        OR auth.users.raw_user_meta_data->>'is_admin' = 'true'
      )
    )
  );

-- Comment
COMMENT ON TABLE email_messages IS 'Stores all email communications (outbound via SES, inbound via IMAP from Google Workspace)';

