-- Reset profile version numbers to start from 1
-- This will renumber all versions for each user starting from 1

-- First, let's see what versions exist
SELECT 
    user_id,
    id,
    version_number,
    is_draft,
    created_at
FROM profile_versions 
ORDER BY user_id, created_at;

-- Create a temporary table with the correct version numbers
WITH versioned_profiles AS (
    SELECT 
        user_id,
        id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as new_version_number,
        profile_data,
        completion_percentage,
        is_draft,
        created_at,
        updated_at
    FROM profile_versions
)
UPDATE profile_versions 
SET version_number = vp.new_version_number
FROM versioned_profiles vp
WHERE profile_versions.id = vp.id;

-- Verify the results
SELECT 
    user_id,
    id,
    version_number,
    is_draft,
    created_at
FROM profile_versions 
ORDER BY user_id, version_number;
