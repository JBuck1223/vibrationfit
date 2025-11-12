-- Add refined_categories tracking to vision_versions
-- This tracks which categories have been modified in a draft vision

-- Add JSONB column to store refinement metadata
ALTER TABLE vision_versions 
ADD COLUMN IF NOT EXISTS refined_categories JSONB DEFAULT '[]'::jsonb;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_vision_versions_refined_categories 
ON vision_versions USING gin(refined_categories);

-- Add helpful comment
COMMENT ON COLUMN vision_versions.refined_categories IS 
'Array of category keys that have been refined in this draft. Format: ["health", "fun", "work"]. Only populated for draft visions.';

-- Function to automatically update refined_categories when a category is modified
CREATE OR REPLACE FUNCTION track_category_refinement()
RETURNS TRIGGER AS $$
DECLARE
  category_field TEXT;
  refined_cats JSONB;
  cat_exists BOOLEAN;
BEGIN
  -- Only track for draft visions
  IF NEW.is_draft = true AND NEW.is_active = false THEN
    
    -- Check each category field for changes
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
    ELSIF (OLD.love IS DISTINCT FROM NEW.love OR OLD.romance IS DISTINCT FROM NEW.romance) THEN
      category_field := 'love';
    ELSIF (OLD.health IS DISTINCT FROM NEW.health) THEN
      category_field := 'health';
    ELSIF (OLD.money IS DISTINCT FROM NEW.money) THEN
      category_field := 'money';
    ELSIF (OLD.work IS DISTINCT FROM NEW.work OR OLD.business IS DISTINCT FROM NEW.business) THEN
      category_field := 'work';
    ELSIF (OLD.social IS DISTINCT FROM NEW.social) THEN
      category_field := 'social';
    ELSIF (OLD.stuff IS DISTINCT FROM NEW.stuff OR OLD.possessions IS DISTINCT FROM NEW.possessions) THEN
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically track refinements
DROP TRIGGER IF EXISTS trigger_track_category_refinement ON vision_versions;
CREATE TRIGGER trigger_track_category_refinement
  BEFORE UPDATE ON vision_versions
  FOR EACH ROW
  EXECUTE FUNCTION track_category_refinement();

-- Helper function to get refined categories for a draft
CREATE OR REPLACE FUNCTION get_refined_categories(draft_vision_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  refined_cats TEXT[];
BEGIN
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(refined_categories)
    FROM vision_versions
    WHERE id = draft_vision_id
    AND is_draft = true
  ) INTO refined_cats;
  
  RETURN COALESCE(refined_cats, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- Helper function to mark a category as refined
CREATE OR REPLACE FUNCTION mark_category_refined(
  draft_vision_id UUID,
  category_name TEXT
)
RETURNS VOID AS $$
DECLARE
  current_refined JSONB;
  cat_exists BOOLEAN;
BEGIN
  -- Get current refined_categories
  SELECT refined_categories INTO current_refined
  FROM vision_versions
  WHERE id = draft_vision_id
  AND is_draft = true;
  
  IF current_refined IS NULL THEN
    current_refined := '[]'::jsonb;
  END IF;
  
  -- Check if already marked
  cat_exists := current_refined ? category_name;
  
  -- Add if not present
  IF NOT cat_exists THEN
    UPDATE vision_versions
    SET refined_categories = current_refined || jsonb_build_array(category_name)
    WHERE id = draft_vision_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function to compare draft with active and populate refined_categories
CREATE OR REPLACE FUNCTION sync_refined_categories_from_active(
  draft_vision_id UUID,
  active_vision_id UUID
)
RETURNS JSONB AS $$
DECLARE
  draft_vision RECORD;
  active_vision RECORD;
  refined_cats JSONB := '[]'::jsonb;
BEGIN
  -- Get both visions
  SELECT * INTO draft_vision FROM vision_versions WHERE id = draft_vision_id;
  SELECT * INTO active_vision FROM vision_versions WHERE id = active_vision_id;
  
  -- Compare each category and build list
  IF (draft_vision.forward IS DISTINCT FROM active_vision.forward) THEN
    refined_cats := refined_cats || jsonb_build_array('forward');
  END IF;
  
  IF (draft_vision.fun IS DISTINCT FROM active_vision.fun) THEN
    refined_cats := refined_cats || jsonb_build_array('fun');
  END IF;
  
  IF (draft_vision.travel IS DISTINCT FROM active_vision.travel) THEN
    refined_cats := refined_cats || jsonb_build_array('travel');
  END IF;
  
  IF (draft_vision.home IS DISTINCT FROM active_vision.home) THEN
    refined_cats := refined_cats || jsonb_build_array('home');
  END IF;
  
  IF (draft_vision.family IS DISTINCT FROM active_vision.family) THEN
    refined_cats := refined_cats || jsonb_build_array('family');
  END IF;
  
  IF (draft_vision.love IS DISTINCT FROM active_vision.love OR 
      draft_vision.romance IS DISTINCT FROM active_vision.romance) THEN
    refined_cats := refined_cats || jsonb_build_array('love');
  END IF;
  
  IF (draft_vision.health IS DISTINCT FROM active_vision.health) THEN
    refined_cats := refined_cats || jsonb_build_array('health');
  END IF;
  
  IF (draft_vision.money IS DISTINCT FROM active_vision.money) THEN
    refined_cats := refined_cats || jsonb_build_array('money');
  END IF;
  
  IF (draft_vision.work IS DISTINCT FROM active_vision.work OR 
      draft_vision.business IS DISTINCT FROM active_vision.business) THEN
    refined_cats := refined_cats || jsonb_build_array('work');
  END IF;
  
  IF (draft_vision.social IS DISTINCT FROM active_vision.social) THEN
    refined_cats := refined_cats || jsonb_build_array('social');
  END IF;
  
  IF (draft_vision.stuff IS DISTINCT FROM active_vision.stuff OR 
      draft_vision.possessions IS DISTINCT FROM active_vision.possessions) THEN
    refined_cats := refined_cats || jsonb_build_array('stuff');
  END IF;
  
  IF (draft_vision.giving IS DISTINCT FROM active_vision.giving) THEN
    refined_cats := refined_cats || jsonb_build_array('giving');
  END IF;
  
  IF (draft_vision.spirituality IS DISTINCT FROM active_vision.spirituality) THEN
    refined_cats := refined_cats || jsonb_build_array('spirituality');
  END IF;
  
  IF (draft_vision.conclusion IS DISTINCT FROM active_vision.conclusion) THEN
    refined_cats := refined_cats || jsonb_build_array('conclusion');
  END IF;
  
  -- Update draft with refined categories
  UPDATE vision_versions
  SET refined_categories = refined_cats
  WHERE id = draft_vision_id;
  
  RETURN refined_cats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_refined_categories_from_active IS 
'Compares draft vision with active vision and populates refined_categories array. Useful for migration or fixing discrepancies.';

