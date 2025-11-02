-- ============================================================================
-- Add actualization_story to vision_board_items
-- ============================================================================
-- This migration adds a text field for describing the actualization story

-- Add actualization_story column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'vision_board_items' 
                 AND column_name = 'actualization_story') THEN
    ALTER TABLE vision_board_items ADD COLUMN actualization_story TEXT;
    
    COMMENT ON COLUMN vision_board_items.actualization_story IS 'Story describing how the vision was actualized. Only used when status is actualized.';
  END IF;
END $$;

