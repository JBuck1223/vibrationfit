-- Consolidate clarity_ and contrast_ fields into single state_ fields.
-- People don't think bilaterally; a single "current state" field replaces
-- the separate "what's going well" / "what's not going well" pair.
--
-- 24 columns removed (12 clarity_ + 12 contrast_)
-- 12 columns added  (state_{category})

-- Step 1: Add 12 new state_ columns
ALTER TABLE user_profiles ADD COLUMN state_fun text;
ALTER TABLE user_profiles ADD COLUMN state_health text;
ALTER TABLE user_profiles ADD COLUMN state_travel text;
ALTER TABLE user_profiles ADD COLUMN state_love text;
ALTER TABLE user_profiles ADD COLUMN state_family text;
ALTER TABLE user_profiles ADD COLUMN state_social text;
ALTER TABLE user_profiles ADD COLUMN state_home text;
ALTER TABLE user_profiles ADD COLUMN state_work text;
ALTER TABLE user_profiles ADD COLUMN state_money text;
ALTER TABLE user_profiles ADD COLUMN state_stuff text;
ALTER TABLE user_profiles ADD COLUMN state_giving text;
ALTER TABLE user_profiles ADD COLUMN state_spirituality text;

-- Step 2: Migrate existing data (merge clarity + contrast with double-newline separator)
UPDATE user_profiles SET state_fun = CONCAT_WS(E'\n\n', clarity_fun, contrast_fun)
  WHERE clarity_fun IS NOT NULL OR contrast_fun IS NOT NULL;

UPDATE user_profiles SET state_health = CONCAT_WS(E'\n\n', clarity_health, contrast_health)
  WHERE clarity_health IS NOT NULL OR contrast_health IS NOT NULL;

UPDATE user_profiles SET state_travel = CONCAT_WS(E'\n\n', clarity_travel, contrast_travel)
  WHERE clarity_travel IS NOT NULL OR contrast_travel IS NOT NULL;

UPDATE user_profiles SET state_love = CONCAT_WS(E'\n\n', clarity_love, contrast_love)
  WHERE clarity_love IS NOT NULL OR contrast_love IS NOT NULL;

UPDATE user_profiles SET state_family = CONCAT_WS(E'\n\n', clarity_family, contrast_family)
  WHERE clarity_family IS NOT NULL OR contrast_family IS NOT NULL;

UPDATE user_profiles SET state_social = CONCAT_WS(E'\n\n', clarity_social, contrast_social)
  WHERE clarity_social IS NOT NULL OR contrast_social IS NOT NULL;

UPDATE user_profiles SET state_home = CONCAT_WS(E'\n\n', clarity_home, contrast_home)
  WHERE clarity_home IS NOT NULL OR contrast_home IS NOT NULL;

UPDATE user_profiles SET state_work = CONCAT_WS(E'\n\n', clarity_work, contrast_work)
  WHERE clarity_work IS NOT NULL OR contrast_work IS NOT NULL;

UPDATE user_profiles SET state_money = CONCAT_WS(E'\n\n', clarity_money, contrast_money)
  WHERE clarity_money IS NOT NULL OR contrast_money IS NOT NULL;

UPDATE user_profiles SET state_stuff = CONCAT_WS(E'\n\n', clarity_stuff, contrast_stuff)
  WHERE clarity_stuff IS NOT NULL OR contrast_stuff IS NOT NULL;

UPDATE user_profiles SET state_giving = CONCAT_WS(E'\n\n', clarity_giving, contrast_giving)
  WHERE clarity_giving IS NOT NULL OR contrast_giving IS NOT NULL;

UPDATE user_profiles SET state_spirituality = CONCAT_WS(E'\n\n', clarity_spirituality, contrast_spirituality)
  WHERE clarity_spirituality IS NOT NULL OR contrast_spirituality IS NOT NULL;

-- Step 3: Drop old columns
ALTER TABLE user_profiles
  DROP COLUMN clarity_fun,
  DROP COLUMN clarity_health,
  DROP COLUMN clarity_travel,
  DROP COLUMN clarity_love,
  DROP COLUMN clarity_family,
  DROP COLUMN clarity_social,
  DROP COLUMN clarity_home,
  DROP COLUMN clarity_work,
  DROP COLUMN clarity_money,
  DROP COLUMN clarity_stuff,
  DROP COLUMN clarity_giving,
  DROP COLUMN clarity_spirituality,
  DROP COLUMN contrast_fun,
  DROP COLUMN contrast_health,
  DROP COLUMN contrast_travel,
  DROP COLUMN contrast_love,
  DROP COLUMN contrast_family,
  DROP COLUMN contrast_social,
  DROP COLUMN contrast_home,
  DROP COLUMN contrast_work,
  DROP COLUMN contrast_money,
  DROP COLUMN contrast_stuff,
  DROP COLUMN contrast_giving,
  DROP COLUMN contrast_spirituality;

-- Step 4: Add column comments
COMMENT ON COLUMN public.user_profiles.state_fun IS 'Current state of Fun & Recreation';
COMMENT ON COLUMN public.user_profiles.state_health IS 'Current state of Health & Wellness';
COMMENT ON COLUMN public.user_profiles.state_travel IS 'Current state of Travel & Adventure';
COMMENT ON COLUMN public.user_profiles.state_love IS 'Current state of Love & Relationships';
COMMENT ON COLUMN public.user_profiles.state_family IS 'Current state of Family';
COMMENT ON COLUMN public.user_profiles.state_social IS 'Current state of Social & Friends';
COMMENT ON COLUMN public.user_profiles.state_home IS 'Current state of Home & Living';
COMMENT ON COLUMN public.user_profiles.state_work IS 'Current state of Work & Career';
COMMENT ON COLUMN public.user_profiles.state_money IS 'Current state of Money & Finances';
COMMENT ON COLUMN public.user_profiles.state_stuff IS 'Current state of Stuff & Lifestyle';
COMMENT ON COLUMN public.user_profiles.state_giving IS 'Current state of Giving & Legacy';
COMMENT ON COLUMN public.user_profiles.state_spirituality IS 'Current state of Spirituality & Growth';
