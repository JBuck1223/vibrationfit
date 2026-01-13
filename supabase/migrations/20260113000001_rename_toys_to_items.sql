-- Rename toys column to items in user_profiles table
-- This better reflects that these are recreational items/possessions

BEGIN;

-- Rename the column
ALTER TABLE user_profiles
  RENAME COLUMN toys TO items;

COMMIT;
