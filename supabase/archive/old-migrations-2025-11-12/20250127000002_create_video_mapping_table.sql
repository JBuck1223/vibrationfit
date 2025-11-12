-- Create video_mapping table to track original → processed video relationships
CREATE TABLE IF NOT EXISTS video_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Original video info
  original_s3_key TEXT NOT NULL,
  original_url TEXT NOT NULL,
  
  -- Processed video info
  processed_s3_key TEXT,
  processed_url TEXT,
  
  -- Context
  folder TEXT NOT NULL, -- e.g., 'journal', 'vision-board', 'evidence'
  entry_type TEXT NOT NULL, -- e.g., 'journal_entry', 'vision_board_item', 'evidence_item'
  entry_id UUID, -- ID of the entry that contains this video
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Indexes
  UNIQUE(original_s3_key),
  INDEX idx_user_folder (user_id, folder),
  INDEX idx_entry (entry_type, entry_id),
  INDEX idx_status (status)
);

-- RLS
ALTER TABLE video_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video mappings"
  ON video_mapping FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all video mappings"
  ON video_mapping FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update journal_entries with processed video URLs
CREATE OR REPLACE FUNCTION update_journal_entry_with_processed_videos()
RETURNS TRIGGER AS $$
DECLARE
  entry_id_var UUID;
  processed_url_var TEXT;
  current_image_urls JSONB;
  url_array JSONB;
BEGIN
  -- Only process when status changes to 'completed' and we have a processed URL
  IF NEW.status = 'completed' AND NEW.processed_url IS NOT NULL AND NEW.entry_id IS NOT NULL THEN
    processed_url_var := NEW.processed_url;
    current_image_urls := (SELECT image_urls FROM journal_entries WHERE id = NEW.entry_id);
    
    -- If image_urls is null, initialize it as an empty array
    IF current_image_urls IS NULL THEN
      current_image_urls := '[]'::jsonb;
    END IF;
    
    -- Check if URL already exists in the array
    IF NOT (current_image_urls ? processed_url_var) THEN
      -- Append the new URL to the array
      url_array := current_image_urls || to_jsonb(processed_url_var);
      
      -- Update the journal entry
      UPDATE journal_entries
      SET image_urls = url_array
      WHERE id = NEW.entry_id;
      
      RAISE NOTICE 'Updated journal entry % with processed video URL: %', NEW.entry_id, processed_url_var;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update journal entries
CREATE TRIGGER update_journal_on_video_complete
AFTER UPDATE OF status, processed_url ON video_mapping
FOR EACH ROW
WHEN (NEW.status = 'completed' AND NEW.processed_url IS NOT NULL)
EXECUTE FUNCTION update_journal_entry_with_processed_videos();

