-- Profile Versions Table
-- This table stores versioned snapshots of user profiles, similar to vision_versions

CREATE TABLE IF NOT EXISTS profile_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  profile_data JSONB NOT NULL,
  completion_percentage INTEGER DEFAULT 0,
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique version numbers per user
  UNIQUE(user_id, version_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_versions_user_id ON profile_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_versions_created_at ON profile_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_versions_is_draft ON profile_versions(is_draft);

-- RLS (Row Level Security) policies
ALTER TABLE profile_versions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile versions
CREATE POLICY "Users can view their own profile versions" ON profile_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile versions" ON profile_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile versions" ON profile_versions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile versions" ON profile_versions
  FOR DELETE USING (auth.uid() = user_id);

-- Function to get the latest profile version for a user
CREATE OR REPLACE FUNCTION get_latest_profile_version(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  version_number INTEGER,
  profile_data JSONB,
  completion_percentage INTEGER,
  is_draft BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT pv.id, pv.user_id, pv.version_number, pv.profile_data, 
         pv.completion_percentage, pv.is_draft, pv.created_at, pv.updated_at
  FROM profile_versions pv
  WHERE pv.user_id = user_uuid
  ORDER BY pv.version_number DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  total_fields INTEGER := 25; -- Total number of fields to track
  completed_fields INTEGER := 0;
BEGIN
  -- Personal Info (6 fields)
  IF (profile_data->>'first_name') IS NOT NULL AND (profile_data->>'first_name') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'last_name') IS NOT NULL AND (profile_data->>'last_name') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'email') IS NOT NULL AND (profile_data->>'email') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'phone') IS NOT NULL AND (profile_data->>'phone') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'date_of_birth') IS NOT NULL AND (profile_data->>'date_of_birth') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'gender') IS NOT NULL AND (profile_data->>'gender') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Relationship (2 fields)
  IF (profile_data->>'relationship_status') IS NOT NULL AND (profile_data->>'relationship_status') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'partner_name') IS NOT NULL AND (profile_data->>'partner_name') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Family (2 fields)
  IF (profile_data->>'has_children') IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'number_of_children') IS NOT NULL AND (profile_data->>'number_of_children') != '0' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Health (3 fields)
  IF (profile_data->>'health_conditions') IS NOT NULL AND (profile_data->>'health_conditions') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'medications') IS NOT NULL AND (profile_data->>'medications') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'exercise_frequency') IS NOT NULL AND (profile_data->>'exercise_frequency') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Location (4 fields)
  IF (profile_data->>'living_situation') IS NOT NULL AND (profile_data->>'living_situation') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'time_at_location') IS NOT NULL AND (profile_data->>'time_at_location') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'city') IS NOT NULL AND (profile_data->>'city') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'state') IS NOT NULL AND (profile_data->>'state') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Career (4 fields)
  IF (profile_data->>'employment_type') IS NOT NULL AND (profile_data->>'employment_type') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'occupation') IS NOT NULL AND (profile_data->>'occupation') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'company') IS NOT NULL AND (profile_data->>'company') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'time_in_role') IS NOT NULL AND (profile_data->>'time_in_role') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Financial (1 field)
  IF (profile_data->>'household_income') IS NOT NULL AND (profile_data->>'household_income') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Profile Picture (1 field)
  IF (profile_data->>'profile_picture_url') IS NOT NULL AND (profile_data->>'profile_picture_url') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Additional fields (2 fields)
  IF (profile_data->>'postal_code') IS NOT NULL AND (profile_data->>'postal_code') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'country') IS NOT NULL AND (profile_data->>'country') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  RETURN ROUND((completed_fields::DECIMAL / total_fields) * 100);
END;
$$ LANGUAGE plpgsql;

-- Function to create a new profile version
CREATE OR REPLACE FUNCTION create_profile_version(
  user_uuid UUID,
  profile_data JSONB,
  is_draft BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  next_version INTEGER;
  new_version_id UUID;
  completion_pct INTEGER;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM profile_versions
  WHERE user_id = user_uuid;
  
  -- Calculate completion percentage
  completion_pct := calculate_profile_completion(profile_data);
  
  -- Insert the new version
  INSERT INTO profile_versions (user_id, version_number, profile_data, completion_percentage, is_draft)
  VALUES (user_uuid, next_version, profile_data, completion_pct, is_draft)
  RETURNING id INTO new_version_id;
  
  RETURN new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user stats when profile is completed
CREATE OR REPLACE FUNCTION update_profile_stats(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update user stats table if it exists
  INSERT INTO user_stats (user_id, profiles_created, last_profile_update)
  VALUES (user_uuid, 1, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    profiles_created = user_stats.profiles_created + 1,
    last_profile_update = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
