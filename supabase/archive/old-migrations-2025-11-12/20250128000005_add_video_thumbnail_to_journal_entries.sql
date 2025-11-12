-- Add thumbnail_url column to journal_entries for video thumbnails
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS thumbnail_urls JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN journal_entries.thumbnail_urls IS 'Array of thumbnail URLs for videos in the entry';
