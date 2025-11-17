-- ============================================================================
-- Add Vehicles and Toys Tables to User Profiles
-- ============================================================================
-- This migration adds JSONB columns to store vehicles and toys as arrays
-- Each item has: name, year_acquired, ownership_status

BEGIN;

-- Add vehicles column (JSONB array)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS vehicles JSONB DEFAULT '[]'::jsonb;

-- Add toys column (JSONB array)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS toys JSONB DEFAULT '[]'::jsonb;

-- Add has_vehicle boolean for conditional display
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS has_vehicle BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN user_profiles.vehicles IS 'Array of vehicle objects: [{name, year_acquired, ownership_status}]';
COMMENT ON COLUMN user_profiles.toys IS 'Array of toy/recreational item objects: [{name, year_acquired, ownership_status}]';
COMMENT ON COLUMN user_profiles.has_vehicle IS 'Whether user has a vehicle (triggers vehicle table display)';

COMMIT;

