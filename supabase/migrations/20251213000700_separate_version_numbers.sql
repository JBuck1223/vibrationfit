-- Separate version numbers for personal vs household visions
-- Personal visions: V1, V2, V3... (count only personal)
-- Household visions: V1, V2, V3... (count only household, per household)

DROP FUNCTION IF EXISTS public.calculate_vision_version_number(uuid, uuid);

CREATE FUNCTION public.calculate_vision_version_number(p_vision_id uuid, p_user_id uuid) 
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  vision_created_at TIMESTAMP WITH TIME ZONE;
  vision_household_id UUID;
  version_num INTEGER;
BEGIN
  -- Get the created_at timestamp and household_id for this vision
  SELECT created_at, household_id 
  INTO vision_created_at, vision_household_id
  FROM vision_versions
  WHERE id = p_vision_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Separate numbering based on personal vs household
  IF vision_household_id IS NULL THEN
    -- PERSONAL VISION: Count only personal visions for this user
    SELECT COUNT(*) INTO version_num
    FROM vision_versions
    WHERE user_id = p_user_id
      AND household_id IS NULL  -- Only personal visions
      AND created_at <= vision_created_at
      AND id != p_vision_id;
  ELSE
    -- HOUSEHOLD VISION: Count only household visions for this household
    SELECT COUNT(*) INTO version_num
    FROM vision_versions
    WHERE household_id = vision_household_id  -- Same household
      AND created_at <= vision_created_at
      AND id != p_vision_id;
  END IF;
  
  -- Add 1 because we want 1-based indexing
  RETURN version_num + 1;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.calculate_vision_version_number(p_vision_id uuid, p_user_id uuid) IS 
  'Calculates version number with separate sequences: Personal visions (household_id IS NULL) count only personal. Household visions count only household visions for that household.';

