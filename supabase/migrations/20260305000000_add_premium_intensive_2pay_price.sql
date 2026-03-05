-- Ensure premium intensive products exist, then add 2-pay price.
-- Safe to re-run: uses ON CONFLICT / IF NOT EXISTS throughout.

-- 1. Enum values (idempotent)
ALTER TYPE public.membership_tier_type ADD VALUE IF NOT EXISTS 'intensive_premium';
ALTER TYPE public.membership_tier_type ADD VALUE IF NOT EXISTS 'intensive_premium_household';

-- 2. Products
INSERT INTO public.products (key, name, description, product_type, is_subscription, is_active, metadata)
VALUES (
  'intensive_premium',
  'Premium Activation Intensive',
  'Premium 1:1 hand-holding Activation Intensive experience',
  'intensive',
  false,
  true,
  '{"supports_payment_plans": true, "is_premium": true}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = products.metadata || EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO public.products (key, name, description, product_type, is_subscription, is_active, metadata)
VALUES (
  'intensive_premium_household',
  'Premium Activation Intensive - Household',
  'Premium 1:1 hand-holding Activation Intensive for households (2 people)',
  'intensive',
  false,
  true,
  '{"supports_payment_plans": true, "is_premium": true, "is_household": true}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = products.metadata || EXCLUDED.metadata,
  updated_at = NOW();

-- 3. Full-pay prices (idempotent via ON CONFLICT DO NOTHING)
WITH premium_product AS (
  SELECT id FROM public.products WHERE key = 'intensive_premium'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES (
  (SELECT id FROM premium_product),
  NULL, 'usd', 300000, NULL, 1, true,
  '{"payment_plan": "full", "plan_type": "solo", "installments": 1, "stripe_price_env": "STRIPE_PRICE_PREMIUM_INTENSIVE_FULL", "description": "Premium Activation Intensive - One-time payment"}'::jsonb
)
ON CONFLICT DO NOTHING;

WITH premium_household AS (
  SELECT id FROM public.products WHERE key = 'intensive_premium_household'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES (
  (SELECT id FROM premium_household),
  NULL, 'usd', 420000, NULL, 1, true,
  '{"payment_plan": "full", "plan_type": "household", "installments": 1, "stripe_price_env": "STRIPE_PRICE_PREMIUM_HOUSEHOLD_INTENSIVE_FULL", "description": "Premium Activation Intensive Household - One-time payment"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 4. 2-pay price ($1,500/installment x 2 = $3,000 total)
WITH premium_product AS (
  SELECT id FROM public.products WHERE key = 'intensive_premium'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES (
  (SELECT id FROM premium_product),
  NULL, 'usd', 150000, 'month', 1, true,
  '{"payment_plan": "2pay", "plan_type": "solo", "installments": 2, "stripe_price_env": "STRIPE_PRICE_PREMIUM_INTENSIVE_2PAY", "description": "Premium Activation Intensive - 2 payments of $1,500"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 5. Membership tiers
INSERT INTO public.membership_tiers (
  name, description, tier_type, price_monthly, billing_interval,
  monthly_token_grant, annual_token_grant, storage_quota_gb,
  included_seats, plan_category, is_household_plan, is_active, features
)
VALUES (
  'Premium Activation Intensive',
  'Premium 1:1 hand-holding Activation Intensive',
  'intensive_premium', 300000, 'one-time',
  5000000, 0, 100, 1, 'intensive', false, true,
  '["1:1 or small-group deep dive", "Custom vibration/practice plan", "Priority or private support", "Full Activation Intensive experience", "8 weeks Vision Pro included", "5M VIVA tokens included"]'::jsonb
)
ON CONFLICT DO NOTHING;

INSERT INTO public.membership_tiers (
  name, description, tier_type, price_monthly, billing_interval,
  monthly_token_grant, annual_token_grant, storage_quota_gb,
  included_seats, max_household_members, plan_category, is_household_plan, is_active, features
)
VALUES (
  'Premium Activation Intensive - Household',
  'Premium 1:1 hand-holding Activation Intensive for households',
  'intensive_premium_household', 420000, 'one-time',
  7500000, 0, 100, 2, 2, 'intensive', true, true,
  '["1:1 or small-group deep dive", "Custom vibration/practice plan", "Priority or private support", "Full Activation Intensive experience", "8 weeks Vision Pro included", "7.5M VIVA tokens included", "2 seats included"]'::jsonb
)
ON CONFLICT DO NOTHING;
