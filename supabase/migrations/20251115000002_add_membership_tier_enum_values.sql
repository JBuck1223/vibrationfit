-- ============================================================================
-- ADD MEMBERSHIP TIER ENUM VALUES
-- ============================================================================
-- Migration: 20251115000002_add_membership_tier_enum_values.sql
-- Description: Add household and intensive enum values
-- Note: Must run BEFORE 20251115000003_upgrade_membership_tiers.sql
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


