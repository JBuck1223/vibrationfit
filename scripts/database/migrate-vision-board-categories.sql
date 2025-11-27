-- Migration: Convert vision_board_items categories from labels to keys
-- This ensures all categories use the standardized keys from VISION_CATEGORIES
-- Run this once to clean up existing data

-- Mapping of old label format to new key format
UPDATE vision_board_items
SET categories = ARRAY(
  SELECT CASE 
    -- Old label format -> New key format
    WHEN unnest = 'Fun / Recreation' THEN 'fun'
    WHEN unnest = 'Variety / Travel / Adventure' THEN 'travel'
    WHEN unnest = 'Home / Environment' THEN 'home'
    WHEN unnest = 'Family / Parenting' THEN 'family'
    WHEN unnest = 'Love / Romance / Partner' THEN 'love'
    WHEN unnest = 'Health / Body / Vitality' THEN 'health'
    WHEN unnest = 'Money / Wealth / Investments' THEN 'money'
    WHEN unnest = 'Business / Career / Work' THEN 'work'
    WHEN unnest = 'Social / Friends' THEN 'social'
    WHEN unnest = 'Giving / Contribution / Legacy' THEN 'giving'
    WHEN unnest = 'Things / Belongings / Stuff' THEN 'stuff'
    WHEN unnest = 'Expansion / Spirituality' THEN 'spirituality'
    
    -- Also handle single-word labels that might exist
    WHEN unnest = 'Fun' THEN 'fun'
    WHEN unnest = 'Travel' THEN 'travel'
    WHEN unnest = 'Home' THEN 'home'
    WHEN unnest = 'Family' THEN 'family'
    WHEN unnest = 'Love' THEN 'love'
    WHEN unnest = 'Health' THEN 'health'
    WHEN unnest = 'Money' THEN 'money'
    WHEN unnest = 'Work' THEN 'work'
    WHEN unnest = 'Social' THEN 'social'
    WHEN unnest = 'Giving' THEN 'giving'
    WHEN unnest = 'Stuff' THEN 'stuff'
    WHEN unnest = 'Spirituality' THEN 'spirituality'
    
    -- If already a key (lowercase), keep it as is
    ELSE unnest
  END
  FROM unnest(categories)
)
WHERE categories IS NOT NULL AND array_length(categories, 1) > 0;

-- Verify the migration (optional - for debugging)
-- SELECT id, name, categories FROM vision_board_items ORDER BY created_at DESC;




