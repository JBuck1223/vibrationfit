-- Migration 2 of 2: Insert Premium Activation Intensive products, prices, and membership tiers
--
-- Premium Solo: $3,000 one-time (full pay only)
-- Premium Household: $4,200 one-time (full pay only)
-- Same token grants and storage as standard intensive tiers

-- ============================================================================
-- 1. Insert premium intensive products
-- ============================================================================

INSERT INTO public.products (key, name, description, product_type, is_subscription, is_active, metadata)
VALUES (
  'intensive_premium',
  'Premium Activation Intensive',
  'Premium 1:1 hand-holding Activation Intensive experience',
  'intensive',
  false,
  true,
  '{"supports_payment_plans": false, "is_premium": true}'::jsonb
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
  '{"supports_payment_plans": false, "is_premium": true, "is_household": true}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = products.metadata || EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- 2. Insert premium intensive price variants (full pay only)
-- ============================================================================

WITH premium_product AS (
  SELECT id FROM public.products WHERE key = 'intensive_premium'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES
  (
    (SELECT id FROM premium_product),
    NULL,
    'usd',
    300000,
    NULL, 1, true,
    '{
      "payment_plan": "full",
      "plan_type": "solo",
      "installments": 1,
      "stripe_price_env": "STRIPE_PRICE_PREMIUM_INTENSIVE_FULL",
      "description": "Premium Activation Intensive - One-time payment"
    }'::jsonb
  )
ON CONFLICT DO NOTHING;

WITH premium_household AS (
  SELECT id FROM public.products WHERE key = 'intensive_premium_household'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES
  (
    (SELECT id FROM premium_household),
    NULL,
    'usd',
    420000,
    NULL, 1, true,
    '{
      "payment_plan": "full",
      "plan_type": "household",
      "installments": 1,
      "stripe_price_env": "STRIPE_PRICE_PREMIUM_HOUSEHOLD_INTENSIVE_FULL",
      "description": "Premium Activation Intensive Household - One-time payment"
    }'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. Insert premium intensive membership tiers
-- ============================================================================

INSERT INTO public.membership_tiers (
  name, description, tier_type, price_monthly, billing_interval,
  monthly_token_grant, annual_token_grant, storage_quota_gb,
  included_seats, plan_category, is_household_plan, is_active,
  features
)
VALUES (
  'Premium Activation Intensive',
  'Premium 1:1 hand-holding Activation Intensive',
  'intensive_premium',
  300000,
  'one-time',
  5000000,
  0,
  100,
  1,
  'intensive',
  false,
  true,
  '["1:1 or small-group deep dive", "Custom vibration/practice plan", "Priority or private support", "Full Activation Intensive experience", "8 weeks Vision Pro included", "5M VIVA tokens included"]'::jsonb
)
ON CONFLICT DO NOTHING;

INSERT INTO public.membership_tiers (
  name, description, tier_type, price_monthly, billing_interval,
  monthly_token_grant, annual_token_grant, storage_quota_gb,
  included_seats, max_household_members, plan_category, is_household_plan, is_active,
  features
)
VALUES (
  'Premium Activation Intensive - Household',
  'Premium 1:1 hand-holding Activation Intensive for households',
  'intensive_premium_household',
  420000,
  'one-time',
  7500000,
  0,
  100,
  2,
  2,
  'intensive',
  true,
  true,
  '["1:1 or small-group deep dive", "Custom vibration/practice plan", "Priority or private support", "Full Activation Intensive experience", "8 weeks Vision Pro included", "7.5M VIVA tokens included", "2 seats included"]'::jsonb
)
ON CONFLICT DO NOTHING;
