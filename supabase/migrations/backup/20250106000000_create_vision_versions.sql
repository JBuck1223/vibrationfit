-- Vision Versions Table Schema for VibrationFit
-- This table stores user's life vision documents with version control

CREATE TABLE vision_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  version_number INTEGER NOT NULL DEFAULT 1,
  
  -- 14 Life Vision Sections
  forward TEXT DEFAULT '',
  fun TEXT DEFAULT '',
  travel TEXT DEFAULT '',
  home TEXT DEFAULT '',
  family TEXT DEFAULT '',
  romance TEXT DEFAULT '',
  health TEXT DEFAULT '',
  money TEXT DEFAULT '',
  business TEXT DEFAULT '',
  social TEXT DEFAULT '',
  possessions TEXT DEFAULT '',
  giving TEXT DEFAULT '',
  spirituality TEXT DEFAULT '',
  conclusion TEXT DEFAULT '',
  
  -- Status and Progress Tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vision_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own visions" ON vision_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visions" ON vision_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visions" ON vision_versions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visions" ON vision_versions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_vision_versions_user_id ON vision_versions(user_id);
CREATE INDEX idx_vision_versions_status ON vision_versions(status);
CREATE INDEX idx_vision_versions_created_at ON vision_versions(created_at DESC);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_vision_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_vision_versions_updated_at
  BEFORE UPDATE ON vision_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_vision_versions_updated_at();
