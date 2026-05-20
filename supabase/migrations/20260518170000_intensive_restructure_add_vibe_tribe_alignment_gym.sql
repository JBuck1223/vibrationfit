-- Migration: Restructure Intensive (12 to 14 Steps)
-- Remove Assessment as required step, add Vibe Tribe + Alignment Gym steps
-- assessment_completed column is soft-deprecated (retained in DB, no longer referenced in UI)

ALTER TABLE intensive_checklist
  ADD COLUMN IF NOT EXISTS first_vibe_post BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_vibe_post_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vibe_engagement BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vibe_engagement_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS alignment_gym_toured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS alignment_gym_toured_at TIMESTAMPTZ;

COMMENT ON COLUMN intensive_checklist.first_vibe_post IS 'Step 10: User made their first post in Vibe Tribe';
COMMENT ON COLUMN intensive_checklist.vibe_engagement IS 'Step 11: User engaged (comment or heart) with another member in Vibe Tribe';
COMMENT ON COLUMN intensive_checklist.alignment_gym_toured IS 'Step 12: User completed the Alignment Gym guided tour';
COMMENT ON COLUMN intensive_checklist.assessment_completed IS 'SOFT-DEPRECATED: Assessment is no longer a required intensive step (retained for historical data)';
