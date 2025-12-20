-- Migration: Modify life_vision_category_state for queue system
-- Remove ai_summary field and add clarity_keys and contrast_flips fields

-- Step 1: Add new fields
ALTER TABLE public.life_vision_category_state
  ADD COLUMN IF NOT EXISTS clarity_keys jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contrast_flips jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS category_vision_text text NULL;

-- Step 2: Create index on new fields for efficient querying
CREATE INDEX IF NOT EXISTS idx_lv_category_state_clarity_keys 
  ON public.life_vision_category_state USING gin (clarity_keys);

CREATE INDEX IF NOT EXISTS idx_lv_category_state_contrast_flips 
  ON public.life_vision_category_state USING gin (contrast_flips);

-- Step 3: Drop ai_summary column (after ensuring data is migrated if needed)
-- Note: This will remove the ai_summary field. If you need to preserve existing data,
-- you should migrate it first before running this migration.
ALTER TABLE public.life_vision_category_state
  DROP COLUMN IF EXISTS ai_summary;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN public.life_vision_category_state.clarity_keys IS 'Array of clarity keys from profile for this category';
COMMENT ON COLUMN public.life_vision_category_state.contrast_flips IS 'Array of contrast flips from profile for this category';
COMMENT ON COLUMN public.life_vision_category_state.category_vision_text IS 'Generated vision text for this category (from queue system)';

