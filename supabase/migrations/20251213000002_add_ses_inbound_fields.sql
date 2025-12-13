-- Add fields for SES inbound email tracking
-- This migration adds columns to track SES-specific metadata and guest users

ALTER TABLE email_messages
ADD COLUMN IF NOT EXISTS ses_message_id TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS is_reply BOOLEAN DEFAULT FALSE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_messages_ses_message_id ON email_messages(ses_message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_guest_email ON email_messages(guest_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_is_reply ON email_messages(is_reply);

-- Add comment explaining the fields
COMMENT ON COLUMN email_messages.ses_message_id IS 'AWS SES Message ID for tracking';
COMMENT ON COLUMN email_messages.guest_email IS 'Email address for non-registered users (for guest support tickets)';
COMMENT ON COLUMN email_messages.is_reply IS 'Whether this email is a reply to a support ticket';

