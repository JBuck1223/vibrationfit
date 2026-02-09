-- CRM System Fixes Migration
-- Fixes critical issues found during audit

-- 1. Fix email_messages status CHECK constraint to allow 'received' for inbound emails
ALTER TABLE email_messages DROP CONSTRAINT IF EXISTS email_messages_status_check;
ALTER TABLE email_messages ADD CONSTRAINT email_messages_status_check 
  CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'received'));

-- 2. Add missing indexes on email_messages for CRM conversation lookups
CREATE INDEX IF NOT EXISTS idx_email_messages_from_email ON email_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_to_email ON email_messages(to_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_status ON email_messages(status);

-- 3. Add missing index on marketing_campaigns for type filtering
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_type ON marketing_campaigns(campaign_type);

-- 4. Add missing ON DELETE rules for foreign keys that reference auth.users
-- leads.assigned_to -> SET NULL on user deletion
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- leads.converted_to_user_id -> SET NULL on user deletion
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_converted_to_user_id_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_converted_to_user_id_fkey 
  FOREIGN KEY (converted_to_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- support_tickets.assigned_to -> SET NULL on user deletion
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_assigned_to_fkey;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- marketing_campaigns.created_by -> SET NULL on user deletion
ALTER TABLE marketing_campaigns DROP CONSTRAINT IF EXISTS marketing_campaigns_created_by_fkey;
ALTER TABLE marketing_campaigns ADD CONSTRAINT marketing_campaigns_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- email_messages.reply_to_message_id -> SET NULL on parent message deletion
ALTER TABLE email_messages DROP CONSTRAINT IF EXISTS email_messages_reply_to_message_id_fkey;
ALTER TABLE email_messages ADD CONSTRAINT email_messages_reply_to_message_id_fkey 
  FOREIGN KEY (reply_to_message_id) REFERENCES email_messages(id) ON DELETE SET NULL;

-- 5. Add UNIQUE constraints on external IDs to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_messages_twilio_sid_unique 
  ON sms_messages(twilio_sid) WHERE twilio_sid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_messages_ses_message_id_unique 
  ON email_messages(ses_message_id) WHERE ses_message_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_messages_imap_message_id_unique 
  ON email_messages(imap_message_id) WHERE imap_message_id IS NOT NULL;

-- 6. Fix generate_ticket_number() race condition by using advisory lock
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  ticket_num TEXT;
BEGIN
  -- Use advisory lock to prevent concurrent ticket number generation
  PERFORM pg_advisory_xact_lock(hashtext('ticket_number_gen'));
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM support_tickets;
  
  ticket_num := 'SUPP-' || LPAD(next_num::TEXT, 4, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- 7. Fix update_campaign_metrics() to return OLD on DELETE
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update metrics for the NEW campaign (INSERT/UPDATE)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.campaign_id IS NOT NULL THEN
      UPDATE marketing_campaigns
      SET 
        total_leads = (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id),
        total_conversions = (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id AND status = 'converted'),
        revenue_generated = (SELECT COALESCE(SUM(conversion_value), 0) FROM leads WHERE campaign_id = NEW.campaign_id AND status = 'converted'),
        updated_at = NOW()
      WHERE id = NEW.campaign_id;
    END IF;
  END IF;

  -- Update metrics for the OLD campaign (UPDATE that changes campaign_id, or DELETE)
  IF TG_OP = 'UPDATE' AND OLD.campaign_id IS NOT NULL AND OLD.campaign_id IS DISTINCT FROM NEW.campaign_id THEN
    UPDATE marketing_campaigns
    SET 
      total_leads = (SELECT COUNT(*) FROM leads WHERE campaign_id = OLD.campaign_id),
      total_conversions = (SELECT COUNT(*) FROM leads WHERE campaign_id = OLD.campaign_id AND status = 'converted'),
      revenue_generated = (SELECT COALESCE(SUM(conversion_value), 0) FROM leads WHERE campaign_id = OLD.campaign_id AND status = 'converted'),
      updated_at = NOW()
    WHERE id = OLD.campaign_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.campaign_id IS NOT NULL THEN
      UPDATE marketing_campaigns
      SET 
        total_leads = (SELECT COUNT(*) FROM leads WHERE campaign_id = OLD.campaign_id),
        total_conversions = (SELECT COUNT(*) FROM leads WHERE campaign_id = OLD.campaign_id AND status = 'converted'),
        revenue_generated = (SELECT COALESCE(SUM(conversion_value), 0) FROM leads WHERE campaign_id = OLD.campaign_id AND status = 'converted'),
        updated_at = NOW()
      WHERE id = OLD.campaign_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
