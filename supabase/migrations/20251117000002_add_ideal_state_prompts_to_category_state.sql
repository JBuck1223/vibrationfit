/**
 * Add ideal_state_prompts column to life_vision_category_state
 * 
 * Stores the AI-generated prompts from Step 2 (Imagination)
 * This keeps all category data in one table instead of scattered across multiple tables
 */

-- Add ideal_state_prompts column to store AI-generated prompts
ALTER TABLE public.life_vision_category_state 
  ADD COLUMN IF NOT EXISTS ideal_state_prompts jsonb DEFAULT '[]'::jsonb;

-- Add index for querying prompts
CREATE INDEX IF NOT EXISTS idx_lv_category_state_prompts 
  ON public.life_vision_category_state USING gin (ideal_state_prompts);

-- Add comment
COMMENT ON COLUMN public.life_vision_category_state.ideal_state_prompts IS 
  'Step 2: AI-generated imagination prompts. Array of {title, prompt, focus} objects';

/**
 * Rollback
 */
-- ALTER TABLE public.life_vision_category_state DROP COLUMN IF EXISTS ideal_state_prompts;
-- DROP INDEX IF EXISTS idx_lv_category_state_prompts;


