-- Create generated images gallery table
-- Stores AI-generated images for users to browse and reuse

CREATE TABLE IF NOT EXISTS generated_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Image details
  image_url TEXT NOT NULL,
  s3_key TEXT NOT NULL, -- Full S3 path for management
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'image/png',
  
  -- Generation details
  prompt TEXT NOT NULL,
  revised_prompt TEXT,
  style_used TEXT,
  size TEXT DEFAULT '1024x1024',
  quality TEXT DEFAULT 'standard',
  context TEXT DEFAULT 'vision_board', -- vision_board, journal, custom
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE, -- When user actually used it
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Status
  is_used BOOLEAN DEFAULT FALSE,
  is_expired BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_context ON generated_images(context);
CREATE INDEX IF NOT EXISTS idx_generated_images_generated_at ON generated_images(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_expires_at ON generated_images(expires_at);
CREATE INDEX IF NOT EXISTS idx_generated_images_is_used ON generated_images(is_used);
CREATE INDEX IF NOT EXISTS idx_generated_images_is_expired ON generated_images(is_expired);

-- RLS Policies
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Users can only see their own generated images
CREATE POLICY "Users can view their own generated images" 
ON generated_images FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own generated images
CREATE POLICY "Users can create their own generated images" 
ON generated_images FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own generated images (mark as used, etc.)
CREATE POLICY "Users can update their own generated images" 
ON generated_images FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own generated images
CREATE POLICY "Users can delete their own generated images" 
ON generated_images FOR DELETE 
USING (auth.uid() = user_id);

-- Function to automatically mark images as expired
CREATE OR REPLACE FUNCTION mark_expired_generated_images()
RETURNS void AS $$
BEGIN
  UPDATE generated_images 
  SET is_expired = TRUE, updated_at = NOW()
  WHERE expires_at < NOW() 
    AND is_expired = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired images (call this periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_generated_images()
RETURNS void AS $$
BEGIN
  -- Mark as expired first
  PERFORM mark_expired_generated_images();
  
  -- Delete expired images older than 7 days
  DELETE FROM generated_images 
  WHERE is_expired = TRUE 
    AND expires_at < (NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_generated_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE ON generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_images_updated_at();
