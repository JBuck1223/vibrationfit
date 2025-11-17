-- ============================================================================
-- Add Trips Table to User Profiles
-- ============================================================================
-- This migration adds a JSONB column to store trips as an array
-- Each trip has: destination, year, duration

BEGIN;

-- Add trips column (JSONB array)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS trips JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN user_profiles.trips IS 'Array of trip objects: [{destination, year, duration}]';

COMMIT;

