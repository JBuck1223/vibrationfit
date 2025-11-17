-- ============================================================================
-- Remove Primary Vehicle and Has Vehicle Fields
-- ============================================================================
-- These fields are no longer needed since we're using the vehicles array table

BEGIN;

-- Remove has_vehicle column
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS has_vehicle;

-- Remove primary_vehicle column
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS primary_vehicle;

COMMIT;

