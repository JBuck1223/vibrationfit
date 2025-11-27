-- ============================================================================
-- VibrationFit CRM System - Complete Database Schema
-- Created: November 26, 2025
-- Description: Marketing campaigns, leads, customer success tracking,
--              support tickets, and Twilio SMS integration
-- ============================================================================

BEGIN;

-- ============================================================================
-- MARKETING CAMPAIGNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Campaign Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')) DEFAULT 'draft',
  campaign_type TEXT CHECK (campaign_type IN ('paid_ad', 'email', 'social_organic', 'video', 'partnership', 'other')),
  
  -- UTM Parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Campaign Details
  objective TEXT,
  target_audience TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  cost_per_lead_target DECIMAL(10,2),
  notes TEXT,
  
  -- Creative Assets (URLs to S3)
  creative_urls TEXT[],
  landing_page_url TEXT,
  tracking_url TEXT, -- Full URL with UTM params
  
  -- Performance Metrics (auto-calculated)
  total_clicks INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  calculated_cpl DECIMAL(10,2), -- Cost Per Lead
  calculated_roi DECIMAL(10,4), -- ROI as decimal
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_slug ON marketing_campaigns(slug);
CREATE INDEX idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX idx_campaigns_dates ON marketing_campaigns(start_date, end_date);

-- ============================================================================
-- LEADS WITH ATTRIBUTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lead Type & Status
  type TEXT CHECK (type IN ('contact', 'demo', 'intensive_intake')) NOT NULL,
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')) DEFAULT 'new',
  
  -- Contact Information
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  
  -- Source
  source TEXT, -- e.g., 'website_contact', 'demo_request'
  metadata JSONB, -- Form-specific data
  
  -- Campaign Attribution
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  landing_page TEXT,
  
  -- Engagement Data
  session_id UUID,
  video_engagement JSONB, -- {video_id, watch_time, percent_watched}
  pages_visited TEXT[],
  time_on_site INTEGER, -- seconds
  
  -- Management
  assigned_to UUID REFERENCES auth.users(id),
  converted_to_user_id UUID REFERENCES auth.users(id),
  conversion_value DECIMAL(10,2),
  notes TEXT,
  
  -- SMS Opt-in
  sms_opt_in BOOLEAN DEFAULT false,
  sms_consent_date TIMESTAMPTZ,
  sms_opt_out_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_type ON leads(type);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_utm_campaign ON leads(utm_campaign);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_converted_user ON leads(converted_to_user_id);

-- ============================================================================
-- USER ACTIVITY METRICS (Simplified - Manual Classification)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity_metrics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feature Usage Counts (auto-calculated from other tables)
  profile_completion_percent INTEGER DEFAULT 0,
  vision_count INTEGER DEFAULT 0,
  vision_refinement_count INTEGER DEFAULT 0,
  audio_generated_count INTEGER DEFAULT 0,
  journal_entry_count INTEGER DEFAULT 0,
  vision_board_image_count INTEGER DEFAULT 0,
  
  -- Login Activity
  last_login_at TIMESTAMPTZ,
  total_logins INTEGER DEFAULT 0,
  days_since_last_login INTEGER,
  
  -- Resource Usage
  s3_file_count INTEGER DEFAULT 0,
  total_storage_mb DECIMAL(10,2) DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  tokens_remaining INTEGER DEFAULT 0,
  
  -- Manual Classification (YOU decide!)
  engagement_status TEXT, -- e.g., 'active', 'at_risk', 'champion', 'inactive'
  health_status TEXT, -- e.g., 'healthy', 'needs_attention', 'churned'
  custom_tags TEXT[], -- Flexible tagging
  admin_notes TEXT, -- Your observations
  
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user_id ON user_activity_metrics(user_id);
CREATE INDEX idx_activity_engagement_status ON user_activity_metrics(engagement_status);
CREATE INDEX idx_activity_health_status ON user_activity_metrics(health_status);
CREATE INDEX idx_activity_last_login ON user_activity_metrics(last_login_at DESC);
CREATE INDEX idx_activity_tags ON user_activity_metrics USING GIN(custom_tags);

-- ============================================================================
-- REVENUE METRICS - Use existing customer_subscriptions + payment_history
-- ============================================================================
-- NOTE: We use the existing production tables:
--   - customer_subscriptions (links users to membership_tiers)
--   - membership_tiers (pricing, features, plan details)
--   - payment_history (all transactions for calculating LTV/MRR)
-- No need for a separate user_revenue_metrics table!

-- ============================================================================
-- SUPPORT TICKETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ticket Identity
  ticket_number TEXT UNIQUE NOT NULL, -- e.g., "SUPP-0001"
  
  -- User Info
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT, -- For non-logged-in users
  
  -- Ticket Details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'waiting_reply', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  category TEXT CHECK (category IN ('technical', 'billing', 'account', 'feature', 'other')),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_tickets_ticket_number ON support_tickets(ticket_number);
CREATE INDEX idx_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_tickets_guest_email ON support_tickets(guest_email);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON support_tickets(created_at DESC);

-- ============================================================================
-- SUPPORT TICKET REPLIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  is_staff BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  attachments TEXT[], -- URLs to uploaded files
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);
CREATE INDEX idx_ticket_replies_user_id ON support_ticket_replies(user_id);
CREATE INDEX idx_ticket_replies_created_at ON support_ticket_replies(created_at);

-- ============================================================================
-- SMS MESSAGES (Twilio Only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Message Details
  direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  
  -- Contact Info
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  
  -- Content
  body TEXT NOT NULL,
  media_urls TEXT[], -- MMS support
  
  -- Status Tracking
  status TEXT CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'received')) DEFAULT 'queued',
  error_message TEXT,
  
  -- Twilio ID
  twilio_sid TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_lead_id ON sms_messages(lead_id);
CREATE INDEX idx_sms_ticket_id ON sms_messages(ticket_id);
CREATE INDEX idx_sms_user_id ON sms_messages(user_id);
CREATE INDEX idx_sms_to_number ON sms_messages(to_number);
CREATE INDEX idx_sms_from_number ON sms_messages(from_number);
CREATE INDEX idx_sms_created_at ON sms_messages(created_at DESC);
CREATE INDEX idx_sms_twilio_sid ON sms_messages(twilio_sid);

-- ============================================================================
-- LEAD TRACKING EVENTS (Optional - for detailed engagement tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  session_id UUID NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL, -- 'page_view', 'video_play', 'video_milestone', 'form_view', 'form_submit'
  event_data JSONB, -- Flexible storage for event-specific data
  page_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracking_events_session_id ON lead_tracking_events(session_id);
CREATE INDEX idx_tracking_events_lead_id ON lead_tracking_events(lead_id);
CREATE INDEX idx_tracking_events_event_type ON lead_tracking_events(event_type);
CREATE INDEX idx_tracking_events_created_at ON lead_tracking_events(created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update campaign metrics when leads change
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.campaign_id IS NOT NULL THEN
      UPDATE marketing_campaigns
      SET 
        total_leads = (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id),
        total_conversions = (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id AND status = 'converted'),
        revenue_generated = (SELECT COALESCE(SUM(conversion_value), 0) FROM leads WHERE campaign_id = NEW.campaign_id AND status = 'converted'),
        calculated_cpl = CASE 
          WHEN (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id) > 0 
          THEN total_spent / (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id)
          ELSE 0 
        END,
        calculated_roi = CASE 
          WHEN total_spent > 0 
          THEN ((SELECT COALESCE(SUM(conversion_value), 0) FROM leads WHERE campaign_id = NEW.campaign_id AND status = 'converted') - total_spent) / total_spent
          ELSE 0 
        END,
        updated_at = NOW()
      WHERE id = NEW.campaign_id;
    END IF;
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_metrics
AFTER INSERT OR UPDATE OR DELETE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_campaign_metrics();

-- Function to generate next ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  ticket_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM support_tickets;
  
  ticket_num := 'SUPP-' || LPAD(next_num::TEXT, 4, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_number();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaigns_updated_at
BEFORE UPDATE ON marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tracking_events ENABLE ROW LEVEL SECURITY;

-- Marketing Campaigns: Admin only
CREATE POLICY "Admins can manage campaigns" ON marketing_campaigns
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

-- Leads: Admin only
CREATE POLICY "Admins can manage leads" ON leads
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

-- User Activity Metrics: Users see their own, admins see all
CREATE POLICY "Users can view own metrics" ON user_activity_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all metrics" ON user_activity_metrics
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

-- Revenue Metrics: Use existing customer_subscriptions table (already has RLS)

-- Support Tickets: Users see their own, admins see all
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (
    auth.uid() = user_id 
    OR guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" ON support_tickets
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

-- Ticket Replies: Users see replies to their tickets, admins see all
CREATE POLICY "Users can view replies to own tickets" ON support_ticket_replies
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can reply to own tickets" ON support_ticket_replies
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all replies" ON support_ticket_replies
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

-- SMS Messages: Admin only
CREATE POLICY "Admins can manage sms" ON sms_messages
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

-- Lead Tracking Events: Admin only
CREATE POLICY "Admins can manage tracking events" ON lead_tracking_events
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

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run: npx supabase migration up
-- 2. Verify tables created successfully
-- 3. Test RLS policies
-- 4. Begin building API routes and UI components
-- ============================================================================

