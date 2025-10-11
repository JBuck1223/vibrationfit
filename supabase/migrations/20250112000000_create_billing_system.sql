-- ============================================================================
-- VibrationFit Billing & Membership System
-- ============================================================================
-- This migration creates the schema for Stripe-based subscriptions and memberships

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Subscription status (mirrors Stripe statuses)
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Membership tier type
DO $$ BEGIN
  CREATE TYPE membership_tier_type AS ENUM (
    'free',
    'starter',
    'pro',
    'elite'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- MEMBERSHIP TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tier identification
  name TEXT NOT NULL UNIQUE,
  tier_type membership_tier_type NOT NULL UNIQUE,
  
  -- Stripe product/price IDs
  stripe_product_id TEXT UNIQUE,
  stripe_price_id TEXT UNIQUE,
  
  -- Pricing
  price_monthly INTEGER NOT NULL DEFAULT 0, -- In cents ($0 = free)
  price_yearly INTEGER, -- In cents (optional annual pricing)
  
  -- Features & Limits
  features JSONB DEFAULT '[]', -- Array of feature names
  viva_tokens_monthly INTEGER NOT NULL DEFAULT 0, -- VIVA token allowance
  max_visions INTEGER, -- NULL = unlimited
  max_journal_entries INTEGER, -- NULL = unlimited
  max_vision_board_items INTEGER, -- NULL = unlimited
  audio_generation_enabled BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  
  -- Display
  description TEXT,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CUSTOMER SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and tier
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_tier_id UUID NOT NULL REFERENCES membership_tiers(id),
  
  -- Stripe identifiers
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Subscription details
  status subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Trial information
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index to ensure one active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription 
  ON customer_subscriptions (user_id) 
  WHERE status = 'active' OR status = 'trialing';

-- ============================================================================
-- PAYMENT HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and subscription
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES customer_subscriptions(id) ON DELETE SET NULL,
  
  -- Stripe identifiers
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  
  -- Payment details
  amount INTEGER NOT NULL, -- In cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- succeeded, failed, pending, etc.
  
  -- Metadata
  description TEXT,
  metadata JSONB,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add all missing columns to membership_tiers if they don't exist
DO $$ 
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'membership_tiers') THEN
    
    -- tier_type column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'tier_type') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_tier_type') THEN
        CREATE TYPE membership_tier_type AS ENUM ('free', 'starter', 'pro', 'elite');
      END IF;
      ALTER TABLE membership_tiers ADD COLUMN tier_type membership_tier_type;
      RAISE NOTICE 'Added tier_type column';
    END IF;
    
    -- price_monthly column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'price_monthly') THEN
      ALTER TABLE membership_tiers ADD COLUMN price_monthly INTEGER NOT NULL DEFAULT 0;
      RAISE NOTICE 'Added price_monthly column';
    END IF;
    
    -- price_yearly column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'price_yearly') THEN
      ALTER TABLE membership_tiers ADD COLUMN price_yearly INTEGER;
      RAISE NOTICE 'Added price_yearly column';
    END IF;
    
    -- features column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'features') THEN
      ALTER TABLE membership_tiers ADD COLUMN features JSONB DEFAULT '[]';
      RAISE NOTICE 'Added features column';
    END IF;
    
    -- viva_tokens_monthly column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'viva_tokens_monthly') THEN
      ALTER TABLE membership_tiers ADD COLUMN viva_tokens_monthly INTEGER NOT NULL DEFAULT 0;
      RAISE NOTICE 'Added viva_tokens_monthly column';
    END IF;
    
    -- max_visions column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'max_visions') THEN
      ALTER TABLE membership_tiers ADD COLUMN max_visions INTEGER;
      RAISE NOTICE 'Added max_visions column';
    END IF;
    
    -- description column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'description') THEN
      ALTER TABLE membership_tiers ADD COLUMN description TEXT;
      RAISE NOTICE 'Added description column';
    END IF;
    
    -- is_popular column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'is_popular') THEN
      ALTER TABLE membership_tiers ADD COLUMN is_popular BOOLEAN DEFAULT false;
      RAISE NOTICE 'Added is_popular column';
    END IF;
    
    -- display_order column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'display_order') THEN
      ALTER TABLE membership_tiers ADD COLUMN display_order INTEGER DEFAULT 0;
      RAISE NOTICE 'Added display_order column';
    END IF;
    
    -- is_active column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'is_active') THEN
      ALTER TABLE membership_tiers ADD COLUMN is_active BOOLEAN DEFAULT true;
      RAISE NOTICE 'Added is_active column';
    END IF;
    
    -- stripe_product_id column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'stripe_product_id') THEN
      ALTER TABLE membership_tiers ADD COLUMN stripe_product_id TEXT UNIQUE;
      RAISE NOTICE 'Added stripe_product_id column';
    END IF;
    
    -- stripe_price_id column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'stripe_price_id') THEN
      ALTER TABLE membership_tiers ADD COLUMN stripe_price_id TEXT UNIQUE;
      RAISE NOTICE 'Added stripe_price_id column';
    END IF;
    
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Membership tiers indexes (only create if columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'tier_type') THEN
    CREATE INDEX IF NOT EXISTS idx_membership_tiers_type ON membership_tiers(tier_type);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'membership_tiers' AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_membership_tiers_active ON membership_tiers(is_active);
  END IF;
END $$;

-- Customer subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_user_id ON customer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_stripe_customer ON customer_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_stripe_subscription ON customer_subscriptions(stripe_subscription_id);

-- Payment history indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on membership_tiers
CREATE TRIGGER update_membership_tiers_updated_at
  BEFORE UPDATE ON membership_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_updated_at(); -- Reuse existing function

-- Update updated_at on customer_subscriptions
CREATE TRIGGER update_customer_subscriptions_updated_at
  BEFORE UPDATE ON customer_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active membership tiers" ON membership_tiers;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON customer_subscriptions;
DROP POLICY IF EXISTS "System can create subscriptions" ON customer_subscriptions;
DROP POLICY IF EXISTS "System can update subscriptions" ON customer_subscriptions;
DROP POLICY IF EXISTS "Users can view their own payment history" ON payment_history;
DROP POLICY IF EXISTS "System can create payment records" ON payment_history;

-- Membership tiers policies (public read)
CREATE POLICY "Anyone can view active membership tiers"
  ON membership_tiers FOR SELECT
  USING (is_active = true);

-- Customer subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
  ON customer_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create subscriptions"
  ON customer_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update subscriptions"
  ON customer_subscriptions FOR UPDATE
  USING (true);

-- Payment history policies
CREATE POLICY "Users can view their own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create payment records"
  ON payment_history FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- SEED DATA - Default Membership Tiers
-- ============================================================================

-- Only insert if all required columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'membership_tiers' 
    AND column_name IN ('tier_type', 'price_monthly', 'features')
    GROUP BY table_name
    HAVING COUNT(*) >= 3
  ) THEN
    
    INSERT INTO membership_tiers (name, tier_type, price_monthly, price_yearly, features, viva_tokens_monthly, max_visions, description, is_popular, display_order)
    VALUES 
  -- Free Tier
  (
    'Free',
    'free',
    0,
    0,
    '["Basic profile", "1 life vision", "Manual vision creation", "Community access"]',
    100,
    1,
    'Get started with VibrationFit basics',
    false,
    1
  ),
  
  -- Starter Tier
  (
    'Starter',
    'starter',
    1900, -- $19/month
    19900, -- $199/year (save ~15%)
    '["Everything in Free", "Unlimited visions", "VIVA assistant (500 tokens/month)", "Assessment tool", "Journal entries", "Vision board", "Email support"]',
    500,
    NULL,
    'Perfect for committed conscious creators',
    true,
    2
  ),
  
  -- Pro Tier
  (
    'Pro',
    'pro',
    4900, -- $49/month
    49900, -- $499/year (save ~15%)
    '["Everything in Starter", "VIVA assistant (2000 tokens/month)", "Audio generation", "Priority support", "Advanced analytics", "Export to PDF", "Custom branding"]',
    2000,
    NULL,
    'For power users and coaches',
    false,
    3
  ),
  
  -- Elite Tier
  (
    'Elite',
    'elite',
    9900, -- $99/month
    99900, -- $999/year (save ~15%)
    '["Everything in Pro", "Unlimited VIVA tokens", "1-on-1 coaching sessions (2/month)", "White-label option", "API access", "Custom integrations", "Dedicated support"]',
    999999,
    NULL,
    'Ultimate transformation experience',
    false,
    4
  )
  ON CONFLICT (name) DO NOTHING; -- Skip if tiers already exist
    
    RAISE NOTICE 'Seeded membership tiers';
  ELSE
    RAISE NOTICE 'Skipping tier seed - required columns missing';
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's active subscription
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id UUID)
RETURNS customer_subscriptions AS $$
DECLARE
  v_subscription customer_subscriptions;
BEGIN
  SELECT * INTO v_subscription
  FROM customer_subscriptions
  WHERE user_id = p_user_id
    AND (status = 'active' OR status = 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN v_subscription;
END;
$$ LANGUAGE plpgsql;

-- Get user's current tier (with fallback to free)
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS membership_tiers AS $$
DECLARE
  v_tier membership_tiers;
  v_subscription customer_subscriptions;
BEGIN
  -- Get active subscription
  v_subscription := get_active_subscription(p_user_id);
  
  IF v_subscription IS NOT NULL THEN
    -- User has active subscription
    SELECT * INTO v_tier
    FROM membership_tiers
    WHERE id = v_subscription.membership_tier_id;
  ELSE
    -- Default to free tier
    SELECT * INTO v_tier
    FROM membership_tiers
    WHERE tier_type = 'free';
  END IF;
  
  RETURN v_tier;
END;
$$ LANGUAGE plpgsql;

-- Check if user has access to a feature
CREATE OR REPLACE FUNCTION user_has_feature(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier membership_tiers;
BEGIN
  v_tier := get_user_tier(p_user_id);
  
  -- Check if feature is in the tier's features array
  RETURN v_tier.features @> to_jsonb(ARRAY[p_feature]);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE membership_tiers IS 'Defines available membership tiers and their features';
COMMENT ON TABLE customer_subscriptions IS 'Tracks user subscriptions synced with Stripe';
COMMENT ON TABLE payment_history IS 'Records all payment transactions';

COMMENT ON FUNCTION get_active_subscription IS 'Returns user''s active or trialing subscription';
COMMENT ON FUNCTION get_user_tier IS 'Returns user''s current membership tier (defaults to free)';
COMMENT ON FUNCTION user_has_feature IS 'Checks if user has access to a specific feature';

