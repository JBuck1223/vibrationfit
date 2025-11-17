-- ============================================================================
-- Update Family Children to Use Table Structure
-- ============================================================================
-- Replace number_of_children and children_ages with a children JSONB array
-- Each child has: first_name, birthday

BEGIN;

-- Add children column (JSONB array)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN user_profiles.children IS 'Array of child objects: [{first_name, birthday}]';

-- Note: We're keeping number_of_children and children_ages columns for now
-- to avoid breaking existing data. They can be removed in a future migration
-- after data migration is complete.

COMMIT;

