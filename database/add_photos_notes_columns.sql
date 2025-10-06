-- Add missing columns to user_profiles table for Photos & Notes section
-- Run this in your Supabase SQL editor

-- Add version_notes column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS version_notes TEXT;

-- Add progress_photos column (array of text URLs)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS progress_photos TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.version_notes IS 'Optional notes about this version of the profile';
COMMENT ON COLUMN user_profiles.progress_photos IS 'Array of URLs to progress photos (optional)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('version_notes', 'progress_photos')
ORDER BY column_name;
