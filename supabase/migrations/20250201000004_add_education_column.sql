-- Add education fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS education TEXT CHECK (education IN (
    'High School', 
    'Some College', 
    'Associate Degree', 
    'Bachelor''s Degree',
    'Master''s Degree',
    'Doctorate', 
    'Other', 
    'Prefer not to say'
)),
ADD COLUMN IF NOT EXISTS education_description TEXT;

