-- Check a user's subscription tier
-- Replace the email below with the user you want to check

WITH user_info AS (
  SELECT 
    au.id as user_id,
    au.email,
    up.first_name,
    up.last_name
  FROM auth.users au
  LEFT JOIN user_profiles up ON up.user_id = au.id AND up.is_active = true
  WHERE au.email = 'buckinghambliss@gmail.com'  -- ⬅️ CHANGE THIS EMAIL
)
SELECT 
  ui.email,
  ui.first_name,
  ui.last_name,
  cs.status as subscription_status,
  mt.name as tier_name,
  mt.tier_type,
  mt.price_monthly / 100.0 as price_monthly_dollars,
  mt.price_yearly / 100.0 as price_yearly_dollars,
  mt.billing_interval,
  mt.viva_tokens_monthly as tokens_per_cycle,
  mt.storage_quota_gb,
  cs.stripe_customer_id,
  cs.stripe_subscription_id,
  cs.current_period_start,
  cs.current_period_end,
  cs.created_at as subscription_created,
  CASE 
    WHEN cs.id IS NULL THEN 'Free (No subscription)'
    WHEN cs.status NOT IN ('active', 'trialing') THEN 'Free (Subscription ' || cs.status || ')'
    ELSE mt.name
  END as display_tier
FROM user_info ui
LEFT JOIN customer_subscriptions cs ON cs.user_id = ui.user_id
LEFT JOIN membership_tiers mt ON cs.tier_id = mt.id
ORDER BY cs.created_at DESC
LIMIT 1;

-- Also show ALL membership tiers available
SELECT 
  name,
  tier_type,
  price_monthly / 100.0 as price_monthly_dollars,
  price_yearly / 100.0 as price_yearly_dollars,
  billing_interval,
  viva_tokens_monthly,
  is_active,
  is_popular,
  display_order
FROM membership_tiers
WHERE is_active = true
ORDER BY display_order;

