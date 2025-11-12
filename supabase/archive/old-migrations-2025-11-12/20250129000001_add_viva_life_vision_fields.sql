-- Add transcript and ai_summary columns to refinements table for VIVA Life Vision Creation
-- This enables storing user audio transcripts and AI-generated category summaries

ALTER TABLE refinements 
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add comments for documentation
COMMENT ON COLUMN refinements.transcript IS 'User audio/video transcript for life vision category';
COMMENT ON COLUMN refinements.ai_summary IS 'AI-generated category summary from VIVA';

-- Create index for searching transcripts
CREATE INDEX IF NOT EXISTS idx_refinements_transcript ON refinements USING gin(to_tsvector('english', transcript));

-- Create index for searching ai_summary
CREATE INDEX IF NOT EXISTS idx_refinements_ai_summary ON refinements USING gin(to_tsvector('english', ai_summary));
