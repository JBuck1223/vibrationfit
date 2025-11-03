-- Add profile_data column to refinements table for profile refinement drafts
-- This enables storing profile draft data separate from vision refinement data

ALTER TABLE refinements 
ADD COLUMN IF NOT EXISTS profile_data JSONB;

-- Add index for searching profile_data
CREATE INDEX IF NOT EXISTS idx_refinements_profile_data ON refinements USING gin(profile_data);

-- Add comment for documentation
COMMENT ON COLUMN refinements.profile_data IS 'Profile draft data for refine_profile operations';

