-- ============================================================================
-- Rename Story Fields to Clarity Fields and Add Contrast Fields
-- ============================================================================
-- This migration:
-- 1. Renames all {category}_story fields to clarity_{category} fields
-- 2. Adds new contrast_{category} fields for each category
-- 3. Updates column comments with new descriptions

begin;

-- Rename story fields to clarity fields (using vision category keys from vision-categories.ts)
ALTER TABLE user_profiles 
  RENAME COLUMN fun_story TO clarity_fun;

ALTER TABLE user_profiles 
  RENAME COLUMN health_story TO clarity_health;

ALTER TABLE user_profiles 
  RENAME COLUMN travel_story TO clarity_travel;

ALTER TABLE user_profiles 
  RENAME COLUMN love_story TO clarity_love;

ALTER TABLE user_profiles 
  RENAME COLUMN family_story TO clarity_family;

ALTER TABLE user_profiles 
  RENAME COLUMN social_story TO clarity_social;

ALTER TABLE user_profiles 
  RENAME COLUMN home_story TO clarity_home;

ALTER TABLE user_profiles 
  RENAME COLUMN work_story TO clarity_work;

ALTER TABLE user_profiles 
  RENAME COLUMN money_story TO clarity_money;

ALTER TABLE user_profiles 
  RENAME COLUMN stuff_story TO clarity_stuff;

ALTER TABLE user_profiles 
  RENAME COLUMN giving_story TO clarity_giving;

ALTER TABLE user_profiles 
  RENAME COLUMN spirituality_story TO clarity_spirituality;

-- Add contrast fields for each category
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_fun TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_health TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_travel TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_love TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_family TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_social TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_home TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_work TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_money TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_stuff TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_giving TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS contrast_spirituality TEXT;

-- Update column comments for clarity fields
COMMENT ON COLUMN user_profiles.clarity_fun IS 'What''s going well in Fun?';
COMMENT ON COLUMN user_profiles.clarity_health IS 'What''s going well in Health?';
COMMENT ON COLUMN user_profiles.clarity_travel IS 'What''s going well in Travel?';
COMMENT ON COLUMN user_profiles.clarity_love IS 'What''s going well in Love?';
COMMENT ON COLUMN user_profiles.clarity_family IS 'What''s going well in Family?';
COMMENT ON COLUMN user_profiles.clarity_social IS 'What''s going well in Social?';
COMMENT ON COLUMN user_profiles.clarity_home IS 'What''s going well in Home?';
COMMENT ON COLUMN user_profiles.clarity_work IS 'What''s going well in Work?';
COMMENT ON COLUMN user_profiles.clarity_money IS 'What''s going well in Money?';
COMMENT ON COLUMN user_profiles.clarity_stuff IS 'What''s going well in Stuff?';
COMMENT ON COLUMN user_profiles.clarity_giving IS 'What''s going well in Giving?';
COMMENT ON COLUMN user_profiles.clarity_spirituality IS 'What''s going well in Spirituality?';

-- Add column comments for contrast fields
COMMENT ON COLUMN user_profiles.contrast_fun IS 'What''s not going well in Fun?';
COMMENT ON COLUMN user_profiles.contrast_health IS 'What''s not going well in Health?';
COMMENT ON COLUMN user_profiles.contrast_travel IS 'What''s not going well in Travel?';
COMMENT ON COLUMN user_profiles.contrast_love IS 'What''s not going well in Love?';
COMMENT ON COLUMN user_profiles.contrast_family IS 'What''s not going well in Family?';
COMMENT ON COLUMN user_profiles.contrast_social IS 'What''s not going well in Social?';
COMMENT ON COLUMN user_profiles.contrast_home IS 'What''s not going well in Home?';
COMMENT ON COLUMN user_profiles.contrast_work IS 'What''s not going well in Work?';
COMMENT ON COLUMN user_profiles.contrast_money IS 'What''s not going well in Money?';
COMMENT ON COLUMN user_profiles.contrast_stuff IS 'What''s not going well in Stuff?';
COMMENT ON COLUMN user_profiles.contrast_giving IS 'What''s not going well in Giving?';
COMMENT ON COLUMN user_profiles.contrast_spirituality IS 'What''s not going well in Spirituality?';

commit;

