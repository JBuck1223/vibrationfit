-- Update create_draft_from_version function to use education instead of education_level
CREATE OR REPLACE FUNCTION create_draft_from_version(p_source_profile_id UUID, p_user_id UUID, p_version_notes TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  source_profile user_profiles%ROWTYPE;
  new_profile_id UUID;
  next_version INTEGER;
BEGIN
  -- Get the source profile data
  SELECT * INTO source_profile
  FROM user_profiles
  WHERE id = p_source_profile_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source profile not found or access denied';
  END IF;
  
  -- Get next version number
  next_version := get_next_version_number(p_user_id);
  
  -- Delete any existing draft for this user
  DELETE FROM user_profiles 
  WHERE user_id = p_user_id AND is_draft = true;
  
  -- Create new draft version
  INSERT INTO user_profiles (
    user_id,
    version_number,
    is_draft,
    is_active,
    version_notes,
    parent_version_id,
    completion_percentage,
    -- Copy all profile data fields
    profile_picture_url,
    date_of_birth,
    gender,
    ethnicity,
    relationship_status,
    relationship_length,
    partner_name,
    has_children,
    number_of_children,
    children_ages,
    units,
    height,
    weight,
    exercise_frequency,
    living_situation,
    time_at_location,
    city,
    state,
    postal_code,
    country,
    employment_type,
    occupation,
    company,
    time_in_role,
    currency,
    household_income,
    savings_retirement,
    assets_equity,
    consumer_debt,
    education,
    education_description,
    current_story,
    desired_story,
    -- Life category stories
    health_vitality_story,
    romance_partnership_story,
    family_parenting_story,
    career_work_story,
    money_wealth_story,
    home_environment_story,
    fun_recreation_story,
    travel_adventure_story,
    social_friends_story,
    possessions_lifestyle_story,
    spirituality_growth_story,
    giving_legacy_story,
    -- Structured fields
    hobbies,
    leisure_time_weekly,
    travel_frequency,
    passport,
    countries_visited,
    close_friends_count,
    social_preference,
    lifestyle_category,
    primary_vehicle,
    spiritual_practice,
    meditation_frequency,
    personal_growth_focus,
    volunteer_status,
    charitable_giving,
    legacy_mindset,
    -- Media and notes
    progress_photos,
    story_recordings,
    -- Token tracking fields
    vibe_assistant_tokens_used,
    vibe_assistant_tokens_remaining,
    vibe_assistant_total_cost,
    token_rollover_cycles,
    token_last_drip_date,
    auto_topup_enabled,
    auto_topup_pack_id,
    storage_quota_gb,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    next_version,
    true,  -- is_draft
    false, -- is_active
    p_version_notes,
    p_source_profile_id, -- parent_version_id
    source_profile.completion_percentage,
    -- Copy all fields from source
    source_profile.profile_picture_url,
    source_profile.date_of_birth,
    source_profile.gender,
    source_profile.ethnicity,
    source_profile.relationship_status,
    source_profile.relationship_length,
    source_profile.partner_name,
    source_profile.has_children,
    source_profile.number_of_children,
    source_profile.children_ages,
    source_profile.units,
    source_profile.height,
    source_profile.weight,
    source_profile.exercise_frequency,
    source_profile.living_situation,
    source_profile.time_at_location,
    source_profile.city,
    source_profile.state,
    source_profile.postal_code,
    source_profile.country,
    source_profile.employment_type,
    source_profile.occupation,
    source_profile.company,
    source_profile.time_in_role,
    source_profile.currency,
    source_profile.household_income,
    source_profile.savings_retirement,
    source_profile.assets_equity,
    source_profile.consumer_debt,
    source_profile.education,
    source_profile.education_description,
    source_profile.current_story,
    source_profile.desired_story,
    source_profile.health_vitality_story,
    source_profile.romance_partnership_story,
    source_profile.family_parenting_story,
    source_profile.career_work_story,
    source_profile.money_wealth_story,
    source_profile.home_environment_story,
    source_profile.fun_recreation_story,
    source_profile.travel_adventure_story,
    source_profile.social_friends_story,
    source_profile.possessions_lifestyle_story,
    source_profile.spirituality_growth_story,
    source_profile.giving_legacy_story,
    source_profile.hobbies,
    source_profile.leisure_time_weekly,
    source_profile.travel_frequency,
    source_profile.passport,
    source_profile.countries_visited,
    source_profile.close_friends_count,
    source_profile.social_preference,
    source_profile.lifestyle_category,
    source_profile.primary_vehicle,
    source_profile.spiritual_practice,
    source_profile.meditation_frequency,
    source_profile.personal_growth_focus,
    source_profile.volunteer_status,
    source_profile.charitable_giving,
    source_profile.legacy_mindset,
    source_profile.progress_photos,
    source_profile.story_recordings,
    source_profile.vibe_assistant_tokens_used,
    source_profile.vibe_assistant_tokens_remaining,
    source_profile.vibe_assistant_total_cost,
    source_profile.token_rollover_cycles,
    source_profile.token_last_drip_date,
    source_profile.auto_topup_enabled,
    source_profile.auto_topup_pack_id,
    source_profile.storage_quota_gb,
    NOW(),
    NOW()
  ) RETURNING id INTO new_profile_id;
  
  RETURN new_profile_id;
END;
$$ LANGUAGE plpgsql;
