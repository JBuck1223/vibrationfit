-- Fix the profile completion calculation function
-- This version is more accurate and matches the actual profile form fields

CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  total_fields INTEGER := 20; -- Adjusted total number of fields
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
  -- Partner name is optional, so we don't count it as required
  
  -- Family (2 fields)
  IF (profile_data->>'has_children') IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  END IF;
  -- Number of children is only required if has_children is true
  IF (profile_data->>'has_children') = 'true' AND (profile_data->>'number_of_children') IS NOT NULL AND (profile_data->>'number_of_children') != '0' THEN
    completed_fields := completed_fields + 1;
  ELSIF (profile_data->>'has_children') = 'false' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Health (1 field - exercise frequency is the main one)
  IF (profile_data->>'exercise_frequency') IS NOT NULL AND (profile_data->>'exercise_frequency') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  -- Health conditions and medications are optional
  
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
  
  -- Career (2 fields - employment type and occupation are the main ones)
  IF (profile_data->>'employment_type') IS NOT NULL AND (profile_data->>'employment_type') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'occupation') IS NOT NULL AND (profile_data->>'occupation') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  -- Company and time_in_role are optional
  
  -- Financial (1 field)
  IF (profile_data->>'household_income') IS NOT NULL AND (profile_data->>'household_income') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Profile Picture (1 field) - optional but counts if present
  IF (profile_data->>'profile_picture_url') IS NOT NULL AND (profile_data->>'profile_picture_url') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Additional location fields (2 fields)
  IF (profile_data->>'postal_code') IS NOT NULL AND (profile_data->>'postal_code') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'country') IS NOT NULL AND (profile_data->>'country') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  RETURN ROUND((completed_fields::DECIMAL / total_fields) * 100);
END;
$$ LANGUAGE plpgsql;
