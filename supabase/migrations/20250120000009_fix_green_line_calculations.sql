-- Fix Green Line calculations for 7-question categories
-- Purpose: Update get_green_line_status function to use correct max score (35 instead of 70)

-- Update the get_green_line_status function to use 35 as max score per category
CREATE OR REPLACE FUNCTION get_green_line_status(p_score INTEGER)
RETURNS green_line_status AS $$
DECLARE
  v_percentage NUMERIC;
BEGIN
  -- Calculate percentage (max score per category is 35 points: 7 questions × 5 points each)
  v_percentage := (p_score::NUMERIC / 35.0) * 100;
  
  -- Determine status
  IF v_percentage >= 80 THEN
    RETURN 'above'::green_line_status;
  ELSIF v_percentage >= 60 THEN
    RETURN 'transition'::green_line_status;
  ELSE
    RETURN 'below'::green_line_status;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update comment to reflect the change
COMMENT ON FUNCTION get_green_line_status IS 'Determines Green Line status based on score percentage (max 35 points per category)';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE '✅ Updated get_green_line_status function to use 35 as max score per category';
END $$;
