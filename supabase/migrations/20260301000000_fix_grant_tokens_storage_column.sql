-- Fix: grant_tokens_for_tier references wrong column names for user_storage
--
-- Bug: The function used `storage_quota_gb` but the user_storage table column
-- is `quota_gb`. It also referenced a non-existent `updated_at` column.
-- This caused the entire function to fail, preventing BOTH token grants
-- AND storage grants on every intensive purchase.

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
  SELECT * INTO v_tier
  FROM membership_tiers
  WHERE id = p_tier_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tier not found: %', p_tier_id;
  END IF;
  
  SELECT (get_user_token_balance(p_user_id)->>'total_active')::INTEGER
  INTO v_current_balance;
  
  IF v_tier.billing_interval = 'year' THEN
    v_grant_amount := v_tier.annual_token_grant;
    v_expires_at := NOW() + INTERVAL '364 days';
    v_action_type := 'subscription_grant';
  ELSIF v_tier.billing_interval = 'month' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NOW() + INTERVAL '84 days';
    v_action_type := 'subscription_grant';
  ELSIF v_tier.billing_interval = 'one-time' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NULL;
    v_action_type := 'trial_grant';
  ELSE
    RAISE EXCEPTION 'Unknown billing interval: %', v_tier.billing_interval;
  END IF;
  
  v_new_balance := v_current_balance + v_grant_amount;
  
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
    -v_grant_amount,
    v_grant_amount,
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
  
  INSERT INTO user_storage (
    user_id,
    quota_gb,
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
    quota_gb = EXCLUDED.quota_gb,
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
