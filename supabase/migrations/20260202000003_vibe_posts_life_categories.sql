-- Add life_categories column to vibe_posts
-- Run this if you already ran the main vibe_tribe_schema migration

ALTER TABLE vibe_posts 
ADD COLUMN IF NOT EXISTS life_categories TEXT[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN vibe_posts.life_categories IS 'Optional life vision categories (health, wealth, relationships, etc.)';
