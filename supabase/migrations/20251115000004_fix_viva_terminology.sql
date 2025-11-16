-- ============================================================================
-- FIX VIVA TERMINOLOGY IN MEMBERSHIP TIERS
-- ============================================================================
-- Migration: 20251115000004_fix_viva_terminology.sql
-- Description: Update features JSONB to use "VIVA" instead of generic AI terms
-- ============================================================================

-- Vision Pro Annual
UPDATE membership_tiers
SET features = '[
  "5M VIVA tokens per year",
  "100GB storage",
  "Life Vision Builder (12 categories)",
  "Vision Boards & Audio",
  "VIVA AI Assistant",
  "Priority support",
  "4 bonus check-ins per year",
  "Price locked for 12 months"
]'::jsonb
WHERE tier_type = 'vision_pro_annual';

-- Vision Pro 28-Day
UPDATE membership_tiers
SET features = '[
  "375k VIVA tokens per 28 days",
  "25GB storage",
  "Life Vision Builder (12 categories)",
  "Vision Boards & Audio",
  "VIVA AI Assistant",
  "Unused tokens roll over (max 3 cycles)",
  "Cancel anytime"
]'::jsonb
WHERE tier_type = 'vision_pro_28day';

-- Vision Pro Household Annual
UPDATE membership_tiers
SET features = '[
  "5M VIVA tokens per year (shared)",
  "100GB storage (shared)",
  "2 included seats",
  "Add up to 4 more members",
  "Life Vision Builder (12 categories)",
  "Individual & shared visions",
  "Optional token sharing",
  "Priority support"
]'::jsonb
WHERE tier_type = 'vision_pro_household_annual';

-- Vision Pro Household 28-Day
UPDATE membership_tiers
SET features = '[
  "750k VIVA tokens per 28 days (375k per seat)",
  "100GB storage (shared)",
  "2 included seats",
  "Add up to 4 more members ($19/28-days each)",
  "Life Vision Builder (12 categories)",
  "Individual & shared visions",
  "Optional token sharing",
  "Unused tokens roll over (max 3 cycles)"
]'::jsonb
WHERE tier_type = 'vision_pro_household_28day';

-- Household Add-on 28-Day
UPDATE membership_tiers
SET features = '[
  "100k VIVA tokens per 28 days",
  "Shared household storage",
  "Full platform access",
  "Individual vision tracking"
]'::jsonb
WHERE tier_type = 'household_addon_28day';

-- Household Add-on Annual
UPDATE membership_tiers
SET features = '[
  "1.2M VIVA tokens per year (100k/month)",
  "Shared household storage",
  "Full platform access",
  "Individual vision tracking"
]'::jsonb
WHERE tier_type = 'household_addon_annual';

-- Intensive Program
UPDATE membership_tiers
SET features = '[
  "72-hour activation window",
  "1M trial VIVA tokens (56 days)",
  "Life Vision Builder",
  "1:1 calibration call",
  "Vision Pro upgrade at Day 56"
]'::jsonb
WHERE tier_type = 'intensive';

-- Intensive Household
UPDATE membership_tiers
SET features = '[
  "72-hour activation window (2 people)",
  "2M trial VIVA tokens (1M per seat, 56 days)",
  "Life Vision Builder for both",
  "Joint calibration call",
  "Vision Pro Household upgrade at Day 56"
]'::jsonb
WHERE tier_type = 'intensive_household';


