-- ============================================================================
-- SEED CHECKOUT PRODUCTS INTO products + product_prices
-- Consolidates hardcoded products from src/lib/checkout/products.ts
-- into the database for dynamic resolution.
-- Idempotent: safe to re-run via ON CONFLICT.
-- ============================================================================

-- ============================================================================
-- 1. PRODUCTS
-- ============================================================================

-- Token packs / add-ons parent product
INSERT INTO public.products (key, name, description, product_type, is_subscription, is_active, metadata)
VALUES (
  'tokens',
  'VIVA Token Packs',
  'One-time token packs and recurring token add-ons for VIVA',
  'tokens',
  false,
  true,
  '{"supports_one_time": true, "supports_subscription": true}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  product_type = EXCLUDED.product_type,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Storage add-ons parent product
INSERT INTO public.products (key, name, description, product_type, is_subscription, is_active, metadata)
VALUES (
  'storage',
  'Storage Add-on',
  'Recurring storage add-on for additional cloud storage',
  'storage',
  true,
  true,
  '{"supports_subscription": true}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  product_type = EXCLUDED.product_type,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- 2. TOKEN PACK PRICES (one-time)
-- ============================================================================

-- We use a CTE to get the token product ID, then insert prices.
-- stripe_price_id is nullable; env-var name stored in metadata for resolution.

WITH token_product AS (
  SELECT id FROM public.products WHERE key = 'tokens'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES
  -- Power Pack: 2M tokens, $99
  (
    (SELECT id FROM token_product),
    NULL,
    'usd',
    9900,
    NULL, 1, true,
    '{
      "pack_key": "power",
      "pack_name": "Power Pack",
      "description": "2M VIVA tokens - one-time purchase",
      "grant_amount": 2000000,
      "grant_unit": "tokens",
      "sort_order": 1,
      "is_popular": false,
      "stripe_price_env": "STRIPE_PRICE_TOKEN_POWER",
      "highlights": ["2M VIVA tokens", "Never expires", "Use for any VIVA feature"],
      "features": ["2M VIVA tokens", "Never expires", "Use for any VIVA feature", "Stacks with existing balance"]
    }'::jsonb
  ),
  -- Mega Pack: 5M tokens, $199
  (
    (SELECT id FROM token_product),
    NULL,
    'usd',
    19900,
    NULL, 1, true,
    '{
      "pack_key": "mega",
      "pack_name": "Mega Pack",
      "description": "5M VIVA tokens - one-time purchase",
      "grant_amount": 5000000,
      "grant_unit": "tokens",
      "sort_order": 2,
      "is_popular": true,
      "stripe_price_env": "STRIPE_PRICE_TOKEN_MEGA",
      "highlights": ["5M VIVA tokens", "Never expires", "Best value per token"],
      "features": ["5M VIVA tokens", "Never expires", "Use for any VIVA feature", "Stacks with existing balance"]
    }'::jsonb
  ),
  -- Ultra Pack: 12M tokens, $399
  (
    (SELECT id FROM token_product),
    NULL,
    'usd',
    39900,
    NULL, 1, true,
    '{
      "pack_key": "ultra",
      "pack_name": "Ultra Pack",
      "description": "12M VIVA tokens - one-time purchase",
      "grant_amount": 12000000,
      "grant_unit": "tokens",
      "sort_order": 3,
      "is_popular": false,
      "stripe_price_env": "STRIPE_PRICE_TOKEN_ULTRA",
      "highlights": ["12M VIVA tokens", "Never expires", "Maximum token value"],
      "features": ["12M VIVA tokens", "Never expires", "Use for any VIVA feature", "Stacks with existing balance"]
    }'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. TOKEN ADD-ON PRICES (recurring subscription)
-- ============================================================================

WITH token_product AS (
  SELECT id FROM public.products WHERE key = 'tokens'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES
  -- Token Add-on 28-Day: $29 per 1M tokens per 28-day cycle
  (
    (SELECT id FROM token_product),
    NULL,
    'usd',
    2900,
    'month', 1, true,
    '{
      "addon_key": "token_addon_28day",
      "addon_type": "tokens",
      "billing_interval": "28day",
      "grant_amount": 1000000,
      "grant_unit": "tokens",
      "stripe_price_env": "STRIPE_PRICE_TOKEN_ADDON_28DAY",
      "description": "1M VIVA tokens every 28 days"
    }'::jsonb
  ),
  -- Token Add-on Annual: $290 per 1M tokens per year
  (
    (SELECT id FROM token_product),
    NULL,
    'usd',
    29000,
    'year', 1, true,
    '{
      "addon_key": "token_addon_annual",
      "addon_type": "tokens",
      "billing_interval": "annual",
      "grant_amount": 1000000,
      "grant_unit": "tokens",
      "stripe_price_env": "STRIPE_PRICE_TOKEN_ADDON_ANNUAL",
      "description": "1M VIVA tokens per year"
    }'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. STORAGE ADD-ON PRICES (recurring subscription)
-- ============================================================================

WITH storage_product AS (
  SELECT id FROM public.products WHERE key = 'storage'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES
  -- Storage Add-on 28-Day: $9 per 100GB per 28-day cycle
  (
    (SELECT id FROM storage_product),
    NULL,
    'usd',
    900,
    'month', 1, true,
    '{
      "addon_key": "storage_addon_28day",
      "addon_type": "storage",
      "billing_interval": "28day",
      "grant_amount": 100,
      "grant_unit": "storage_gb",
      "stripe_price_env": "STRIPE_PRICE_STORAGE_ADDON_28DAY",
      "description": "100GB additional storage every 28 days"
    }'::jsonb
  ),
  -- Storage Add-on Annual: $90 per 100GB per year
  (
    (SELECT id FROM storage_product),
    NULL,
    'usd',
    9000,
    'year', 1, true,
    '{
      "addon_key": "storage_addon_annual",
      "addon_type": "storage",
      "billing_interval": "annual",
      "grant_amount": 100,
      "grant_unit": "storage_gb",
      "stripe_price_env": "STRIPE_PRICE_STORAGE_ADDON_ANNUAL",
      "description": "100GB additional storage per year"
    }'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. INTENSIVE PRICE VARIANTS
-- We add 2pay and 3pay price entries for the existing intensive product.
-- The intensive product should already exist from the ecommerce backfill.
-- ============================================================================

-- Ensure intensive product exists
INSERT INTO public.products (key, name, description, product_type, is_subscription, is_active, metadata)
VALUES (
  'intensive',
  'Vision Activation Intensive',
  '72-Hour Vision Activation Intensive experience',
  'intensive',
  false,
  true,
  '{"supports_payment_plans": true}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = products.metadata || EXCLUDED.metadata,
  updated_at = NOW();

-- Ensure household intensive product exists
INSERT INTO public.products (key, name, description, product_type, is_subscription, is_active, metadata)
VALUES (
  'intensive_household',
  'Vision Activation Intensive - Household',
  '72-Hour Vision Activation Intensive for households (2 people)',
  'intensive',
  false,
  true,
  '{"supports_payment_plans": true, "is_household": true}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = products.metadata || EXCLUDED.metadata,
  updated_at = NOW();

-- Solo intensive price variants
WITH intensive_product AS (
  SELECT id FROM public.products WHERE key = 'intensive'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES
  -- Full pay: $499
  (
    (SELECT id FROM intensive_product),
    NULL,
    'usd',
    49900,
    NULL, 1, true,
    '{
      "payment_plan": "full",
      "plan_type": "solo",
      "installments": 1,
      "stripe_price_env": "STRIPE_PRICE_INTENSIVE_FULL",
      "description": "Vision Activation Intensive - One-time payment"
    }'::jsonb
  ),
  -- 2-pay: $249.50 x 2
  (
    (SELECT id FROM intensive_product),
    NULL,
    'usd',
    24950,
    'month', 1, true,
    '{
      "payment_plan": "2pay",
      "plan_type": "solo",
      "installments": 2,
      "stripe_price_env": "STRIPE_PRICE_INTENSIVE_2PAY",
      "description": "Vision Activation Intensive - 2 payments"
    }'::jsonb
  ),
  -- 3-pay: $166.33 x 3
  (
    (SELECT id FROM intensive_product),
    NULL,
    'usd',
    16633,
    'month', 1, true,
    '{
      "payment_plan": "3pay",
      "plan_type": "solo",
      "installments": 3,
      "stripe_price_env": "STRIPE_PRICE_INTENSIVE_3PAY",
      "description": "Vision Activation Intensive - 3 payments"
    }'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Household intensive price variants
WITH household_intensive AS (
  SELECT id FROM public.products WHERE key = 'intensive_household'
)
INSERT INTO public.product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
VALUES
  -- Full pay: $699
  (
    (SELECT id FROM household_intensive),
    NULL,
    'usd',
    69900,
    NULL, 1, true,
    '{
      "payment_plan": "full",
      "plan_type": "household",
      "installments": 1,
      "stripe_price_env": "STRIPE_PRICE_HOUSEHOLD_INTENSIVE_FULL",
      "description": "Vision Activation Intensive Household - One-time payment"
    }'::jsonb
  ),
  -- 2-pay: $349.50 x 2
  (
    (SELECT id FROM household_intensive),
    NULL,
    'usd',
    34950,
    'month', 1, true,
    '{
      "payment_plan": "2pay",
      "plan_type": "household",
      "installments": 2,
      "stripe_price_env": "STRIPE_PRICE_HOUSEHOLD_INTENSIVE_2PAY",
      "description": "Vision Activation Intensive Household - 2 payments"
    }'::jsonb
  ),
  -- 3-pay: $233 x 3
  (
    (SELECT id FROM household_intensive),
    NULL,
    'usd',
    23300,
    'month', 1, true,
    '{
      "payment_plan": "3pay",
      "plan_type": "household",
      "installments": 3,
      "stripe_price_env": "STRIPE_PRICE_HOUSEHOLD_INTENSIVE_3PAY",
      "description": "Vision Activation Intensive Household - 3 payments"
    }'::jsonb
  )
ON CONFLICT DO NOTHING;
