-- ============================================================================
-- Migration: Clean Up user_profiles Table
-- ============================================================================
-- Purpose: Remove token/storage tracking from user_profiles, create proper
--          token_balances table with FIFO expiration, and user_storage table
--          for quota tracking (usage calculated from S3).
--
-- Date: November 14, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE NEW TABLES
-- ============================================================================

-- 1.1 token_balances: Track token grants with expiration
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_type TEXT NOT NULL, -- 'annual', '28day', 'trial', 'purchase', 'admin'
  tokens_granted INTEGER NOT NULL,
  tokens_remaining INTEGER NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL for purchases (never expire)
  subscription_id UUID REFERENCES customer_subscriptions(id) ON DELETE SET NULL,
  token_pack_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_token_balances_user_id ON token_balances(user_id);
CREATE INDEX idx_token_balances_user_active ON token_balances(user_id, granted_at ASC) 
  WHERE tokens_remaining > 0;
CREATE INDEX idx_token_balances_expiration ON token_balances(expires_at) 
  WHERE tokens_remaining > 0;

COMMENT ON TABLE token_balances IS 'Tracks individual token grants with FIFO expiration. Deductions consume oldest grants first.';
COMMENT ON COLUMN token_balances.grant_type IS 'Type: annual (365d expiry), 28day (90d expiry), trial (custom expiry), purchase (never expires), admin (custom)';
COMMENT ON COLUMN token_balances.expires_at IS 'NULL = never expires (purchases). Otherwise auto-expire on this date.';
COMMENT ON COLUMN token_balances.tokens_remaining IS 'Decrements as tokens are consumed (FIFO). 0 = fully consumed.';

-- 1.2 user_storage: Track storage quota grants only (usage from S3)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_gb INTEGER NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_id UUID REFERENCES customer_subscriptions(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_storage_user_id ON user_storage(user_id);
CREATE INDEX idx_user_storage_recent ON user_storage(user_id, granted_at DESC);

COMMENT ON TABLE user_storage IS 'Tracks storage quota grants. Current quota = SUM(quota_gb). Usage always calculated from S3.';
COMMENT ON COLUMN user_storage.quota_gb IS 'Storage quota granted (25GB, 100GB, etc.)';

-- ============================================================================
-- PART 2: MIGRATE EXISTING DATA
-- ============================================================================

-- 2.1 Migrate token grants from token_transactions to token_balances
-- ----------------------------------------------------------------------------
-- Strategy: Find all grant transactions and create token_balance records
--           with appropriate expiration dates

INSERT INTO token_balances (
  user_id,
  grant_type,
  tokens_granted,
  tokens_remaining,
  granted_at,
  expires_at,
  subscription_id,
  metadata
)
SELECT 
  tt.user_id,
  CASE 
    -- Check metadata to distinguish between annual and 28-day
    WHEN tt.action_type = 'subscription_grant' AND (tt.metadata->>'plan' = 'vision_pro_annual' OR tt.tokens_used >= 5000000) THEN 'annual'
    WHEN tt.action_type = 'subscription_grant' THEN '28day'
    WHEN tt.action_type = 'renewal_grant' AND tt.tokens_used >= 5000000 THEN 'annual'
    WHEN tt.action_type = 'renewal_grant' THEN '28day'
    WHEN tt.action_type = 'trial_grant' THEN 'trial'
    WHEN tt.action_type = 'token_pack_purchase' THEN 'purchase'
    WHEN tt.action_type = 'pack_purchase' THEN 'purchase'
    WHEN tt.action_type = 'admin_grant' THEN 'admin'
    ELSE 'admin'
  END as grant_type,
  ABS(tt.tokens_used) as tokens_granted,
  -- Calculate remaining: need to subtract all usage since this grant
  ABS(tt.tokens_used) - COALESCE(
    (SELECT COALESCE(SUM(tu.tokens_used), 0)
     FROM token_usage tu
     WHERE tu.user_id = tt.user_id
       AND tu.created_at >= tt.created_at
       AND tu.success = true
       AND tu.action_type NOT IN ('admin_grant', 'subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_deduct')
    ), 0
  ) as tokens_remaining,
  tt.created_at as granted_at,
  CASE 
    -- Determine expiration based on grant type we calculated above
    WHEN (tt.action_type = 'subscription_grant' AND (tt.metadata->>'plan' = 'vision_pro_annual' OR tt.tokens_used >= 5000000)) THEN tt.created_at + INTERVAL '365 days'
    WHEN (tt.action_type = 'renewal_grant' AND tt.tokens_used >= 5000000) THEN tt.created_at + INTERVAL '365 days'
    WHEN tt.action_type = 'subscription_grant' THEN tt.created_at + INTERVAL '90 days'
    WHEN tt.action_type = 'renewal_grant' THEN tt.created_at + INTERVAL '90 days'
    WHEN tt.action_type = 'trial_grant' THEN tt.created_at + INTERVAL '56 days'
    WHEN tt.action_type = 'token_pack_purchase' THEN NULL
    WHEN tt.action_type = 'pack_purchase' THEN NULL
    WHEN tt.action_type = 'admin_grant' THEN tt.created_at + INTERVAL '365 days'
    ELSE tt.created_at + INTERVAL '365 days'
  END as expires_at,
  tt.subscription_id,
  tt.metadata
FROM token_transactions tt
WHERE tt.action_type IN (
  'subscription_grant',
  'renewal_grant',
  'trial_grant',
  'token_pack_purchase',
  'pack_purchase',
  'admin_grant'
)
AND tt.tokens_used < 0 -- Negative means grant
ORDER BY tt.created_at ASC;

-- 2.2 Migrate storage quotas from user_profiles to user_storage
-- ----------------------------------------------------------------------------
INSERT INTO user_storage (
  user_id,
  quota_gb,
  granted_at,
  metadata
)
SELECT 
  up.user_id,
  COALESCE(up.storage_quota_gb, 25) as quota_gb, -- Default 25GB if null
  COALESCE(up.created_at, NOW()) as granted_at,
  jsonb_build_object(
    'source', 'migration',
    'original_quota_gb', up.storage_quota_gb
  ) as metadata
FROM user_profiles up
WHERE up.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 3: CREATE HELPER FUNCTIONS
-- ============================================================================

-- 3.1 Get user token balance (active + expired breakdown)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_user_token_balance(UUID);

CREATE OR REPLACE FUNCTION get_user_token_balance(p_user_id UUID)
RETURNS TABLE (
  total_active INTEGER,
  total_expired INTEGER,
  grants_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH active_grants AS (
    SELECT 
      grant_type,
      SUM(tokens_remaining) as remaining,
      COUNT(*) as grant_count
    FROM token_balances
    WHERE user_id = p_user_id
      AND tokens_remaining > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    GROUP BY grant_type
  ),
  expired_grants AS (
    SELECT 
      SUM(tokens_remaining) as expired_tokens
    FROM token_balances
    WHERE user_id = p_user_id
      AND tokens_remaining > 0
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
  )
  SELECT 
    COALESCE((SELECT SUM(remaining) FROM active_grants), 0)::INTEGER as total_active,
    COALESCE((SELECT expired_tokens FROM expired_grants), 0)::INTEGER as total_expired,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'grant_type', grant_type,
          'remaining', remaining,
          'grant_count', grant_count
        )
      ) FROM active_grants),
      '[]'::jsonb
    ) as grants_breakdown;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_token_balance IS 'Returns active and expired token balances with breakdown by grant type';

-- 3.2 Deduct tokens with FIFO (oldest grants first)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS deduct_tokens_with_fifo(UUID, INTEGER);

CREATE OR REPLACE FUNCTION deduct_tokens_with_fifo(
  p_user_id UUID,
  p_tokens_to_deduct INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_remaining_to_deduct INTEGER := p_tokens_to_deduct;
  v_grant_record RECORD;
  v_deducted_from JSONB := '[]'::jsonb;
  v_deduction INTEGER;
BEGIN
  -- Lock and process grants in FIFO order (oldest first)
  FOR v_grant_record IN
    SELECT id, tokens_remaining, grant_type, granted_at
    FROM token_balances
    WHERE user_id = p_user_id
      AND tokens_remaining > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY granted_at ASC
    FOR UPDATE
  LOOP
    -- Calculate how much to deduct from this grant
    v_deduction := LEAST(v_grant_record.tokens_remaining, v_remaining_to_deduct);
    
    -- Update the grant balance
    UPDATE token_balances
    SET tokens_remaining = tokens_remaining - v_deduction
    WHERE id = v_grant_record.id;
    
    -- Track what we deducted
    v_deducted_from := v_deducted_from || jsonb_build_object(
      'grant_id', v_grant_record.id,
      'grant_type', v_grant_record.grant_type,
      'granted_at', v_grant_record.granted_at,
      'deducted', v_deduction
    );
    
    -- Reduce remaining
    v_remaining_to_deduct := v_remaining_to_deduct - v_deduction;
    
    -- Exit if we've deducted enough
    EXIT WHEN v_remaining_to_deduct <= 0;
  END LOOP;
  
  -- Return summary
  RETURN jsonb_build_object(
    'success', v_remaining_to_deduct <= 0,
    'tokens_deducted', p_tokens_to_deduct - v_remaining_to_deduct,
    'tokens_remaining_to_deduct', GREATEST(v_remaining_to_deduct, 0),
    'deducted_from', v_deducted_from
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION deduct_tokens_with_fifo IS 'Deducts tokens from oldest grants first (FIFO), skips expired grants';

-- 3.3 Get user storage quota (sum of all grants)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_user_storage_quota(UUID);

CREATE OR REPLACE FUNCTION get_user_storage_quota(p_user_id UUID)
RETURNS TABLE (
  total_quota_gb INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(quota_gb), 0)::INTEGER as total_quota_gb
  FROM user_storage
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_storage_quota IS 'Returns total storage quota for user (sum of all grants). Usage calculated from S3.';

-- 3.4 Expire old token grants (background job)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS expire_old_token_grants();

CREATE OR REPLACE FUNCTION expire_old_token_grants()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Mark expired grants by setting tokens_remaining to 0
  -- (Alternatively, could delete them, but keeping for audit trail)
  WITH expired AS (
    UPDATE token_balances
    SET tokens_remaining = 0,
        metadata = metadata || jsonb_build_object('expired_at', NOW())
    WHERE expires_at IS NOT NULL
      AND expires_at <= NOW()
      AND tokens_remaining > 0
    RETURNING id
  )
  SELECT COUNT(*) INTO v_expired_count FROM expired;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_token_grants IS 'Background job: marks expired token grants. Returns count of expired grants.';

-- ============================================================================
-- PART 4: UPDATE EXISTING GRANT FUNCTIONS
-- ============================================================================

-- 4.1 Update grant_annual_tokens to use token_balances
-- ----------------------------------------------------------------------------
-- Drop all possible versions
DROP FUNCTION IF EXISTS grant_annual_tokens(UUID, UUID);
DROP FUNCTION IF EXISTS grant_annual_tokens(UUID);

CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_grant_amount INTEGER := 5000000; -- 5M tokens
  v_storage_quota INTEGER := 100; -- 100GB
  v_balance_id UUID;
BEGIN
  -- Insert token grant with 365-day expiration
  INSERT INTO token_balances (
    user_id,
    grant_type,
    tokens_granted,
    tokens_remaining,
    granted_at,
    expires_at,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    'annual',
    v_grant_amount,
    v_grant_amount,
    NOW(),
    NOW() + INTERVAL '365 days',
    p_subscription_id,
    jsonb_build_object(
      'plan', 'vision_pro_annual',
      'grant_type', 'full_year_upfront'
    )
  )
  RETURNING id INTO v_balance_id;
  
  -- Insert storage quota grant
  INSERT INTO user_storage (
    user_id,
    quota_gb,
    granted_at,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    v_storage_quota,
    NOW(),
    p_subscription_id,
    jsonb_build_object(
      'plan', 'vision_pro_annual',
      'grant_type', 'annual_subscription'
    )
  );
  
  -- Record in token_transactions for audit trail
  INSERT INTO token_transactions (
    user_id,
    action_type,
    tokens_used,
    tokens_remaining,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    'subscription_grant',
    -v_grant_amount,
    v_grant_amount,
    p_subscription_id,
    jsonb_build_object(
      'plan', 'vision_pro_annual',
      'balance_id', v_balance_id
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', v_grant_amount,
    'storage_quota_gb', v_storage_quota,
    'expires_at', NOW() + INTERVAL '365 days',
    'balance_id', v_balance_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_annual_tokens IS 'Grant 5M tokens + 100GB storage for annual subscription (365-day expiry)';

-- 4.2 Update drip_tokens_28day to use token_balances with rollover
-- ----------------------------------------------------------------------------
-- Drop all possible versions (with and without default parameter)
DROP FUNCTION IF EXISTS drip_tokens_28day(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS drip_tokens_28day(UUID, UUID);

CREATE OR REPLACE FUNCTION drip_tokens_28day(
  p_user_id UUID,
  p_subscription_id UUID,
  p_cycle_number INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_drip_amount INTEGER := 375000; -- 375k tokens per cycle
  v_storage_quota INTEGER := 25; -- 25GB
  v_balance_id UUID;
  v_current_active INTEGER;
  v_max_rollover INTEGER := 1125000; -- 3 cycles max (375k * 3)
BEGIN
  -- Get current active balance
  SELECT total_active INTO v_current_active
  FROM get_user_token_balance(p_user_id);
  
  v_current_active := COALESCE(v_current_active, 0);
  
  -- Check if we need to cap the new grant due to rollover limit
  -- If current balance + new drip > max, grant less
  IF v_current_active + v_drip_amount > v_max_rollover THEN
    v_drip_amount := GREATEST(0, v_max_rollover - v_current_active);
  END IF;
  
  -- Insert token grant with 90-day expiration (allows 3-cycle rollover)
  IF v_drip_amount > 0 THEN
    INSERT INTO token_balances (
      user_id,
      grant_type,
      tokens_granted,
      tokens_remaining,
      granted_at,
      expires_at,
      subscription_id,
      metadata
    ) VALUES (
      p_user_id,
      '28day',
      v_drip_amount,
      v_drip_amount,
      NOW(),
      NOW() + INTERVAL '90 days',
      p_subscription_id,
      jsonb_build_object(
        'plan', 'vision_pro_28day',
        'cycle_number', p_cycle_number,
        'grant_type', 'drip'
      )
    )
    RETURNING id INTO v_balance_id;
    
    -- Record in token_transactions for audit trail
    INSERT INTO token_transactions (
      user_id,
      action_type,
      tokens_used,
      tokens_remaining,
      subscription_id,
      metadata
    ) VALUES (
      p_user_id,
      'subscription_grant',
      -v_drip_amount,
      v_current_active + v_drip_amount,
      p_subscription_id,
      jsonb_build_object(
        'plan', 'vision_pro_28day',
        'cycle_number', p_cycle_number,
        'balance_id', v_balance_id
      )
    );
  END IF;
  
  -- Grant storage quota on first cycle only
  IF p_cycle_number = 1 THEN
    INSERT INTO user_storage (
      user_id,
      quota_gb,
      granted_at,
      subscription_id,
      metadata
    ) VALUES (
      p_user_id,
      v_storage_quota,
      NOW(),
      p_subscription_id,
      jsonb_build_object(
        'plan', 'vision_pro_28day',
        'grant_type', 'subscription_start'
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'dripped', v_drip_amount,
    'cycle_number', p_cycle_number,
    'balance_before', v_current_active,
    'balance_after', v_current_active + v_drip_amount,
    'expires_at', NOW() + INTERVAL '90 days',
    'balance_id', v_balance_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION drip_tokens_28day IS 'Drip 375k tokens per 28-day cycle with 90-day expiry (3-cycle max rollover = 1.125M)';

-- 4.3 Update grant_trial_tokens to use token_balances
-- ----------------------------------------------------------------------------
-- Drop all possible versions
-- Old version: grant_trial_tokens(p_user_id uuid, p_trial_amount integer DEFAULT 100000)
-- New version: grant_trial_tokens(p_user_id uuid, p_subscription_id uuid, p_tokens integer, p_trial_period_days integer)
DROP FUNCTION IF EXISTS grant_trial_tokens(UUID, INTEGER); -- Old 2-param version
DROP FUNCTION IF EXISTS grant_trial_tokens(UUID, UUID, INTEGER, INTEGER); -- New 4-param version

CREATE OR REPLACE FUNCTION grant_trial_tokens(
  p_user_id UUID,
  p_subscription_id UUID,
  p_tokens INTEGER,
  p_trial_period_days INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_storage_quota INTEGER := 25; -- 25GB for trial
  v_balance_id UUID;
BEGIN
  -- Insert token grant with trial expiration
  INSERT INTO token_balances (
    user_id,
    grant_type,
    tokens_granted,
    tokens_remaining,
    granted_at,
    expires_at,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    'trial',
    p_tokens,
    p_tokens,
    NOW(),
    NOW() + (p_trial_period_days || ' days')::INTERVAL,
    p_subscription_id,
    jsonb_build_object(
      'trial_period_days', p_trial_period_days,
      'grant_type', 'trial'
    )
  )
  RETURNING id INTO v_balance_id;
  
  -- Insert storage quota grant
  INSERT INTO user_storage (
    user_id,
    quota_gb,
    granted_at,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    v_storage_quota,
    NOW(),
    p_subscription_id,
    jsonb_build_object(
      'grant_type', 'trial',
      'trial_period_days', p_trial_period_days
    )
  );
  
  -- Record in token_transactions for audit trail
  INSERT INTO token_transactions (
    user_id,
    action_type,
    tokens_used,
    tokens_remaining,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    'trial_grant',
    -p_tokens,
    p_tokens,
    p_subscription_id,
    jsonb_build_object(
      'trial_period_days', p_trial_period_days,
      'balance_id', v_balance_id
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', p_tokens,
    'storage_quota_gb', v_storage_quota,
    'expires_at', NOW() + (p_trial_period_days || ' days')::INTERVAL,
    'balance_id', v_balance_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_trial_tokens IS 'Grant trial tokens with custom expiration period + 25GB storage';

-- ============================================================================
-- PART 5: DROP DEPRECATED COLUMNS FROM user_profiles
-- ============================================================================

-- 5.1 First, drop dependent views
-- ----------------------------------------------------------------------------
-- These views were used for debugging the old token system and are no longer needed
DROP VIEW IF EXISTS untracked_token_changes CASCADE;
DROP VIEW IF EXISTS user_token_balances CASCADE;

-- 5.2 Drop token tracking columns
-- ----------------------------------------------------------------------------
ALTER TABLE user_profiles DROP COLUMN IF EXISTS vibe_assistant_tokens_used;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS vibe_assistant_tokens_remaining;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS vibe_assistant_total_cost;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS token_rollover_cycles;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS token_last_drip_date;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS vibe_assistant_monthly_reset_date;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS vibe_assistant_allowance_reset_count;

-- 5.3 Drop storage tracking column
-- ----------------------------------------------------------------------------
ALTER TABLE user_profiles DROP COLUMN IF EXISTS storage_quota_gb;

-- 5.4 Drop auto-topup columns (never implemented)
-- ----------------------------------------------------------------------------
ALTER TABLE user_profiles DROP COLUMN IF EXISTS auto_topup_enabled;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS auto_topup_pack_id;

-- 5.5 Drop membership tier reference (use customer_subscriptions instead)
-- ----------------------------------------------------------------------------
ALTER TABLE user_profiles DROP COLUMN IF EXISTS membership_tier_id;

-- ============================================================================
-- PART 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own token balances
CREATE POLICY "Users can view own token balances"
  ON token_balances FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can view their own storage grants
CREATE POLICY "Users can view own storage grants"
  ON user_storage FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can do anything
CREATE POLICY "Service role has full access to token_balances"
  ON token_balances FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to user_storage"
  ON user_storage FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary
DO $$
DECLARE
  v_token_balance_count INTEGER;
  v_storage_grant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_token_balance_count FROM token_balances;
  SELECT COUNT(*) INTO v_storage_grant_count FROM user_storage;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'MIGRATION COMPLETE: user_profiles cleanup';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Token balances migrated: %', v_token_balance_count;
  RAISE NOTICE 'Storage grants migrated: %', v_storage_grant_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Deprecated columns dropped from user_profiles:';
  RAISE NOTICE '  - vibe_assistant_tokens_used';
  RAISE NOTICE '  - vibe_assistant_tokens_remaining';
  RAISE NOTICE '  - vibe_assistant_total_cost';
  RAISE NOTICE '  - token_rollover_cycles';
  RAISE NOTICE '  - token_last_drip_date';
  RAISE NOTICE '  - storage_quota_gb';
  RAISE NOTICE '  - auto_topup_enabled';
  RAISE NOTICE '  - auto_topup_pack_id';
  RAISE NOTICE '  - membership_tier_id';
  RAISE NOTICE '';
  RAISE NOTICE 'New tables created:';
  RAISE NOTICE '  - token_balances (with FIFO expiration)';
  RAISE NOTICE '  - user_storage (quota grants only)';
  RAISE NOTICE '';
  RAISE NOTICE 'New functions available:';
  RAISE NOTICE '  - get_user_token_balance(user_id)';
  RAISE NOTICE '  - deduct_tokens_with_fifo(user_id, tokens)';
  RAISE NOTICE '  - get_user_storage_quota(user_id)';
  RAISE NOTICE '  - expire_old_token_grants()';
  RAISE NOTICE '============================================================================';
END $$;

