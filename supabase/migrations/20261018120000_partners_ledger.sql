-- ============================================================================
-- Vibration Fit Partners: referral attribution, referral credits, commission
-- ledger, sponsored campaigns, payouts, and per-payment profit.
-- Design: docs/features/partners/README.md
--
-- Ledger rules:
--   - commission_ledger amounts are never edited. Status moves forward
--     (pending -> approved -> paid); corrections are new 'adjustment' or
--     'reversal' rows that point at the entry they correct.
--   - Every accrual is tied to one payment_history row, so a payment can be
--     re-processed safely (unique per payment + entry type + beneficiary).
--   - All writes are service-role only. Members and partners read
--     their own rows; admins read everything.
-- ============================================================================

-- ============================================================================
-- PROGRAM SETTINGS (single row, admin-editable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.partner_program_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  referral_rate numeric(5,4) NOT NULL DEFAULT 0.2000,
  -- Referral credit: each active referral, up to credit_slots, takes this off the referrer's bill
  credit_slots integer NOT NULL DEFAULT 3,
  credit_per_referral_cents integer NOT NULL DEFAULT 3300,
  -- Shadow mode: credits are computed and recorded but not taken off the bill
  credits_live boolean NOT NULL DEFAULT false,
  minimum_profit_floor_cents integer NOT NULL DEFAULT 4000,
  maximum_commission_percentage numeric(5,4) NOT NULL DEFAULT 0.4500,
  minimum_referral_age_days integer NOT NULL DEFAULT 0,
  refund_hold_days integer NOT NULL DEFAULT 30,
  minimum_payout_cents integer NOT NULL DEFAULT 2500,
  sponsored_cash_share numeric(5,4) NOT NULL DEFAULT 0.5000,
  -- Fallback when the PayPal capture has no fee breakdown
  processing_fee_rate numeric(5,4) NOT NULL DEFAULT 0.0349,
  processing_fee_fixed_cents integer NOT NULL DEFAULT 49,
  -- Human support time per member per cycle (no system tracks this yet)
  support_cost_cents integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.partner_program_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.partner_program_settings IS 'Single-row config for referral credits, commission rates, holds, profit floor, and payouts';

-- ============================================================================
-- PARTNER IDENTITY (extends the existing referral program participant)
-- ============================================================================
ALTER TABLE public.referral_participants
  ADD COLUMN IF NOT EXISTS partner_level text NOT NULL DEFAULT 'advocate'
    CHECK (partner_level IN ('advocate', 'proven_partner', 'sponsored_partner')),
  ADD COLUMN IF NOT EXISTS partner_terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.referral_participants.partner_level IS 'Advocate (default) -> Proven Partner -> Sponsored Partner (eligible for ad budget)';
COMMENT ON COLUMN public.referral_participants.is_internal IS 'Founder/staff codes: referrals are attributed and reported but never earn credits or commissions';

-- Founder codes found in the backfill preview
UPDATE public.referral_participants SET is_internal = true WHERE referral_code IN ('jordan', 'jordanb', 'vanessa');

CREATE TABLE IF NOT EXISTS public.partner_payout_accounts (
  participant_id uuid PRIMARY KEY REFERENCES public.referral_participants(id) ON DELETE CASCADE,
  method text NOT NULL DEFAULT 'paypal' CHECK (method IN ('paypal', 'venmo')),
  paypal_email text,
  venmo_phone text,
  tax_form_status text NOT NULL DEFAULT 'missing' CHECK (tax_form_status IN ('missing', 'submitted', 'verified', 'rejected')),
  tax_form_submitted_at timestamptz,
  legal_name text,
  country text NOT NULL DEFAULT 'US',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.partner_payout_accounts IS 'Where a partner gets paid. Tax ID documents are never stored here, only their status.';

-- ============================================================================
-- SPONSORED CAMPAIGNS (defined before referrals so referrals can point at one)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sponsored_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.referral_participants(id) ON DELETE RESTRICT,
  name text NOT NULL,
  source text NOT NULL CHECK (source IN ('paid_influencer_audience', 'broad_paid_influencer_creative')),
  budget_cap_cents integer NOT NULL CHECK (budget_cap_cents > 0),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  approved_creative jsonb NOT NULL DEFAULT '[]'::jsonb,
  attribution_window_days integer NOT NULL DEFAULT 30,
  stop_loss_cents integer NOT NULL,
  profit_floor_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'stopped', 'completed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_sponsored_campaigns_participant ON public.sponsored_campaigns(participant_id);

-- ============================================================================
-- REFERRALS (one row per referred customer; lifetime attribution)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.referral_participants(id) ON DELETE RESTRICT,
  referred_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email text NOT NULL,
  source text NOT NULL DEFAULT 'organic_referral'
    CHECK (source IN ('organic_referral', 'paid_influencer_audience', 'broad_paid_influencer_creative', 'admin_approved')),
  campaign_id uuid REFERENCES public.sponsored_campaigns(id) ON DELETE SET NULL,
  attribution_event_id uuid REFERENCES public.referral_events(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'clicked'
    CHECK (status IN ('clicked', 'signed_up', 'payment_pending', 'active', 'failed_payment', 'paused',
                      'refunded', 'cancelled', 'chargeback', 'fraud')),
  first_paid_at timestamptz,
  activated_at timestamptz,
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  fraud_reason text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source = 'organic_referral' OR source = 'admin_approved' OR campaign_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred_email ON public.referrals(lower(referred_email));
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON public.referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_campaign ON public.referrals(campaign_id) WHERE campaign_id IS NOT NULL;

COMMENT ON TABLE public.referrals IS 'One referrer per customer, first verified referral wins. Only status = active counts toward the referral credit.';
COMMENT ON COLUMN public.referrals.activated_at IS 'First time this referral became active. Among a referrer''s currently active referrals, the earliest credit_slots earn bill credit; the rest earn cash.';

-- ============================================================================
-- PAYMENT HISTORY: amounts needed for net collected revenue
-- ============================================================================
ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS list_price_cents integer,
  ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_credit_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_fee_cents integer,
  ADD COLUMN IF NOT EXISTS refunded_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chargeback_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS disputed_at timestamptz,
  ADD COLUMN IF NOT EXISTS membership_tier_id uuid REFERENCES public.membership_tiers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cycle_start timestamptz,
  ADD COLUMN IF NOT EXISTS cycle_end timestamptz;

CREATE INDEX IF NOT EXISTS idx_payment_history_paypal_capture
  ON public.payment_history(paypal_capture_id) WHERE paypal_capture_id IS NOT NULL;

COMMENT ON COLUMN public.payment_history.referral_credit_cents IS 'Referral credit applied to this charge ($33 per active referral, up to 3)';
COMMENT ON COLUMN public.payment_history.processing_fee_cents IS 'PayPal fee from the capture breakdown; NULL until known';

-- ============================================================================
-- PAYOUTS (defined before the ledger so ledger rows can point at one)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.referral_participants(id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  method text NOT NULL DEFAULT 'paypal' CHECK (method IN ('paypal', 'venmo', 'manual')),
  receiver text NOT NULL,
  paypal_batch_id text,
  paypal_item_id text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'sent', 'paid', 'failed', 'returned', 'cancelled')),
  period_end date NOT NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_payouts_participant ON public.partner_payouts(participant_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status ON public.partner_payouts(status);

-- ============================================================================
-- COMMISSION LEDGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type text NOT NULL
    CHECK (entry_type IN ('referral_commission', 'referral_credit', 'adjustment', 'reversal')),
  participant_id uuid NOT NULL REFERENCES public.referral_participants(id) ON DELETE RESTRICT,
  source_payment_id uuid REFERENCES public.payment_history(id) ON DELETE RESTRICT,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE RESTRICT,
  campaign_id uuid REFERENCES public.sponsored_campaigns(id) ON DELETE RESTRICT,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  cycle_start timestamptz,
  cycle_end timestamptz,
  net_collected_cents integer NOT NULL DEFAULT 0,
  rate numeric(5,4),
  -- Signed: accruals positive, reversals/negative adjustments negative
  amount_cents integer NOT NULL,
  cash_payable_cents integer NOT NULL,
  ad_recovery_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'held', 'approved', 'paid', 'reversed', 'void')),
  hold_reason text,
  hold_until timestamptz,
  corrects_entry_id uuid REFERENCES public.commission_ledger(id) ON DELETE RESTRICT,
  payout_id uuid REFERENCES public.partner_payouts(id) ON DELETE SET NULL,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (entry_type NOT IN ('adjustment', 'reversal') OR corrects_entry_id IS NOT NULL),
  CHECK (cash_payable_cents + ad_recovery_cents = amount_cents OR entry_type = 'referral_credit')
);

-- Idempotency: one accrual per payment, type, and beneficiary
CREATE UNIQUE INDEX IF NOT EXISTS idx_commission_ledger_accrual_once
  ON public.commission_ledger(source_payment_id, entry_type, participant_id)
  WHERE entry_type IN ('referral_commission', 'referral_credit');

CREATE INDEX IF NOT EXISTS idx_commission_ledger_participant ON public.commission_ledger(participant_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_release ON public.commission_ledger(hold_until) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_commission_ledger_payout ON public.commission_ledger(payout_id) WHERE payout_id IS NOT NULL;

COMMENT ON TABLE public.commission_ledger IS 'Append-only money ledger. Amounts never change; corrections are new rows with corrects_entry_id.';
COMMENT ON COLUMN public.commission_ledger.cash_payable_cents IS 'Portion payable in cash. For sponsored referrals this is the cash share; the rest goes to ad_recovery_cents.';

-- ============================================================================
-- AD RECOVERY LEDGER (sponsored campaigns only, never mixed with organic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ad_recovery_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.sponsored_campaigns(id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (entry_type IN ('spend', 'recovery', 'adjustment')),
  -- Positive = owed back to Vibration Fit (spend); negative = recovered
  amount_cents integer NOT NULL,
  commission_entry_id uuid REFERENCES public.commission_ledger(id) ON DELETE RESTRICT,
  spend_date date,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (entry_type <> 'recovery' OR (amount_cents < 0 AND commission_entry_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_ad_recovery_campaign ON public.ad_recovery_ledger(campaign_id);

CREATE OR REPLACE VIEW public.sponsored_campaign_balances
WITH (security_invoker = true) AS
SELECT
  c.id AS campaign_id,
  c.participant_id,
  COALESCE(SUM(a.amount_cents) FILTER (WHERE a.entry_type = 'spend'), 0) AS spend_cents,
  GREATEST(COALESCE(SUM(a.amount_cents), 0), 0) AS recovery_balance_cents
FROM public.sponsored_campaigns c
LEFT JOIN public.ad_recovery_ledger a ON a.campaign_id = c.id
GROUP BY c.id, c.participant_id;

-- ============================================================================
-- PROFIT SNAPSHOTS (one per collected payment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profit_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL UNIQUE REFERENCES public.payment_history(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.customer_subscriptions(id) ON DELETE SET NULL,
  membership_tier_id uuid REFERENCES public.membership_tiers(id) ON DELETE SET NULL,
  cycle_start timestamptz,
  cycle_end timestamptz,
  gross_cents integer NOT NULL,
  discount_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  refunded_cents integer NOT NULL DEFAULT 0,
  chargeback_cents integer NOT NULL DEFAULT 0,
  net_collected_cents integer NOT NULL,
  referral_commission_cents integer NOT NULL DEFAULT 0,
  processing_cents integer NOT NULL DEFAULT 0,
  -- Usage this member (and their household) caused during the cycle, from token_usage
  usage_cost_cents integer NOT NULL DEFAULT 0,
  -- Share of platform costs (AWS, Vercel, Supabase, unattributed AI) per active paying member
  shared_cost_cents integer NOT NULL DEFAULT 0,
  support_cents integer NOT NULL DEFAULT 0,
  ad_recovery_cents integer NOT NULL DEFAULT 0,
  cost_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  costs_final boolean NOT NULL DEFAULT false,
  contribution_profit_cents integer NOT NULL,
  below_floor boolean NOT NULL DEFAULT false,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profit_snapshots_user ON public.profit_snapshots(user_id, cycle_start);

COMMENT ON TABLE public.profit_snapshots IS 'Contribution profit per collected payment; recomputed at cycle end and on refunds and chargebacks';
COMMENT ON COLUMN public.profit_snapshots.cost_breakdown IS 'Per-provider cents, e.g. {"vercel_gateway": 412, "mureka": 300, "fal": 85, "elevenlabs": 40, "openai": 12, "aws": 61, "vercel": 30, "supabase": 25}';
COMMENT ON COLUMN public.profit_snapshots.costs_final IS 'false while the cycle is running (usage still accruing); true after cycle_end and provider reconciliation';

-- ============================================================================
-- ROW LEVEL SECURITY (no insert/update/delete policies: service role only)
-- ============================================================================
ALTER TABLE public.partner_program_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_recovery_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read partner settings" ON public.partner_program_settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Partners read own payout account" ON public.partner_payout_accounts
  FOR SELECT USING (
    participant_id IN (SELECT id FROM public.referral_participants WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Partners read own campaigns" ON public.sponsored_campaigns
  FOR SELECT USING (
    participant_id IN (SELECT id FROM public.referral_participants WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Referrers read own referrals" ON public.referrals
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM public.referral_participants WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Partners read own payouts" ON public.partner_payouts
  FOR SELECT USING (
    participant_id IN (SELECT id FROM public.referral_participants WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Partners read own ledger" ON public.commission_ledger
  FOR SELECT USING (
    participant_id IN (SELECT id FROM public.referral_participants WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Partners read own campaign recovery" ON public.ad_recovery_ledger
  FOR SELECT USING (
    campaign_id IN (
      SELECT c.id FROM public.sponsored_campaigns c
      JOIN public.referral_participants p ON p.id = c.participant_id
      WHERE p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins read profit snapshots" ON public.profit_snapshots
  FOR SELECT USING (public.is_admin());
