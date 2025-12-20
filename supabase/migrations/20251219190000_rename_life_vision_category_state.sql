-- Rename life_vision_category_state to vision_new_category_state
-- This is a simple rename that preserves all data, indexes, and constraints

-- Rename the table
ALTER TABLE public.life_vision_category_state 
  RENAME TO vision_new_category_state;

-- Rename indexes to match new table name
ALTER INDEX idx_lv_category_state_blueprint 
  RENAME TO idx_vision_new_category_state_blueprint;

ALTER INDEX idx_lv_category_state_created 
  RENAME TO idx_vision_new_category_state_created;

ALTER INDEX idx_lv_category_state_user_category 
  RENAME TO idx_vision_new_category_state_user_category;

ALTER INDEX idx_lv_category_state_prompts 
  RENAME TO idx_vision_new_category_state_prompts;

ALTER INDEX idx_lv_category_state_clarity_keys 
  RENAME TO idx_vision_new_category_state_clarity_keys;

ALTER INDEX idx_lv_category_state_contrast_flips 
  RENAME TO idx_vision_new_category_state_contrast_flips;

-- Rename the primary key constraint
ALTER TABLE vision_new_category_state
  RENAME CONSTRAINT life_vision_category_state_pkey 
  TO vision_new_category_state_pkey;

-- Rename the unique constraint
ALTER TABLE vision_new_category_state
  RENAME CONSTRAINT life_vision_category_state_user_id_category_key 
  TO vision_new_category_state_user_id_category_key;

-- Rename the foreign key constraint
ALTER TABLE vision_new_category_state
  RENAME CONSTRAINT life_vision_category_state_user_id_fkey 
  TO vision_new_category_state_user_id_fkey;

-- Rename the check constraint
ALTER TABLE vision_new_category_state
  RENAME CONSTRAINT life_vision_category_state_category_check 
  TO vision_new_category_state_category_check;

-- Rename the trigger
ALTER TRIGGER update_lv_category_state_updated_at 
  ON vision_new_category_state 
  RENAME TO update_vision_new_category_state_updated_at;

-- Add comment
COMMENT ON TABLE vision_new_category_state IS 'Stores per-category vision creation state including clarity, imagination, blueprint, scenes, and generated vision text.';

