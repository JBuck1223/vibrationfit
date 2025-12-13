-- Grant Vision Pro 28-Day to buckinghambliss@gmail.com
-- ADDITIVE: Does not remove existing subscriptions

-- Insert new subscription (allows multiple active subscriptions)
WITH user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'buckinghambliss@gmail.com'
)
INSERT INTO customer_subscriptions (
  user_id,
  membership_tier_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  stripe_customer_id,
  stripe_subscription_id,
  created_at,
  updated_at
)
SELECT 
  user_lookup.id,
  '284d3fe6-1237-463c-98c8-2e76f13c058a'::uuid, -- Vision Pro 28-Day
  'active',
  NOW(),
  NOW() + INTERVAL '28 days',
  false,
  'manual-grant-vision-pro',
  null,
  NOW(),
  NOW()
FROM user_lookup;

-- Verify ALL active subscriptions for this user
SELECT 
  au.email,
  cs.id as subscription_id,
  cs.status,
  mt.name as tier_name,
  mt.tier_type,
  mt.price_monthly / 100.0 as monthly_price_usd,
  mt.viva_tokens_monthly as tokens_per_cycle,
  mt.storage_quota_gb,
  cs.current_period_start,
  cs.current_period_end,
  cs.stripe_customer_id
FROM auth.users au
JOIN customer_subscriptions cs ON cs.user_id = au.id
JOIN membership_tiers mt ON mt.id = cs.membership_tier_id
WHERE au.email = 'buckinghambliss@gmail.com'
  AND cs.status IN ('active', 'trialing')
ORDER BY cs.created_at DESC;
