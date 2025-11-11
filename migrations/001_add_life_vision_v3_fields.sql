-- Life Vision V3 Upgrade - Database Schema Changes
-- Created: 2025-01-10
-- Purpose: Add new fields for enhanced Life Vision Process with Being/Doing/Receiving blueprints,
--          ideal state capture, forward/conclusion sections, and richness metadata

-- =============================================================================
-- 1. Update refinements table
-- =============================================================================

-- Add ideal_state column for Step 2 (Unleash Imagination)
ALTER TABLE refinements
  ADD COLUMN IF NOT EXISTS ideal_state TEXT;

-- Add blueprint_data column for Step 3 (Being/Doing/Receiving loops)
-- Stored as JSONB to support array of loop objects
ALTER TABLE refinements
  ADD COLUMN IF NOT EXISTS blueprint_data JSONB;

COMMENT ON COLUMN refinements.ideal_state IS 'Step 2: User''s ideal state imagination for this category';
COMMENT ON COLUMN refinements.blueprint_data IS 'Step 3: Being/Doing/Receiving loops as JSONB array: [{"being": string, "doing": string, "receiving": string, "essence": string}]';

-- =============================================================================
-- 2. Update vision_versions table
-- =============================================================================

-- NOTE: forward and conclusion columns already exist in vision_versions
-- Only adding NEW V3 columns:

-- Add activation_message column for Step 6 celebration
ALTER TABLE vision_versions
  ADD COLUMN IF NOT EXISTS activation_message TEXT;

-- Add richness_metadata column to track input density per category
ALTER TABLE vision_versions
  ADD COLUMN IF NOT EXISTS richness_metadata JSONB;

COMMENT ON COLUMN vision_versions.activation_message IS 'Step 6: Celebration message with next steps guidance';
COMMENT ON COLUMN vision_versions.richness_metadata IS 'Per-category richness data as JSONB: {"fun": {"inputChars": 500, "ideas": 5, "density": "medium"}, ...}';

-- Note: forward and conclusion columns already exist and will be populated by existing/enhanced logic

-- =============================================================================
-- 3. Create indexes for performance
-- =============================================================================

-- Index on refinements.blueprint_data for JSONB queries
CREATE INDEX IF NOT EXISTS idx_refinements_blueprint_data 
  ON refinements USING GIN (blueprint_data);

-- Index on vision_versions.richness_metadata for JSONB queries
CREATE INDEX IF NOT EXISTS idx_vision_versions_richness_metadata 
  ON vision_versions USING GIN (richness_metadata);

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =============================================================================

-- To rollback these changes, run:
-- 
-- DROP INDEX IF EXISTS idx_refinements_blueprint_data;
-- DROP INDEX IF EXISTS idx_vision_versions_richness_metadata;
-- 
-- ALTER TABLE refinements DROP COLUMN IF EXISTS ideal_state;
-- ALTER TABLE refinements DROP COLUMN IF EXISTS blueprint_data;
-- 
-- ALTER TABLE vision_versions DROP COLUMN IF EXISTS activation_message;
-- ALTER TABLE vision_versions DROP COLUMN IF EXISTS richness_metadata;
--
-- Note: forward and conclusion columns were NOT added by this migration (already exist)

