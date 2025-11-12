-- ============================================================================
-- Profile Version Comparison Function
-- ============================================================================
-- Adds ability to compare any two profile versions and generate a diff
-- This enables on-demand changelog generation between any two versions

-- Function to calculate diff between two versions
-- Returns JSONB object with changed fields: { "field_name": { "old": "...", "new": "..." } }
CREATE OR REPLACE FUNCTION calculate_version_diff(
  p_old_version_id UUID,
  p_new_version_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  old_profile JSONB;
  new_profile JSONB;
  diff JSONB := '{}'::JSONB;
  field_name TEXT;
  old_value TEXT;
  new_value TEXT;
  old_array_value JSONB;
  new_array_value JSONB;
BEGIN
  -- Get both versions and verify they belong to the user
  -- Convert to JSONB for dynamic field access
  SELECT to_jsonb(p.*) INTO old_profile
  FROM user_profiles p
  WHERE p.id = p_old_version_id AND p.user_id = p_user_id;
  
  SELECT to_jsonb(p.*) INTO new_profile
  FROM user_profiles p
  WHERE p.id = p_new_version_id AND p.user_id = p_user_id;
  
  -- Verify both profiles exist
  IF old_profile IS NULL THEN
    RAISE EXCEPTION 'Old version not found or access denied';
  END IF;
  
  IF new_profile IS NULL THEN
    RAISE EXCEPTION 'New version not found or access denied';
  END IF;
  
  -- Compare all fields (excluding versioning/metadata fields)
  -- We'll check each field individually to handle NULLs properly
  FOR field_name IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND table_schema = 'public'
    AND column_name NOT IN (
      'id', 'user_id', 'version_number', 'is_draft', 'is_active', 
      'parent_version_id', 'created_at', 'updated_at', 'ai_tags',
      'vibe_assistant_tokens_used', 'vibe_assistant_tokens_remaining',
      'vibe_assistant_total_cost', 'token_rollover_cycles', 'token_last_drip_date',
      'auto_topup_enabled', 'auto_topup_pack_id', 'storage_quota_gb'
    )
  LOOP
    -- Get values, handling NULLs and normalizing
    -- Extract as text, normalize empty strings to NULL, trim whitespace
    old_value := NULLIF(TRIM(COALESCE(old_profile->>field_name, '')), '');
    new_value := NULLIF(TRIM(COALESCE(new_profile->>field_name, '')), '');
    
    -- Compare values (handle arrays and JSONB specially)
    IF field_name IN ('children_ages', 'hobbies', 'progress_photos') THEN
      -- Array comparison - extract as JSONB array
      old_array_value := old_profile->field_name;
      new_array_value := new_profile->field_name;
      
      -- Compare arrays (handle NULL as empty array)
      IF COALESCE(old_array_value, '[]'::jsonb) IS DISTINCT FROM COALESCE(new_array_value, '[]'::jsonb) THEN
        diff := diff || jsonb_build_object(
          field_name,
          jsonb_build_object(
            'old', COALESCE(old_profile->>field_name, '[]'),
            'new', COALESCE(new_profile->>field_name, '[]'),
            'type', 'array'
          )
        );
      END IF;
    ELSIF field_name = 'story_recordings' THEN
      -- JSONB comparison - extract as JSONB
      old_array_value := old_profile->field_name;
      new_array_value := new_profile->field_name;
      
      IF COALESCE(old_array_value, 'null'::jsonb) IS DISTINCT FROM COALESCE(new_array_value, 'null'::jsonb) THEN
        diff := diff || jsonb_build_object(
          field_name,
          jsonb_build_object(
            'old', COALESCE(old_profile->>field_name, 'null'),
            'new', COALESCE(new_profile->>field_name, 'null'),
            'type', 'jsonb'
          )
        );
      END IF;
    ELSE
      -- Standard field comparison
      -- Use IS DISTINCT FROM to handle NULLs correctly
      -- Two NULLs are considered equal, NULL and non-NULL are different
      IF old_value IS DISTINCT FROM new_value THEN
        diff := diff || jsonb_build_object(
          field_name,
          jsonb_build_object(
            'old', old_value,
            'new', new_value,
            'type', 'text'
          )
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN diff;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error calculating version diff: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get field labels for display
CREATE OR REPLACE FUNCTION get_field_label(p_field_name TEXT)
RETURNS TEXT AS $$
DECLARE
  label_map JSONB := '{
    "first_name": "First Name",
    "last_name": "Last Name",
    "email": "Email",
    "phone": "Phone",
    "date_of_birth": "Date of Birth",
    "gender": "Gender",
    "ethnicity": "Ethnicity",
    "relationship_status": "Relationship Status",
    "partner_name": "Partner Name",
    "has_children": "Has Children",
    "number_of_children": "Number of Children",
    "children_ages": "Children Ages",
    "height": "Height",
    "weight": "Weight",
    "exercise_frequency": "Exercise Frequency",
    "city": "City",
    "state": "State",
    "country": "Country",
    "occupation": "Occupation",
    "company": "Company",
    "household_income": "Household Income",
    "health_vitality_story": "Health Story",
    "romance_partnership_story": "Love Story",
    "family_parenting_story": "Family Story",
    "career_work_story": "Career Story",
    "money_wealth_story": "Money Story",
    "fun_recreation_story": "Fun Story",
    "travel_adventure_story": "Travel Story",
    "social_friends_story": "Social Story",
    "home_environment_story": "Home Story",
    "possessions_lifestyle_story": "Possessions Story",
    "spirituality_growth_story": "Spirituality Story",
    "giving_legacy_story": "Giving Story"
  }'::JSONB;
BEGIN
  RETURN COALESCE(label_map->>p_field_name, INITCAP(REPLACE(p_field_name, '_', ' ')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comment on functions
COMMENT ON FUNCTION calculate_version_diff(UUID, UUID, UUID) IS 'Calculates differences between two profile versions. Returns JSONB with changed fields.';
COMMENT ON FUNCTION get_field_label(TEXT) IS 'Returns human-readable label for a field name.';

