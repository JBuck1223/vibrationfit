-- ============================================================================
-- Migration: Simplify Token System - Use token_transactions Only
-- ============================================================================
-- Purpose: Remove token_balances table complexity. Use token_transactions
--          with expires_at field instead. Calculate balance on-the-fly:
--          SUM(unexpired grants) - SUM(usage)
--
-- Date: November 14, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: DROP token_balances TABLE AND RELATED FUNCTIONS
-- ============================================================================

-- 1.1 Drop functions that use token_balances
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS deduct_tokens_with_fifo(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_user_token_balance(UUID);
DROP FUNCTION IF EXISTS expire_old_token_grants();

-- 1.2 Drop deprecated tables
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS token_balances CASCADE;
DROP TABLE IF EXISTS token_drips CASCADE; -- Deprecated: drips now tracked in token_transactions

-- ============================================================================
-- PART 2: ADD expires_at TO token_transactions
-- ============================================================================

-- 2.1 Add expires_at column
-- ----------------------------------------------------------------------------
ALTER TABLE token_transactions 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN token_transactions.expires_at IS 'Expiration date for grants (NULL = never expires for purchases)';

-- 2.2 Create index for expiration queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_token_transactions_expires_at 
ON token_transactions(user_id, expires_at) 
WHERE expires_at IS NOT NULL;

-- 2.3 Backfill expires_at for existing grants
-- ----------------------------------------------------------------------------
UPDATE token_transactions
SET expires_at = CASE 
  -- Subscription grants: 90 days (28-day plans with 3-cycle rollover)
  WHEN action_type = 'subscription_grant' AND tokens_used < 5000000 THEN created_at + INTERVAL '90 days'
  -- Annual grants: 365 days
  WHEN action_type = 'subscription_grant' AND tokens_used >= 5000000 THEN created_at + INTERVAL '365 days'
  WHEN action_type = 'renewal_grant' AND tokens_used < 5000000 THEN created_at + INTERVAL '90 days'
  WHEN action_type = 'renewal_grant' AND tokens_used >= 5000000 THEN created_at + INTERVAL '365 days'
  -- Trial grants: 56 days (8 weeks)
  WHEN action_type = 'trial_grant' THEN created_at + INTERVAL '56 days'
  -- Admin grants: 365 days
  WHEN action_type = 'admin_grant' THEN created_at + INTERVAL '365 days'
  -- Purchases never expire (NULL)
  WHEN action_type IN ('token_pack_purchase', 'pack_purchase') THEN NULL
  -- Default: 365 days
  ELSE created_at + INTERVAL '365 days'
END
WHERE expires_at IS NULL
  AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_grant')
  AND tokens_used > 0; -- Only grants

-- ============================================================================
-- PART 3: CREATE SIMPLIFIED get_user_token_balance FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_token_balance(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_granted BIGINT;
  v_total_used BIGINT;
  v_total_expired BIGINT;
  v_active_balance BIGINT;
  v_grants JSONB;
BEGIN
  -- Calculate total granted from unexpired grants
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_granted
  FROM token_transactions
  WHERE user_id = p_user_id
    AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_grant')
    AND tokens_used > 0
    AND (expires_at IS NULL OR expires_at > NOW()); -- Only count unexpired
  
  -- Calculate total expired
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_expired
  FROM token_transactions
  WHERE user_id = p_user_id
    AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'admin_grant')
    AND tokens_used > 0
    AND expires_at IS NOT NULL
    AND expires_at <= NOW(); -- Expired grants
  
  -- Calculate total used from token_usage
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_used
  FROM token_usage
  WHERE user_id = p_user_id
    AND success = true
    AND action_type NOT IN ('admin_grant', 'subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_deduct');
  
  -- Active balance = unexpired grants - usage
  v_active_balance := v_total_granted - v_total_used;
  
  -- Ensure balance never goes negative
  IF v_active_balance < 0 THEN
    v_active_balance := 0;
  END IF;
  
  -- Get grants summary (grouped by type)
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
    WHERE user_id = p_user_id
      AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_grant')
      AND tokens_used > 0
    GROUP BY action_type
    ORDER BY MAX(created_at)
  ) grants_summary;
  
  RETURN JSONB_BUILD_OBJECT(
    'total_active', v_active_balance,
    'total_granted', v_total_granted,
    'total_used', v_total_used,
    'total_expired', v_total_expired,
    'grants', COALESCE(v_grants, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_token_balance IS 'Calculate user token balance from token_transactions and token_usage (simple: unexpired grants - usage)';

-- ============================================================================
-- PART 4: UPDATE GRANT FUNCTIONS TO SET expires_at
-- ============================================================================

-- 4.1 Update grant_annual_tokens
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS grant_annual_tokens(UUID, UUID);

CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_grant_amount INTEGER := 5000000; -- 5M tokens
  v_new_balance INTEGER;
  v_storage_gb INTEGER := 100;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Calculate current balance
  SELECT (get_user_token_balance(p_user_id)->>'total_active')::INTEGER
  INTO v_current_balance;
  
  v_new_balance := v_current_balance + v_grant_amount;
  v_expires_at := NOW() + INTERVAL '365 days';
  
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
    'subscription_grant',
    v_grant_amount,
    v_new_balance,
    p_subscription_id,
    jsonb_build_object(
      'grant_type', 'annual',
      'plan', 'vision_pro_annual'
    ),
    v_expires_at
  );
  
  -- Grant storage quota
  INSERT INTO user_storage (
    user_id,
    transaction_type,
    quota_gb,
    granted_at,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    'subscription_grant',
    v_storage_gb,
    NOW(),
    p_subscription_id,
    jsonb_build_object('plan', 'vision_pro_annual')
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', v_grant_amount,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at,
    'storage_granted_gb', v_storage_gb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_annual_tokens IS 'Grant 5M tokens + 100GB storage for annual subscription (365-day expiry)';

-- 4.2 Update drip_tokens_28day
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS drip_tokens_28day(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS drip_tokens_28day(UUID, UUID);

CREATE OR REPLACE FUNCTION drip_tokens_28day(
  p_user_id UUID,
  p_subscription_id UUID,
  p_cycle_number INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_drip_amount INTEGER := 375000; -- 375k per cycle
  v_new_balance INTEGER;
  v_storage_gb INTEGER := 25;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Calculate current balance
  SELECT (get_user_token_balance(p_user_id)->>'total_active')::INTEGER
  INTO v_current_balance;
  
  v_new_balance := v_current_balance + v_drip_amount;
  v_expires_at := NOW() + INTERVAL '90 days'; -- 3 cycles (90 days = max rollover)
  
  -- Insert token grant into token_transactions with 90-day expiration
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
    'subscription_grant',
    v_drip_amount,
    v_new_balance,
    p_subscription_id,
    jsonb_build_object(
      'grant_type', '28day',
      'cycle_number', p_cycle_number,
      'plan', 'vision_pro_28day'
    ),
    v_expires_at
  );
  
  -- Grant storage quota (only on first cycle)
  IF p_cycle_number = 1 THEN
    INSERT INTO user_storage (
      user_id,
      transaction_type,
      quota_gb,
      granted_at,
      subscription_id,
      metadata
    ) VALUES (
      p_user_id,
      'subscription_grant',
      v_storage_gb,
      NOW(),
      p_subscription_id,
      jsonb_build_object('plan', 'vision_pro_28day', 'cycle', 1)
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', v_drip_amount,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at,
    'storage_granted_gb', CASE WHEN p_cycle_number = 1 THEN v_storage_gb ELSE 0 END,
    'cycle_number', p_cycle_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION drip_tokens_28day IS 'Drip 375k tokens per 28-day cycle with 90-day expiry (3-cycle max rollover)';

-- 4.3 Update grant_trial_tokens
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS grant_trial_tokens(UUID, INTEGER);
DROP FUNCTION IF EXISTS grant_trial_tokens(UUID, UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION grant_trial_tokens(
  p_user_id UUID,
  p_subscription_id UUID,
  p_tokens INTEGER,
  p_trial_period_days INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_storage_gb INTEGER := 25;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Calculate current balance
  SELECT (get_user_token_balance(p_user_id)->>'total_active')::INTEGER
  INTO v_current_balance;
  
  v_new_balance := v_current_balance + p_tokens;
  v_expires_at := NOW() + (p_trial_period_days || ' days')::INTERVAL;
  
  -- Insert token grant with custom expiration
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
    'trial_grant',
    p_tokens,
    v_new_balance,
    p_subscription_id,
    jsonb_build_object(
      'grant_type', 'trial',
      'trial_period_days', p_trial_period_days
    ),
    v_expires_at
  );
  
  -- Grant trial storage
  INSERT INTO user_storage (
    user_id,
    transaction_type,
    quota_gb,
    granted_at,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    'trial_grant',
    v_storage_gb,
    NOW(),
    p_subscription_id,
    jsonb_build_object('trial_period_days', p_trial_period_days)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', p_tokens,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at,
    'storage_granted_gb', v_storage_gb,
    'trial_period_days', p_trial_period_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_trial_tokens IS 'Grant trial tokens with custom expiration period + 25GB storage';

-- ============================================================================
-- PART 5: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_users_with_grants INTEGER;
  v_total_active_grants BIGINT;
  v_total_expired_grants BIGINT;
  v_grants_with_expiry INTEGER;
  v_grants_never_expire INTEGER;
BEGIN
  -- Count users with grants
  SELECT COUNT(DISTINCT user_id) INTO v_users_with_grants
  FROM token_transactions
  WHERE action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_grant')
    AND tokens_used > 0;
  
  -- Sum active grants (unexpired)
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_total_active_grants
  FROM token_transactions
  WHERE action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_grant')
    AND tokens_used > 0
    AND (expires_at IS NULL OR expires_at > NOW());
  
  -- Sum expired grants
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_total_expired_grants
  FROM token_transactions
  WHERE action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'admin_grant')
    AND tokens_used > 0
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();
  
  -- Count grants with expiration
  SELECT COUNT(*) INTO v_grants_with_expiry
  FROM token_transactions
  WHERE expires_at IS NOT NULL
    AND tokens_used > 0;
  
  -- Count grants that never expire (purchases)
  SELECT COUNT(*) INTO v_grants_never_expire
  FROM token_transactions
  WHERE expires_at IS NULL
    AND action_type IN ('token_pack_purchase', 'pack_purchase')
    AND tokens_used > 0;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Token System Simplified - Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'token_balances table: REMOVED ✓';
  RAISE NOTICE 'expires_at added to token_transactions ✓';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Users with token grants: %', v_users_with_grants;
  RAISE NOTICE 'Total active (unexpired) tokens: %', v_total_active_grants;
  RAISE NOTICE 'Total expired tokens: %', v_total_expired_grants;
  RAISE NOTICE 'Grants with expiration: %', v_grants_with_expiry;
  RAISE NOTICE 'Grants that never expire: %', v_grants_never_expire;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Balance now calculated as:';
  RAISE NOTICE 'SUM(unexpired grants) - SUM(usage)';
  RAISE NOTICE '========================================';
END $$;

