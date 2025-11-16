-- ============================================================================
-- UPDATE TOKEN GRANT FUNCTIONS TO READ FROM MEMBERSHIP_TIERS
-- ============================================================================
-- Migration: 20251115000005_update_grant_functions_use_membership_tiers.sql
-- Description: Update grant functions to be tier-agnostic and read from membership_tiers table
-- ============================================================================

-- ============================================================================
-- DROP OLD FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS grant_annual_tokens(UUID, UUID);
DROP FUNCTION IF EXISTS drip_tokens_28day(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS grant_trial_tokens(UUID, UUID, INTEGER, INTEGER);

-- ============================================================================
-- NEW: UNIFIED TOKEN GRANT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_tokens_for_tier(
  p_user_id UUID,
  p_tier_id UUID,
  p_subscription_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
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
    v_expires_at := NOW() + INTERVAL '365 days';
    v_action_type := 'subscription_grant';
  ELSIF v_tier.billing_interval = 'month' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NOW() + INTERVAL '90 days'; -- 28-day grants expire after 3 cycles
    v_action_type := 'subscription_grant';
  ELSIF v_tier.billing_interval = 'one-time' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NOW() + INTERVAL '56 days'; -- Intensive trial period
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- WRAPPER: GRANT BY STRIPE PRICE ID (for webhook)
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_tokens_by_stripe_price_id(
  p_user_id UUID,
  p_stripe_price_id TEXT,
  p_subscription_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  -- Look up tier by Stripe price ID
  SELECT id INTO v_tier_id
  FROM membership_tiers
  WHERE stripe_price_id = p_stripe_price_id
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active tier found for Stripe price ID: %', p_stripe_price_id;
  END IF;
  
  -- Grant tokens for that tier
  RETURN grant_tokens_for_tier(p_user_id, v_tier_id, p_subscription_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- LEGACY WRAPPER FUNCTIONS (for backwards compatibility)
-- ============================================================================

-- Wrapper: grant_annual_tokens (uses Vision Pro Annual tier)
CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  -- Get Vision Pro Annual tier ID
  SELECT id INTO v_tier_id
  FROM membership_tiers
  WHERE tier_type = 'vision_pro_annual'
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vision Pro Annual tier not found';
  END IF;
  
  RETURN grant_tokens_for_tier(p_user_id, v_tier_id, p_subscription_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper: drip_tokens_28day (uses Vision Pro 28-Day tier)
CREATE OR REPLACE FUNCTION drip_tokens_28day(
  p_user_id UUID,
  p_subscription_id UUID,
  p_cycle_number INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  -- Get Vision Pro 28-Day tier ID
  SELECT id INTO v_tier_id
  FROM membership_tiers
  WHERE tier_type = 'vision_pro_28day'
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vision Pro 28-Day tier not found';
  END IF;
  
  RETURN grant_tokens_for_tier(p_user_id, v_tier_id, p_subscription_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper: grant_trial_tokens (uses Intensive tier)
CREATE OR REPLACE FUNCTION grant_trial_tokens(
  p_user_id UUID,
  p_intensive_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  -- Get Intensive tier ID
  SELECT id INTO v_tier_id
  FROM membership_tiers
  WHERE tier_type = 'intensive'
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intensive tier not found';
  END IF;
  
  RETURN grant_tokens_for_tier(p_user_id, v_tier_id, p_intensive_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER: GET TIER BY TIER_TYPE (for easy lookups)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_tier_by_type(p_tier_type TEXT)
RETURNS membership_tiers AS $$
DECLARE
  v_tier membership_tiers;
BEGIN
  SELECT * INTO v_tier
  FROM membership_tiers
  WHERE tier_type = p_tier_type::membership_tier_type
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tier not found: %', p_tier_type;
  END IF;
  
  RETURN v_tier;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- GRANTS & COMMENTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION grant_tokens_for_tier(UUID, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION grant_tokens_by_stripe_price_id(UUID, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION grant_annual_tokens(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION drip_tokens_28day(UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION grant_trial_tokens(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_tier_by_type(TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION grant_tokens_for_tier IS 'Universal token grant function that reads from membership_tiers table';
COMMENT ON FUNCTION grant_tokens_by_stripe_price_id IS 'Grant tokens by looking up tier from Stripe price ID (for webhooks)';
COMMENT ON FUNCTION get_tier_by_type IS 'Get tier configuration by tier_type enum value';


