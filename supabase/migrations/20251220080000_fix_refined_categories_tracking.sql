-- Fix refined_categories tracking to always recalculate on update
-- This fixes the bug where clicking save without changes marks categories as refined

CREATE OR REPLACE FUNCTION public.track_category_refinement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  category_field TEXT;
  refined_cats JSONB;
  active_vision RECORD;
  draft_value TEXT;
  active_value TEXT;
BEGIN
  -- Only track for draft visions
  IF NEW.is_draft = true AND NEW.is_active = false THEN
    
    -- Get the baseline vision for comparison
    -- First try to get via parent_id (the source this draft was created from)
    IF NEW.parent_id IS NOT NULL THEN
      SELECT * INTO active_vision 
      FROM vision_versions 
      WHERE id = NEW.parent_id
      LIMIT 1;
    END IF;
    
    -- If no parent, get current active vision for this user as baseline
    IF active_vision IS NULL THEN
      SELECT * INTO active_vision 
      FROM vision_versions 
      WHERE user_id = NEW.user_id 
        AND is_active = true 
        AND is_draft = false
      LIMIT 1;
    END IF;
    
    -- If still no baseline vision, skip tracking
    IF active_vision IS NULL THEN
      RAISE NOTICE 'No baseline vision found for draft %, skipping refinement tracking', NEW.id;
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Comparing draft % against baseline %', NEW.id, active_vision.id;
    
    -- ALWAYS recalculate refined_categories to ensure accuracy
    -- This fixes the bug where clicking save without changes marks categories as refined
    RAISE NOTICE 'Recalculating refined_categories based on comparison with baseline';
    
    refined_cats := '[]'::jsonb;
    
    -- Check all category fields and build refined_categories array
    -- Only include categories that differ from the baseline
    
    -- Forward
    IF COALESCE(TRIM(NEW.forward), '') <> COALESCE(TRIM(active_vision.forward), '') THEN
      refined_cats := refined_cats || jsonb_build_array('forward');
    END IF;
    
    -- Fun
    IF COALESCE(TRIM(NEW.fun), '') <> COALESCE(TRIM(active_vision.fun), '') THEN
      refined_cats := refined_cats || jsonb_build_array('fun');
    END IF;
    
    -- Travel
    IF COALESCE(TRIM(NEW.travel), '') <> COALESCE(TRIM(active_vision.travel), '') THEN
      refined_cats := refined_cats || jsonb_build_array('travel');
    END IF;
    
    -- Home
    IF COALESCE(TRIM(NEW.home), '') <> COALESCE(TRIM(active_vision.home), '') THEN
      refined_cats := refined_cats || jsonb_build_array('home');
    END IF;
    
    -- Family
    IF COALESCE(TRIM(NEW.family), '') <> COALESCE(TRIM(active_vision.family), '') THEN
      refined_cats := refined_cats || jsonb_build_array('family');
    END IF;
    
    -- Love
    IF COALESCE(TRIM(NEW.love), '') <> COALESCE(TRIM(active_vision.love), '') THEN
      refined_cats := refined_cats || jsonb_build_array('love');
    END IF;
    
    -- Health
    IF COALESCE(TRIM(NEW.health), '') <> COALESCE(TRIM(active_vision.health), '') THEN
      refined_cats := refined_cats || jsonb_build_array('health');
    END IF;
    
    -- Money
    IF COALESCE(TRIM(NEW.money), '') <> COALESCE(TRIM(active_vision.money), '') THEN
      refined_cats := refined_cats || jsonb_build_array('money');
    END IF;
    
    -- Work
    IF COALESCE(TRIM(NEW.work), '') <> COALESCE(TRIM(active_vision.work), '') THEN
      refined_cats := refined_cats || jsonb_build_array('work');
    END IF;
    
    -- Social
    IF COALESCE(TRIM(NEW.social), '') <> COALESCE(TRIM(active_vision.social), '') THEN
      refined_cats := refined_cats || jsonb_build_array('social');
    END IF;
    
    -- Stuff
    IF COALESCE(TRIM(NEW.stuff), '') <> COALESCE(TRIM(active_vision.stuff), '') THEN
      refined_cats := refined_cats || jsonb_build_array('stuff');
    END IF;
    
    -- Giving
    IF COALESCE(TRIM(NEW.giving), '') <> COALESCE(TRIM(active_vision.giving), '') THEN
      refined_cats := refined_cats || jsonb_build_array('giving');
    END IF;
    
    -- Spirituality
    IF COALESCE(TRIM(NEW.spirituality), '') <> COALESCE(TRIM(active_vision.spirituality), '') THEN
      refined_cats := refined_cats || jsonb_build_array('spirituality');
    END IF;
    
    -- Conclusion
    IF COALESCE(TRIM(NEW.conclusion), '') <> COALESCE(TRIM(active_vision.conclusion), '') THEN
      refined_cats := refined_cats || jsonb_build_array('conclusion');
    END IF;
  
    RAISE NOTICE 'Calculated refined_categories: %', refined_cats;
    NEW.refined_categories := refined_cats;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.track_category_refinement() IS 
'Tracks which vision categories have been refined compared to the baseline (parent or active) vision. 
Always recalculates refined_categories on every update to ensure accuracy and handle reverts correctly.
Categories are only marked as refined if their text differs from the baseline.';

