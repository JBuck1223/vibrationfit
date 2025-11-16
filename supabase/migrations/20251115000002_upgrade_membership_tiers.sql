-- ============================================================================
-- UPGRADE MEMBERSHIP TIERS TABLE
-- Make it the single source of truth for all billing configuration
-- ============================================================================
-- Migration: 20251115000002_upgrade_membership_tiers.sql
-- Description: Add missing fields, clean up legacy fields, seed all plans
-- ============================================================================

-- NOTE: No BEGIN/COMMIT wrapper because enum values must be committed 
-- before they can be used in INSERT statements

-- ============================================================================
-- STEP 1: ADD NEW ENUM VALUES
-- ============================================================================

-- Add household and intensive tier types to enum
DO $$ 
BEGIN
  -- Add household annual
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vision_pro_household_annual' AND enumtypid = 'membership_tier_type'::regtype) THEN
    ALTER TYPE membership_tier_type ADD VALUE 'vision_pro_household_annual';
  END IF;
  
  -- Add household 28-day
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vision_pro_household_28day' AND enumtypid = 'membership_tier_type'::regtype) THEN
    ALTER TYPE membership_tier_type ADD VALUE 'vision_pro_household_28day';
  END IF;
  
  -- Add household addon 28-day
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'household_addon_28day' AND enumtypid = 'membership_tier_type'::regtype) THEN
    ALTER TYPE membership_tier_type ADD VALUE 'household_addon_28day';
  END IF;
  
  -- Add household addon annual
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'household_addon_annual' AND enumtypid = 'membership_tier_type'::regtype) THEN
    ALTER TYPE membership_tier_type ADD VALUE 'household_addon_annual';
  END IF;
  
  -- Add intensive
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'intensive' AND enumtypid = 'membership_tier_type'::regtype) THEN
    ALTER TYPE membership_tier_type ADD VALUE 'intensive';
  END IF;
  
  -- Add intensive household
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'intensive_household' AND enumtypid = 'membership_tier_type'::regtype) THEN
    ALTER TYPE membership_tier_type ADD VALUE 'intensive_household';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: ADD MISSING FIELDS
-- ============================================================================

-- Storage quota (critical - was in user_profiles, now per-tier)
ALTER TABLE membership_tiers 
ADD COLUMN IF NOT EXISTS storage_quota_gb INTEGER DEFAULT 100;

-- Household plan fields
ALTER TABLE membership_tiers 
ADD COLUMN IF NOT EXISTS included_seats INTEGER DEFAULT 1;

ALTER TABLE membership_tiers 
ADD COLUMN IF NOT EXISTS max_household_members INTEGER;

-- Token rollover settings
ALTER TABLE membership_tiers 
ADD COLUMN IF NOT EXISTS rollover_max_cycles INTEGER;

-- Plan metadata
ALTER TABLE membership_tiers 
ADD COLUMN IF NOT EXISTS plan_category TEXT DEFAULT 'subscription';
-- Values: 'subscription', 'intensive', 'addon'

ALTER TABLE membership_tiers 
ADD COLUMN IF NOT EXISTS is_household_plan BOOLEAN DEFAULT FALSE;

-- Comments
COMMENT ON COLUMN membership_tiers.storage_quota_gb IS 'Storage quota in GB for this tier';
COMMENT ON COLUMN membership_tiers.included_seats IS 'Number of user seats included (1 for solo, 2+ for household)';
COMMENT ON COLUMN membership_tiers.max_household_members IS 'Maximum household members (NULL = solo plan, 6 = household)';
COMMENT ON COLUMN membership_tiers.rollover_max_cycles IS 'Max billing cycles tokens can roll over (NULL = no rollover/annual reset)';
COMMENT ON COLUMN membership_tiers.plan_category IS 'Plan category: subscription, intensive, or addon';
COMMENT ON COLUMN membership_tiers.is_household_plan IS 'Whether this is a household plan (vs solo)';

-- ============================================================================
-- STEP 3: DROP LEGACY/DUPLICATE FIELDS
-- ============================================================================

-- Drop duplicate token field
ALTER TABLE membership_tiers 
DROP COLUMN IF EXISTS monthly_vibe_assistant_tokens;

-- Drop unused cost limit field
ALTER TABLE membership_tiers 
DROP COLUMN IF EXISTS monthly_vibe_assistant_cost_limit;

-- Drop duplicate price field (NUMERIC)
ALTER TABLE membership_tiers 
DROP COLUMN IF EXISTS price_per_month;

-- ============================================================================
-- STEP 4: CLEAN UP EXISTING DATA
-- ============================================================================

-- Truncate to start fresh with correct data
TRUNCATE TABLE membership_tiers CASCADE;

-- ============================================================================
-- STEP 5: SEED ALL PLANS
-- ============================================================================

-- --------------------------------------------------------------------------
-- SOLO PLANS
-- --------------------------------------------------------------------------

INSERT INTO membership_tiers (
  name,
  tier_type,
  description,
  plan_category,
  is_household_plan,
  
  -- Tokens
  annual_token_grant,
  monthly_token_grant,
  viva_tokens_monthly,
  rollover_max_cycles,
  
  -- Storage & Seats
  storage_quota_gb,
  included_seats,
  max_household_members,
  
  -- Pricing (in cents)
  price_monthly,
  price_yearly,
  billing_interval,
  
  -- Stripe
  stripe_product_id,
  stripe_price_id,
  
  -- Display
  features,
  is_active,
  is_popular,
  display_order
) VALUES

-- Solo: Vision Pro Annual
(
  'Vision Pro Annual',
  'vision_pro_annual',
  'Full platform access with 5M AI tokens per year',
  'subscription',
  FALSE,
  
  5000000,  -- annual_token_grant
  0,        -- monthly_token_grant (not used for annual)
  0,        -- viva_tokens_monthly (calculated as annual/12 if needed)
  NULL,     -- rollover_max_cycles (annual = reset, not rollover)
  
  100,      -- storage_quota_gb
  1,        -- included_seats
  NULL,     -- max_household_members (solo)
  
  0,        -- price_monthly (annual doesn't have monthly price)
  99900,    -- price_yearly ($999)
  'year',
  
  NULL,     -- stripe_product_id (add after Stripe setup)
  NULL,     -- stripe_price_id (add after Stripe setup)
  
  '[
    "5M AI tokens per year",
    "100GB storage",
    "Life Vision Builder (12 categories)",
    "Vision Boards & Audio",
    "VIVA AI Assistant",
    "Priority support",
    "4 bonus check-ins per year",
    "Price locked for 12 months"
  ]'::jsonb,
  TRUE,
  FALSE,
  1
),

-- Solo: Vision Pro 28-Day
(
  'Vision Pro 28-Day',
  'vision_pro_28day',
  'Flexible monthly access with 375k AI tokens every 28 days',
  'subscription',
  FALSE,
  
  0,        -- annual_token_grant (not used for monthly)
  375000,   -- monthly_token_grant (dripped every 28 days)
  375000,   -- viva_tokens_monthly
  3,        -- rollover_max_cycles (max 3 cycles)
  
  25,       -- storage_quota_gb
  1,        -- included_seats
  NULL,     -- max_household_members (solo)
  
  9900,     -- price_monthly ($99)
  0,        -- price_yearly (monthly doesn't have annual price)
  'month',
  
  NULL,     -- stripe_product_id
  NULL,     -- stripe_price_id
  
  '[
    "375k AI tokens per 28 days",
    "25GB storage",
    "Life Vision Builder (12 categories)",
    "Vision Boards & Audio",
    "VIVA AI Assistant",
    "Unused tokens roll over (max 3 cycles)",
    "Cancel anytime"
  ]'::jsonb,
  TRUE,
  TRUE,     -- Most popular
  2
),

-- --------------------------------------------------------------------------
-- HOUSEHOLD PLANS
-- --------------------------------------------------------------------------

-- Household: Vision Pro Annual
(
  'Vision Pro Household Annual',
  'vision_pro_household_annual',
  'Full platform access for 2 people with 5M shared AI tokens per year',
  'subscription',
  TRUE,
  
  5000000,  -- annual_token_grant (shared across household)
  0,        -- monthly_token_grant
  0,        -- viva_tokens_monthly
  NULL,     -- rollover_max_cycles (annual reset)
  
  100,      -- storage_quota_gb (shared)
  2,        -- included_seats
  6,        -- max_household_members
  
  0,        -- price_monthly
  99900,    -- price_yearly ($999) - TODO: Confirm household annual pricing
  'year',
  
  NULL,     -- stripe_product_id
  NULL,     -- stripe_price_id
  
  '[
    "5M AI tokens per year (shared)",
    "100GB storage (shared)",
    "2 included seats",
    "Add up to 4 more members",
    "Life Vision Builder (12 categories)",
    "Individual & shared visions",
    "Optional token sharing",
    "Priority support"
  ]'::jsonb,
  TRUE,
  FALSE,
  3
),

-- Household: Vision Pro 28-Day
(
  'Vision Pro Household 28-Day',
  'vision_pro_household_28day',
  'Flexible monthly access for 2 people with 750k AI tokens every 28 days',
  'subscription',
  TRUE,
  
  0,        -- annual_token_grant
  750000,   -- monthly_token_grant (375k × 2 seats)
  750000,   -- viva_tokens_monthly
  3,        -- rollover_max_cycles
  
  100,      -- storage_quota_gb (shared)
  2,        -- included_seats
  6,        -- max_household_members
  
  14900,    -- price_monthly ($149)
  0,        -- price_yearly
  'month',
  
  NULL,     -- stripe_product_id
  NULL,     -- stripe_price_id
  
  '[
    "750k AI tokens per 28 days (375k per seat)",
    "100GB storage (shared)",
    "2 included seats",
    "Add up to 4 more members ($19/28-days each)",
    "Life Vision Builder (12 categories)",
    "Individual & shared visions",
    "Optional token sharing",
    "Unused tokens roll over (max 3 cycles)"
  ]'::jsonb,
  TRUE,
  FALSE,
  4
),

-- --------------------------------------------------------------------------
-- ADD-ON PLANS
-- --------------------------------------------------------------------------

-- Add-on: Additional Household Member (28-Day)
(
  'Household Add-on Member (28-Day)',
  'household_addon_28day',
  'Additional family member for household plans',
  'addon',
  TRUE,
  
  0,        -- annual_token_grant
  100000,   -- monthly_token_grant (100k per member per 28 days)
  100000,   -- viva_tokens_monthly
  3,        -- rollover_max_cycles
  
  0,        -- storage_quota_gb (uses household shared storage)
  1,        -- included_seats
  NULL,     -- max_household_members
  
  1900,     -- price_monthly ($19)
  0,        -- price_yearly
  'month',
  
  NULL,     -- stripe_product_id
  NULL,     -- stripe_price_id
  
  '[
    "100k AI tokens per 28 days",
    "Shared household storage",
    "Full platform access",
    "Individual vision tracking"
  ]'::jsonb,
  TRUE,
  FALSE,
  5
),

-- Add-on: Additional Household Member (Annual)
(
  'Household Add-on Member (Annual)',
  'household_addon_annual',
  'Additional family member for household plans (annual billing)',
  'addon',
  TRUE,
  
  1200000,  -- annual_token_grant (100k × 12 months)
  0,        -- monthly_token_grant
  0,        -- viva_tokens_monthly
  NULL,     -- rollover_max_cycles (annual reset)
  
  0,        -- storage_quota_gb (uses household shared storage)
  1,        -- included_seats
  NULL,     -- max_household_members
  
  0,        -- price_monthly
  19200,    -- price_yearly ($192)
  'year',
  
  NULL,     -- stripe_product_id
  NULL,     -- stripe_price_id
  
  '[
    "1.2M AI tokens per year (100k/month)",
    "Shared household storage",
    "Full platform access",
    "Individual vision tracking"
  ]'::jsonb,
  TRUE,
  FALSE,
  6
),

-- --------------------------------------------------------------------------
-- INTENSIVE PLANS
-- --------------------------------------------------------------------------

-- Intensive: Solo
(
  'Intensive Program',
  'intensive',
  'Complete intensive program with 72-hour activation and 56 days of trial tokens',
  'intensive',
  FALSE,
  
  0,        -- annual_token_grant
  1000000,  -- monthly_token_grant (trial tokens during 56-day window)
  0,        -- viva_tokens_monthly
  NULL,     -- rollover_max_cycles (expires after 56 days)
  
  25,       -- storage_quota_gb
  1,        -- included_seats
  NULL,     -- max_household_members
  
  49900,    -- price_monthly ($499 one-time)
  0,        -- price_yearly
  'one-time',
  
  NULL,     -- stripe_product_id
  NULL,     -- stripe_price_id
  
  '[
    "72-hour activation window",
    "1M trial tokens (56 days)",
    "Life Vision Builder",
    "1:1 calibration call",
    "Vision Pro upgrade at Day 56"
  ]'::jsonb,
  TRUE,
  FALSE,
  7
),

-- Intensive: Household
(
  'Intensive Program (Household)',
  'intensive_household',
  'Complete intensive program for 2 people with shared activation',
  'intensive',
  TRUE,
  
  0,        -- annual_token_grant
  2000000,  -- monthly_token_grant (1M × 2 seats, expires after 56 days)
  0,        -- viva_tokens_monthly
  NULL,     -- rollover_max_cycles
  
  100,      -- storage_quota_gb (shared)
  2,        -- included_seats
  6,        -- max_household_members
  
  69900,    -- price_monthly ($699 one-time)
  0,        -- price_yearly
  'one-time',
  
  NULL,     -- stripe_product_id
  NULL,     -- stripe_price_id
  
  '[
    "72-hour activation window (2 people)",
    "2M trial tokens (1M per seat, 56 days)",
    "Life Vision Builder for both",
    "Joint calibration call",
    "Vision Pro Household upgrade at Day 56"
  ]'::jsonb,
  TRUE,
  FALSE,
  8
);

-- ============================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Get tier by Stripe price ID (used in webhook)
CREATE OR REPLACE FUNCTION get_tier_by_stripe_price_id(p_price_id TEXT)
RETURNS membership_tiers AS $$
DECLARE
  v_tier membership_tiers;
BEGIN
  SELECT * INTO v_tier
  FROM membership_tiers
  WHERE stripe_price_id = p_price_id
  AND is_active = TRUE;
  
  RETURN v_tier;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get tier configuration as JSONB (for API responses)
CREATE OR REPLACE FUNCTION get_tier_config(p_tier_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'id', id,
      'name', name,
      'tier_type', tier_type,
      'tokens', CASE 
        WHEN billing_interval = 'year' THEN annual_token_grant
        ELSE monthly_token_grant
      END,
      'storage_gb', storage_quota_gb,
      'seats', included_seats,
      'max_members', max_household_members,
      'rollover_cycles', rollover_max_cycles,
      'is_household', is_household_plan,
      'price_monthly', price_monthly,
      'price_yearly', price_yearly
    )
    FROM membership_tiers
    WHERE id = p_tier_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 7: UPDATE RLS POLICIES
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Membership tiers are viewable by everyone" ON membership_tiers;
DROP POLICY IF EXISTS "membership_tiers_select_policy" ON membership_tiers;

-- Everyone can view active tiers (for pricing page)
CREATE POLICY "Active membership tiers are viewable by everyone"
ON membership_tiers
FOR SELECT
USING (is_active = TRUE);

-- Only service role can modify
CREATE POLICY "Only service role can modify membership tiers"
ON membership_tiers
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON membership_tiers TO authenticated, anon;
GRANT ALL ON membership_tiers TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE membership_tiers IS 'Single source of truth for all billing configuration, token grants, and plan features';

