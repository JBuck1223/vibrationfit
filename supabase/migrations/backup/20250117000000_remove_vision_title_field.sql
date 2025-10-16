-- Remove title field from vision_versions table
-- Vision identification will be handled by version numbers and IDs

-- Drop the title column
ALTER TABLE vision_versions DROP COLUMN IF EXISTS title;

-- Update any existing completion percentage calculations that might reference title
-- (This will be handled in the application code)
