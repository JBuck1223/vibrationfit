-- Pricing restore (Aug 2026) - reverses 20260728163500_reprice_intensive_97_monthly_37:
--   Vision Activation Intensive: $97 -> $499 (household $147 -> $699)
--   2-pay reinstated: $275 x 2 solo (existing price_1ToDvC...Wcu9),
--     $399 x 2 household (new price_1U18mz...Wvc1lsiB, 2-week cadence)
--   Vision Pro continuity: $37/month -> $99 every 28 days (household $57 -> $149)
--     back to the original day/28 Stripe prices
--   Vision Pro Annual: $370 -> $999 solo (price_1SHGXh... reactivated in Stripe),
--     $570 -> $1,490 household (new price_1U18mz...H2mZimYq)
--   Family Activation + Seat: seat add-on $19 -> $29 every 28 days / $190 -> $290 year
--     (new dedicated Stripe prices; fixes previously swapped IDs)
--   Launch coupons re-anchored so the $1 verification stays $1 at $499/$699
--   Existing $37/$57 monthly subscribers keep their current Stripe prices (the
--   month/1 prices and add-on rows created in July remain active for them).

-- ============================================================
-- 1. product_prices: intensive one-time amounts
-- ============================================================

-- Solo intensive full: $97 -> $499
UPDATE product_prices
SET unit_amount = 49900, updated_at = NOW()
WHERE unit_amount = 9700
  AND product_id IN (SELECT id FROM products WHERE key = 'intensive');

-- Household intensive full: $147 -> $699 (rows exist on both 'intensive' and
-- legacy 'intensive_household' products)
UPDATE product_prices
SET unit_amount = 69900, updated_at = NOW()
WHERE unit_amount = 14700
  AND product_id IN (SELECT id FROM products WHERE key IN ('intensive', 'intensive_household'));

-- ============================================================
-- 2. product_prices: reinstate 2-pay installment plans
-- ============================================================

-- Solo 2-pay: $275 x 2 (existing Stripe price, week/2 cadence, still active)
UPDATE product_prices
SET is_active = true,
    unit_amount = 27500,
    stripe_price_id = 'price_1ToDvCFVKmXx41XwGwwrWcu9',
    metadata = metadata || '{"description":"Vision Activation Intensive - 2 payments of $275 (2nd in 2 weeks)"}'::jsonb,
    updated_at = NOW()
WHERE metadata->>'payment_plan' = '2pay'
  AND metadata->>'plan_type' = 'solo'
  AND product_id IN (SELECT id FROM products WHERE key = 'intensive');

-- Household 2-pay: $399 x 2 (new Stripe price, week/2 cadence)
UPDATE product_prices
SET is_active = true,
    unit_amount = 39900,
    interval_unit = 'week',
    interval_count = 2,
    stripe_price_id = 'price_1U18mzFVKmXx41XwWvc1lsiB',
    metadata = metadata || '{"cadence":"every_2_weeks","description":"Household Activation Intensive - 2 payments of $399 (2nd in 2 weeks)"}'::jsonb,
    updated_at = NOW()
WHERE metadata->>'payment_plan' = '2pay'
  AND metadata->>'plan_type' = 'household'
  AND product_id IN (SELECT id FROM products WHERE key = 'intensive');

-- Legacy intensive_household product 2-pay row: align amount but keep inactive
-- (checkout resolves 2-pay from the 'intensive' product rows above)
UPDATE product_prices
SET unit_amount = 39900, updated_at = NOW()
WHERE metadata->>'payment_plan' = '2pay'
  AND product_id IN (SELECT id FROM products WHERE key = 'intensive_household');

-- ============================================================
-- 3. product_prices: Vision Pro continuity back to 28-day prices
-- ============================================================

UPDATE product_prices
SET unit_amount = 9900, stripe_price_id = 'price_1SHGZCFVKmXx41Xw1dhfKW1u', interval_unit = 'day', interval_count = 28, updated_at = NOW()
WHERE product_id IN (SELECT id FROM products WHERE key = 'vision_pro_28day');

UPDATE product_prices
SET unit_amount = 14900, stripe_price_id = 'price_1SzfriFVKmXx41Xwst5GkIp6', interval_unit = 'day', interval_count = 28, updated_at = NOW()
WHERE product_id IN (SELECT id FROM products WHERE key = 'vision_pro_household_28day');

UPDATE product_prices
SET unit_amount = 99900, stripe_price_id = 'price_1SHGXhFVKmXx41XwJlMJbUJa', updated_at = NOW()
WHERE product_id IN (SELECT id FROM products WHERE key = 'vision_pro_annual');

UPDATE product_prices
SET unit_amount = 149000, stripe_price_id = 'price_1U18mzFVKmXx41XwH2mZimYq', updated_at = NOW()
WHERE product_id IN (SELECT id FROM products WHERE key = 'vision_pro_household_annual');

-- ============================================================
-- 4. membership_tiers: prices, names, copy (token grants unchanged)
-- ============================================================

UPDATE membership_tiers
SET price_monthly = 49900, updated_at = NOW()
WHERE tier_type = 'intensive';

UPDATE membership_tiers
SET price_monthly = 69900, updated_at = NOW()
WHERE tier_type = 'intensive_household';

UPDATE membership_tiers
SET price_monthly = 9900,
    name = 'Vision Pro 28-Day',
    description = 'Flexible 28-day access with 375k AI tokens every cycle',
    stripe_price_id = 'price_1SHGZCFVKmXx41Xw1dhfKW1u',
    features = '["375k VIVA tokens per 28 days","25GB storage","Life Vision Builder (12 categories)","Vision Boards & Audio","VIVA AI Assistant","Unused tokens roll over (max 3 cycles)","Cancel anytime"]'::jsonb,
    updated_at = NOW()
WHERE tier_type = 'vision_pro_28day';

UPDATE membership_tiers
SET price_monthly = 14900,
    name = 'Vision Pro Household 28-Day',
    description = 'Flexible 28-day access for 2 people with 750k shared AI tokens every cycle',
    stripe_price_id = 'price_1SzfriFVKmXx41Xwst5GkIp6',
    features = '["750k VIVA tokens per 28 days (375k per seat)","100GB storage (shared)","2 included seats","Add more family members ($199 activation + $29 every 28 days each)","Life Vision Builder (12 categories)","Individual & shared visions","Optional token sharing","Unused tokens roll over (max 3 cycles)"]'::jsonb,
    updated_at = NOW()
WHERE tier_type = 'vision_pro_household_28day';

UPDATE membership_tiers
SET price_yearly = 99900,
    stripe_price_id = 'price_1SHGXhFVKmXx41XwJlMJbUJa',
    updated_at = NOW()
WHERE tier_type = 'vision_pro_annual';

UPDATE membership_tiers
SET price_yearly = 149000,
    stripe_price_id = 'price_1U18mzFVKmXx41XwH2mZimYq',
    updated_at = NOW()
WHERE tier_type = 'vision_pro_household_annual';

-- ============================================================
-- 5. Seat add-on tiers: $29 every 28 days / $290 per year
--    (new dedicated Stripe prices under the "Household Seat Add-On" product)
-- ============================================================

UPDATE membership_tiers
SET stripe_price_id = NULL, updated_at = NOW()
WHERE tier_type IN ('household_addon_28day', 'household_addon_annual');

UPDATE membership_tiers
SET price_monthly = 2900,
    stripe_price_id = 'price_1U18n9FVKmXx41XwO8IEgYjq',
    updated_at = NOW()
WHERE tier_type = 'household_addon_28day';

UPDATE membership_tiers
SET price_yearly = 29000,
    stripe_price_id = 'price_1U18nAFVKmXx41XwcjqAt8pP',
    updated_at = NOW()
WHERE tier_type = 'household_addon_annual';

-- ============================================================
-- 6. Coupons
-- ============================================================

-- Launch "$1 intensive" coupons re-anchored to $499/$699 so checkout stays $1
UPDATE coupons
SET discount_value = 49800,
    metadata = jsonb_set(metadata, '{description}', '"$498 off Solo Intensive ($1 verification)"'),
    updated_at = NOW()
WHERE name = 'Launch 2026 - Solo Intensive';

UPDATE coupons
SET discount_value = 69800,
    metadata = jsonb_set(metadata, '{description}', '"$698 off Household Intensive ($1 verification)"'),
    updated_at = NOW()
WHERE name = 'Launch 2026 - Household Intensive';

-- Free household intensive add-on: covers the $199 Family Activation Intensive
UPDATE coupons
SET discount_value = 19900, updated_at = NOW()
WHERE name = 'Free Household Intensive Add-on';
