-- Migration: Update token grants, storage quotas, and expiration logic
-- 
-- Changes:
--   Activation Intensive: 1M -> 5M tokens, no expiration
--   Household Intensive: 2M -> 10M tokens, no expiration
--   28-day subscriptions: 375k -> 1M tokens, 84-day expiry, 250 GB storage
--   Annual subscriptions: 5M -> 20M tokens, 364-day expiry, 500 GB storage
--   Household 28-day: 750k -> 2M tokens, 250 GB storage
--   Household Annual: 5M -> 20M tokens, 500 GB storage

-- ============================================================================
-- 1. Update membership_tiers table values
-- ============================================================================

-- Activation Intensive (solo)
UPDATE membership_tiers
SET 
  monthly_token_grant = 5000000,
  storage_quota_gb = 100,
  updated_at = NOW()
WHERE tier_type = 'intensive'
  AND (is_household_plan = false OR is_household_plan IS NULL);

-- Household Intensive
UPDATE membership_tiers
SET 
  monthly_token_grant = 7500000,
  storage_quota_gb = 100,
  updated_at = NOW()
WHERE tier_type = 'intensive'
  AND is_household_plan = true;

-- Vision Pro 28-Day (solo)
UPDATE membership_tiers
SET 
  monthly_token_grant = 1000000,
  storage_quota_gb = 250,
  updated_at = NOW()
WHERE tier_type = 'vision_pro_28day'
  AND (is_household_plan = false OR is_household_plan IS NULL);

-- Vision Pro Annual (solo)
UPDATE membership_tiers
SET 
  annual_token_grant = 20000000,
  storage_quota_gb = 500,
  updated_at = NOW()
WHERE tier_type = 'vision_pro_annual'
  AND (is_household_plan = false OR is_household_plan IS NULL);

-- Vision Pro Household 28-Day
UPDATE membership_tiers
SET 
  monthly_token_grant = 1500000,
  storage_quota_gb = 250,
  updated_at = NOW()
WHERE tier_type = 'vision_pro_28day'
  AND is_household_plan = true;

-- Vision Pro Household Annual
UPDATE membership_tiers
SET 
  annual_token_grant = 30000000,
  storage_quota_gb = 500,
  updated_at = NOW()
WHERE tier_type = 'vision_pro_annual'
  AND is_household_plan = true;

-- ============================================================================
-- 2. Update grant_tokens_for_tier function with new expiration logic
-- ============================================================================

CREATE OR REPLACE FUNCTION public.grant_tokens_for_tier(
  p_user_id uuid, 
  p_tier_id uuid, 
  p_subscription_id uuid DEFAULT NULL::uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_tier membership_tiers;
  v_current_balance INTEGER;
  v_grant_amount INTEGER;
  v_new_balance INTEGER;
  v_expires_at TIMESTAMPTZ;
  v_action_type token_action_type;
BEGIN
  -- Get tier configuration
  SELECT * INTO v_tier
  FROM membership_tiers
  WHERE id = p_tier_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tier not found: %', p_tier_id;
  END IF;
  
  -- Calculate current balance
  SELECT (get_user_token_balance(p_user_id)->>'total_active')::INTEGER
  INTO v_current_balance;
  
  -- Determine grant amount and expiration based on billing interval
  IF v_tier.billing_interval = 'year' THEN
    v_grant_amount := v_tier.annual_token_grant;
    v_expires_at := NOW() + INTERVAL '364 days';
    v_action_type := 'subscription_grant';
  ELSIF v_tier.billing_interval = 'month' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NOW() + INTERVAL '84 days'; -- 28-day grants expire after 3 cycles
    v_action_type := 'subscription_grant';
  ELSIF v_tier.billing_interval = 'one-time' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NULL; -- Intensive tokens never expire
    v_action_type := 'trial_grant';
  ELSE
    RAISE EXCEPTION 'Unknown billing interval: %', v_tier.billing_interval;
  END IF;
  
  v_new_balance := v_current_balance + v_grant_amount;
  
  -- Insert token grant into token_transactions with expiration
  INSERT INTO token_transactions (
    user_id,
    action_type,
    tokens_used,
    tokens_remaining,
    subscription_id,
    metadata,
    expires_at
  ) VALUES (
    p_user_id,
    v_action_type,
    -v_grant_amount, -- Negative because it's a grant
    v_grant_amount, -- Initial remaining equals granted
    p_subscription_id,
    jsonb_build_object(
      'tier_id', p_tier_id,
      'tier_type', v_tier.tier_type,
      'tier_name', v_tier.name,
      'plan_category', v_tier.plan_category,
      'grant_type', v_tier.billing_interval
    ),
    v_expires_at
  );
  
  -- Insert storage grant
  INSERT INTO user_storage (
    user_id,
    storage_quota_gb,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    v_tier.storage_quota_gb,
    p_subscription_id,
    jsonb_build_object(
      'tier_id', p_tier_id,
      'tier_type', v_tier.tier_type,
      'granted_at', NOW()
    )
  )
  ON CONFLICT (user_id, subscription_id)
  DO UPDATE SET
    storage_quota_gb = EXCLUDED.storage_quota_gb,
    updated_at = NOW(),
    metadata = EXCLUDED.metadata;
  
  RETURN jsonb_build_object(
    'success', true,
    'tokens_granted', v_grant_amount,
    'new_balance', v_new_balance,
    'storage_quota_gb', v_tier.storage_quota_gb,
    'expires_at', v_expires_at,
    'tier', jsonb_build_object(
      'id', v_tier.id,
      'name', v_tier.name,
      'tier_type', v_tier.tier_type
    )
  );
END;
$$;

COMMENT ON FUNCTION public.grant_tokens_for_tier(p_user_id uuid, p_tier_id uuid, p_subscription_id uuid) 
IS 'Universal token grant function that reads from membership_tiers table. Intensive tokens never expire. 28-day tokens expire in 84 days. Annual tokens expire in 364 days.';
