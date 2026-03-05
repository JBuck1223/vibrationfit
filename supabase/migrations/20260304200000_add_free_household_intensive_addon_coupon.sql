-- Add Free-Household-Intensive-Addon coupon ($200 off $200 = free)
INSERT INTO coupons (
  name,
  discount_type,
  discount_value,
  currency,
  max_redemptions_per_user,
  is_active
) VALUES (
  'Free Household Intensive Add-on',
  'fixed',
  20000,
  'usd',
  1,
  true
)
ON CONFLICT DO NOTHING;

-- Add the code linked to the coupon
INSERT INTO coupon_codes (
  coupon_id,
  code,
  is_active
) VALUES (
  (SELECT id FROM coupons WHERE name = 'Free Household Intensive Add-on' LIMIT 1),
  'FREE-HOUSEHOLD-INTENSIVE-ADDON',
  true
)
ON CONFLICT DO NOTHING;
