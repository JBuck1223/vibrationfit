-- Fix all database triggers and functions that reference old category keys
-- (romance, business, possessions) which have been renamed to (love, work, stuff)

-- 1. Fix track_category_refinement function
CREATE OR REPLACE FUNCTION public.track_category_refinement() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  category_field TEXT;
  refined_cats JSONB;
  cat_exists BOOLEAN;
BEGIN
  -- Only track for draft visions
  IF NEW.is_draft = true AND NEW.is_active = false THEN
    
    -- Check each category field for changes (REMOVED OLD KEY REFERENCES)
    IF (OLD.forward IS DISTINCT FROM NEW.forward) THEN
      category_field := 'forward';
    ELSIF (OLD.fun IS DISTINCT FROM NEW.fun) THEN
      category_field := 'fun';
    ELSIF (OLD.travel IS DISTINCT FROM NEW.travel) THEN
      category_field := 'travel';
    ELSIF (OLD.home IS DISTINCT FROM NEW.home) THEN
      category_field := 'home';
    ELSIF (OLD.family IS DISTINCT FROM NEW.family) THEN
      category_field := 'family';
    ELSIF (OLD.love IS DISTINCT FROM NEW.love) THEN
      category_field := 'love';
    ELSIF (OLD.health IS DISTINCT FROM NEW.health) THEN
      category_field := 'health';
    ELSIF (OLD.money IS DISTINCT FROM NEW.money) THEN
      category_field := 'money';
    ELSIF (OLD.work IS DISTINCT FROM NEW.work) THEN
      category_field := 'work';
    ELSIF (OLD.social IS DISTINCT FROM NEW.social) THEN
      category_field := 'social';
    ELSIF (OLD.stuff IS DISTINCT FROM NEW.stuff) THEN
      category_field := 'stuff';
    ELSIF (OLD.giving IS DISTINCT FROM NEW.giving) THEN
      category_field := 'giving';
    ELSIF (OLD.spirituality IS DISTINCT FROM NEW.spirituality) THEN
      category_field := 'spirituality';
    ELSIF (OLD.conclusion IS DISTINCT FROM NEW.conclusion) THEN
      category_field := 'conclusion';
    END IF;
    
    -- If a category changed, add it to refined_categories
    IF category_field IS NOT NULL THEN
      refined_cats := COALESCE(NEW.refined_categories, '[]'::jsonb);
      
      -- Check if category already exists in array
      cat_exists := refined_cats ? category_field;
      
      -- Add to array if not already present
      IF NOT cat_exists THEN
        refined_cats := refined_cats || jsonb_build_array(category_field);
        NEW.refined_categories := refined_cats;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.track_category_refinement() IS 'Tracks which categories have been refined in a draft vision (updated to use new category keys: love, work, stuff)';

