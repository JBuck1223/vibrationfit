-- User Profiles Table for VibrationFit
-- Based on Gravity Forms export structure

CREATE TABLE user_profiles (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Personal Info
  profile_picture_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Prefer not to say')),
  ethnicity TEXT CHECK (ethnicity IN ('Asian', 'Black', 'Hispanic', 'Middle Eastern', 'Multi-ethnic', 'Native American', 'Pacific Islander', 'White', 'Other', 'Prefer not to say')),
  
  -- Relationship
  relationship_status TEXT CHECK (relationship_status IN ('Single', 'In a Relationship', 'Married')),
  relationship_length TEXT CHECK (relationship_length IN ('1-6 months', '6-12 months', '12-18 months', '18-24 months', '2-3 years', '3-5 years', '5-10 years', '10+ years')),
  
  -- Family
  has_children BOOLEAN DEFAULT FALSE,
  number_of_children INTEGER CHECK (number_of_children >= 0 AND number_of_children <= 20),
  children_ages TEXT[], -- Array of age ranges like ['0-2 years', '3-5 years']
  
  -- Health & Fitness
  units TEXT CHECK (units IN ('US', 'Metric')) DEFAULT 'US',
  height DECIMAL(5,2), -- In inches (US) or centimeters (Metric)
  weight DECIMAL(6,2), -- In pounds (US) or kilograms (Metric)
  exercise_frequency TEXT CHECK (exercise_frequency IN ('None', '1-2x', '3-4x', '5+')),
  
  -- Living Situation
  living_situation TEXT CHECK (living_situation IN ('Own', 'Rent', 'With family/friends', 'Other', 'Prefer not to say')),
  time_at_location TEXT CHECK (time_at_location IN ('<3 months', '3-6 months', '6-12 months', '1-2 years', '2-3 years', '3-5 years', '5-10 years', '10+ years')),
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'United States',
  
  -- Career
  employment_type TEXT CHECK (employment_type IN ('Employee', 'Business Owner', 'Contractor/Freelancer', 'Prefer not to say')),
  occupation TEXT,
  company TEXT,
  time_in_role TEXT CHECK (time_in_role IN ('<3 months', '3-6 months', '6-12 months', '1-2 years', '2-3 years', '3-5 years', '5-10 years', '10+ years')),
  
  -- Financial
  currency TEXT CHECK (currency IN ('USD', 'EUR', 'GBP', 'Other')) DEFAULT 'USD',
  household_income TEXT CHECK (household_income IN ('<10,000', '10,000-24,999', '25,000-49,999', '50,000-99,999', '100,000-249,999', '250,000-499,999', '500,000-999,999', '1,000,000+', 'Prefer not to say')),
  savings_retirement TEXT CHECK (savings_retirement IN ('<10,000', '10,000-24,999', '25,000-49,999', '50,000-99,999', '100,000-249,999', '250,000-499,999', '500,000-999,999', '1,000,000+', 'Prefer not to say')),
  assets_equity TEXT CHECK (assets_equity IN ('<10,000', '10,000-24,999', '25,000-49,999', '50,000-99,999', '100,000-249,999', '250,000-499,999', '500,000-999,999', '1,000,000+', 'Prefer not to say')),
  consumer_debt TEXT CHECK (consumer_debt IN ('None', 'Under 10,000', '10,000-24,999', '25,000-49,999', '50,000-99,999', '100,000-249,999', '250,000-499,999', '500,000-999,999', '1,000,000+', 'Prefer not to say')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Create function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION get_profile_completion_percentage(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_fields INTEGER := 24; -- Total number of profile fields
  completed_fields INTEGER := 0;
  profile_record user_profiles%ROWTYPE;
BEGIN
  -- Get the user's profile
  SELECT * INTO profile_record FROM user_profiles WHERE user_id = user_uuid;
  
  -- If no profile exists, return 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Count completed fields
  IF profile_record.profile_picture_url IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.date_of_birth IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.gender IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.ethnicity IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.relationship_status IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.relationship_length IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.has_children IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.number_of_children IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.children_ages IS NOT NULL AND array_length(profile_record.children_ages, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.units IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.height IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.weight IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.exercise_frequency IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.living_situation IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.time_at_location IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.city IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.state IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.postal_code IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.country IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.employment_type IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.occupation IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.company IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.time_in_role IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.household_income IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  
  -- Return percentage
  RETURN ROUND((completed_fields::DECIMAL / total_fields::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
