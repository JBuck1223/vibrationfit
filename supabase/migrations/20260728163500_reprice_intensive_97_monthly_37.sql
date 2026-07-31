-- Repricing (Jul 2026):
--   Vision Activation Intensive: $499 -> $97 (household $699 -> $147); 2-pay retired
--   Vision Pro continuity: $99/28-day -> $37/calendar month (household $149 -> $57)
--   Vision Pro Annual: -> $370/yr solo, $570/yr household (10 months' price)
--   New monthly (month/1) Stripe prices created for continuity + add-ons; legacy
--   day/28 prices remain active in Stripe for existing subscribers.
--   Also fixes swapped seat add-on stripe_price_ids on household_addon tiers.

-- ============================================================
-- 1. product_prices: intensive one-time amounts
-- ============================================================

-- Solo intensive full: $499 -> $97
UPDATE product_prices
SET unit_amount = 9700, updated_at = NOW()
WHERE unit_amount = 49900
  AND product_id IN (SELECT id FROM products WHERE key = 'intensive');

-- Household intensive full: $699 -> $147 (rows exist on both 'intensive' and
-- legacy 'intensive_household' products)
UPDATE product_prices
SET unit_amount = 14700, updated_at = NOW()
WHERE unit_amount = 69900
  AND product_id IN (SELECT id FROM products WHERE key IN ('intensive', 'intensive_household'));

-- Retire 2-pay installment plans (price no longer warrants installments)
UPDATE product_prices
SET is_active = false, updated_at = NOW()
WHERE metadata->>'payment_plan' = '2pay'
  AND product_id IN (SELECT id FROM products WHERE key IN ('intensive', 'intensive_household'));

-- ============================================================
-- 2. product_prices: Vision Pro continuity
-- ============================================================

UPDATE product_prices
SET unit_amount = 3700, stripe_price_id = 'price_1TyE95FVKmXx41Xw2g4vYLTp', updated_at = NOW()
WHERE product_id IN (SELECT id FROM products WHERE key = 'vision_pro_28day');

UPDATE product_prices
SET unit_amount = 5700, stripe_price_id = 'price_1TyE95FVKmXx41XwD90Wxf55', updated_at = NOW()
WHERE product_id IN (SELECT id FROM products WHERE key = 'vision_pro_household_28day');

UPDATE product_prices
SET unit_amount = 37000, stripe_price_id = 'price_1TyE96FVKmXx41XwDxf3ZYHL', updated_at = NOW()
WHERE product_id IN (SELECT id FROM products WHERE key = 'vision_pro_annual');

UPDATE product_prices
SET unit_amount = 57000, stripe_price_id = 'price_1TyE96FVKmXx41XwxNk9DDrC', updated_at = NOW()
WHERE product_id IN (SELECT id FROM products WHERE key = 'vision_pro_household_annual');

-- ============================================================
-- 3. product_prices: monthly add-on prices (calendar month) for new subs.
--    Legacy day/28 add-on rows stay active for pre-Jul-2026 subscribers.
-- ============================================================

INSERT INTO product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
SELECT id, 'price_1TyEBOFVKmXx41XwCuBav7cY', 'usd', 2900, 'month', 1, true,
  '{"addon_key":"token_addon_month","addon_type":"tokens","grant_unit":"tokens","description":"1M VIVA tokens per month","grant_amount":1000000,"billing_interval":"month","stripe_price_env":"STRIPE_PRICE_TOKEN_ADDON_MONTH"}'::jsonb
FROM products WHERE key = 'tokens'
ON CONFLICT DO NOTHING;

INSERT INTO product_prices (product_id, stripe_price_id, currency, unit_amount, interval_unit, interval_count, is_active, metadata)
SELECT id, 'price_1TyEBPFVKmXx41XwbkoL83xZ', 'usd', 900, 'month', 1, true,
  '{"addon_key":"storage_addon_month","addon_type":"storage","grant_unit":"storage_gb","description":"100GB additional storage per month","grant_amount":100,"billing_interval":"month","stripe_price_env":"STRIPE_PRICE_STORAGE_ADDON_MONTH"}'::jsonb
FROM products WHERE key = 'storage'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. membership_tiers: prices, names, copy
-- ============================================================

UPDATE membership_tiers
SET price_monthly = 9700, updated_at = NOW()
WHERE tier_type = 'intensive';

UPDATE membership_tiers
SET price_monthly = 14700, updated_at = NOW()
WHERE tier_type = 'intensive_household';

UPDATE membership_tiers
SET price_monthly = 3700,
    name = 'Vision Pro Monthly',
    description = 'Flexible monthly access with 375k AI tokens every month',
    stripe_price_id = 'price_1TyE95FVKmXx41Xw2g4vYLTp',
    features = '["375k VIVA tokens per month","25GB storage","Life Vision Builder (12 categories)","Vision Boards & Audio","VIVA AI Assistant","Unused tokens roll over (max 3 cycles)","Cancel anytime"]'::jsonb,
    updated_at = NOW()
WHERE tier_type = 'vision_pro_28day';

UPDATE membership_tiers
SET price_monthly = 5700,
    name = 'Vision Pro Household Monthly',
    description = 'Flexible monthly access for 2 people with 750k shared AI tokens every month',
    stripe_price_id = 'price_1TyE95FVKmXx41XwD90Wxf55',
    features = '["750k VIVA tokens per month (375k per seat)","100GB storage (shared)","2 included seats","Add up to 4 more members ($19/month each)","Life Vision Builder (12 categories)","Individual & shared visions","Optional token sharing","Unused tokens roll over (max 3 cycles)"]'::jsonb,
    updated_at = NOW()
WHERE tier_type = 'vision_pro_household_28day';

UPDATE membership_tiers
SET price_yearly = 37000,
    stripe_price_id = 'price_1TyE96FVKmXx41XwDxf3ZYHL',
    updated_at = NOW()
WHERE tier_type = 'vision_pro_annual';

UPDATE membership_tiers
SET price_yearly = 57000,
    stripe_price_id = 'price_1TyE96FVKmXx41XwxNk9DDrC',
    updated_at = NOW()
WHERE tier_type = 'vision_pro_household_annual';

-- Fix swapped seat add-on price IDs (28-day tier had the annual Stripe price and
-- vice versa). Monthly seat price for new subs: price_1TyEBPFVKmXx41Xwy6XEesxr
-- (resolved via STRIPE_PRICE_SEAT_ADDON_MONTH env, not stored on a tier).
-- (stripe_price_id is unique across tiers, so clear both before swapping)
UPDATE membership_tiers
SET stripe_price_id = NULL, updated_at = NOW()
WHERE tier_type IN ('household_addon_28day', 'household_addon_annual');

UPDATE membership_tiers
SET stripe_price_id = 'price_1T7D7HFVKmXx41XwbxXkxwvY', updated_at = NOW()
WHERE tier_type = 'household_addon_28day';

UPDATE membership_tiers
SET stripe_price_id = 'price_1T7D7dFVKmXx41XwQyovZk7c', updated_at = NOW()
WHERE tier_type = 'household_addon_annual';

-- ============================================================
-- 5. Launch "$1 intensive" coupons: fixed discounts must track the new
--    prices ($97 - $96 = $1; $147 - $146 = $1). At the old values ($498/$698)
--    the discounted total would hit $0 and the payment would fail.
-- ============================================================

UPDATE coupons
SET discount_value = 9600,
    metadata = jsonb_set(metadata, '{description}', '"$96 off Solo Intensive ($1 verification)"'),
    updated_at = NOW()
WHERE name = 'Launch 2026 - Solo Intensive';

UPDATE coupons
SET discount_value = 14600,
    metadata = jsonb_set(metadata, '{description}', '"$146 off Household Intensive ($1 verification)"'),
    updated_at = NOW()
WHERE name = 'Launch 2026 - Household Intensive';
