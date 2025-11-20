-- Remove old category keys from assessment_category ENUM
-- These are no longer used: romance, business, possessions
-- We now use: love, work, stuff

-- Note: PostgreSQL doesn't allow direct removal of ENUM values
-- We need to create a new ENUM type and migrate

-- 1. Create new ENUM with only the current category keys
DO $$ 
BEGIN
  -- Only create if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_category_new') THEN
    CREATE TYPE assessment_category_new AS ENUM (
      'love',
      'work',
      'stuff',
      'money',
      'health',
      'family',
      'social',
      'fun',
      'travel',
      'home',
      'giving',
      'spirituality'
    );
  END IF;
END $$;

-- 2. Update all tables to use the new ENUM
-- Note: All data should already be migrated to new keys from previous migrations

-- Update assessment_responses
ALTER TABLE assessment_responses 
  ALTER COLUMN category TYPE assessment_category_new 
  USING category::text::assessment_category_new;

-- Update assessment_results (category_scores JSONB keys are already updated)

-- Update assessment_insights
ALTER TABLE assessment_insights 
  ALTER COLUMN category TYPE assessment_category_new 
  USING category::text::assessment_category_new;

-- 3. Drop old ENUM with CASCADE to handle function dependencies
DROP TYPE assessment_category CASCADE;

-- 4. Rename new ENUM to old name
ALTER TYPE assessment_category_new RENAME TO assessment_category;

-- 5. Recreate the calculate_category_score function with new type
CREATE OR REPLACE FUNCTION public.calculate_category_score(
  p_assessment_id uuid,
  p_category assessment_category
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_score INTEGER;
BEGIN
  -- Calculate sum of response values for this category
  SELECT COALESCE(SUM(response_value), 0)
  INTO v_total_score
  FROM assessment_responses
  WHERE assessment_id = p_assessment_id
    AND category = p_category;
  
  RETURN v_total_score;
END;
$$;

COMMENT ON FUNCTION public.calculate_category_score(uuid, assessment_category) IS 'Calculates total score for a category in an assessment';

-- 6. Add comment to type
COMMENT ON TYPE assessment_category IS 'Life categories for assessments - uses unified keys (love, work, stuff)';

