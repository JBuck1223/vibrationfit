-- Fix: get_user_token_balance referenced user_profiles.household_id which doesn't exist.
-- The household_id column is on user_accounts, not user_profiles.
-- This caused the function to error on every call, returning no token data.

CREATE OR REPLACE FUNCTION public.get_user_token_balance(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_grant_user_id UUID;
  v_household_id UUID;
  v_household_user_ids UUID[];
  v_total_granted BIGINT;
  v_total_used BIGINT;
  v_total_expired BIGINT;
  v_active_balance BIGINT;
  v_grants JSONB;
BEGIN
  -- Check if user is in an active household (household_id lives on user_accounts)
  SELECT ua.household_id INTO v_household_id
  FROM user_accounts ua
  WHERE ua.id = p_user_id
    AND ua.household_id IS NOT NULL;

  IF v_household_id IS NOT NULL THEN
    -- Get the admin (bill-payer) of this household
    SELECT h.admin_user_id INTO v_grant_user_id
    FROM households h
    WHERE h.id = v_household_id;

    -- All active members share usage against the admin's grants
    SELECT ARRAY_AGG(hm.user_id) INTO v_household_user_ids
    FROM household_members hm
    WHERE hm.household_id = v_household_id
      AND hm.status = 'active';

    -- Safety: if array is null, fall back to just the requesting user
    IF v_household_user_ids IS NULL THEN
      v_household_user_ids := ARRAY[p_user_id];
    END IF;
  ELSE
    -- Solo user: grants and usage are their own
    v_grant_user_id := p_user_id;
    v_household_user_ids := ARRAY[p_user_id];
  END IF;

  -- Unexpired grants (from the grant owner = admin or self)
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_granted
  FROM token_transactions
  WHERE user_id = v_grant_user_id
    AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant',
                        'token_pack_purchase', 'pack_purchase', 'admin_grant')
    AND tokens_used > 0
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Expired grants (from the grant owner)
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_expired
  FROM token_transactions
  WHERE user_id = v_grant_user_id
    AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'admin_grant')
    AND tokens_used > 0
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();

  -- Total usage from ALL household members (or just the solo user)
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_used
  FROM token_usage
  WHERE user_id = ANY(v_household_user_ids)
    AND success = true
    AND action_type NOT IN ('admin_grant', 'subscription_grant', 'renewal_grant',
                            'trial_grant', 'token_pack_purchase', 'pack_purchase',
                            'admin_deduct');

  v_active_balance := v_total_granted - v_total_used;
  IF v_active_balance < 0 THEN
    v_active_balance := 0;
  END IF;

  -- Grants summary (from grant owner)
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'action_type', action_type,
      'total_granted', total_granted,
      'expires_at', expires_at,
      'is_expired', (expires_at IS NOT NULL AND expires_at <= NOW())
    )
  )
  INTO v_grants
  FROM (
    SELECT
      action_type,
      SUM(tokens_used) as total_granted,
      MAX(expires_at) as expires_at
    FROM token_transactions
    WHERE user_id = v_grant_user_id
      AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant',
                          'token_pack_purchase', 'pack_purchase', 'admin_grant')
      AND tokens_used > 0
    GROUP BY action_type
    ORDER BY MAX(created_at)
  ) grants_summary;

  RETURN JSONB_BUILD_OBJECT(
    'total_active', v_active_balance,
    'total_granted', v_total_granted,
    'total_used', v_total_used,
    'total_expired', v_total_expired,
    'grants', COALESCE(v_grants, '[]'::jsonb),
    'is_household_shared', v_household_id IS NOT NULL,
    'grant_owner_id', v_grant_user_id
  );
END;
$$;

COMMENT ON FUNCTION public.get_user_token_balance(p_user_id uuid)
IS 'Shared-pool model: household members resolve to admin grants minus all members usage. Solo users unchanged.';
