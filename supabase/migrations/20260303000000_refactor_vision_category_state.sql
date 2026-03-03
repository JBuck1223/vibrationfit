-- Refactor vision_new_category_state table
-- 1. Rename ideal_state → get_me_started_text
-- 2. Add imagination_text column
-- 3. Drop unused columns: transcript, ideal_state_prompts, master_vision_raw, contrast_flips
-- 4. Drop associated GIN indexes

BEGIN;

-- Step 1: Rename ideal_state to get_me_started_text
ALTER TABLE public.vision_new_category_state
  RENAME COLUMN ideal_state TO get_me_started_text;

COMMENT ON COLUMN public.vision_new_category_state.get_me_started_text IS
  'AI-generated starter text from current state profile data (Cleanse/Expand/Embody)';

-- Step 2: Add imagination_text column
ALTER TABLE public.vision_new_category_state
  ADD COLUMN imagination_text text;

COMMENT ON COLUMN public.vision_new_category_state.imagination_text IS
  'User-written imagination text describing their dream life for this category';

-- Step 3: Drop GIN indexes on columns being removed
DROP INDEX IF EXISTS public.idx_vision_new_category_state_prompts;
DROP INDEX IF EXISTS public.idx_vision_new_category_state_contrast_flips;
DROP INDEX IF EXISTS public.idx_vision_new_category_state_blueprint;

-- Step 4: Drop unused columns
ALTER TABLE public.vision_new_category_state
  DROP COLUMN IF EXISTS transcript,
  DROP COLUMN IF EXISTS ideal_state_prompts,
  DROP COLUMN IF EXISTS master_vision_raw,
  DROP COLUMN IF EXISTS contrast_flips,
  DROP COLUMN IF EXISTS blueprint_data;

COMMIT;
