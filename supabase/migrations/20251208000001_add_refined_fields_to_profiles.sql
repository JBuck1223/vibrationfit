-- Add refined_fields array to user_profiles table for tracking refined fields in drafts
-- Similar to refined_categories in vision_versions table

ALTER TABLE user_profiles
ADD COLUMN refined_fields TEXT[] DEFAULT '{}';

-- Create GIN index for efficient array operations
CREATE INDEX idx_user_profiles_refined_fields 
ON user_profiles USING GIN (refined_fields);

-- Add comment to document the field
COMMENT ON COLUMN user_profiles.refined_fields 
IS 'Array of field keys that have been refined in this draft (e.g. clarity_health, partner_name, email)';






