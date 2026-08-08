-- HOUSEHOLD2026 was scoped to legacy product key `intensive_household`, but
-- checkout carts always use product_key `intensive` + plan_type=household.
-- Without this, remapping LAUNCH2026 → HOUSEHOLD2026 would fail validation.
-- Also ensure the $1 household discount stays anchored at $698 off $699.

UPDATE coupons
SET eligible_products = ARRAY['intensive', 'intensive_household']::text[],
    discount_value = 69800,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{description}',
      '"$698 off Household Intensive ($1 verification)"'
    ),
    updated_at = NOW()
WHERE name = 'Launch 2026 - Household Intensive';
