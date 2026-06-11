-- Assessment V2 Migration
-- Adds support for custom response text, not-applicable responses,
-- self-assessment scores, and dynamic scoring that excludes N/A responses.

-- 1. Add columns to assessment_responses
ALTER TABLE public.assessment_responses
  ADD COLUMN IF NOT EXISTS custom_response_text text,
  ADD COLUMN IF NOT EXISTS is_not_applicable boolean DEFAULT false NOT NULL;

-- 2. Add self_assessment_scores to assessment_results
ALTER TABLE public.assessment_results
  ADD COLUMN IF NOT EXISTS self_assessment_scores jsonb;

COMMENT ON COLUMN public.assessment_results.self_assessment_scores IS 'User self-assessment ratings (1-10) per category, stored as {"money": 7, "health": 5, ...}';

-- 3. Add seeking_relationship to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS seeking_relationship boolean DEFAULT true NOT NULL;

COMMENT ON COLUMN public.user_profiles.seeking_relationship IS 'Whether user is actively seeking a romantic relationship (used for assessment branching)';

-- 4. Update calculate_category_score to exclude N/A responses
CREATE OR REPLACE FUNCTION public.calculate_category_score(p_assessment_id uuid, p_category public.assessment_category)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_score INTEGER;
BEGIN
  SELECT COALESCE(SUM(response_value), 0)
  INTO v_total_score
  FROM assessment_responses
  WHERE assessment_id = p_assessment_id
    AND category = p_category
    AND is_not_applicable = false;
  
  RETURN v_total_score;
END;
$$;

COMMENT ON FUNCTION public.calculate_category_score(uuid, public.assessment_category) IS 'Calculates total score for a category, excluding N/A responses';

-- 5. Update get_green_line_status to accept dynamic max score
CREATE OR REPLACE FUNCTION public.get_green_line_status(p_score integer, p_max_score integer DEFAULT 35)
RETURNS public.green_line_status
LANGUAGE plpgsql
AS $$
DECLARE
  v_percentage NUMERIC;
BEGIN
  IF p_max_score <= 0 THEN
    RETURN 'below'::green_line_status;
  END IF;

  v_percentage := (p_score::NUMERIC / p_max_score::NUMERIC) * 100;
  
  IF v_percentage >= 80 THEN
    RETURN 'above'::green_line_status;
  ELSIF v_percentage >= 60 THEN
    RETURN 'transition'::green_line_status;
  ELSE
    RETURN 'below'::green_line_status;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_green_line_status(integer, integer) IS 'Determines Green Line status based on score percentage with dynamic max score';

-- 6. Update update_assessment_scores to use dynamic max per category
CREATE OR REPLACE FUNCTION public.update_assessment_scores() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_category_score INTEGER;
  v_category_max INTEGER;
  v_green_line_status green_line_status;
  v_total_score INTEGER;
  v_total_max INTEGER;
  v_category_scores JSONB;
  v_green_line_statuses JSONB;
  v_category_key TEXT;
  v_answered_count INTEGER;
BEGIN
  v_category_scores := '{}'::JSONB;
  v_green_line_statuses := '{}'::JSONB;
  v_total_score := 0;
  v_total_max := 0;
  
  FOR v_category_key IN 
    SELECT DISTINCT category::TEXT 
    FROM assessment_responses 
    WHERE assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id)
  LOOP
    -- Calculate category score (excludes N/A via the function)
    SELECT calculate_category_score(
      COALESCE(NEW.assessment_id, OLD.assessment_id),
      v_category_key::assessment_category
    ) INTO v_category_score;
    
    -- Count non-N/A responses for dynamic max
    SELECT COUNT(*)
    INTO v_answered_count
    FROM assessment_responses
    WHERE assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id)
      AND category = v_category_key::assessment_category
      AND is_not_applicable = false;
    
    v_category_max := v_answered_count * 5;
    
    -- Get Green Line status with dynamic max
    v_green_line_status := get_green_line_status(v_category_score, v_category_max);
    
    v_category_scores := v_category_scores || jsonb_build_object(v_category_key, v_category_score);
    v_green_line_statuses := v_green_line_statuses || jsonb_build_object(v_category_key, v_green_line_status);
    v_total_score := v_total_score + v_category_score;
    v_total_max := v_total_max + v_category_max;
  END LOOP;
  
  -- Update the assessment_results table with dynamic max
  UPDATE assessment_results
  SET 
    category_scores = v_category_scores,
    green_line_status = v_green_line_statuses,
    total_score = v_total_score,
    max_possible_score = CASE WHEN v_total_max > 0 THEN v_total_max ELSE max_possible_score END,
    overall_percentage = CASE 
      WHEN v_total_max > 0 THEN ROUND((v_total_score::NUMERIC / v_total_max::NUMERIC) * 100)
      ELSE 0
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.assessment_id, OLD.assessment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.update_assessment_scores() IS 'Automatically updates assessment totals when responses change, using dynamic max that excludes N/A responses';
