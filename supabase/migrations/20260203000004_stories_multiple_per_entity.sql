-- Migration: Allow multiple stories per entity
-- Removes unique constraint and adds display_order for story ordering

-- Remove unique constraint to allow multiple stories per entity
ALTER TABLE public.stories 
DROP CONSTRAINT IF EXISTS unique_story_per_entity;

-- Add ordering field for story list (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stories' 
    AND column_name = 'display_order'
  ) THEN
    ALTER TABLE public.stories ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Add index for efficient story listing by entity
CREATE INDEX IF NOT EXISTS idx_stories_entity_order 
ON public.stories (entity_type, entity_id, display_order);

-- Add index for listing stories by entity and creation date (alternative ordering)
CREATE INDEX IF NOT EXISTS idx_stories_entity_created 
ON public.stories (entity_type, entity_id, created_at DESC);
