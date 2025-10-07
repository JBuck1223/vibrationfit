-- Add VIVA Notes column to vibe_assistant_logs table
-- This migration adds support for storing VIVA's reasoning and explanation for each refinement

-- Add viva_notes column to vibe_assistant_logs table
ALTER TABLE vibe_assistant_logs 
ADD COLUMN IF NOT EXISTS viva_notes TEXT;

-- Add index for viva_notes searches (optional, for future analytics)
CREATE INDEX IF NOT EXISTS idx_vibe_assistant_logs_viva_notes ON vibe_assistant_logs USING gin(to_tsvector('english', viva_notes));

-- Add comment for documentation
COMMENT ON COLUMN vibe_assistant_logs.viva_notes IS 'VIVA Notes: AI explanation of refinement reasoning and approach';
