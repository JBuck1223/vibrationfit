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

