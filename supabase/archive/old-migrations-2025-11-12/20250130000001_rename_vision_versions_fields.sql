-- ============================================================================
-- Rename vision_versions Category Fields to Match Display Labels
-- ============================================================================
-- This migration renames the category columns in vision_versions table to
-- match the VISION_CATEGORIES display labels and align with the new category system.
-- Renames: romance → love, business → work, possessions → stuff

begin;

-- Rename all three columns (only if they exist and haven't been renamed already)
DO $$
BEGIN
  -- 1. Rename romance to love (if romance exists and love doesn't)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'vision_versions' 
      AND column_name = 'romance'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'vision_versions' 
      AND column_name = 'love'
  ) THEN
    ALTER TABLE vision_versions RENAME COLUMN romance TO love;
    RAISE NOTICE 'Renamed romance → love';
  END IF;

  -- 2. Rename business to work (if business exists and work doesn't)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'vision_versions' 
      AND column_name = 'business'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'vision_versions' 
      AND column_name = 'work'
  ) THEN
    ALTER TABLE vision_versions RENAME COLUMN business TO work;
    RAISE NOTICE 'Renamed business → work';
  END IF;

  -- 3. Rename possessions to stuff (if possessions exists and stuff doesn't)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'vision_versions' 
      AND column_name = 'possessions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'vision_versions' 
      AND column_name = 'stuff'
  ) THEN
    ALTER TABLE vision_versions RENAME COLUMN possessions TO stuff;
    RAISE NOTICE 'Renamed possessions → stuff';
  END IF;
END $$;

-- Add comments for ALL category columns for documentation consistency
DO $$
BEGIN
  -- Meta sections
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'forward') THEN
    COMMENT ON COLUMN vision_versions.forward IS 'Forward / Introduction - Vibrational warmup section';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'conclusion') THEN
    COMMENT ON COLUMN vision_versions.conclusion IS 'Conclusion - Unifying final section';
  END IF;

  -- 12 Life Category sections
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'fun') THEN
    COMMENT ON COLUMN vision_versions.fun IS 'Fun / Recreation category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'health') THEN
    COMMENT ON COLUMN vision_versions.health IS 'Health / Vitality category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'travel') THEN
    COMMENT ON COLUMN vision_versions.travel IS 'Travel / Adventure category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'love') THEN
    COMMENT ON COLUMN vision_versions.love IS 'Love / Romance / Partnership category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'family') THEN
    COMMENT ON COLUMN vision_versions.family IS 'Family / Parenting category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'social') THEN
    COMMENT ON COLUMN vision_versions.social IS 'Social / Friends category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'home') THEN
    COMMENT ON COLUMN vision_versions.home IS 'Home / Environment category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'work') THEN
    COMMENT ON COLUMN vision_versions.work IS 'Work / Business / Career category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'money') THEN
    COMMENT ON COLUMN vision_versions.money IS 'Money / Wealth category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'stuff') THEN
    COMMENT ON COLUMN vision_versions.stuff IS 'Stuff / Possessions / Lifestyle category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'giving') THEN
    COMMENT ON COLUMN vision_versions.giving IS 'Giving / Legacy category content';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vision_versions' AND column_name = 'spirituality') THEN
    COMMENT ON COLUMN vision_versions.spirituality IS 'Spirituality / Growth category content';
  END IF;
END $$;

-- Note: Column rename preserves all existing data automatically
-- No data migration needed

commit;

