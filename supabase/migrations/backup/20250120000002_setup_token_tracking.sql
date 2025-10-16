-- ============================================================================
-- Essential Tables for Token Tracking System
-- ============================================================================
-- This migration sets up the core tables needed for token tracking

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Basic profile fields
  profile_picture_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  
  -- Token tracking fields
  vibe_assistant_tokens_used INTEGER DEFAULT 0,
  vibe_assistant_tokens_remaining INTEGER DEFAULT 100,
  vibe_assistant_total_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profiles' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Users can view their own profiles" ON user_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profiles' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Users can insert their own profiles" ON user_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profiles' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Users can update their own profiles" ON user_profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create token_usage table
CREATE TABLE IF NOT EXISTS token_usage (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'assessment_scoring',
    'vision_generation', 
    'vision_refinement',
    'blueprint_generation',
    'chat_conversation',
    'audio_generation',
    'image_generation'
  )),
  
  -- Model and usage details
  model_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_estimate NUMERIC(10, 4) DEFAULT 0, -- in cents
  
  -- Status and metadata
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_action_type ON token_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_token_usage_model_used ON token_usage(model_used);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_created ON token_usage(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own token usage
CREATE POLICY "Users can view their own token usage"
  ON token_usage FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert token usage records
CREATE POLICY "System can insert token usage"
  ON token_usage FOR INSERT
  WITH CHECK (true);

-- Create vision_versions table for assessment compatibility
CREATE TABLE IF NOT EXISTS vision_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  version_number INTEGER NOT NULL DEFAULT 1,
  
  -- Basic vision sections
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

-- Create policies for user access (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own visions' AND tablename = 'vision_versions') THEN
    CREATE POLICY "Users can view their own visions" ON vision_versions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own visions' AND tablename = 'vision_versions') THEN
    CREATE POLICY "Users can insert their own visions" ON vision_versions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own visions' AND tablename = 'vision_versions') THEN
    CREATE POLICY "Users can update their own visions" ON vision_versions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own visions' AND tablename = 'vision_versions') THEN
    CREATE POLICY "Users can delete their own visions" ON vision_versions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vision_versions_user_id ON vision_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_versions_status ON vision_versions(status);
CREATE INDEX IF NOT EXISTS idx_vision_versions_created_at ON vision_versions(created_at DESC);

-- Comments
COMMENT ON TABLE token_usage IS 'Tracks AI token usage and costs for each user action';
COMMENT ON TABLE user_profiles IS 'User profile information with token tracking';
COMMENT ON TABLE vision_versions IS 'User vision documents with version control';
