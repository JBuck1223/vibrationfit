-- ============================================================================
-- HORMOZI PRICING SYSTEM - PART 1: ADD ENUM VALUES
-- ============================================================================
-- This MUST be run first and committed before Part 2
-- PostgreSQL requires enum values to be committed before they can be used

-- Add new enum values for Vision Pro plans
DO $$ 
BEGIN
  -- Add 'vision_pro_annual'
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vision_pro_annual' AND enumtypid = 'membership_tier_type'::regtype) THEN
    ALTER TYPE membership_tier_type ADD VALUE 'vision_pro_annual';
    RAISE NOTICE 'Added enum value: vision_pro_annual';
  END IF;
  
  -- Add 'vision_pro_28day'
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vision_pro_28day' AND enumtypid = 'membership_tier_type'::regtype) THEN
    ALTER TYPE membership_tier_type ADD VALUE 'vision_pro_28day';
    RAISE NOTICE 'Added enum value: vision_pro_28day';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Enum values added. Run Part 2 migration next.';
END $$;

