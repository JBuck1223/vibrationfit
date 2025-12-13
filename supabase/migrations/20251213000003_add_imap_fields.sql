-- Add fields for IMAP email tracking
-- This migration adds columns to track IMAP-specific metadata

ALTER TABLE email_messages
ADD COLUMN IF NOT EXISTS imap_message_id TEXT,
ADD COLUMN IF NOT EXISTS imap_uid INTEGER,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_messages_imap_message_id ON email_messages(imap_message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_imap_uid ON email_messages(imap_uid);

-- Add comments explaining the fields
COMMENT ON COLUMN email_messages.imap_message_id IS 'IMAP Message-ID header for deduplication';
COMMENT ON COLUMN email_messages.imap_uid IS 'IMAP UID for tracking';
COMMENT ON COLUMN email_messages.sent_at IS 'Original sent date from email headers';

