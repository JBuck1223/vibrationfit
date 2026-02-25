-- ============================================================================
-- DATABASE-DRIVEN COUPON SYSTEM
-- Source of truth for coupon rules, codes, and redemption tracking.
-- Stripe is only used to apply the discount at payment time.
-- ============================================================================

-- ============================================================================
-- 1. COUPONS (discount templates with rules)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  min_purchase_amount integer,
  max_discount_amount integer,
  eligible_products text[],
  eligible_tiers text[],
  max_redemptions integer,
  max_redemptions_per_user integer NOT NULL DEFAULT 1,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percent', 'fixed')),
  CONSTRAINT coupons_discount_value_positive CHECK (discount_value > 0),
  CONSTRAINT coupons_percent_max CHECK (
    discount_type != 'percent' OR discount_value <= 100
  )
);

CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_campaign_id ON public.coupons(campaign_id);

-- ============================================================================
-- 2. COUPON CODES (individual redeemable codes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  batch_id text,
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_codes_coupon_id ON public.coupon_codes(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_batch_id ON public.coupon_codes(batch_id) WHERE batch_id IS NOT NULL;

-- ============================================================================
-- 3. COUPON REDEMPTIONS (usage tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  coupon_code_id uuid NOT NULL REFERENCES public.coupon_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.customer_subscriptions(id) ON DELETE SET NULL,
  discount_amount integer NOT NULL,
  original_amount integer NOT NULL,
  product_key text,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_code_id ON public.coupon_redemptions(coupon_code_id);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================
CREATE TRIGGER trigger_update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage coupons"
ON public.coupons
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Active coupons are viewable by everyone"
ON public.coupons FOR SELECT
USING (is_active = true);

CREATE POLICY "Service role can manage coupon codes"
ON public.coupon_codes
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Active coupon codes are viewable by everyone"
ON public.coupon_codes FOR SELECT
USING (is_active = true);

CREATE POLICY "Service role can manage coupon redemptions"
ON public.coupon_redemptions
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view own redemptions"
ON public.coupon_redemptions FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================================
-- 6. SEED EXISTING STRIPE PROMOS INTO DB
-- ============================================================================

-- LAUNCH50: 50% off first month
INSERT INTO public.coupons (name, discount_type, discount_value, max_redemptions_per_user, metadata)
VALUES ('Launch 50% Off', 'percent', 50, 1, '{"stripe_legacy": true, "duration": "once", "description": "50% off first month"}'::jsonb)
ON CONFLICT DO NOTHING;

WITH c AS (SELECT id FROM public.coupons WHERE name = 'Launch 50% Off' LIMIT 1)
INSERT INTO public.coupon_codes (coupon_id, code)
SELECT c.id, 'LAUNCH50' FROM c
ON CONFLICT (code) DO NOTHING;

-- LAUNCH25: 25% off for 3 months
INSERT INTO public.coupons (name, discount_type, discount_value, max_redemptions_per_user, metadata)
VALUES ('Launch 25% Off 3 Months', 'percent', 25, 1, '{"stripe_legacy": true, "duration": "repeating", "duration_months": 3, "description": "25% off for 3 months"}'::jsonb)
ON CONFLICT DO NOTHING;

WITH c AS (SELECT id FROM public.coupons WHERE name = 'Launch 25% Off 3 Months' LIMIT 1)
INSERT INTO public.coupon_codes (coupon_id, code)
SELECT c.id, 'LAUNCH25' FROM c
ON CONFLICT (code) DO NOTHING;

-- REFER20: 20% off forever (referral)
INSERT INTO public.coupons (name, discount_type, discount_value, max_redemptions_per_user, metadata)
VALUES ('Referral 20% Off', 'percent', 20, 1, '{"stripe_legacy": true, "duration": "forever", "description": "20% off forever (referral reward)"}'::jsonb)
ON CONFLICT DO NOTHING;

WITH c AS (SELECT id FROM public.coupons WHERE name = 'Referral 20% Off' LIMIT 1)
INSERT INTO public.coupon_codes (coupon_id, code)
SELECT c.id, 'REFER20' FROM c
ON CONFLICT (code) DO NOTHING;

-- NEWYEAR2025: 30% off first month
INSERT INTO public.coupons (name, discount_type, discount_value, max_redemptions_per_user, valid_until, metadata)
VALUES ('New Year 2025', 'percent', 30, 1, '2025-02-28T23:59:59Z', '{"stripe_legacy": true, "duration": "once", "description": "30% off first month (New Year)"}'::jsonb)
ON CONFLICT DO NOTHING;

WITH c AS (SELECT id FROM public.coupons WHERE name = 'New Year 2025' LIMIT 1)
INSERT INTO public.coupon_codes (coupon_id, code)
SELECT c.id, 'NEWYEAR2025' FROM c
ON CONFLICT (code) DO NOTHING;

-- VIP50: 50% off forever, max 10 redemptions
INSERT INTO public.coupons (name, discount_type, discount_value, max_redemptions, max_redemptions_per_user, metadata)
VALUES ('VIP 50% Off Forever', 'percent', 50, 10, 1, '{"stripe_legacy": true, "duration": "forever", "description": "50% off forever (VIP)"}'::jsonb)
ON CONFLICT DO NOTHING;

WITH c AS (SELECT id FROM public.coupons WHERE name = 'VIP 50% Off Forever' LIMIT 1)
INSERT INTO public.coupon_codes (coupon_id, code)
SELECT c.id, 'VIP50' FROM c
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- ACTIVE LAUNCH COUPONS (currently in Stripe Dashboard)
-- ============================================================================

-- LAUNCH2026: $498 off Solo Intensive = $1 verification charge
INSERT INTO public.coupons (name, discount_type, discount_value, currency, max_redemptions_per_user, eligible_products, metadata)
VALUES (
  'Launch 2026 - Solo Intensive',
  'fixed',
  49800,
  'usd',
  1,
  '{intensive}'::text[],
  '{"description": "$498 off Solo Intensive ($1 verification)", "stripe_coupon_id": "LAUNCH2026"}'::jsonb
)
ON CONFLICT DO NOTHING;

WITH c AS (SELECT id FROM public.coupons WHERE name = 'Launch 2026 - Solo Intensive' LIMIT 1)
INSERT INTO public.coupon_codes (coupon_id, code)
SELECT c.id, 'LAUNCH2026' FROM c
ON CONFLICT (code) DO NOTHING;

-- Household2026: $698 off Household Intensive = $1 verification charge
INSERT INTO public.coupons (name, discount_type, discount_value, currency, max_redemptions_per_user, eligible_products, metadata)
VALUES (
  'Launch 2026 - Household Intensive',
  'fixed',
  69800,
  'usd',
  1,
  '{intensive_household}'::text[],
  '{"description": "$698 off Household Intensive ($1 verification)", "stripe_coupon_id": "Household2026"}'::jsonb
)
ON CONFLICT DO NOTHING;

WITH c AS (SELECT id FROM public.coupons WHERE name = 'Launch 2026 - Household Intensive' LIMIT 1)
INSERT INTO public.coupon_codes (coupon_id, code)
SELECT c.id, 'HOUSEHOLD2026' FROM c
ON CONFLICT (code) DO NOTHING;
