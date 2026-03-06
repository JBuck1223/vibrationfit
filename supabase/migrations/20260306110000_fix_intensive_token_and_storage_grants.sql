-- Fix: grant_tokens_for_tier FK violation on intensive purchases
--
-- Bug: grant_trial_tokens passes an order_items.id as p_subscription_id,
-- but both token_transactions.subscription_id and user_storage.subscription_id
-- have FK constraints referencing customer_subscriptions(id).
-- An order_items UUID doesn't exist there → FK violation → entire function
-- rolls back → BOTH token and storage grants silently fail.
--
-- Additionally, ON CONFLICT (user_id, subscription_id) on user_storage had
-- no matching unique constraint, which would also error.
--
-- Fix: For one-time (intensive) grants, use NULL as subscription_id and
-- store the intensive_id in metadata instead.

-- 1. Add the missing unique index for the ON CONFLICT clause
--    (partial: only for rows with a non-null subscription_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_storage_user_subscription
  ON public.user_storage (user_id, subscription_id)
  WHERE subscription_id IS NOT NULL;

-- 2. Rewrite grant_tokens_for_tier to handle intensive grants correctly
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
  v_effective_sub_id UUID;
  v_metadata JSONB;
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
    v_effective_sub_id := p_subscription_id;
  ELSIF v_tier.billing_interval = 'month' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NOW() + INTERVAL '84 days';
    v_action_type := 'subscription_grant';
    v_effective_sub_id := p_subscription_id;
  ELSIF v_tier.billing_interval = 'one-time' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NULL;
    v_action_type := 'trial_grant';
    v_effective_sub_id := NULL;
  ELSE
    RAISE EXCEPTION 'Unknown billing interval: %', v_tier.billing_interval;
  END IF;

  v_new_balance := v_current_balance + v_grant_amount;

  v_metadata := jsonb_build_object(
    'tier_id', p_tier_id,
    'tier_type', v_tier.tier_type,
    'tier_name', v_tier.name,
    'plan_category', v_tier.plan_category,
    'grant_type', v_tier.billing_interval
  );
  IF v_tier.billing_interval = 'one-time' AND p_subscription_id IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('intensive_id', p_subscription_id);
  END IF;

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
    v_effective_sub_id,
    v_metadata,
    v_expires_at
  );

  IF v_effective_sub_id IS NOT NULL THEN
    INSERT INTO user_storage (
      user_id,
      quota_gb,
      subscription_id,
      metadata
    ) VALUES (
      p_user_id,
      v_tier.storage_quota_gb,
      v_effective_sub_id,
      jsonb_build_object(
        'tier_id', p_tier_id,
        'tier_type', v_tier.tier_type,
        'granted_at', NOW()
      )
    )
    ON CONFLICT (user_id, subscription_id) WHERE subscription_id IS NOT NULL
    DO UPDATE SET
      quota_gb = EXCLUDED.quota_gb,
      metadata = EXCLUDED.metadata;
  ELSE
    INSERT INTO user_storage (
      user_id,
      quota_gb,
      subscription_id,
      metadata
    ) VALUES (
      p_user_id,
      v_tier.storage_quota_gb,
      NULL,
      jsonb_build_object(
        'tier_id', p_tier_id,
        'tier_type', v_tier.tier_type,
        'granted_at', NOW(),
        'intensive_id', p_subscription_id
      )
    );
  END IF;

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
IS 'Universal token grant function. For subscriptions, subscription_id is used as FK. For intensives (one-time), subscription_id is stored in metadata to avoid FK violation against customer_subscriptions.';
