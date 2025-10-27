-- ============================================================================
-- Rename Profile Story Fields to Match Display Labels
-- ============================================================================
-- This migration renames the profile story fields to use labels that match
-- the VISION_CATEGORIES display labels (not keys).

begin;

-- Rename story fields to match VISION_CATEGORIES display labels
ALTER TABLE user_profiles 
  RENAME COLUMN fun_recreation_story TO fun_story;

ALTER TABLE user_profiles 
  RENAME COLUMN health_vitality_story TO health_story;

ALTER TABLE user_profiles 
  RENAME COLUMN travel_adventure_story TO travel_story;

ALTER TABLE user_profiles 
  RENAME COLUMN romance_partnership_story TO love_story;

ALTER TABLE user_profiles 
  RENAME COLUMN family_parenting_story TO family_story;

ALTER TABLE user_profiles 
  RENAME COLUMN social_friends_story TO social_story;

ALTER TABLE user_profiles 
  RENAME COLUMN home_environment_story TO home_story;

ALTER TABLE user_profiles 
  RENAME COLUMN career_work_story TO work_story;

ALTER TABLE user_profiles 
  RENAME COLUMN money_wealth_story TO money_story;

ALTER TABLE user_profiles 
  RENAME COLUMN possessions_lifestyle_story TO stuff_story;

ALTER TABLE user_profiles 
  RENAME COLUMN giving_legacy_story TO giving_story;

ALTER TABLE user_profiles 
  RENAME COLUMN spirituality_growth_story TO spirituality_story;

-- Update column comments
COMMENT ON COLUMN user_profiles.fun_story IS 'Natural language: Tell us about fun and recreation in your life';
COMMENT ON COLUMN user_profiles.health_story IS 'Natural language: Tell us about your health and body';
COMMENT ON COLUMN user_profiles.travel_story IS 'Natural language: Tell us about travel and adventure';
COMMENT ON COLUMN user_profiles.love_story IS 'Natural language: Tell us about your love life and relationship status';
COMMENT ON COLUMN user_profiles.family_story IS 'Natural language: Tell us about your family and parenting situation';
COMMENT ON COLUMN user_profiles.social_story IS 'Natural language: Tell us about your social life and friendships';
COMMENT ON COLUMN user_profiles.home_story IS 'Natural language: Tell us about where you live';
COMMENT ON COLUMN user_profiles.work_story IS 'Natural language: Tell us about your work and career';
COMMENT ON COLUMN user_profiles.money_story IS 'Natural language: Tell us about your financial situation';
COMMENT ON COLUMN user_profiles.stuff_story IS 'Natural language: Tell us about your lifestyle and possessions';
COMMENT ON COLUMN user_profiles.giving_story IS 'Natural language: Tell us about giving back and your legacy';
COMMENT ON COLUMN user_profiles.spirituality_story IS 'Natural language: Tell us about your spiritual life and personal growth';

commit;
