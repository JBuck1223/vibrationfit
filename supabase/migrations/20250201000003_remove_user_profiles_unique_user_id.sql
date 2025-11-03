-- Remove the UNIQUE constraint on user_id in user_profiles table
-- This allows versioning with multiple rows per user (one active, one draft)
-- The unique constraints are now handled by partial indexes based on is_draft and is_active

-- Drop the unique constraint if it exists
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;

-- Add comment for documentation
COMMENT ON TABLE user_profiles IS 'Versioned user profiles allowing multiple profiles per user (active + draft)';

