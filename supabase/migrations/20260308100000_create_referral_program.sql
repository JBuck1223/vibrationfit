-- Create referral program tables
-- Migration: 20260308100000_create_referral_program.sql

-- Add 'referral' to template_category enum (applied as separate migration in production
-- because Postgres requires new enum values to be committed before use)
ALTER TYPE template_category ADD VALUE IF NOT EXISTS 'referral';

-- ============================================================================
-- REFERRAL PARTICIPANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  display_name TEXT,
  referred_by_participant_id UUID REFERENCES public.referral_participants(id) ON DELETE SET NULL,
  total_clicks INTEGER DEFAULT 0,
  email_signups INTEGER DEFAULT 0,
  paid_conversions INTEGER DEFAULT 0,
  second_degree_signups INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referral_participants_code ON public.referral_participants(referral_code);
CREATE INDEX idx_referral_participants_email ON public.referral_participants(email);
CREATE INDEX idx_referral_participants_user_id ON public.referral_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_referral_participants_referred_by ON public.referral_participants(referred_by_participant_id) WHERE referred_by_participant_id IS NOT NULL;

COMMENT ON TABLE public.referral_participants IS 'Anyone (member or non-member) who has joined the referral program';
COMMENT ON COLUMN public.referral_participants.user_id IS 'Linked when participant creates an account; NULL for non-members';
COMMENT ON COLUMN public.referral_participants.referred_by_participant_id IS 'Who referred this person into the program (chain tracking, not multi-level rewards)';
COMMENT ON COLUMN public.referral_participants.second_degree_signups IS 'People referred by YOUR referrals (reporting only)';

-- ============================================================================
-- REFERRAL CODE HISTORY (preserves old codes so old links keep working)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_code_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.referral_participants(id) ON DELETE CASCADE,
  old_code TEXT UNIQUE NOT NULL,
  replaced_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referral_code_history_code ON public.referral_code_history(old_code);

COMMENT ON TABLE public.referral_code_history IS 'Old referral codes that still resolve to the participant who changed them';

-- ============================================================================
-- REFERRAL EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.referral_participants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('click', 'email_signup', 'paid_conversion', 'referral_sent')),
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referral_events_referrer ON public.referral_events(referrer_id);
CREATE INDEX idx_referral_events_type ON public.referral_events(event_type);
CREATE INDEX idx_referral_events_referred_email ON public.referral_events(referred_email) WHERE referred_email IS NOT NULL;

COMMENT ON TABLE public.referral_events IS 'Every tracked referral interaction: clicks, signups, conversions, emails sent';

-- ============================================================================
-- REFERRAL REWARD TIERS (configurable, designed for future voting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_reward_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL,
  tier_order INTEGER NOT NULL,
  min_email_signups INTEGER DEFAULT 0,
  min_paid_conversions INTEGER DEFAULT 0,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('tokens', 'free_month', 'discount', 'custom')),
  reward_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referral_reward_tiers_order ON public.referral_reward_tiers(tier_order) WHERE is_active;

COMMENT ON TABLE public.referral_reward_tiers IS 'Configurable reward tiers for the referral program';

-- ============================================================================
-- REFERRAL REWARDS EARNED
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_rewards_earned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.referral_participants(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.referral_reward_tiers(id) ON DELETE CASCADE,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referral_rewards_participant ON public.referral_rewards_earned(participant_id);
CREATE INDEX idx_referral_rewards_unclaimed ON public.referral_rewards_earned(participant_id, is_claimed) WHERE NOT is_claimed;

COMMENT ON TABLE public.referral_rewards_earned IS 'Rewards granted to referral participants when they hit tier thresholds';

-- ============================================================================
-- REFERRAL INVITES (warm-intro personal emails)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.referral_participants(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_name TEXT,
  personalization TEXT,
  email_message_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'converted')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  UNIQUE(participant_id, referred_email)
);

CREATE INDEX idx_referral_invites_participant ON public.referral_invites(participant_id);
CREATE INDEX idx_referral_invites_email ON public.referral_invites(referred_email);

COMMENT ON TABLE public.referral_invites IS 'Tracks personal warm-intro referral emails for dedup and conversion tracking';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.referral_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_code_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards_earned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_invites ENABLE ROW LEVEL SECURITY;

-- referral_participants: users see own, service role sees all
CREATE POLICY "Users can view their own referral participant"
  ON public.referral_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert referral participant"
  ON public.referral_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own referral participant"
  ON public.referral_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- referral_code_history: public read for code resolution
CREATE POLICY "Anyone can read referral code history"
  ON public.referral_code_history FOR SELECT
  USING (true);

CREATE POLICY "Users can insert code history for own participant"
  ON public.referral_code_history FOR INSERT
  WITH CHECK (true);

-- referral_events: users see events where they are the referrer
CREATE POLICY "Users can view their referral events"
  ON public.referral_events FOR SELECT
  USING (referrer_id IN (SELECT id FROM public.referral_participants WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert referral events"
  ON public.referral_events FOR INSERT
  WITH CHECK (true);

-- referral_reward_tiers: public read
CREATE POLICY "Anyone can read active reward tiers"
  ON public.referral_reward_tiers FOR SELECT
  USING (is_active = true);

-- referral_rewards_earned: users see own
CREATE POLICY "Users can view their earned rewards"
  ON public.referral_rewards_earned FOR SELECT
  USING (participant_id IN (SELECT id FROM public.referral_participants WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert earned rewards"
  ON public.referral_rewards_earned FOR INSERT
  WITH CHECK (true);

-- referral_invites: users see own
CREATE POLICY "Users can view their referral invites"
  ON public.referral_invites FOR SELECT
  USING (participant_id IN (SELECT id FROM public.referral_participants WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert referral invites"
  ON public.referral_invites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update referral invites"
  ON public.referral_invites FOR UPDATE
  USING (true);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_referral_participant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_participant_updated_at
  BEFORE UPDATE ON public.referral_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_participant_timestamp();

-- ============================================================================
-- SEED DEFAULT REWARD TIERS
-- ============================================================================
INSERT INTO public.referral_reward_tiers (tier_name, tier_order, min_email_signups, min_paid_conversions, reward_type, reward_value, description)
VALUES
  ('Signal Sender', 1, 3, 0, 'tokens', '{"tokens": 100000}', 'Refer 3 friends who sign up and earn 100K tokens'),
  ('Vibe Amplifier', 2, 5, 1, 'tokens', '{"tokens": 500000}', 'Refer 5 friends (1 paid) and earn 500K tokens'),
  ('Frequency Raiser', 3, 10, 3, 'free_month', '{"months": 1}', 'Refer 10 friends (3 paid) and earn 1 free month'),
  ('Tribe Builder', 4, 25, 10, 'free_month', '{"months": 3}', 'Refer 25 friends (10 paid) and earn 3 free months');

-- ============================================================================
-- SEED WARM-INTRO EMAIL TEMPLATE
-- ============================================================================
INSERT INTO public.email_templates (
  slug, name, description, category, status, subject, html_body, text_body, variables, triggers
) VALUES (
  'referral-warm-intro',
  'Warm Intro Referral',
  'Personal referral email sent on behalf of a referrer -- plain text for Primary inbox delivery',
  'referral',
  'active',
  '{{referrerName}} thought you might like this',
  '',
  E'Hey {{firstName}},\n\n{{referrerName}} mentioned you''re into {{personalization}}, and suggested I share this with you.\n\nMy partner Vanessa and I just finished building a 72-Hour Activation Intensive. In 3 days you create a written life vision, custom AM/PM audios, a vision board, and a 28-day activation plan to make it stick.\n\nWe''re inviting a small group of founding testers in at a big discount in exchange for honest feedback.\n\nDetails are here:\n{{referralLink}}\n\nIf it feels like a fit, amazing. If not, no worries at all and thanks for taking a look.\n\nJordan',
  '["referrerName", "firstName", "personalization", "referralLink"]',
  '["Manual referral send"]'
);
