-- Add field to store raw master vision AI output for safety/debugging
-- This stores the complete markdown+JSON output before parsing

ALTER TABLE life_vision_category_state
ADD COLUMN IF NOT EXISTS master_vision_raw TEXT;

COMMENT ON COLUMN life_vision_category_state.master_vision_raw IS 
  'Raw AI output from master vision assembly (full markdown+JSON) - stored once per user';

-- We'll store this in a special row with category='_master' for each user
-- Update the category constraint to allow '_master' as a special category
ALTER TABLE life_vision_category_state
DROP CONSTRAINT IF EXISTS life_vision_category_state_category_check;

ALTER TABLE life_vision_category_state
ADD CONSTRAINT life_vision_category_state_category_check 
  CHECK (category IN (
    'fun', 'health', 'travel', 'love', 'family', 'social',
    'home', 'work', 'money', 'stuff', 'giving', 'spirituality',
    '_master'  -- Special category for storing master vision raw output
  ));


