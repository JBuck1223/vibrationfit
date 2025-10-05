-- Debug function to see what's in the profile data and what's being counted
CREATE OR REPLACE FUNCTION debug_profile_completion(user_uuid UUID)
RETURNS TABLE (
  field_name TEXT,
  field_value TEXT,
  is_completed BOOLEAN
) AS $$
DECLARE
  profile_data JSONB;
BEGIN
  -- Get the latest profile version for the user
  SELECT pv.profile_data INTO profile_data
  FROM profile_versions pv
  WHERE pv.user_id = user_uuid
  ORDER BY pv.version_number DESC
  LIMIT 1;
  
  -- If no version found, try user_profiles table
  IF profile_data IS NULL THEN
    SELECT up.* INTO profile_data
    FROM user_profiles up
    WHERE up.user_id = user_uuid;
  END IF;
  
  -- Return all fields and their completion status
  RETURN QUERY
  SELECT 
    'first_name'::TEXT,
    COALESCE(profile_data->>'first_name', 'NULL'),
    (profile_data->>'first_name') IS NOT NULL AND (profile_data->>'first_name') != ''
  UNION ALL
  SELECT 
    'last_name'::TEXT,
    COALESCE(profile_data->>'last_name', 'NULL'),
    (profile_data->>'last_name') IS NOT NULL AND (profile_data->>'last_name') != ''
  UNION ALL
  SELECT 
    'email'::TEXT,
    COALESCE(profile_data->>'email', 'NULL'),
    (profile_data->>'email') IS NOT NULL AND (profile_data->>'email') != ''
  UNION ALL
  SELECT 
    'phone'::TEXT,
    COALESCE(profile_data->>'phone', 'NULL'),
    (profile_data->>'phone') IS NOT NULL AND (profile_data->>'phone') != ''
  UNION ALL
  SELECT 
    'date_of_birth'::TEXT,
    COALESCE(profile_data->>'date_of_birth', 'NULL'),
    (profile_data->>'date_of_birth') IS NOT NULL AND (profile_data->>'date_of_birth') != ''
  UNION ALL
  SELECT 
    'gender'::TEXT,
    COALESCE(profile_data->>'gender', 'NULL'),
    (profile_data->>'gender') IS NOT NULL AND (profile_data->>'gender') != ''
  UNION ALL
  SELECT 
    'relationship_status'::TEXT,
    COALESCE(profile_data->>'relationship_status', 'NULL'),
    (profile_data->>'relationship_status') IS NOT NULL AND (profile_data->>'relationship_status') != ''
  UNION ALL
  SELECT 
    'has_children'::TEXT,
    COALESCE(profile_data->>'has_children', 'NULL'),
    (profile_data->>'has_children') IS NOT NULL
  UNION ALL
  SELECT 
    'number_of_children'::TEXT,
    COALESCE(profile_data->>'number_of_children', 'NULL'),
    (profile_data->>'number_of_children') IS NOT NULL AND (profile_data->>'number_of_children') != '0'
  UNION ALL
  SELECT 
    'exercise_frequency'::TEXT,
    COALESCE(profile_data->>'exercise_frequency', 'NULL'),
    (profile_data->>'exercise_frequency') IS NOT NULL AND (profile_data->>'exercise_frequency') != ''
  UNION ALL
  SELECT 
    'living_situation'::TEXT,
    COALESCE(profile_data->>'living_situation', 'NULL'),
    (profile_data->>'living_situation') IS NOT NULL AND (profile_data->>'living_situation') != ''
  UNION ALL
  SELECT 
    'time_at_location'::TEXT,
    COALESCE(profile_data->>'time_at_location', 'NULL'),
    (profile_data->>'time_at_location') IS NOT NULL AND (profile_data->>'time_at_location') != ''
  UNION ALL
  SELECT 
    'city'::TEXT,
    COALESCE(profile_data->>'city', 'NULL'),
    (profile_data->>'city') IS NOT NULL AND (profile_data->>'city') != ''
  UNION ALL
  SELECT 
    'state'::TEXT,
    COALESCE(profile_data->>'state', 'NULL'),
    (profile_data->>'state') IS NOT NULL AND (profile_data->>'state') != ''
  UNION ALL
  SELECT 
    'employment_type'::TEXT,
    COALESCE(profile_data->>'employment_type', 'NULL'),
    (profile_data->>'employment_type') IS NOT NULL AND (profile_data->>'employment_type') != ''
  UNION ALL
  SELECT 
    'occupation'::TEXT,
    COALESCE(profile_data->>'occupation', 'NULL'),
    (profile_data->>'occupation') IS NOT NULL AND (profile_data->>'occupation') != ''
  UNION ALL
  SELECT 
    'household_income'::TEXT,
    COALESCE(profile_data->>'household_income', 'NULL'),
    (profile_data->>'household_income') IS NOT NULL AND (profile_data->>'household_income') != ''
  UNION ALL
  SELECT 
    'postal_code'::TEXT,
    COALESCE(profile_data->>'postal_code', 'NULL'),
    (profile_data->>'postal_code') IS NOT NULL AND (profile_data->>'postal_code') != ''
  UNION ALL
  SELECT 
    'country'::TEXT,
    COALESCE(profile_data->>'country', 'NULL'),
    (profile_data->>'country') IS NOT NULL AND (profile_data->>'country') != ''
  UNION ALL
  SELECT 
    'profile_picture_url'::TEXT,
    COALESCE(profile_data->>'profile_picture_url', 'NULL'),
    (profile_data->>'profile_picture_url') IS NOT NULL AND (profile_data->>'profile_picture_url') != '';
END;
$$ LANGUAGE plpgsql;
