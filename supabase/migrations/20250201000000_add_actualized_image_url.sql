-- ============================================================================
-- Add actualized_image_url to vision_board_items
-- ============================================================================
-- This migration adds a second image field for evidence of actualization

-- Add actualized_image_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'vision_board_items' 
                 AND column_name = 'actualized_image_url') THEN
    ALTER TABLE vision_board_items ADD COLUMN actualized_image_url TEXT;
    
    COMMENT ON COLUMN vision_board_items.actualized_image_url IS 'Evidence image showing the vision has been actualized. Displayed when status is actualized.';
  END IF;
END $$;

