-- Migration: Add dream and worry fields for each life category to user_profiles
-- Date: November 19, 2025
-- Adds 24 new text columns (2 per category × 12 categories)

-- Add dream fields for each category
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS dream_fun TEXT,
  ADD COLUMN IF NOT EXISTS dream_health TEXT,
  ADD COLUMN IF NOT EXISTS dream_travel TEXT,
  ADD COLUMN IF NOT EXISTS dream_love TEXT,
  ADD COLUMN IF NOT EXISTS dream_family TEXT,
  ADD COLUMN IF NOT EXISTS dream_social TEXT,
  ADD COLUMN IF NOT EXISTS dream_home TEXT,
  ADD COLUMN IF NOT EXISTS dream_work TEXT,
  ADD COLUMN IF NOT EXISTS dream_money TEXT,
  ADD COLUMN IF NOT EXISTS dream_stuff TEXT,
  ADD COLUMN IF NOT EXISTS dream_giving TEXT,
  ADD COLUMN IF NOT EXISTS dream_spirituality TEXT;

-- Add worry fields for each category
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS worry_fun TEXT,
  ADD COLUMN IF NOT EXISTS worry_health TEXT,
  ADD COLUMN IF NOT EXISTS worry_travel TEXT,
  ADD COLUMN IF NOT EXISTS worry_love TEXT,
  ADD COLUMN IF NOT EXISTS worry_family TEXT,
  ADD COLUMN IF NOT EXISTS worry_social TEXT,
  ADD COLUMN IF NOT EXISTS worry_home TEXT,
  ADD COLUMN IF NOT EXISTS worry_work TEXT,
  ADD COLUMN IF NOT EXISTS worry_money TEXT,
  ADD COLUMN IF NOT EXISTS worry_stuff TEXT,
  ADD COLUMN IF NOT EXISTS worry_giving TEXT,
  ADD COLUMN IF NOT EXISTS worry_spirituality TEXT;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.dream_fun IS 'User''s dream/aspiration in the Fun & Recreation category';
COMMENT ON COLUMN user_profiles.dream_health IS 'User''s dream/aspiration in the Health & Vitality category';
COMMENT ON COLUMN user_profiles.dream_travel IS 'User''s dream/aspiration in the Travel & Adventure category';
COMMENT ON COLUMN user_profiles.dream_love IS 'User''s dream/aspiration in the Love & Romance category';
COMMENT ON COLUMN user_profiles.dream_family IS 'User''s dream/aspiration in the Family & Parenting category';
COMMENT ON COLUMN user_profiles.dream_social IS 'User''s dream/aspiration in the Social & Friendships category';
COMMENT ON COLUMN user_profiles.dream_home IS 'User''s dream/aspiration in the Home & Environment category';
COMMENT ON COLUMN user_profiles.dream_work IS 'User''s dream/aspiration in the Work & Career category';
COMMENT ON COLUMN user_profiles.dream_money IS 'User''s dream/aspiration in the Money & Wealth category';
COMMENT ON COLUMN user_profiles.dream_stuff IS 'User''s dream/aspiration in the Stuff & Possessions category';
COMMENT ON COLUMN user_profiles.dream_giving IS 'User''s dream/aspiration in the Giving & Legacy category';
COMMENT ON COLUMN user_profiles.dream_spirituality IS 'User''s dream/aspiration in the Spirituality category';

COMMENT ON COLUMN user_profiles.worry_fun IS 'User''s worry/concern in the Fun & Recreation category';
COMMENT ON COLUMN user_profiles.worry_health IS 'User''s worry/concern in the Health & Vitality category';
COMMENT ON COLUMN user_profiles.worry_travel IS 'User''s worry/concern in the Travel & Adventure category';
COMMENT ON COLUMN user_profiles.worry_love IS 'User''s worry/concern in the Love & Romance category';
COMMENT ON COLUMN user_profiles.worry_family IS 'User''s worry/concern in the Family & Parenting category';
COMMENT ON COLUMN user_profiles.worry_social IS 'User''s worry/concern in the Social & Friendships category';
COMMENT ON COLUMN user_profiles.worry_home IS 'User''s worry/concern in the Home & Environment category';
COMMENT ON COLUMN user_profiles.worry_work IS 'User''s worry/concern in the Work & Career category';
COMMENT ON COLUMN user_profiles.worry_money IS 'User''s worry/concern in the Money & Wealth category';
COMMENT ON COLUMN user_profiles.worry_stuff IS 'User''s worry/concern in the Stuff & Possessions category';
COMMENT ON COLUMN user_profiles.worry_giving IS 'User''s worry/concern in the Giving & Legacy category';
COMMENT ON COLUMN user_profiles.worry_spirituality IS 'User''s worry/concern in the Spirituality category';

