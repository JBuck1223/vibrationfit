-- ============================================================================
-- HORMOZI PRICING SYSTEM - PART 2: CREATE TABLES AND FUNCTIONS
-- ============================================================================
-- ⚠️ PREREQUISITE: Run 20250112000001_add_hormozi_enum_values.sql FIRST!
-- Implements: $499 Intensive + Vision Pro Annual/28-Day + Token Dripping
-- ============================================================================

-- ============================================================================
-- 2. CREATE MEMBERSHIP TIERS (Fresh inserts, no migration)
-- ============================================================================

-- Insert Vision Pro Annual tier (minimal approach)
INSERT INTO membership_tiers (
  tier_type,
  name,
  price_monthly,
  viva_tokens_monthly,
  features
) VALUES (
  'vision_pro_annual',
  'Vision Pro Annual',
  99900, -- $999/year stored in price_monthly
  5000000, -- 5M tokens
  jsonb_build_array(
    '5M tokens granted immediately',
    '100GB storage',
    'Unlimited visions',
    'VIVA assistant (unlimited conversations)',
    'Vibrational assessment',
    'Journal & vision board',
    'Audio generation',
    'PDF exports',
    'Actualization blueprints',
    'Priority support',
    'All future features'
  )
) ON CONFLICT (tier_type) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  viva_tokens_monthly = EXCLUDED.viva_tokens_monthly,
  features = EXCLUDED.features;

-- Insert Vision Pro 28-Day tier (minimal approach)
INSERT INTO membership_tiers (
  tier_type,
  name,
  price_monthly,
  viva_tokens_monthly,
  features
) VALUES (
  'vision_pro_28day',
  'Vision Pro 28-Day',
  9900, -- $99 every 28 days
  375000, -- 375k tokens per cycle
  jsonb_build_array(
    '375k tokens per 28-day cycle',
    '25GB storage base',
    'Rollover up to 3 cycles max',
    'All Vision Pro features',
    'Standard support'
  )
) ON CONFLICT (tier_type) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  viva_tokens_monthly = EXCLUDED.viva_tokens_monthly,
  features = EXCLUDED.features;

-- ============================================================================
-- 2. ADD TOKEN ROLLOVER COLUMNS TO USER_PROFILES
-- ============================================================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS token_rollover_cycles INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS token_last_drip_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_topup_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_topup_pack_id TEXT,
ADD COLUMN IF NOT EXISTS storage_quota_gb INTEGER DEFAULT 100;

COMMENT ON COLUMN user_profiles.token_rollover_cycles IS 'Number of billing cycles tokens have been rolled over (max 3 for 28-day)';
COMMENT ON COLUMN user_profiles.token_last_drip_date IS 'Last time tokens were dripped for 28-day plan';
COMMENT ON COLUMN user_profiles.auto_topup_enabled IS 'Automatically purchase token pack when balance < 20%';
COMMENT ON COLUMN user_profiles.auto_topup_pack_id IS 'Which pack to auto-purchase: power, mega, or ultra';
COMMENT ON COLUMN user_profiles.storage_quota_gb IS 'Storage quota in GB based on plan';

-- ============================================================================
-- 3. CREATE TOKEN_DRIPS TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_drips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES customer_subscriptions(id) ON DELETE SET NULL,
  
  -- Drip details
  drip_amount INTEGER NOT NULL,
  drip_date TIMESTAMP DEFAULT NOW(),
  cycle_number INTEGER NOT NULL,
  
  -- Rollover tracking
  rollover_from_previous INTEGER DEFAULT 0,
  rollover_cycles_count INTEGER DEFAULT 0,
  expired_tokens INTEGER DEFAULT 0, -- Tokens that expired (beyond 3 cycles)
  
  -- Balance snapshots
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- Metadata
  billing_period_start TIMESTAMP,
  billing_period_end TIMESTAMP,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_drips_user ON token_drips(user_id);
CREATE INDEX IF NOT EXISTS idx_token_drips_date ON token_drips(drip_date DESC);
CREATE INDEX IF NOT EXISTS idx_token_drips_subscription ON token_drips(subscription_id);

COMMENT ON TABLE token_drips IS 'Tracks token dripping for 28-day plans with rollover logic';

-- ============================================================================
-- 4. CREATE INTENSIVE PURCHASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS intensive_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment details
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  amount INTEGER NOT NULL, -- 49900 cents = $499
  currency TEXT DEFAULT 'usd',
  
  -- Payment plan
  payment_plan TEXT NOT NULL DEFAULT 'full', -- 'full', '2pay', '3pay'
  installments_total INTEGER DEFAULT 1,
  installments_paid INTEGER DEFAULT 0,
  next_installment_date TIMESTAMP,
  
  -- Completion tracking
  completion_status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, refunded
  activation_deadline TIMESTAMP, -- 72 hours from purchase
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  
  CONSTRAINT valid_completion_status CHECK (completion_status IN ('pending', 'in_progress', 'completed', 'refunded')),
  CONSTRAINT valid_payment_plan CHECK (payment_plan IN ('full', '2pay', '3pay'))
);

CREATE INDEX IF NOT EXISTS idx_intensive_user ON intensive_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_intensive_status ON intensive_purchases(completion_status);
CREATE INDEX IF NOT EXISTS idx_intensive_payment_intent ON intensive_purchases(stripe_payment_intent_id);

COMMENT ON TABLE intensive_purchases IS '$499 Vision Activation Intensive purchase tracking';

-- ============================================================================
-- 5. CREATE INTENSIVE CHECKLIST TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS intensive_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intensive_id UUID NOT NULL REFERENCES intensive_purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Hour 0-1: Instant Start
  intake_completed BOOLEAN DEFAULT false,
  intake_completed_at TIMESTAMP,
  
  -- Hour 1-24: Draft + Build
  vision_drafted BOOLEAN DEFAULT false,
  vision_drafted_at TIMESTAMP,
  
  builder_session_started BOOLEAN DEFAULT false,
  builder_session_started_at TIMESTAMP,
  
  builder_session_completed BOOLEAN DEFAULT false,
  builder_session_completed_at TIMESTAMP,
  
  vision_board_created BOOLEAN DEFAULT false,
  vision_board_created_at TIMESTAMP,
  
  -- Hour 24-36: Record + Calibrate
  calibration_scheduled BOOLEAN DEFAULT false,
  calibration_scheduled_at TIMESTAMP,
  
  calibration_attended BOOLEAN DEFAULT false,
  calibration_attended_at TIMESTAMP,
  
  audios_generated BOOLEAN DEFAULT false,
  audios_generated_at TIMESTAMP,
  
  -- Hour 36-48: Activate
  activation_protocol_started BOOLEAN DEFAULT false,
  activation_started_at TIMESTAMP,
  
  -- 7-Day Tracking
  streak_day_1 BOOLEAN DEFAULT false,
  streak_day_2 BOOLEAN DEFAULT false,
  streak_day_3 BOOLEAN DEFAULT false,
  streak_day_4 BOOLEAN DEFAULT false,
  streak_day_5 BOOLEAN DEFAULT false,
  streak_day_6 BOOLEAN DEFAULT false,
  streak_day_7 BOOLEAN DEFAULT false,
  streak_day_7_reached_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intensive_checklist_intensive ON intensive_checklist(intensive_id);
CREATE INDEX IF NOT EXISTS idx_intensive_checklist_user ON intensive_checklist(user_id);

COMMENT ON TABLE intensive_checklist IS '72-hour activation intensive completion tracking';

-- ============================================================================
-- 6. STORAGE QUOTA CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_storage_quota(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_quota_gb INTEGER;
  v_used_bytes BIGINT;
  v_used_gb NUMERIC;
  v_percentage NUMERIC;
  v_over_quota BOOLEAN;
BEGIN
  -- Get user's storage quota
  SELECT COALESCE(storage_quota_gb, 100) INTO v_quota_gb
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Calculate current usage from storage.objects
  -- Note: This is a placeholder - actual implementation depends on your storage setup
  SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0) INTO v_used_bytes
  FROM storage.objects
  WHERE owner = p_user_id::TEXT;
  
  v_used_gb := ROUND((v_used_bytes / 1073741824.0)::NUMERIC, 2); -- Convert to GB
  v_percentage := ROUND(((v_used_gb / v_quota_gb) * 100)::NUMERIC, 1);
  v_over_quota := v_used_gb > v_quota_gb;
  
  RETURN jsonb_build_object(
    'quota_gb', v_quota_gb,
    'used_gb', v_used_gb,
    'used_bytes', v_used_bytes,
    'percentage', v_percentage,
    'over_quota', v_over_quota,
    'remaining_gb', GREATEST(0, v_quota_gb - v_used_gb),
    'warning_90pct', v_percentage >= 90,
    'warning_80pct', v_percentage >= 80
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_storage_quota IS 'Check user storage quota and usage';

-- ============================================================================
-- 7. TOKEN DRIP FUNCTION (for 28-day plans)
-- ============================================================================

CREATE OR REPLACE FUNCTION drip_tokens_28day(
  p_user_id UUID,
  p_subscription_id UUID,
  p_cycle_number INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_drip_amount INTEGER := 375000; -- 375k per cycle
  v_rollover_cycles INTEGER;
  v_rollover_amount INTEGER := 0;
  v_expired_tokens INTEGER := 0;
  v_new_balance INTEGER;
  v_max_rollover_cycles INTEGER := 3;
BEGIN
  -- Get current balance and rollover count
  SELECT 
    COALESCE(vibe_assistant_tokens_remaining, 0),
    COALESCE(token_rollover_cycles, 0)
  INTO v_current_balance, v_rollover_cycles
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- If user already has tokens from previous cycle, track rollover
  IF v_current_balance > 0 THEN
    v_rollover_amount := v_current_balance;
    v_rollover_cycles := v_rollover_cycles + 1;
    
    -- If exceeding max rollover cycles, expire the excess
    IF v_rollover_cycles > v_max_rollover_cycles THEN
      v_expired_tokens := v_current_balance;
      v_rollover_amount := 0;
      v_rollover_cycles := 0;
    END IF;
  ELSE
    -- No rollover, reset counter
    v_rollover_cycles := 0;
  END IF;
  
  -- Calculate new balance
  v_new_balance := (v_rollover_amount + v_drip_amount);
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_rollover_cycles = v_rollover_cycles,
    token_last_drip_date = NOW()
  WHERE user_id = p_user_id;
  
  -- Record the drip
  INSERT INTO token_drips (
    user_id,
    subscription_id,
    drip_amount,
    cycle_number,
    rollover_from_previous,
    rollover_cycles_count,
    expired_tokens,
    balance_before,
    balance_after,
    billing_period_start,
    billing_period_end
  ) VALUES (
    p_user_id,
    p_subscription_id,
    v_drip_amount,
    p_cycle_number,
    v_rollover_amount,
    v_rollover_cycles,
    v_expired_tokens,
    v_current_balance,
    v_new_balance,
    NOW(),
    NOW() + INTERVAL '28 days'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'dripped', v_drip_amount,
    'rollover', v_rollover_amount,
    'expired', v_expired_tokens,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance,
    'rollover_cycles', v_rollover_cycles
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION drip_tokens_28day IS 'Drip 375k tokens per 28-day cycle with 3-cycle rollover max';

-- ============================================================================
-- 8. GRANT ANNUAL TOKENS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_annual_tokens(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_grant_amount INTEGER := 5000000; -- 5M tokens
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- For annual, we REPLACE the balance (not add)
  -- This is because annual resets each year
  v_new_balance := v_grant_amount;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_rollover_cycles = 0, -- Reset rollover for annual
    token_last_drip_date = NOW(),
    storage_quota_gb = 100 -- Set annual storage quota
  WHERE user_id = p_user_id;
  
  -- Record as a token grant transaction
  INSERT INTO token_transactions (
    user_id,
    action_type,
    tokens_used,
    tokens_remaining,
    metadata
  ) VALUES (
    p_user_id,
    'annual_subscription_grant',
    -v_grant_amount, -- Negative = grant
    v_new_balance,
    jsonb_build_object(
      'subscription_id', p_subscription_id,
      'plan', 'vision_pro_annual',
      'grant_type', 'full_year_upfront'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', v_grant_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_annual_tokens IS 'Grant 5M tokens immediately for annual subscriptions';

-- ============================================================================
-- 9. INTENSIVE COMPLETION CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_intensive_completion(p_intensive_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_checklist RECORD;
  v_required_items INTEGER := 0;
  v_completed_items INTEGER := 0;
  v_completion_pct NUMERIC;
  v_is_complete BOOLEAN := false;
BEGIN
  SELECT * INTO v_checklist
  FROM intensive_checklist
  WHERE intensive_id = p_intensive_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Checklist not found');
  END IF;
  
  -- Count required items for guarantee
  v_required_items := 4; -- intake, builder, calibration, activation protocol
  
  v_completed_items := 0;
  IF v_checklist.intake_completed THEN v_completed_items := v_completed_items + 1; END IF;
  IF v_checklist.builder_session_completed THEN v_completed_items := v_completed_items + 1; END IF;
  IF v_checklist.calibration_attended THEN v_completed_items := v_completed_items + 1; END IF;
  IF v_checklist.activation_protocol_started THEN v_completed_items := v_completed_items + 1; END IF;
  
  v_completion_pct := ROUND((v_completed_items::NUMERIC / v_required_items * 100), 1);
  v_is_complete := v_completed_items >= v_required_items;
  
  RETURN jsonb_build_object(
    'intensive_id', p_intensive_id,
    'required_items', v_required_items,
    'completed_items', v_completed_items,
    'completion_percentage', v_completion_pct,
    'is_complete', v_is_complete,
    'checklist', row_to_json(v_checklist)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_intensive_completion IS 'Check if intensive checklist meets guarantee requirements';

-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE token_drips ENABLE ROW LEVEL SECURITY;
ALTER TABLE intensive_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE intensive_checklist ENABLE ROW LEVEL SECURITY;

-- Users can view their own token drips
CREATE POLICY "Users can view own token drips"
  ON token_drips FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own intensive purchases
CREATE POLICY "Users can view own intensive purchases"
  ON intensive_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own intensive checklist
CREATE POLICY "Users can view own intensive checklist"
  ON intensive_checklist FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own intensive checklist
CREATE POLICY "Users can update own intensive checklist"
  ON intensive_checklist FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 11. GRANT TOKENS TO EXISTING USERS (if any)
-- ============================================================================

-- Grant 5M tokens to all Vision Pro Annual users
-- (Only if they don't already have a large balance)
UPDATE user_profiles up
SET 
  vibe_assistant_tokens_remaining = GREATEST(COALESCE(vibe_assistant_tokens_remaining, 0), 5000000),
  storage_quota_gb = COALESCE(storage_quota_gb, 100)
WHERE EXISTS (
  SELECT 1 FROM customer_subscriptions cs
  JOIN membership_tiers mt ON cs.membership_tier_id = mt.id
  WHERE cs.user_id = up.user_id
  AND mt.tier_type = 'vision_pro_annual'
  AND cs.status = 'active'
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE '✅ Hormozi Pricing System Migration Complete';
  RAISE NOTICE '✅ Updated membership tiers: vision_pro_annual, vision_pro_28day';
  RAISE NOTICE '✅ Created intensive tracking tables';
  RAISE NOTICE '✅ Added token dripping functions';
  RAISE NOTICE '✅ Migrated existing users to Vision Pro Annual';
END $$;

