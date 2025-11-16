


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."assessment_category" AS ENUM (
    'money',
    'health',
    'family',
    'romance',
    'social',
    'business',
    'fun',
    'travel',
    'home',
    'possessions',
    'giving',
    'spirituality'
);


ALTER TYPE "public"."assessment_category" OWNER TO "postgres";


CREATE TYPE "public"."assessment_status" AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);


ALTER TYPE "public"."assessment_status" OWNER TO "postgres";


CREATE TYPE "public"."audio_generation_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE "public"."audio_generation_status" OWNER TO "postgres";


CREATE TYPE "public"."green_line_status" AS ENUM (
    'above',
    'transition',
    'below'
);


ALTER TYPE "public"."green_line_status" OWNER TO "postgres";


CREATE TYPE "public"."lifestyle_category" AS ENUM (
    'minimalist',
    'moderate',
    'comfortable',
    'luxury'
);


ALTER TYPE "public"."lifestyle_category" OWNER TO "postgres";


CREATE TYPE "public"."membership_tier_type" AS ENUM (
    'free',
    'starter',
    'pro',
    'elite',
    'vision_pro_annual',
    'vision_pro_28day'
);


ALTER TYPE "public"."membership_tier_type" OWNER TO "postgres";


CREATE TYPE "public"."social_preference" AS ENUM (
    'introvert',
    'ambivert',
    'extrovert'
);


ALTER TYPE "public"."social_preference" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."token_action_type" AS ENUM (
    'chat',
    'refinement',
    'blueprint',
    'audio_generation',
    'transcription',
    'image_generation',
    'assessment',
    'manual_adjustment',
    'subscription_grant',
    'renewal_grant',
    'pack_purchase',
    'admin_grant',
    'admin_deduct',
    'trial_grant',
    'token_pack_purchase'
);


ALTER TYPE "public"."token_action_type" OWNER TO "postgres";


CREATE TYPE "public"."travel_frequency" AS ENUM (
    'never',
    'yearly',
    'quarterly',
    'monthly'
);


ALTER TYPE "public"."travel_frequency" OWNER TO "postgres";


CREATE TYPE "public"."vision_audio_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE "public"."vision_audio_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_token_usage"("p_user_id" "uuid", "p_action_type" "text", "p_model_used" "text", "p_tokens_used" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate_cents" integer, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_effective_tokens INTEGER;
  v_override INTEGER;
BEGIN
  IF p_tokens_used IS NULL THEN
    p_tokens_used := 0;
  END IF;

  -- If no explicit tokens, try override for this action_type
  SELECT token_value INTO v_override
  FROM public.ai_action_token_overrides
  WHERE action_type = p_action_type;

  v_effective_tokens := COALESCE(NULLIF(p_input_tokens, 0), 0) + COALESCE(NULLIF(p_output_tokens, 0), 0);
  IF v_effective_tokens = 0 THEN
    v_effective_tokens := COALESCE(NULLIF(p_tokens_used, 0), 0);
  END IF;
  IF v_effective_tokens = 0 THEN
    v_effective_tokens := COALESCE(v_override, 0);
  END IF;

  -- Insert token_usage record
  INSERT INTO public.token_usage(
    user_id,
    action_type,
    model_used,
    tokens_used,
    cost_estimate,
    input_tokens,
    output_tokens,
    success,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_action_type,
    p_model_used,
    v_effective_tokens,
    COALESCE(p_cost_estimate_cents, 0),
    COALESCE(p_input_tokens, 0),
    COALESCE(p_output_tokens, 0),
    true,
    COALESCE(p_metadata, '{}'),
    NOW()
  );

  -- Update user profile balances
  UPDATE public.user_profiles
  SET
    vibe_assistant_tokens_used = COALESCE(vibe_assistant_tokens_used, 0) + v_effective_tokens,
    vibe_assistant_tokens_remaining = GREATEST(COALESCE(vibe_assistant_tokens_remaining, 0) - v_effective_tokens, 0),
    vibe_assistant_total_cost = COALESCE(vibe_assistant_total_cost, 0) + COALESCE(p_cost_estimate_cents, 0)
  WHERE user_id = p_user_id;

END;
$$;


ALTER FUNCTION "public"."apply_token_usage"("p_user_id" "uuid", "p_action_type" "text", "p_model_used" "text", "p_tokens_used" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate_cents" integer, "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_blueprint_progress"("p_blueprint_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Count total tasks
    SELECT COUNT(*) INTO total_tasks
    FROM blueprint_tasks
    WHERE blueprint_id = p_blueprint_id;
    
    -- Count completed tasks
    SELECT COUNT(*) INTO completed_tasks
    FROM blueprint_tasks
    WHERE blueprint_id = p_blueprint_id AND status = 'completed';
    
    -- Calculate percentage
    IF total_tasks > 0 THEN
        progress_percentage := ROUND((completed_tasks::DECIMAL / total_tasks) * 100);
    ELSE
        progress_percentage := 0;
    END IF;
    
    RETURN progress_percentage;
END;
$$;


ALTER FUNCTION "public"."calculate_blueprint_progress"("p_blueprint_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_blueprint_progress"("p_blueprint_id" "uuid") IS 'Calculates progress percentage based on completed tasks';



CREATE OR REPLACE FUNCTION "public"."calculate_category_score"("p_assessment_id" "uuid", "p_category" "public"."assessment_category") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_total_score INTEGER;
BEGIN
  -- Use ai_score when available (for custom responses), otherwise use response_value
  SELECT COALESCE(SUM(
    CASE 
      WHEN ai_score IS NOT NULL AND is_custom_response = true THEN ai_score
      ELSE response_value
    END
  ), 0)
  INTO v_total_score
  FROM assessment_responses
  WHERE assessment_id = p_assessment_id
    AND category = p_category;
  
  RETURN v_total_score;
END;
$$;


ALTER FUNCTION "public"."calculate_category_score"("p_assessment_id" "uuid", "p_category" "public"."assessment_category") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_category_score"("p_assessment_id" "uuid", "p_category" "public"."assessment_category") IS 'Calculates total score for a category, using ai_score for custom responses when available, otherwise response_value';



CREATE OR REPLACE FUNCTION "public"."calculate_profile_completion"("profile_data" "jsonb") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_fields INTEGER := 18; -- Adjusted to match actual profile fields
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
  
  -- Relationship (1 field - relationship_status is the main one)
  IF (profile_data->>'relationship_status') IS NOT NULL AND (profile_data->>'relationship_status') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
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
  
  -- Career (2 fields)
  IF (profile_data->>'employment_type') IS NOT NULL AND (profile_data->>'employment_type') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'occupation') IS NOT NULL AND (profile_data->>'occupation') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Financial (1 field)
  IF (profile_data->>'household_income') IS NOT NULL AND (profile_data->>'household_income') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Profile Picture (1 field) - optional but counts if present
  IF (profile_data->>'profile_picture_url') IS NOT NULL AND (profile_data->>'profile_picture_url') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  RETURN ROUND((completed_fields::DECIMAL / total_fields) * 100);
END;
$$;


ALTER FUNCTION "public"."calculate_profile_completion"("profile_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_token_balance"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_grants INTEGER;
  v_usage INTEGER;
  v_deductions INTEGER;
BEGIN
  -- Get total grants from token_transactions (source of truth)
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_grants
  FROM token_transactions
  WHERE user_id = p_user_id
    AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
    AND tokens_used > 0;

  -- Get total AI usage from token_usage
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_usage
  FROM token_usage
  WHERE user_id = p_user_id
    AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
    AND tokens_used > 0
    AND success = true;

  -- Get deductions from token_transactions
  SELECT COALESCE(SUM(ABS(tokens_used)), 0) INTO v_deductions
  FROM token_transactions
  WHERE user_id = p_user_id
    AND (action_type = 'admin_deduct' OR tokens_used < 0);

  -- Return calculated balance (grants - usage - deductions)
  RETURN GREATEST(0, v_grants - v_usage - v_deductions);
END;
$$;


ALTER FUNCTION "public"."calculate_token_balance"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_token_balance"("p_user_id" "uuid") IS 'Calculates token balance from transactions/usage. Source of truth - ignores user_profiles.vibe_assistant_tokens_remaining';



CREATE OR REPLACE FUNCTION "public"."calculate_version_diff"("p_old_version_id" "uuid", "p_new_version_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_version_diff"("p_old_version_id" "uuid", "p_new_version_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_version_diff"("p_old_version_id" "uuid", "p_new_version_id" "uuid", "p_user_id" "uuid") IS 'Calculates differences between two profile versions. Returns JSONB with changed fields.';



CREATE OR REPLACE FUNCTION "public"."calculate_version_number"("p_profile_id" "uuid", "p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  profile_created_at TIMESTAMP WITH TIME ZONE;
  version_num INTEGER;
BEGIN
  -- Get the created_at timestamp for this profile
  SELECT created_at INTO profile_created_at
  FROM user_profiles
  WHERE id = p_profile_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Count how many profiles were created before or at the same time as this one
  -- Order: oldest first = version 1, newest = highest version
  -- This ensures sequential numbering even after deletions
  SELECT COUNT(*) INTO version_num
  FROM user_profiles
  WHERE user_id = p_user_id
    AND created_at <= profile_created_at
    AND id != p_profile_id; -- Don't count self (will add 1 below)
  
  -- Add 1 because we want 1-based indexing
  RETURN version_num + 1;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;


ALTER FUNCTION "public"."calculate_version_number"("p_profile_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_version_number"("p_profile_id" "uuid", "p_user_id" "uuid") IS 'Calculates version number based on chronological order (created_at) for a user. Returns sequential numbers (1, 2, 3...) without gaps even after deletions.';



CREATE OR REPLACE FUNCTION "public"."calculate_vibe_assistant_cost"("p_tokens" integer) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
    -- GPT-4 pricing as of 2024: $0.03 per 1K input tokens, $0.06 per 1K output tokens
    -- Using average of input/output pricing for estimation
    RETURN (p_tokens * 0.045) / 1000.0;
END;
$_$;


ALTER FUNCTION "public"."calculate_vibe_assistant_cost"("p_tokens" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_vibe_assistant_cost"("p_tokens" integer) IS 'Calculates cost in USD for given token count';



CREATE OR REPLACE FUNCTION "public"."calculate_vision_version_number"("p_vision_id" "uuid", "p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  vision_created_at TIMESTAMP WITH TIME ZONE;
  version_num INTEGER;
BEGIN
  -- Get the created_at timestamp for this vision
  SELECT created_at INTO vision_created_at
  FROM vision_versions
  WHERE id = p_vision_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Count how many visions were created before or at the same time as this one
  -- Order: oldest first = version 1, newest = highest version
  -- This ensures sequential numbering even after deletions
  SELECT COUNT(*) INTO version_num
  FROM vision_versions
  WHERE user_id = p_user_id
    AND created_at <= vision_created_at
    AND id != p_vision_id; -- Don't count self (will add 1 below)
  
  -- Add 1 because we want 1-based indexing
  RETURN version_num + 1;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;


ALTER FUNCTION "public"."calculate_vision_version_number"("p_vision_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_vision_version_number"("p_vision_id" "uuid", "p_user_id" "uuid") IS 'Calculates version number based on chronological order (created_at) for a user. Returns sequential numbers (1, 2, 3...) without gaps even after deletions.';



CREATE OR REPLACE FUNCTION "public"."check_intensive_completion"("p_intensive_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_checklist RECORD;
  v_required_items INTEGER := 0;
  v_completed_items INTEGER := 0;
  v_completion_pct NUMERIC;
  v_is_complete BOOLEAN := false;
BEGIN
  SELECT * INTO v_checklist
  FROM intensive_checklist
  WHERE intensive_id = p_intensive_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Checklist not found');
  END IF;
  
  -- Count required items for guarantee
  v_required_items := 4; -- intake, builder, calibration, activation protocol
  
  v_completed_items := 0;
  IF v_checklist.intake_completed THEN v_completed_items := v_completed_items + 1; END IF;
  IF v_checklist.builder_session_completed THEN v_completed_items := v_completed_items + 1; END IF;
  IF v_checklist.calibration_attended THEN v_completed_items := v_completed_items + 1; END IF;
  IF v_checklist.activation_protocol_started THEN v_completed_items := v_completed_items + 1; END IF;
  
  v_completion_pct := ROUND((v_completed_items::NUMERIC / v_required_items * 100), 1);
  v_is_complete := v_completed_items >= v_required_items;
  
  RETURN jsonb_build_object(
    'intensive_id', p_intensive_id,
    'required_items', v_required_items,
    'completed_items', v_completed_items,
    'completion_percentage', v_completion_pct,
    'is_complete', v_is_complete,
    'checklist', row_to_json(v_checklist)
  );
END;
$$;


ALTER FUNCTION "public"."check_intensive_completion"("p_intensive_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_intensive_completion"("p_intensive_id" "uuid") IS 'Check if intensive checklist meets guarantee requirements';



CREATE OR REPLACE FUNCTION "public"."check_storage_quota"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_quota_gb INTEGER;
  v_used_bytes BIGINT;
  v_used_gb NUMERIC;
  v_percentage NUMERIC;
  v_over_quota BOOLEAN;
BEGIN
  -- Get user's storage quota
  SELECT COALESCE(storage_quota_gb, 100) INTO v_quota_gb
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Calculate current usage from storage.objects
  -- Note: This is a placeholder - actual implementation depends on your storage setup
  SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0) INTO v_used_bytes
  FROM storage.objects
  WHERE owner = p_user_id::TEXT;
  
  v_used_gb := ROUND((v_used_bytes / 1073741824.0)::NUMERIC, 2); -- Convert to GB
  v_percentage := ROUND(((v_used_gb / v_quota_gb) * 100)::NUMERIC, 1);
  v_over_quota := v_used_gb > v_quota_gb;
  
  RETURN jsonb_build_object(
    'quota_gb', v_quota_gb,
    'used_gb', v_used_gb,
    'used_bytes', v_used_bytes,
    'percentage', v_percentage,
    'over_quota', v_over_quota,
    'remaining_gb', GREATEST(0, v_quota_gb - v_used_gb),
    'warning_90pct', v_percentage >= 90,
    'warning_80pct', v_percentage >= 80
  );
END;
$$;


ALTER FUNCTION "public"."check_storage_quota"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_storage_quota"("p_user_id" "uuid") IS 'Check user storage quota and usage';



CREATE OR REPLACE FUNCTION "public"."commit_draft_as_active"("p_draft_profile_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  draft_exists BOOLEAN;
  next_version INTEGER;
BEGIN
  -- Verify the draft exists (don't need full SELECT * - just check existence)
  SELECT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = p_draft_profile_id AND user_id = p_user_id AND is_draft = true
  ) INTO draft_exists;
  
  IF NOT draft_exists THEN
    RAISE EXCEPTION 'Draft profile not found or access denied';
  END IF;
  
  -- Get next version number
  next_version := get_next_version_number(p_user_id);
  
  -- Deactivate current active version
  UPDATE user_profiles 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true AND is_draft = false;
  
  -- Commit the draft as the new active version
  UPDATE user_profiles 
  SET 
    is_draft = false,
    is_active = true,
    version_number = next_version,
    updated_at = NOW()
  WHERE id = p_draft_profile_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."commit_draft_as_active"("p_draft_profile_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."commit_draft_as_active"("p_draft_profile_id" "uuid", "p_user_id" "uuid") IS 'Commits a draft as the new active version';



CREATE OR REPLACE FUNCTION "public"."create_draft_from_version"("p_source_profile_id" "uuid", "p_user_id" "uuid", "p_version_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_profile_id UUID;
  next_version INTEGER;
  sql_text TEXT;
BEGIN
  -- Get next version number
  next_version := get_next_version_number(p_user_id);
  
  -- Delete any existing draft for this user
  DELETE FROM user_profiles 
  WHERE user_id = p_user_id AND is_draft = true;
  
  -- Build dynamic INSERT statement that excludes completion_percentage
  -- Get all column names except completion_percentage and versioning fields
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO sql_text
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name NOT IN ('id', 'completion_percentage', 'user_id', 'version_number', 'is_draft', 'is_active', 'version_notes', 'parent_version_id', 'created_at', 'updated_at');
  
  -- Execute dynamic INSERT
  EXECUTE format('
    INSERT INTO user_profiles (
      user_id, version_number, is_draft, is_active, version_notes, parent_version_id,
      %s,
      created_at, updated_at
    )
    SELECT 
      %L as user_id,
      %s as version_number,
      true as is_draft,
      false as is_active,
      %L as version_notes,
      %L as parent_version_id,
      %s,
      NOW() as created_at,
      NOW() as updated_at
    FROM user_profiles
    WHERE id = %L AND user_id = %L
    RETURNING id
  ', sql_text, p_user_id, next_version, p_version_notes, p_source_profile_id, sql_text, p_source_profile_id, p_user_id) INTO new_profile_id;
  
  IF new_profile_id IS NULL THEN
    RAISE EXCEPTION 'Source profile not found or access denied';
  END IF;
  
  RETURN new_profile_id;
EXCEPTION
  WHEN undefined_column THEN
    -- If completion_percentage doesn't exist (already dropped), exclude it from the column list
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO sql_text
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name NOT IN ('id', 'user_id', 'version_number', 'is_draft', 'is_active', 'version_notes', 'parent_version_id', 'created_at', 'updated_at');
    
    EXECUTE format('
      INSERT INTO user_profiles (
        user_id, version_number, is_draft, is_active, version_notes, parent_version_id,
        %s,
        created_at, updated_at
      )
      SELECT 
        %L as user_id,
        %s as version_number,
        true as is_draft,
        false as is_active,
        %L as version_notes,
        %L as parent_version_id,
        %s,
        NOW() as created_at,
        NOW() as updated_at
      FROM user_profiles
      WHERE id = %L AND user_id = %L
      RETURNING id
    ', sql_text, p_user_id, next_version, p_version_notes, p_source_profile_id, sql_text, p_source_profile_id, p_user_id) INTO new_profile_id;
    
    IF new_profile_id IS NULL THEN
      RAISE EXCEPTION 'Source profile not found or access denied';
    END IF;
    
    RETURN new_profile_id;
END;
$$;


ALTER FUNCTION "public"."create_draft_from_version"("p_source_profile_id" "uuid", "p_user_id" "uuid", "p_version_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_draft_from_version"("p_source_profile_id" "uuid", "p_user_id" "uuid", "p_version_notes" "text") IS 'Creates a draft version from an existing version';



CREATE OR REPLACE FUNCTION "public"."create_profile_version"("user_uuid" "uuid", "profile_data" "jsonb", "is_draft" boolean DEFAULT true) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_profile_version"("user_uuid" "uuid", "profile_data" "jsonb", "is_draft" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_vibe_assistant_allowance"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_tokens INTEGER;
    monthly_limit INTEGER;
    cost_limit DECIMAL(10,4);
    current_cost DECIMAL(10,4);
BEGIN
    -- Get current allowance and limits
    SELECT 
        p.vibe_assistant_tokens_remaining,
        COALESCE(mt.monthly_vibe_assistant_tokens, 0),
        COALESCE(mt.monthly_vibe_assistant_cost_limit, 0.00),
        p.vibe_assistant_total_cost
    INTO current_tokens, monthly_limit, cost_limit, current_cost
    FROM profiles p
    LEFT JOIN membership_tiers mt ON p.membership_tier_id = mt.id
    WHERE p.user_id = p_user_id;
    
    -- Check if user has sufficient tokens and hasn't exceeded cost limit
    IF current_tokens >= p_tokens AND (current_cost + p_cost) <= cost_limit THEN
        -- Decrement tokens and add cost
        UPDATE profiles 
        SET 
            vibe_assistant_tokens_remaining = vibe_assistant_tokens_remaining - p_tokens,
            vibe_assistant_tokens_used = vibe_assistant_tokens_used + p_tokens,
            vibe_assistant_total_cost = vibe_assistant_total_cost + p_cost,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;


ALTER FUNCTION "public"."decrement_vibe_assistant_allowance"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."decrement_vibe_assistant_allowance"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) IS 'Decrements user allowance and returns success status';



CREATE OR REPLACE FUNCTION "public"."delete_from_s3"("file_path" "text", "bucket_name" "text" DEFAULT 'vibration-fit-client-storage'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a placeholder implementation
  -- In production, you would need to:
  -- 1. Install the AWS SDK extension in Supabase
  -- 2. Configure AWS credentials
  -- 3. Implement actual S3 delete logic
  
  -- For now, we'll just return success
  -- The actual S3 delete would happen here using AWS SDK
  
  result := json_build_object(
    'success', true,
    'message', 'File deleted successfully (placeholder)',
    'path', file_path,
    'bucket', bucket_name
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."delete_from_s3"("file_path" "text", "bucket_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."drip_tokens_28day"("p_user_id" "uuid", "p_subscription_id" "uuid", "p_cycle_number" integer DEFAULT 1) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_balance INTEGER;
  v_drip_amount INTEGER := 375000; -- 375k per cycle
  v_rollover_cycles INTEGER;
  v_rollover_amount INTEGER := 0;
  v_expired_tokens INTEGER := 0;
  v_new_balance INTEGER;
  v_max_rollover_cycles INTEGER := 3;
BEGIN
  -- Get current balance and rollover count
  SELECT 
    COALESCE(vibe_assistant_tokens_remaining, 0),
    COALESCE(token_rollover_cycles, 0)
  INTO v_current_balance, v_rollover_cycles
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- If user already has tokens from previous cycle, track rollover
  IF v_current_balance > 0 THEN
    v_rollover_amount := v_current_balance;
    v_rollover_cycles := v_rollover_cycles + 1;
    
    -- If exceeding max rollover cycles, expire the excess
    IF v_rollover_cycles > v_max_rollover_cycles THEN
      v_expired_tokens := v_current_balance;
      v_rollover_amount := 0;
      v_rollover_cycles := 0;
    END IF;
  ELSE
    -- No rollover, reset counter
    v_rollover_cycles := 0;
  END IF;
  
  -- Calculate new balance
  v_new_balance := (v_rollover_amount + v_drip_amount);
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_rollover_cycles = v_rollover_cycles,
    token_last_drip_date = NOW()
  WHERE user_id = p_user_id;
  
  -- Record the drip
  INSERT INTO token_drips (
    user_id,
    subscription_id,
    drip_amount,
    cycle_number,
    rollover_from_previous,
    rollover_cycles_count,
    expired_tokens,
    balance_before,
    balance_after,
    billing_period_start,
    billing_period_end
  ) VALUES (
    p_user_id,
    p_subscription_id,
    v_drip_amount,
    p_cycle_number,
    v_rollover_amount,
    v_rollover_cycles,
    v_expired_tokens,
    v_current_balance,
    v_new_balance,
    NOW(),
    NOW() + INTERVAL '28 days'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'dripped', v_drip_amount,
    'rollover', v_rollover_amount,
    'expired', v_expired_tokens,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance,
    'rollover_cycles', v_rollover_cycles
  );
END;
$$;


ALTER FUNCTION "public"."drip_tokens_28day"("p_user_id" "uuid", "p_subscription_id" "uuid", "p_cycle_number" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."drip_tokens_28day"("p_user_id" "uuid", "p_subscription_id" "uuid", "p_cycle_number" integer) IS 'Drip 375k tokens per 28-day cycle with 3-cycle rollover max';



CREATE OR REPLACE FUNCTION "public"."estimate_vibe_assistant_tokens"("p_text" "text") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    -- Rough estimation: ~4 characters per token for English text
    -- Add buffer for system prompts and formatting
    RETURN GREATEST(100, LENGTH(p_text) / 4 + 200);
END;
$$;


ALTER FUNCTION "public"."estimate_vibe_assistant_tokens"("p_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."estimate_vibe_assistant_tokens"("p_text" "text") IS 'Estimates token count for given text';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customer_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "membership_tier_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "stripe_subscription_id" "text",
    "stripe_price_id" "text",
    "status" "public"."subscription_status" DEFAULT 'incomplete'::"public"."subscription_status" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."customer_subscriptions" IS 'Tracks user subscriptions synced with Stripe';



CREATE OR REPLACE FUNCTION "public"."get_active_subscription"("p_user_id" "uuid") RETURNS "public"."customer_subscriptions"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_subscription customer_subscriptions;
BEGIN
  SELECT * INTO v_subscription
  FROM customer_subscriptions
  WHERE user_id = p_user_id
    AND (status = 'active' OR status = 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN v_subscription;
END;
$$;


ALTER FUNCTION "public"."get_active_subscription"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_subscription"("p_user_id" "uuid") IS 'Returns user''s active or trialing subscription';



CREATE OR REPLACE FUNCTION "public"."get_field_label"("p_field_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_field_label"("p_field_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_field_label"("p_field_name" "text") IS 'Returns human-readable label for a field name.';



CREATE OR REPLACE FUNCTION "public"."get_green_line_status"("p_score" integer) RETURNS "public"."green_line_status"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_percentage NUMERIC;
BEGIN
  -- Calculate percentage (max score per category is 35 points: 7 questions × 5 points each)
  v_percentage := (p_score::NUMERIC / 35.0) * 100;
  
  -- Determine status
  IF v_percentage >= 80 THEN
    RETURN 'above'::green_line_status;
  ELSIF v_percentage >= 60 THEN
    RETURN 'transition'::green_line_status;
  ELSE
    RETURN 'below'::green_line_status;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_green_line_status"("p_score" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_green_line_status"("p_score" integer) IS 'Determines Green Line status based on score percentage (max 35 points per category)';



CREATE TABLE IF NOT EXISTS "public"."intensive_checklist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "intensive_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "intake_completed" boolean DEFAULT false,
    "intake_completed_at" timestamp without time zone,
    "vision_drafted" boolean DEFAULT false,
    "vision_drafted_at" timestamp without time zone,
    "builder_session_started" boolean DEFAULT false,
    "builder_session_started_at" timestamp without time zone,
    "builder_session_completed" boolean DEFAULT false,
    "builder_session_completed_at" timestamp without time zone,
    "vision_board_created" boolean DEFAULT false,
    "vision_board_created_at" timestamp without time zone,
    "calibration_scheduled" boolean DEFAULT false,
    "calibration_scheduled_at" timestamp without time zone,
    "calibration_attended" boolean DEFAULT false,
    "calibration_attended_at" timestamp without time zone,
    "audios_generated" boolean DEFAULT false,
    "audios_generated_at" timestamp without time zone,
    "activation_protocol_started" boolean DEFAULT false,
    "activation_started_at" timestamp without time zone,
    "streak_day_1" boolean DEFAULT false,
    "streak_day_2" boolean DEFAULT false,
    "streak_day_3" boolean DEFAULT false,
    "streak_day_4" boolean DEFAULT false,
    "streak_day_5" boolean DEFAULT false,
    "streak_day_6" boolean DEFAULT false,
    "streak_day_7" boolean DEFAULT false,
    "streak_day_7_reached_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "profile_completed" boolean DEFAULT false,
    "profile_completed_at" timestamp without time zone,
    "assessment_completed" boolean DEFAULT false,
    "assessment_completed_at" timestamp without time zone,
    "call_scheduled" boolean DEFAULT false,
    "call_scheduled_at" timestamp without time zone,
    "call_scheduled_time" timestamp without time zone,
    "vision_built" boolean DEFAULT false,
    "vision_built_at" timestamp without time zone,
    "vision_refined" boolean DEFAULT false,
    "vision_refined_at" timestamp without time zone,
    "audio_generated" boolean DEFAULT false,
    "audio_generated_at" timestamp without time zone,
    "vision_board_completed" boolean DEFAULT false,
    "vision_board_completed_at" timestamp without time zone,
    "first_journal_entry" boolean DEFAULT false,
    "first_journal_entry_at" timestamp without time zone,
    "calibration_call_completed" boolean DEFAULT false,
    "calibration_call_completed_at" timestamp without time zone,
    "activation_protocol_completed" boolean DEFAULT false,
    "activation_protocol_completed_at" timestamp without time zone
);


ALTER TABLE "public"."intensive_checklist" OWNER TO "postgres";


COMMENT ON TABLE "public"."intensive_checklist" IS '48-hour activation intensive completion tracking';



COMMENT ON COLUMN "public"."intensive_checklist"."intake_completed" IS 'DEPRECATED: Use profile_completed instead';



COMMENT ON COLUMN "public"."intensive_checklist"."vision_drafted" IS 'DEPRECATED: Use vision_built instead';



COMMENT ON COLUMN "public"."intensive_checklist"."builder_session_started" IS 'DEPRECATED: Use vision_built instead';



COMMENT ON COLUMN "public"."intensive_checklist"."builder_session_completed" IS 'DEPRECATED: Use vision_built instead';



COMMENT ON COLUMN "public"."intensive_checklist"."vision_board_created" IS 'DEPRECATED: Use vision_board_completed instead';



COMMENT ON COLUMN "public"."intensive_checklist"."calibration_scheduled" IS 'DEPRECATED: Use call_scheduled instead';



COMMENT ON COLUMN "public"."intensive_checklist"."calibration_attended" IS 'DEPRECATED: Use calibration_call_completed instead';



COMMENT ON COLUMN "public"."intensive_checklist"."audios_generated" IS 'DEPRECATED: Use audio_generated instead';



CREATE OR REPLACE FUNCTION "public"."get_intensive_progress"("checklist_row" "public"."intensive_checklist") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  total_steps INTEGER := 10;
  completed_steps INTEGER := 0;
BEGIN
  IF checklist_row.profile_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.assessment_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.call_scheduled THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.vision_built THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.vision_refined THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.audio_generated THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.vision_board_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.first_journal_entry THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.calibration_call_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.activation_protocol_completed THEN completed_steps := completed_steps + 1; END IF;
  
  RETURN (completed_steps * 100 / total_steps);
END;
$$;


ALTER FUNCTION "public"."get_intensive_progress"("checklist_row" "public"."intensive_checklist") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_latest_profile_version"("user_uuid" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "version_number" integer, "profile_data" "jsonb", "completion_percentage" integer, "is_draft" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT pv.id, pv.user_id, pv.version_number, pv.profile_data, 
         pv.completion_percentage, pv.is_draft, pv.created_at, pv.updated_at
  FROM profile_versions pv
  WHERE pv.user_id = user_uuid
  ORDER BY pv.version_number DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_latest_profile_version"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_intensive_step"("checklist_row" "public"."intensive_checklist") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  IF NOT checklist_row.profile_completed THEN RETURN 'profile'; END IF;
  IF NOT checklist_row.assessment_completed THEN RETURN 'assessment'; END IF;
  IF NOT checklist_row.call_scheduled THEN RETURN 'schedule_call'; END IF;
  IF NOT checklist_row.vision_built THEN RETURN 'build_vision'; END IF;
  IF NOT checklist_row.vision_refined THEN RETURN 'refine_vision'; END IF;
  IF NOT checklist_row.audio_generated THEN RETURN 'generate_audio'; END IF;
  IF NOT checklist_row.vision_board_completed THEN RETURN 'vision_board'; END IF;
  IF NOT checklist_row.first_journal_entry THEN RETURN 'journal'; END IF;
  IF NOT checklist_row.calibration_call_completed THEN RETURN 'calibration_call'; END IF;
  IF NOT checklist_row.activation_protocol_completed THEN RETURN 'activation'; END IF;
  
  RETURN 'completed';
END;
$$;


ALTER FUNCTION "public"."get_next_intensive_step"("checklist_row" "public"."intensive_checklist") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_version_number"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  RETURN next_version;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 1;
END;
$$;


ALTER FUNCTION "public"."get_next_version_number"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_next_version_number"("p_user_id" "uuid") IS 'Gets the next version number for a user';



CREATE OR REPLACE FUNCTION "public"."get_profile_completion_percentage"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_profile_completion_percentage"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_version_number"("p_profile_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  profile_user_id UUID;
  version_num INTEGER;
BEGIN
  -- Get the user_id for this profile
  SELECT user_id INTO profile_user_id
  FROM user_profiles
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate version number
  SELECT calculate_version_number(p_profile_id, profile_user_id) INTO version_num;
  
  RETURN version_num;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;


ALTER FUNCTION "public"."get_profile_version_number"("p_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_profile_version_number"("p_profile_id" "uuid") IS 'Gets the calculated version number for a profile based on chronological order.';



CREATE TABLE IF NOT EXISTS "public"."membership_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "monthly_vibe_assistant_tokens" integer DEFAULT 0 NOT NULL,
    "monthly_vibe_assistant_cost_limit" numeric(10,4) DEFAULT 0.00,
    "price_per_month" numeric(10,2) DEFAULT 0.00,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "tier_type" "public"."membership_tier_type",
    "price_monthly" integer DEFAULT 0 NOT NULL,
    "price_yearly" integer,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "viva_tokens_monthly" integer DEFAULT 0 NOT NULL,
    "max_visions" integer,
    "is_popular" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "stripe_product_id" "text",
    "stripe_price_id" "text",
    "annual_token_grant" integer DEFAULT 0,
    "monthly_token_grant" integer DEFAULT 0,
    "billing_interval" "text" DEFAULT 'month'::"text"
);


ALTER TABLE "public"."membership_tiers" OWNER TO "postgres";


COMMENT ON TABLE "public"."membership_tiers" IS 'Defines available membership tiers and their features';



COMMENT ON COLUMN "public"."membership_tiers"."monthly_vibe_assistant_tokens" IS 'Monthly token allowance based on enhanced context system (3K-5K tokens per request)';



COMMENT ON COLUMN "public"."membership_tiers"."monthly_vibe_assistant_cost_limit" IS 'Monthly cost limit in USD based on GPT-5 input/output pricing';



CREATE OR REPLACE FUNCTION "public"."get_user_tier"("p_user_id" "uuid") RETURNS "public"."membership_tiers"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_tier membership_tiers;
  v_subscription customer_subscriptions;
BEGIN
  -- Get active subscription
  v_subscription := get_active_subscription(p_user_id);
  
  IF v_subscription IS NOT NULL THEN
    -- User has active subscription
    SELECT * INTO v_tier
    FROM membership_tiers
    WHERE id = v_subscription.membership_tier_id;
  ELSE
    -- Default to free tier
    SELECT * INTO v_tier
    FROM membership_tiers
    WHERE tier_type = 'free';
  END IF;
  
  RETURN v_tier;
END;
$$;


ALTER FUNCTION "public"."get_user_tier"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_tier"("p_user_id" "uuid") IS 'Returns user''s current membership tier (defaults to free)';



CREATE OR REPLACE FUNCTION "public"."get_user_token_summary"("p_user_id" "uuid") RETURNS TABLE("total_tokens_used" bigint, "total_cost_usd" numeric, "tokens_by_action" "jsonb", "recent_transactions" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total tokens used (sum of all positive values)
    COALESCE(SUM(CASE WHEN tokens_used > 0 THEN tokens_used ELSE 0 END), 0)::BIGINT,
    
    -- Total cost
    COALESCE(SUM(estimated_cost_usd), 0)::DECIMAL,
    
    -- Breakdown by action type
    (
      SELECT jsonb_object_agg(action_type, token_sum)
      FROM (
        SELECT 
          action_type::TEXT,
          SUM(CASE WHEN tokens_used > 0 THEN tokens_used ELSE 0 END) as token_sum
        FROM token_transactions
        WHERE user_id = p_user_id
        GROUP BY action_type
      ) action_breakdown
    ),
    
    -- Recent transactions (last 10)
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'action_type', action_type,
          'tokens_used', tokens_used,
          'tokens_remaining', tokens_remaining,
          'created_at', created_at,
          'metadata', metadata
        )
        ORDER BY created_at DESC
      )
      FROM (
        SELECT *
        FROM token_transactions
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    )
  FROM token_transactions
  WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_token_summary"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_token_summary"("p_user_id" "uuid") IS 'Returns comprehensive token usage analytics for a user';



CREATE OR REPLACE FUNCTION "public"."get_vibe_assistant_allowance"("p_user_id" "uuid") RETURNS TABLE("tokens_remaining" integer, "tokens_used" integer, "monthly_limit" integer, "cost_limit" numeric, "reset_date" timestamp with time zone, "tier_name" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.vibe_assistant_tokens_remaining,
        p.vibe_assistant_tokens_used,
        COALESCE(mt.monthly_vibe_assistant_tokens, 0),
        COALESCE(mt.monthly_vibe_assistant_cost_limit, 0.00),
        p.vibe_assistant_monthly_reset_date,
        COALESCE(mt.name, 'Free')
    FROM profiles p
    LEFT JOIN membership_tiers mt ON p.membership_tier_id = mt.id
    WHERE p.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_vibe_assistant_allowance"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_vibe_assistant_allowance"("p_user_id" "uuid") IS 'Returns current Vibe Assistant allowance info for a user';



CREATE OR REPLACE FUNCTION "public"."get_vision_version_number"("p_vision_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  vision_user_id UUID;
  version_num INTEGER;
BEGIN
  -- Get the user_id for this vision
  SELECT user_id INTO vision_user_id
  FROM vision_versions
  WHERE id = p_vision_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate version number
  SELECT calculate_vision_version_number(p_vision_id, vision_user_id) INTO version_num;
  
  RETURN version_num;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;


ALTER FUNCTION "public"."get_vision_version_number"("p_vision_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_vision_version_number"("p_vision_id" "uuid") IS 'Gets the calculated version number for a vision based on chronological order.';



CREATE OR REPLACE FUNCTION "public"."grant_annual_tokens"("p_user_id" "uuid", "p_subscription_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_balance INTEGER;
  v_grant_amount INTEGER := 5000000; -- 5M tokens
  v_new_balance INTEGER;
BEGIN
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  v_new_balance := v_grant_amount;
  
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    token_rollover_cycles = 0,
    token_last_drip_date = NOW(),
    storage_quota_gb = 100
  WHERE user_id = p_user_id;
  
  -- Record in token_transactions (legacy - only if table and basic columns exist)
  -- Note: This will work with whatever columns exist in your token_transactions table
  BEGIN
    INSERT INTO token_transactions (
      user_id,
      token_amount,
      balance_before,
      balance_after,
      created_at
    ) VALUES (
      p_user_id,
      v_grant_amount,
      v_current_balance,
      v_new_balance,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If insert fails (missing columns), just skip it
    NULL;
  END;
  
  -- Also record in token_usage (unified)
  INSERT INTO token_usage (
    user_id,
    action_type,
    model_used,
    tokens_used,
    input_tokens,
    output_tokens,
    cost_estimate,
    success,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'subscription_grant',
    'subscription',
    v_grant_amount,
    0,
    0,
    0,
    true,
    jsonb_build_object(
      'subscription_id', p_subscription_id,
      'plan', 'vision_pro_annual',
      'grant_type', 'full_year_upfront',
      'balance_before', v_current_balance,
      'balance_after', v_new_balance
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', v_grant_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance
  );
END;
$$;


ALTER FUNCTION "public"."grant_annual_tokens"("p_user_id" "uuid", "p_subscription_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."grant_annual_tokens"("p_user_id" "uuid", "p_subscription_id" "uuid") IS 'Grant 5M tokens immediately for annual subscriptions';



CREATE OR REPLACE FUNCTION "public"."grant_trial_tokens"("p_user_id" "uuid", "p_trial_amount" integer DEFAULT 100000) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  SELECT COALESCE(vibe_assistant_tokens_remaining, 0)
  INTO v_current_balance
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  v_new_balance := v_current_balance + p_trial_amount;
  
  UPDATE user_profiles
  SET 
    vibe_assistant_tokens_remaining = v_new_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  INSERT INTO token_usage (
    user_id,
    action_type,
    model_used,
    tokens_used,
    input_tokens,
    output_tokens,
    cost_estimate,
    success,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'trial_grant',
    'trial',
    p_trial_amount,
    0,
    0,
    0,
    true,
    jsonb_build_object(
      'grant_type', 'trial',
      'balance_before', v_current_balance,
      'balance_after', v_new_balance
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'granted', p_trial_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance
  );
END;
$$;


ALTER FUNCTION "public"."grant_trial_tokens"("p_user_id" "uuid", "p_trial_amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_ai_usage"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_ai_calls, total_tokens_used, estimated_ai_cost)
  VALUES (p_user_id, 1, p_tokens, p_cost)
  ON CONFLICT (user_id) DO UPDATE SET
    total_ai_calls = user_stats.total_ai_calls + 1,
    total_tokens_used = user_stats.total_tokens_used + p_tokens,
    estimated_ai_cost = user_stats.estimated_ai_cost + p_cost,
    updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."increment_ai_usage"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_journal_stats"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_last_date DATE;
  v_streak INTEGER;
BEGIN
  SELECT last_journal_date, journal_streak
  INTO v_last_date, v_streak
  FROM user_stats
  WHERE user_id = p_user_id;
  
  IF v_last_date IS NULL THEN
    v_streak := 1;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := v_streak + 1;
  ELSIF v_last_date < CURRENT_DATE THEN
    v_streak := 1;
  END IF;
  
  INSERT INTO user_stats (user_id, total_journal_entries, journal_streak, last_journal_date)
  VALUES (p_user_id, 1, v_streak, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_journal_entries = user_stats.total_journal_entries + 1,
    journal_streak = v_streak,
    last_journal_date = CURRENT_DATE,
    updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."increment_journal_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_vision_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.vision_progress (user_id, vision_id, total_categories)
  values (new.user_id, new.id, 12)
  on conflict (vision_id) do nothing;
  
  return new;
end;
$$;


ALTER FUNCTION "public"."initialize_vision_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_monthly_vibe_assistant_allowances"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    reset_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Find users whose monthly reset date has passed
    FOR user_record IN 
        SELECT 
            p.user_id,
            COALESCE(mt.monthly_vibe_assistant_tokens, 100) as monthly_tokens
        FROM profiles p
        LEFT JOIN membership_tiers mt ON p.membership_tier_id = mt.id
        WHERE p.vibe_assistant_monthly_reset_date < CURRENT_TIMESTAMP
    LOOP
        -- Reset tokens for this user
        UPDATE profiles 
        SET 
            vibe_assistant_tokens_remaining = user_record.monthly_tokens,
            vibe_assistant_tokens_used = 0,
            vibe_assistant_total_cost = 0.00,
            vibe_assistant_monthly_reset_date = CURRENT_TIMESTAMP + INTERVAL '1 month',
            vibe_assistant_allowance_reset_count = vibe_assistant_allowance_reset_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = user_record.user_id;
        
        reset_count := reset_count + 1;
    END LOOP;
    
    RETURN reset_count;
END;
$$;


ALTER FUNCTION "public"."reset_monthly_vibe_assistant_allowances"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reset_monthly_vibe_assistant_allowances"() IS 'Resets monthly allowances for all eligible users';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_updated_at"() IS 'Sets updated_at timestamp to now() before update triggers.';



CREATE OR REPLACE FUNCTION "public"."set_version_active"("p_profile_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Check if the profile exists and belongs to the user
  SELECT EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = p_profile_id AND user_id = p_user_id
  ) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RETURN false;
  END IF;
  
  -- Deactivate all other active versions for this user
  UPDATE user_profiles 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true AND is_draft = false;
  
  -- Set the specified version as active
  UPDATE user_profiles 
  SET is_active = true, is_draft = false, updated_at = NOW()
  WHERE id = p_profile_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."set_version_active"("p_profile_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_version_active"("p_profile_id" "uuid", "p_user_id" "uuid") IS 'Sets a version as active and deactivates others';



CREATE OR REPLACE FUNCTION "public"."update_assessment_scores"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_category_score INTEGER;
  v_green_line_status green_line_status;
  v_total_score INTEGER;
  v_category_scores JSONB;
  v_green_line_statuses JSONB;
  v_category_key TEXT;
BEGIN
  -- Get the assessment_id from the new or old row
  IF TG_OP = 'DELETE' THEN
    v_category_key := OLD.assessment_id::TEXT;
  ELSE
    v_category_key := NEW.assessment_id::TEXT;
  END IF;
  
  -- Recalculate all category scores for this assessment
  v_category_scores := '{}'::JSONB;
  v_green_line_statuses := '{}'::JSONB;
  v_total_score := 0;
  
  -- Loop through each category
  FOR v_category_key IN 
    SELECT DISTINCT category::TEXT 
    FROM assessment_responses 
    WHERE assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id)
  LOOP
    -- Calculate category score
    SELECT calculate_category_score(
      COALESCE(NEW.assessment_id, OLD.assessment_id),
      v_category_key::assessment_category
    ) INTO v_category_score;
    
    -- Get Green Line status
    v_green_line_status := get_green_line_status(v_category_score);
    
    -- Add to JSONB objects
    v_category_scores := v_category_scores || jsonb_build_object(v_category_key, v_category_score);
    v_green_line_statuses := v_green_line_statuses || jsonb_build_object(v_category_key, v_green_line_status);
    v_total_score := v_total_score + v_category_score;
  END LOOP;
  
  -- Update the assessment_results table
  UPDATE assessment_results
  SET 
    category_scores = v_category_scores,
    green_line_status = v_green_line_statuses,
    total_score = v_total_score,
    overall_percentage = ROUND((v_total_score::NUMERIC / max_possible_score::NUMERIC) * 100),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.assessment_id, OLD.assessment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_assessment_scores"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_assessment_scores"() IS 'Automatically updates assessment totals when responses change';



CREATE OR REPLACE FUNCTION "public"."update_assessment_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_assessment_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_blueprint_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the blueprint's progress percentage
    UPDATE actualization_blueprints
    SET 
        progress_percentage = calculate_blueprint_progress(NEW.blueprint_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.blueprint_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_blueprint_progress"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_blueprint_progress"() IS 'Automatically updates blueprint progress when tasks change';



CREATE OR REPLACE FUNCTION "public"."update_conversation_session"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update the conversation session's last_message_at and message_count
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversation_sessions
    SET 
      updated_at = NOW(),
      last_message_at = NEW.created_at,
      message_count = (
        SELECT COUNT(*) 
        FROM ai_conversations 
        WHERE conversation_id = NEW.conversation_id
      )
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_session"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_generated_images_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_generated_images_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_stats"("user_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update user stats table if it exists
  INSERT INTO user_stats (user_id, profiles_created, last_profile_update)
  VALUES (user_uuid, 1, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    profiles_created = user_stats.profiles_created + 1,
    last_profile_update = NOW();
END;
$$;


ALTER FUNCTION "public"."update_profile_stats"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vibrational_links_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_vibrational_links_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vision_progress_on_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Only proceed if conversation was just completed
  if new.completed_at is not null and (old.completed_at is null or old.completed_at is distinct from new.completed_at) then
    -- Update vision_progress
    update public.vision_progress
    set 
      categories_completed = array_append(
        array_remove(categories_completed, new.category), 
        new.category
      ),
      last_activity = now(),
      completed_at = case 
        when array_length(array_append(array_remove(categories_completed, new.category), new.category), 1) = total_categories 
        then now() 
        else null 
      end
    where vision_id = new.vision_id;
    
    -- Update vision_versions conversation count
    update public.vision_versions
    set conversation_count = (
      select count(*) 
      from public.vision_conversations 
      where vision_id = new.vision_id and completed_at is not null
    )
    where id = new.vision_id;
  end if;
  
  return new;
end;
$$;


ALTER FUNCTION "public"."update_vision_progress_on_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vision_refinement_tracking"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update vision_versions table with refinement info
    UPDATE vision_versions 
    SET 
        vibe_assistant_refinements_count = vibe_assistant_refinements_count + 1,
        last_vibe_assistant_refinement = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.vision_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_vision_refinement_tracking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upload_to_s3"("file_path" "text", "file_data" "text", "content_type" "text", "bucket_name" "text" DEFAULT 'vibration-fit-client-storage'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a placeholder implementation
  -- In production, you would need to:
  -- 1. Install the AWS SDK extension in Supabase
  -- 2. Configure AWS credentials
  -- 3. Implement actual S3 upload logic
  
  -- For now, we'll just return success
  -- The actual S3 upload would happen here using AWS SDK
  
  result := json_build_object(
    'success', true,
    'message', 'File uploaded successfully (placeholder)',
    'path', file_path,
    'bucket', bucket_name
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."upload_to_s3"("file_path" "text", "file_data" "text", "content_type" "text", "bucket_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_feature"("p_user_id" "uuid", "p_feature" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_tier membership_tiers;
BEGIN
  v_tier := get_user_tier(p_user_id);
  
  -- Check if feature is in the tier's features array
  RETURN v_tier.features @> to_jsonb(ARRAY[p_feature]);
END;
$$;


ALTER FUNCTION "public"."user_has_feature"("p_user_id" "uuid", "p_feature" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_has_feature"("p_user_id" "uuid", "p_feature" "text") IS 'Checks if user has access to a specific feature';



CREATE TABLE IF NOT EXISTS "public"."abundance_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "value_type" "text" NOT NULL,
    "amount" numeric(12,2),
    "vision_category" "text",
    "entry_category" "text",
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "abundance_events_value_type_check" CHECK (("value_type" = ANY (ARRAY['money'::"text", 'value'::"text"])))
);


ALTER TABLE "public"."abundance_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."actualization_blueprints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vision_id" "uuid",
    "vision_board_item_id" "uuid",
    "title" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(100) NOT NULL,
    "priority_level" character varying(50) DEFAULT 'medium'::character varying,
    "ai_analysis" "text",
    "opportunity_summary" "text",
    "success_metrics" "text",
    "potential_challenges" "text",
    "recommended_timeline" character varying(100),
    "phases" "jsonb",
    "resources_needed" "jsonb",
    "milestones" "jsonb",
    "status" character varying(50) DEFAULT 'draft'::character varying,
    "progress_percentage" integer DEFAULT 0,
    "current_phase" integer DEFAULT 1,
    "linked_journal_entries" "uuid"[],
    "linked_vision_board_items" "uuid"[],
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "actualization_blueprints_priority_level_check" CHECK ((("priority_level")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "actualization_blueprints_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100))),
    CONSTRAINT "actualization_blueprints_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'paused'::character varying, 'completed'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."actualization_blueprints" OWNER TO "postgres";


COMMENT ON TABLE "public"."actualization_blueprints" IS 'AI-generated action plans to help users actualize their visions';



COMMENT ON COLUMN "public"."actualization_blueprints"."phases" IS 'JSON array of phases with tasks, timelines, and resources';



COMMENT ON COLUMN "public"."actualization_blueprints"."resources_needed" IS 'JSON array of people, places, tools, skills, and financial resources';



COMMENT ON COLUMN "public"."actualization_blueprints"."milestones" IS 'JSON array of key checkpoints and celebration points';



CREATE TABLE IF NOT EXISTS "public"."ai_action_token_overrides" (
    "action_type" "text" NOT NULL,
    "token_value" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_action_token_overrides_token_value_check" CHECK (("token_value" >= 0))
);


ALTER TABLE "public"."ai_action_token_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "message" "text" NOT NULL,
    "context_used" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "context" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_conversations" IS 'Stores individual chat messages between users and VIVA';



COMMENT ON COLUMN "public"."ai_conversations"."conversation_id" IS 'Links messages to a conversation session (nullable for backward compatibility)';



CREATE TABLE IF NOT EXISTS "public"."ai_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feature" "text" NOT NULL,
    "model" "text" NOT NULL,
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "total_tokens" integer,
    "estimated_cost" numeric(10,4),
    "related_entity_type" "text",
    "related_entity_id" "uuid",
    "request_data" "jsonb",
    "response_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "category" "public"."assessment_category" NOT NULL,
    "insight_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "confidence_score" numeric(3,2),
    "supporting_responses" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "assessment_insights_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric)))
);


ALTER TABLE "public"."assessment_insights" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment_insights" IS 'VIVA-generated insights based on assessment responses';



CREATE TABLE IF NOT EXISTS "public"."assessment_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "question_id" "text" NOT NULL,
    "question_text" "text" NOT NULL,
    "category" "public"."assessment_category" NOT NULL,
    "response_value" integer NOT NULL,
    "response_text" "text" NOT NULL,
    "response_emoji" "text",
    "green_line" "text" NOT NULL,
    "answered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_custom_response" boolean DEFAULT false,
    "ai_green_line" "text",
    "custom_response_value" integer,
    CONSTRAINT "assessment_responses_ai_green_line_check" CHECK (("ai_green_line" = ANY (ARRAY['above'::"text", 'neutral'::"text", 'below'::"text"]))),
    CONSTRAINT "assessment_responses_green_line_check" CHECK (("green_line" = ANY (ARRAY['above'::"text", 'neutral'::"text", 'below'::"text"])))
);


ALTER TABLE "public"."assessment_responses" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment_responses" IS 'Individual question responses for each assessment';



COMMENT ON COLUMN "public"."assessment_responses"."response_value" IS 'Numerical value of the response (0 for custom responses, 2, 4, 6, 8, or 10 for regular responses)';



COMMENT ON COLUMN "public"."assessment_responses"."green_line" IS 'Green Line classification of this specific response (above/neutral/below)';



COMMENT ON COLUMN "public"."assessment_responses"."is_custom_response" IS 'True if this response was a custom text response scored by AI';



COMMENT ON COLUMN "public"."assessment_responses"."ai_green_line" IS 'AI-determined Green Line status for custom responses';



CREATE TABLE IF NOT EXISTS "public"."assessment_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "profile_version_id" "uuid",
    "status" "public"."assessment_status" DEFAULT 'not_started'::"public"."assessment_status" NOT NULL,
    "total_score" integer DEFAULT 0,
    "max_possible_score" integer DEFAULT 840,
    "overall_percentage" integer DEFAULT 0,
    "category_scores" "jsonb" DEFAULT '{}'::"jsonb",
    "green_line_status" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assessment_version" integer DEFAULT 1,
    "notes" "text",
    "is_active" boolean DEFAULT false NOT NULL,
    "is_draft" boolean DEFAULT false NOT NULL,
    CONSTRAINT "valid_scores" CHECK ((("total_score" >= 0) AND ("total_score" <= "max_possible_score")))
);


ALTER TABLE "public"."assessment_results" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment_results" IS 'Stores vibrational assessment results across all 12 life categories';



COMMENT ON COLUMN "public"."assessment_results"."category_scores" IS 'JSONB object with scores for each category (0-70 points each)';



COMMENT ON COLUMN "public"."assessment_results"."green_line_status" IS 'JSONB object with Green Line status for each category (above/transition/below)';



COMMENT ON COLUMN "public"."assessment_results"."assessment_version" IS 'Version of assessment questions used (for tracking changes over time)';



CREATE TABLE IF NOT EXISTS "public"."audio_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vision_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "variant" "text",
    "voice_id" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audio_sets" OWNER TO "postgres";


COMMENT ON TABLE "public"."audio_sets" IS 'Audio version sets for life visions - allows multiple audio variants per vision';



COMMENT ON COLUMN "public"."audio_sets"."variant" IS 'Type of audio variant (standard, sleep, energy, meditation, etc.)';



COMMENT ON COLUMN "public"."audio_sets"."metadata" IS 'Additional metadata like background music, tempo, fade effects, etc.';



CREATE TABLE IF NOT EXISTS "public"."audio_tracks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vision_id" "uuid" NOT NULL,
    "section_key" "text" NOT NULL,
    "content_hash" "text" NOT NULL,
    "text_content" "text" NOT NULL,
    "voice_id" "text" NOT NULL,
    "s3_bucket" "text" NOT NULL,
    "s3_key" "text" NOT NULL,
    "audio_url" "text" NOT NULL,
    "duration_seconds" integer,
    "status" "public"."audio_generation_status" DEFAULT 'pending'::"public"."audio_generation_status" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "audio_set_id" "uuid" NOT NULL,
    "mix_status" "text" DEFAULT 'not_required'::"text",
    "mixed_audio_url" "text",
    "mixed_s3_key" "text",
    CONSTRAINT "audio_tracks_mix_status_check" CHECK (("mix_status" = ANY (ARRAY['not_required'::"text", 'pending'::"text", 'mixing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."audio_tracks" OWNER TO "postgres";


COMMENT ON TABLE "public"."audio_tracks" IS 'AI-narrated audio tracks for life visions (per section)';



COMMENT ON COLUMN "public"."audio_tracks"."section_key" IS 'Section identity (2 meta + 12 categories)';



COMMENT ON COLUMN "public"."audio_tracks"."content_hash" IS 'SHA-256 of normalized text content for regeneration control';



COMMENT ON COLUMN "public"."audio_tracks"."audio_set_id" IS 'References the audio_set this track belongs to';



COMMENT ON COLUMN "public"."audio_tracks"."mix_status" IS 'Status of background mixing: not_required, pending, mixing, completed, failed';



CREATE TABLE IF NOT EXISTS "public"."audio_variants" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "voice_volume" integer DEFAULT 50 NOT NULL,
    "bg_volume" integer DEFAULT 50 NOT NULL,
    "background_track" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "audio_variants_check" CHECK ((("voice_volume" + "bg_volume") = 100))
);


ALTER TABLE "public"."audio_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blueprint_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "blueprint_id" "uuid",
    "insight_type" character varying(100) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "confidence_level" character varying(50) DEFAULT 'medium'::character varying,
    "ai_reasoning" "text",
    "supporting_evidence" "text",
    "recommended_actions" "text",
    "status" character varying(50) DEFAULT 'new'::character varying,
    "reviewed_at" timestamp with time zone,
    "acted_upon_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blueprint_insights_confidence_level_check" CHECK ((("confidence_level")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::"text"[]))),
    CONSTRAINT "blueprint_insights_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['new'::character varying, 'reviewed'::character varying, 'acted_upon'::character varying, 'dismissed'::character varying])::"text"[])))
);


ALTER TABLE "public"."blueprint_insights" OWNER TO "postgres";


COMMENT ON TABLE "public"."blueprint_insights" IS 'AI-generated insights about opportunities, challenges, and resources';



CREATE TABLE IF NOT EXISTS "public"."blueprint_phases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blueprint_id" "uuid" NOT NULL,
    "phase_number" integer NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "estimated_duration" character varying(100),
    "objectives" "text"[],
    "tasks" "jsonb",
    "resources" "jsonb",
    "success_criteria" "text",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blueprint_phases_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'skipped'::character varying])::"text"[])))
);


ALTER TABLE "public"."blueprint_phases" OWNER TO "postgres";


COMMENT ON TABLE "public"."blueprint_phases" IS 'Phases within a blueprint with specific objectives and timelines';



CREATE TABLE IF NOT EXISTS "public"."blueprint_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blueprint_id" "uuid" NOT NULL,
    "phase_id" "uuid",
    "title" character varying(255) NOT NULL,
    "description" "text",
    "task_type" character varying(50) DEFAULT 'action'::character varying,
    "priority" character varying(50) DEFAULT 'medium'::character varying,
    "estimated_effort" character varying(100),
    "resources_needed" "text"[],
    "instructions" "text",
    "success_criteria" "text",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "progress_percentage" integer DEFAULT 0,
    "linked_journal_entry_id" "uuid",
    "linked_vision_board_item_id" "uuid",
    "due_date" "date",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blueprint_tasks_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "blueprint_tasks_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100))),
    CONSTRAINT "blueprint_tasks_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'skipped'::character varying, 'blocked'::character varying])::"text"[]))),
    CONSTRAINT "blueprint_tasks_task_type_check" CHECK ((("task_type")::"text" = ANY ((ARRAY['action'::character varying, 'research'::character varying, 'connection'::character varying, 'preparation'::character varying, 'celebration'::character varying])::"text"[])))
);


ALTER TABLE "public"."blueprint_tasks" OWNER TO "postgres";


COMMENT ON TABLE "public"."blueprint_tasks" IS 'Individual actionable tasks within blueprint phases';



CREATE TABLE IF NOT EXISTS "public"."conversation_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "mode" "text" DEFAULT 'master'::"text",
    "preview_message" "text",
    "message_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_message_at" timestamp with time zone,
    "category" "text",
    "vision_id" "uuid"
);


ALTER TABLE "public"."conversation_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_sessions" IS 'Groups messages into conversations with metadata';



COMMENT ON COLUMN "public"."conversation_sessions"."mode" IS 'Type of conversation: master, refinement, vision_build, etc.';



COMMENT ON COLUMN "public"."conversation_sessions"."category" IS 'The vision category this conversation is about';



COMMENT ON COLUMN "public"."conversation_sessions"."vision_id" IS 'The vision this conversation is refining';



CREATE TABLE IF NOT EXISTS "public"."daily_papers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entry_date" "date" NOT NULL,
    "gratitude" "text" DEFAULT ''::"text" NOT NULL,
    "task_one" "text" DEFAULT ''::"text" NOT NULL,
    "task_two" "text" DEFAULT ''::"text" NOT NULL,
    "task_three" "text" DEFAULT ''::"text" NOT NULL,
    "fun_plan" "text" DEFAULT ''::"text" NOT NULL,
    "attachment_url" "text",
    "attachment_key" "text",
    "attachment_content_type" "text",
    "attachment_size" bigint,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_papers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emotional_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "current_valence" "text" NOT NULL,
    "trending_direction" "text" NOT NULL,
    "avg_intensity" numeric,
    "dominant_essence_words" "text"[] DEFAULT ARRAY[]::"text"[],
    "primary_essence" "text",
    "last_event_at" timestamp with time zone,
    "event_count_7d" integer DEFAULT 0,
    "event_count_30d" integer DEFAULT 0,
    "last_scene_id" "uuid",
    "last_vision_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "emotional_snapshots_current_valence_check" CHECK (("current_valence" = ANY (ARRAY['below_green_line'::"text", 'near_green_line'::"text", 'above_green_line'::"text"]))),
    CONSTRAINT "emotional_snapshots_trending_direction_check" CHECK (("trending_direction" = ANY (ARRAY['up'::"text", 'down'::"text", 'stable'::"text"])))
);


ALTER TABLE "public"."emotional_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."frequency_flip" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "input_text" "text" NOT NULL,
    "clarity_seed" "text" NOT NULL,
    "essence" "text",
    "sensory_anchor" "text",
    "embodiment_line" "text",
    "surrender_line" "text",
    "category" "text",
    "vision_id" "uuid",
    "scene_context" "text",
    "mode" "text" DEFAULT 'flip'::"text" NOT NULL,
    "unchanged" boolean DEFAULT false,
    "voice_notes" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."frequency_flip" OWNER TO "postgres";


COMMENT ON TABLE "public"."frequency_flip" IS 'Stores flipped clarity seeds from frequency_flip microprompt';



COMMENT ON COLUMN "public"."frequency_flip"."input_text" IS 'Original contrast/lack language from user';



COMMENT ON COLUMN "public"."frequency_flip"."clarity_seed" IS 'Flipped present-tense, first-person, positive ideal-state phrase';



COMMENT ON COLUMN "public"."frequency_flip"."essence" IS 'One word or short phrase capturing the essence (e.g., Freedom, Ease, Joy)';



COMMENT ON COLUMN "public"."frequency_flip"."sensory_anchor" IS 'Optional single concrete detail in user voice';



COMMENT ON COLUMN "public"."frequency_flip"."embodiment_line" IS 'Optional "I live it now" line in user voice';



COMMENT ON COLUMN "public"."frequency_flip"."surrender_line" IS 'Optional grounded thank-you/allowing line';



COMMENT ON COLUMN "public"."frequency_flip"."mode" IS 'Mode used: flip, flip+enrich, or batch';



COMMENT ON COLUMN "public"."frequency_flip"."unchanged" IS 'True if input was already aligned (no flip needed)';



CREATE TABLE IF NOT EXISTS "public"."generated_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "s3_key" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text" DEFAULT 'image/png'::"text",
    "prompt" "text" NOT NULL,
    "revised_prompt" "text",
    "style_used" "text",
    "size" "text" DEFAULT '1024x1024'::"text",
    "quality" "text" DEFAULT 'standard'::"text",
    "context" "text" DEFAULT 'vision_board'::"text",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "used_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "is_used" boolean DEFAULT false,
    "is_expired" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."generated_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intensive_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_payment_intent_id" "text",
    "stripe_checkout_session_id" "text",
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text",
    "payment_plan" "text" DEFAULT 'full'::"text" NOT NULL,
    "installments_total" integer DEFAULT 1,
    "installments_paid" integer DEFAULT 0,
    "next_installment_date" timestamp without time zone,
    "completion_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "activation_deadline" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "started_at" timestamp without time zone,
    "completed_at" timestamp without time zone,
    "refunded_at" timestamp without time zone,
    CONSTRAINT "valid_completion_status" CHECK (("completion_status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "valid_payment_plan" CHECK (("payment_plan" = ANY (ARRAY['full'::"text", '2pay'::"text", '3pay'::"text"])))
);


ALTER TABLE "public"."intensive_purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."intensive_purchases" IS '$499 Vision Activation Intensive purchase tracking';



CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "title" "text",
    "content" "text" NOT NULL,
    "categories" "text"[],
    "image_urls" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "audio_recordings" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "thumbnail_urls" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."journal_entries" OWNER TO "postgres";


COMMENT ON COLUMN "public"."journal_entries"."audio_recordings" IS 'Array of audio/video recordings with metadata: [{ url, transcript, type, category, created_at }]';



COMMENT ON COLUMN "public"."journal_entries"."thumbnail_urls" IS 'Array of thumbnail URLs for videos in the entry';



CREATE TABLE IF NOT EXISTS "public"."life_vision_category_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" character varying(50) NOT NULL,
    "transcript" "text",
    "ai_summary" "text",
    "ideal_state" "text",
    "blueprint_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "life_vision_category_state_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['fun'::character varying, 'health'::character varying, 'travel'::character varying, 'love'::character varying, 'family'::character varying, 'social'::character varying, 'home'::character varying, 'work'::character varying, 'money'::character varying, 'stuff'::character varying, 'giving'::character varying, 'spirituality'::character varying])::"text"[])))
);


ALTER TABLE "public"."life_vision_category_state" OWNER TO "postgres";


COMMENT ON TABLE "public"."life_vision_category_state" IS 'V3 Life Vision per-category state storage';



COMMENT ON COLUMN "public"."life_vision_category_state"."transcript" IS 'Step 1: User audio/text transcript';



COMMENT ON COLUMN "public"."life_vision_category_state"."ai_summary" IS 'Step 1: VIVA-generated category summary';



COMMENT ON COLUMN "public"."life_vision_category_state"."ideal_state" IS 'Step 2: User imagination/ideal state answers';



COMMENT ON COLUMN "public"."life_vision_category_state"."blueprint_data" IS 'Step 3: Being/Doing/Receiving loops as JSONB';



CREATE TABLE IF NOT EXISTS "public"."media_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "bucket" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "public_url" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" "text",
    "folder" "text",
    "category" "text",
    "tags" "text"[],
    "title" "text",
    "description" "text",
    "alt_text" "text",
    "view_count" integer DEFAULT 0,
    "last_accessed" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "media_metadata_file_type_check" CHECK (("file_type" = ANY (ARRAY['image'::"text", 'audio'::"text", 'video'::"text"]))),
    CONSTRAINT "valid_user_or_site_content" CHECK ((("user_id" IS NOT NULL) OR ("bucket" = ANY (ARRAY['site-assets'::"text", 'immersion-tracks'::"text", 'tutorial-videos'::"text", 'default-images'::"text"]))))
);


ALTER TABLE "public"."media_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date_of_birth" "date",
    "gender" "text",
    "ethnicity" "text",
    "profile_picture_url" "text",
    "relationship_status" "text",
    "relationship_length" "text",
    "has_children" boolean,
    "children_count" integer,
    "children_ages" "text"[],
    "units" "text",
    "height" numeric,
    "weight" numeric,
    "exercise_frequency" "text",
    "living_situation" "text",
    "time_at_location" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "country" "text",
    "employment_type" "text",
    "occupation" "text",
    "company_name" "text",
    "time_in_role" "text",
    "currency" "text",
    "household_income" "text",
    "savings_retirement" "text",
    "assets_equity" "text",
    "consumer_debt" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."member_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "stripe_payment_intent_id" "text",
    "stripe_invoice_id" "text",
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "status" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."payment_history" IS 'Records all payment transactions';



CREATE TABLE IF NOT EXISTS "public"."profile_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "profile_data" "jsonb" NOT NULL,
    "completion_percentage" integer DEFAULT 0,
    "is_draft" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profile_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "membership_level" "text" DEFAULT 'free'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "vibe_assistant_tokens_used" integer DEFAULT 0,
    "vibe_assistant_tokens_remaining" integer DEFAULT 0,
    "vibe_assistant_monthly_reset_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "vibe_assistant_total_cost" numeric(10,4) DEFAULT 0.00,
    "membership_tier_id" "uuid",
    "vibe_assistant_allowance_reset_count" integer DEFAULT 0
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."vibe_assistant_tokens_used" IS 'Total tokens consumed by user this month';



COMMENT ON COLUMN "public"."profiles"."vibe_assistant_tokens_remaining" IS 'Remaining tokens available this month';



COMMENT ON COLUMN "public"."profiles"."vibe_assistant_monthly_reset_date" IS 'Date when monthly allowances reset';



COMMENT ON COLUMN "public"."profiles"."vibe_assistant_total_cost" IS 'Total cost incurred this month in USD';



CREATE TABLE IF NOT EXISTS "public"."prompt_suggestions_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_key" "text" NOT NULL,
    "profile_id" "uuid",
    "assessment_id" "uuid",
    "suggestions" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prompt_suggestions_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."prompt_suggestions_cache" IS 'Caches AI-generated prompt suggestions for life vision categories to avoid regeneration on every page load';



COMMENT ON COLUMN "public"."prompt_suggestions_cache"."category_key" IS 'Life vision category key (e.g., fun, health, love)';



COMMENT ON COLUMN "public"."prompt_suggestions_cache"."profile_id" IS 'Active profile ID when suggestions were generated (NULL if no profile)';



COMMENT ON COLUMN "public"."prompt_suggestions_cache"."assessment_id" IS 'Latest assessment ID when suggestions were generated (NULL if no assessment)';



COMMENT ON COLUMN "public"."prompt_suggestions_cache"."suggestions" IS 'JSON object with peakExperiences, whatFeelsAmazing, whatFeelsBad prompts';



CREATE TABLE IF NOT EXISTS "public"."refinements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vision_id" "uuid",
    "category" character varying(50) NOT NULL,
    "operation_type" character varying(50) NOT NULL,
    "input_text" "text",
    "output_text" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "viva_notes" "text",
    "migrated_to_v3" boolean DEFAULT false
);


ALTER TABLE "public"."refinements" OWNER TO "postgres";


COMMENT ON TABLE "public"."refinements" IS 'LEGACY: Old vibe-assistant operations. V3 data moved to life_vision_category_state. Cleaned 2025-11-11 (removed 16 deprecated columns)';



COMMENT ON COLUMN "public"."refinements"."category" IS 'Life category being refined: health, money, family, etc.';



COMMENT ON COLUMN "public"."refinements"."operation_type" IS 'Type of operation: refine_vision, generate_guidance, analyze_alignment';



COMMENT ON COLUMN "public"."refinements"."viva_notes" IS 'VIVA Notes: AI explanation of refinement reasoning and approach';



COMMENT ON COLUMN "public"."refinements"."migrated_to_v3" IS 'TRUE if this row was migrated to life_vision_category_state';



CREATE TABLE IF NOT EXISTS "public"."refinements_backup_20251111" (
    "id" "uuid",
    "user_id" "uuid",
    "vision_id" "uuid",
    "category" character varying(50),
    "operation_type" character varying(50),
    "input_tokens" integer,
    "output_tokens" integer,
    "total_tokens" integer,
    "cost_usd" numeric(10,6),
    "refinement_percentage" integer,
    "tonality" character varying(50),
    "word_count_target" integer,
    "emotional_intensity" character varying(50),
    "instructions" "text",
    "input_text" "text",
    "output_text" "text",
    "processing_time_ms" integer,
    "success" boolean,
    "error_message" "text",
    "created_at" timestamp with time zone,
    "viva_notes" "text",
    "transcript" "text",
    "ai_summary" "text",
    "ideal_state" "text",
    "blueprint_data" "jsonb",
    "migrated_to_v3" boolean
);


ALTER TABLE "public"."refinements_backup_20251111" OWNER TO "postgres";


COMMENT ON TABLE "public"."refinements_backup_20251111" IS 'Backup before dropping deprecated columns';



CREATE TABLE IF NOT EXISTS "public"."scenes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "text" "text" NOT NULL,
    "essence_word" "text",
    "emotional_valence" "text" NOT NULL,
    "created_from" "text" NOT NULL,
    "related_vision_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "scenes_created_from_check" CHECK (("created_from" = ANY (ARRAY['ai_suggested'::"text", 'user_written'::"text", 'hybrid'::"text"]))),
    CONSTRAINT "scenes_emotional_valence_check" CHECK (("emotional_valence" = ANY (ARRAY['below_green_line'::"text", 'near_green_line'::"text", 'above_green_line'::"text"])))
);


ALTER TABLE "public"."scenes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."token_drips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "drip_amount" integer NOT NULL,
    "drip_date" timestamp without time zone DEFAULT "now"(),
    "cycle_number" integer NOT NULL,
    "rollover_from_previous" integer DEFAULT 0,
    "rollover_cycles_count" integer DEFAULT 0,
    "expired_tokens" integer DEFAULT 0,
    "balance_before" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "billing_period_start" timestamp without time zone,
    "billing_period_end" timestamp without time zone,
    "metadata" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."token_drips" OWNER TO "postgres";


COMMENT ON TABLE "public"."token_drips" IS 'Tracks token dripping for 28-day plans with rollover logic';



CREATE TABLE IF NOT EXISTS "public"."token_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action_type" "public"."token_action_type" NOT NULL,
    "tokens_used" integer NOT NULL,
    "tokens_remaining" integer NOT NULL,
    "estimated_cost_usd" numeric(10,6),
    "openai_model" "text",
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "amount_paid_cents" integer,
    "currency" "text" DEFAULT 'USD'::"text",
    "stripe_payment_intent_id" "text",
    "stripe_session_id" "text",
    "subscription_id" "uuid",
    "token_pack_id" "text",
    "notes" "text",
    "created_by" "uuid"
);


ALTER TABLE "public"."token_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."token_transactions" IS 'Tracks all AI token usage with real OpenAI costs for precise COGS measurement';



COMMENT ON COLUMN "public"."token_transactions"."tokens_used" IS 'Actual tokens used (positive) or granted (negative for grants)';



COMMENT ON COLUMN "public"."token_transactions"."estimated_cost_usd" IS 'Real OpenAI API cost in USD for analytics';



COMMENT ON COLUMN "public"."token_transactions"."metadata" IS 'Flexible JSONB for action-specific context';



CREATE TABLE IF NOT EXISTS "public"."token_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "model_used" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0 NOT NULL,
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "cost_estimate" numeric(10,4) DEFAULT 0,
    "success" boolean DEFAULT true NOT NULL,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "token_usage_action_type_check" CHECK (("action_type" = ANY (ARRAY['assessment_scoring'::"text", 'vision_generation'::"text", 'vision_refinement'::"text", 'blueprint_generation'::"text", 'chat_conversation'::"text", 'audio_generation'::"text", 'image_generation'::"text", 'transcription'::"text", 'admin_grant'::"text", 'admin_deduct'::"text", 'subscription_grant'::"text", 'trial_grant'::"text", 'token_pack_purchase'::"text", 'life_vision_category_summary'::"text", 'life_vision_master_assembly'::"text", 'prompt_suggestions'::"text", 'frequency_flip'::"text", 'vibrational_analysis'::"text", 'viva_scene_generation'::"text", 'north_star_reflection'::"text"])))
);


ALTER TABLE "public"."token_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."token_usage" IS 'Tracks AI token usage and costs for each user action';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "profile_picture_url" "text",
    "date_of_birth" "date",
    "gender" "text",
    "ethnicity" "text",
    "relationship_status" "text",
    "relationship_length" "text",
    "has_children" boolean DEFAULT false,
    "number_of_children" integer,
    "children_ages" "text"[],
    "units" "text" DEFAULT 'US'::"text",
    "height" numeric(5,2),
    "weight" numeric(6,2),
    "exercise_frequency" "text",
    "living_situation" "text",
    "time_at_location" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'United States'::"text",
    "employment_type" "text",
    "occupation" "text",
    "company" "text",
    "time_in_role" "text",
    "currency" "text" DEFAULT 'USD'::"text",
    "household_income" "text",
    "savings_retirement" "text",
    "assets_equity" "text",
    "consumer_debt" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "partner_name" "text",
    "version_notes" "text",
    "progress_photos" "text"[],
    "vibe_assistant_tokens_used" integer DEFAULT 0,
    "vibe_assistant_tokens_remaining" integer DEFAULT 0,
    "vibe_assistant_monthly_reset_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "vibe_assistant_total_cost" numeric(10,4) DEFAULT 0.00,
    "membership_tier_id" "uuid",
    "vibe_assistant_allowance_reset_count" integer DEFAULT 0,
    "clarity_love" "text",
    "clarity_family" "text",
    "clarity_work" "text",
    "clarity_money" "text",
    "clarity_home" "text",
    "clarity_health" "text",
    "clarity_fun" "text",
    "clarity_travel" "text",
    "clarity_social" "text",
    "clarity_stuff" "text",
    "clarity_giving" "text",
    "clarity_spirituality" "text",
    "ai_tags" "jsonb",
    "hobbies" "text"[] DEFAULT '{}'::"text"[],
    "leisure_time_weekly" "text",
    "travel_frequency" "public"."travel_frequency",
    "passport" boolean DEFAULT false NOT NULL,
    "countries_visited" integer DEFAULT 0 NOT NULL,
    "close_friends_count" "text",
    "social_preference" "public"."social_preference",
    "lifestyle_category" "public"."lifestyle_category",
    "primary_vehicle" "text",
    "spiritual_practice" "text",
    "meditation_frequency" "text",
    "personal_growth_focus" boolean DEFAULT false NOT NULL,
    "volunteer_status" "text",
    "charitable_giving" "text",
    "legacy_mindset" boolean DEFAULT false NOT NULL,
    "story_recordings" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "token_rollover_cycles" integer DEFAULT 0,
    "token_last_drip_date" timestamp without time zone,
    "auto_topup_enabled" boolean DEFAULT false,
    "auto_topup_pack_id" "text",
    "storage_quota_gb" integer DEFAULT 100,
    "version_number" integer DEFAULT 1,
    "is_draft" boolean DEFAULT false,
    "is_active" boolean DEFAULT false,
    "parent_version_id" "uuid",
    "education" "text",
    "education_description" "text",
    "contrast_fun" "text",
    "contrast_health" "text",
    "contrast_travel" "text",
    "contrast_love" "text",
    "contrast_family" "text",
    "contrast_social" "text",
    "contrast_home" "text",
    "contrast_work" "text",
    "contrast_money" "text",
    "contrast_stuff" "text",
    "contrast_giving" "text",
    "contrast_spirituality" "text",
    CONSTRAINT "user_profiles_assets_equity_check" CHECK (("assets_equity" = ANY (ARRAY['<10,000'::"text", '10,000-24,999'::"text", '25,000-49,999'::"text", '50,000-99,999'::"text", '100,000-249,999'::"text", '250,000-499,999'::"text", '500,000-999,999'::"text", '1,000,000+'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "user_profiles_consumer_debt_check" CHECK (("consumer_debt" = ANY (ARRAY['None'::"text", 'Under 10,000'::"text", '10,000-24,999'::"text", '25,000-49,999'::"text", '50,000-99,999'::"text", '100,000-249,999'::"text", '250,000-499,999'::"text", '500,000-999,999'::"text", '1,000,000+'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "user_profiles_countries_visited_check" CHECK (("countries_visited" >= 0)),
    CONSTRAINT "user_profiles_currency_check" CHECK (("currency" = ANY (ARRAY['USD'::"text", 'EUR'::"text", 'GBP'::"text", 'Other'::"text"]))),
    CONSTRAINT "user_profiles_education_check" CHECK (("education" = ANY (ARRAY['High School'::"text", 'Some College'::"text", 'Associate Degree'::"text", 'Bachelor''s Degree'::"text", 'Master''s Degree'::"text", 'Doctorate'::"text", 'Other'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "user_profiles_employment_type_check" CHECK (("employment_type" = ANY (ARRAY['Employee'::"text", 'Business Owner'::"text", 'Contractor/Freelancer'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "user_profiles_ethnicity_check" CHECK (("ethnicity" = ANY (ARRAY['Asian'::"text", 'Black'::"text", 'Hispanic'::"text", 'Middle Eastern'::"text", 'Multi-ethnic'::"text", 'Native American'::"text", 'Pacific Islander'::"text", 'White'::"text", 'Other'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "user_profiles_exercise_frequency_check" CHECK (("exercise_frequency" = ANY (ARRAY['None'::"text", '1-2x'::"text", '3-4x'::"text", '5+'::"text"]))),
    CONSTRAINT "user_profiles_gender_check" CHECK (("gender" = ANY (ARRAY['Male'::"text", 'Female'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "user_profiles_household_income_check" CHECK (("household_income" = ANY (ARRAY['<10,000'::"text", '10,000-24,999'::"text", '25,000-49,999'::"text", '50,000-99,999'::"text", '100,000-249,999'::"text", '250,000-499,999'::"text", '500,000-999,999'::"text", '1,000,000+'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "user_profiles_living_situation_check" CHECK (("living_situation" = ANY (ARRAY['Own'::"text", 'Rent'::"text", 'With family/friends'::"text", 'Other'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "user_profiles_number_of_children_check" CHECK ((("number_of_children" >= 0) AND ("number_of_children" <= 20))),
    CONSTRAINT "user_profiles_relationship_length_check" CHECK (("relationship_length" = ANY (ARRAY['1-6 months'::"text", '6-12 months'::"text", '12-18 months'::"text", '18-24 months'::"text", '2-3 years'::"text", '3-5 years'::"text", '5-10 years'::"text", '10+ years'::"text"]))),
    CONSTRAINT "user_profiles_relationship_status_check" CHECK (("relationship_status" = ANY (ARRAY['Single'::"text", 'In a Relationship'::"text", 'Married'::"text"]))),
    CONSTRAINT "user_profiles_savings_retirement_check" CHECK (("savings_retirement" = ANY (ARRAY['<10,000'::"text", '10,000-24,999'::"text", '25,000-49,999'::"text", '50,000-99,999'::"text", '100,000-249,999'::"text", '250,000-499,999'::"text", '500,000-999,999'::"text", '1,000,000+'::"text", 'Prefer not to say'::"text"]))),
    CONSTRAINT "user_profiles_time_at_location_check" CHECK (("time_at_location" = ANY (ARRAY['<3 months'::"text", '3-6 months'::"text", '6-12 months'::"text", '1-2 years'::"text", '2-3 years'::"text", '3-5 years'::"text", '5-10 years'::"text", '10+ years'::"text"]))),
    CONSTRAINT "user_profiles_time_in_role_check" CHECK (("time_in_role" = ANY (ARRAY['<3 months'::"text", '3-6 months'::"text", '6-12 months'::"text", '1-2 years'::"text", '2-3 years'::"text", '3-5 years'::"text", '5-10 years'::"text", '10+ years'::"text"]))),
    CONSTRAINT "user_profiles_units_check" CHECK (("units" = ANY (ARRAY['US'::"text", 'Metric'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_profiles" IS 'Versioned user profiles allowing multiple profiles per user (active + draft)';



COMMENT ON COLUMN "public"."user_profiles"."version_notes" IS 'Optional notes about this version';



COMMENT ON COLUMN "public"."user_profiles"."progress_photos" IS 'Array of URLs to progress photos (optional)';



COMMENT ON COLUMN "public"."user_profiles"."clarity_love" IS 'What''s going well in Love?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_family" IS 'What''s going well in Family?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_work" IS 'What''s going well in Work?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_money" IS 'What''s going well in Money?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_home" IS 'What''s going well in Home?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_health" IS 'What''s going well in Health?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_fun" IS 'What''s going well in Fun?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_travel" IS 'What''s going well in Travel?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_social" IS 'What''s going well in Social?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_stuff" IS 'What''s going well in Stuff?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_giving" IS 'What''s going well in Giving?';



COMMENT ON COLUMN "public"."user_profiles"."clarity_spirituality" IS 'What''s going well in Spirituality?';



COMMENT ON COLUMN "public"."user_profiles"."ai_tags" IS 'AI-generated tags from story fields for Viva context';



COMMENT ON COLUMN "public"."user_profiles"."hobbies" IS 'Array of current hobbies (free text)';



COMMENT ON COLUMN "public"."user_profiles"."leisure_time_weekly" IS 'Hours per week: 0-5, 6-15, 16-25, 25+';



COMMENT ON COLUMN "public"."user_profiles"."travel_frequency" IS 'Travel cadence: never, yearly, quarterly, monthly';



COMMENT ON COLUMN "public"."user_profiles"."passport" IS 'Has a valid passport';



COMMENT ON COLUMN "public"."user_profiles"."countries_visited" IS 'Total countries visited (current count)';



COMMENT ON COLUMN "public"."user_profiles"."close_friends_count" IS '0, 1-3, 4-8, 9+';



COMMENT ON COLUMN "public"."user_profiles"."social_preference" IS 'introvert, ambivert, extrovert';



COMMENT ON COLUMN "public"."user_profiles"."lifestyle_category" IS 'minimalist, moderate, comfortable, luxury';



COMMENT ON COLUMN "public"."user_profiles"."primary_vehicle" IS 'Primary vehicle type (free text)';



COMMENT ON COLUMN "public"."user_profiles"."spiritual_practice" IS 'none, religious, spiritual, secular';



COMMENT ON COLUMN "public"."user_profiles"."meditation_frequency" IS 'never, rarely, weekly, daily';



COMMENT ON COLUMN "public"."user_profiles"."personal_growth_focus" IS 'Actively focused on personal growth (current state)';



COMMENT ON COLUMN "public"."user_profiles"."volunteer_status" IS 'none, occasional, regular, frequent';



COMMENT ON COLUMN "public"."user_profiles"."charitable_giving" IS 'Annual amount: none, <500, 500-2000, 2000+';



COMMENT ON COLUMN "public"."user_profiles"."legacy_mindset" IS 'Thinks about legacy in day-to-day decisions (current state)';



COMMENT ON COLUMN "public"."user_profiles"."story_recordings" IS 'Array of story recordings with metadata: [{ url, transcript, type, category, created_at }]';



COMMENT ON COLUMN "public"."user_profiles"."token_rollover_cycles" IS 'Number of billing cycles tokens have been rolled over (max 3 for 28-day)';



COMMENT ON COLUMN "public"."user_profiles"."token_last_drip_date" IS 'Last time tokens were dripped for 28-day plan';



COMMENT ON COLUMN "public"."user_profiles"."auto_topup_enabled" IS 'Automatically purchase token pack when balance < 20%';



COMMENT ON COLUMN "public"."user_profiles"."auto_topup_pack_id" IS 'Which pack to auto-purchase: power, mega, or ultra';



COMMENT ON COLUMN "public"."user_profiles"."storage_quota_gb" IS 'Storage quota in GB based on plan';



COMMENT ON COLUMN "public"."user_profiles"."version_number" IS 'Sequential version number for this user';



COMMENT ON COLUMN "public"."user_profiles"."is_draft" IS 'True if this is a work-in-progress draft version';



COMMENT ON COLUMN "public"."user_profiles"."is_active" IS 'True if this is the current active version (only one per user)';



COMMENT ON COLUMN "public"."user_profiles"."parent_version_id" IS 'Reference to the version this was created from';



COMMENT ON COLUMN "public"."user_profiles"."contrast_fun" IS 'What''s not going well in Fun?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_health" IS 'What''s not going well in Health?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_travel" IS 'What''s not going well in Travel?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_love" IS 'What''s not going well in Love?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_family" IS 'What''s not going well in Family?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_social" IS 'What''s not going well in Social?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_home" IS 'What''s not going well in Home?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_work" IS 'What''s not going well in Work?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_money" IS 'What''s not going well in Money?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_stuff" IS 'What''s not going well in Stuff?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_giving" IS 'What''s not going well in Giving?';



COMMENT ON COLUMN "public"."user_profiles"."contrast_spirituality" IS 'What''s not going well in Spirituality?';



CREATE OR REPLACE VIEW "public"."untracked_token_changes" AS
 SELECT DISTINCT "user_id",
    "vibe_assistant_tokens_remaining" AS "current_balance",
    ((COALESCE(( SELECT "sum"("token_transactions"."tokens_used") AS "sum"
           FROM "public"."token_transactions"
          WHERE (("token_transactions"."user_id" = "up"."user_id") AND ("token_transactions"."action_type" = ANY (ARRAY['admin_grant'::"public"."token_action_type", 'subscription_grant'::"public"."token_action_type", 'trial_grant'::"public"."token_action_type", 'token_pack_purchase'::"public"."token_action_type"])) AND ("token_transactions"."tokens_used" > 0))), ( SELECT "sum"("token_usage"."tokens_used") AS "sum"
           FROM "public"."token_usage"
          WHERE (("token_usage"."user_id" = "up"."user_id") AND ("token_usage"."action_type" = ANY (ARRAY['admin_grant'::"text", 'subscription_grant'::"text", 'trial_grant'::"text", 'token_pack_purchase'::"text"])) AND ("token_usage"."tokens_used" > 0) AND (NOT (EXISTS ( SELECT 1
                   FROM "public"."token_transactions"
                  WHERE ("token_transactions"."user_id" = "up"."user_id")))))), (0)::bigint) - COALESCE(( SELECT "sum"("abs"("token_transactions"."tokens_used")) AS "sum"
           FROM "public"."token_transactions"
          WHERE (("token_transactions"."user_id" = "up"."user_id") AND (("token_transactions"."action_type" = 'admin_deduct'::"public"."token_action_type") OR ("token_transactions"."tokens_used" < 0)))), (0)::bigint)) - COALESCE(( SELECT "sum"("token_usage"."tokens_used") AS "sum"
           FROM "public"."token_usage"
          WHERE (("token_usage"."user_id" = "up"."user_id") AND ("token_usage"."action_type" <> ALL (ARRAY['admin_grant'::"text", 'subscription_grant'::"text", 'trial_grant'::"text", 'token_pack_purchase'::"text", 'admin_deduct'::"text"])) AND ("token_usage"."tokens_used" > 0) AND ("token_usage"."success" = true))), (0)::bigint)) AS "expected_balance",
    ("vibe_assistant_tokens_remaining" - ((COALESCE(( SELECT "sum"("token_transactions"."tokens_used") AS "sum"
           FROM "public"."token_transactions"
          WHERE (("token_transactions"."user_id" = "up"."user_id") AND ("token_transactions"."action_type" = ANY (ARRAY['admin_grant'::"public"."token_action_type", 'subscription_grant'::"public"."token_action_type", 'trial_grant'::"public"."token_action_type", 'token_pack_purchase'::"public"."token_action_type"])) AND ("token_transactions"."tokens_used" > 0))), ( SELECT "sum"("token_usage"."tokens_used") AS "sum"
           FROM "public"."token_usage"
          WHERE (("token_usage"."user_id" = "up"."user_id") AND ("token_usage"."action_type" = ANY (ARRAY['admin_grant'::"text", 'subscription_grant'::"text", 'trial_grant'::"text", 'token_pack_purchase'::"text"])) AND ("token_usage"."tokens_used" > 0) AND (NOT (EXISTS ( SELECT 1
                   FROM "public"."token_transactions"
                  WHERE ("token_transactions"."user_id" = "up"."user_id")))))), (0)::bigint) - COALESCE(( SELECT "sum"("abs"("token_transactions"."tokens_used")) AS "sum"
           FROM "public"."token_transactions"
          WHERE (("token_transactions"."user_id" = "up"."user_id") AND (("token_transactions"."action_type" = 'admin_deduct'::"public"."token_action_type") OR ("token_transactions"."tokens_used" < 0)))), (0)::bigint)) - COALESCE(( SELECT "sum"("token_usage"."tokens_used") AS "sum"
           FROM "public"."token_usage"
          WHERE (("token_usage"."user_id" = "up"."user_id") AND ("token_usage"."action_type" <> ALL (ARRAY['admin_grant'::"text", 'subscription_grant'::"text", 'trial_grant'::"text", 'token_pack_purchase'::"text", 'admin_deduct'::"text"])) AND ("token_usage"."tokens_used" > 0) AND ("token_usage"."success" = true))), (0)::bigint))) AS "discrepancy"
   FROM "public"."user_profiles" "up"
  WHERE ("abs"(("vibe_assistant_tokens_remaining" - ((COALESCE(( SELECT "sum"("token_transactions"."tokens_used") AS "sum"
           FROM "public"."token_transactions"
          WHERE (("token_transactions"."user_id" = "up"."user_id") AND ("token_transactions"."action_type" = ANY (ARRAY['admin_grant'::"public"."token_action_type", 'subscription_grant'::"public"."token_action_type", 'trial_grant'::"public"."token_action_type", 'token_pack_purchase'::"public"."token_action_type"])) AND ("token_transactions"."tokens_used" > 0))), ( SELECT "sum"("token_usage"."tokens_used") AS "sum"
           FROM "public"."token_usage"
          WHERE (("token_usage"."user_id" = "up"."user_id") AND ("token_usage"."action_type" = ANY (ARRAY['admin_grant'::"text", 'subscription_grant'::"text", 'trial_grant'::"text", 'token_pack_purchase'::"text"])) AND ("token_usage"."tokens_used" > 0) AND (NOT (EXISTS ( SELECT 1
                   FROM "public"."token_transactions"
                  WHERE ("token_transactions"."user_id" = "up"."user_id")))))), (0)::bigint) - COALESCE(( SELECT "sum"("abs"("token_transactions"."tokens_used")) AS "sum"
           FROM "public"."token_transactions"
          WHERE (("token_transactions"."user_id" = "up"."user_id") AND (("token_transactions"."action_type" = 'admin_deduct'::"public"."token_action_type") OR ("token_transactions"."tokens_used" < 0)))), (0)::bigint)) - COALESCE(( SELECT "sum"("token_usage"."tokens_used") AS "sum"
           FROM "public"."token_usage"
          WHERE (("token_usage"."user_id" = "up"."user_id") AND ("token_usage"."action_type" <> ALL (ARRAY['admin_grant'::"text", 'subscription_grant'::"text", 'trial_grant'::"text", 'token_pack_purchase'::"text", 'admin_deduct'::"text"])) AND ("token_usage"."tokens_used" > 0) AND ("token_usage"."success" = true))), (0)::bigint)))) > 0);


ALTER VIEW "public"."untracked_token_changes" OWNER TO "postgres";


COMMENT ON VIEW "public"."untracked_token_changes" IS 'Shows users whose token balance doesn''t match their transaction history. Indicates untracked token changes.';



CREATE TABLE IF NOT EXISTS "public"."user_stats" (
    "user_id" "uuid" NOT NULL,
    "total_journal_entries" integer DEFAULT 0,
    "journal_streak" integer DEFAULT 0,
    "last_journal_date" "date",
    "total_visions" integer DEFAULT 0,
    "current_vision_version" integer DEFAULT 0,
    "total_creations" integer DEFAULT 0,
    "actualized_creations" integer DEFAULT 0,
    "total_ai_calls" integer DEFAULT 0,
    "total_tokens_used" integer DEFAULT 0,
    "estimated_ai_cost" numeric(10,2) DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_token_balances" AS
 SELECT DISTINCT ON ("user_id") "user_id",
    "public"."calculate_token_balance"("user_id") AS "calculated_balance",
    "vibe_assistant_tokens_remaining" AS "profile_balance",
    ("public"."calculate_token_balance"("user_id") - "vibe_assistant_tokens_remaining") AS "discrepancy",
    ( SELECT COALESCE("sum"("token_transactions"."tokens_used"), (0)::bigint) AS "coalesce"
           FROM "public"."token_transactions"
          WHERE (("token_transactions"."user_id" = "up"."user_id") AND ("token_transactions"."action_type" = ANY (ARRAY['admin_grant'::"public"."token_action_type", 'subscription_grant'::"public"."token_action_type", 'trial_grant'::"public"."token_action_type", 'token_pack_purchase'::"public"."token_action_type"])) AND ("token_transactions"."tokens_used" > 0))) AS "total_grants",
    ( SELECT COALESCE("sum"("token_usage"."tokens_used"), (0)::bigint) AS "coalesce"
           FROM "public"."token_usage"
          WHERE (("token_usage"."user_id" = "up"."user_id") AND ("token_usage"."action_type" <> ALL (ARRAY['admin_grant'::"text", 'subscription_grant'::"text", 'trial_grant'::"text", 'token_pack_purchase'::"text", 'admin_deduct'::"text"])) AND ("token_usage"."tokens_used" > 0) AND ("token_usage"."success" = true))) AS "total_usage"
   FROM "public"."user_profiles" "up"
  ORDER BY "user_id", "updated_at" DESC NULLS LAST;


ALTER VIEW "public"."user_token_balances" OWNER TO "postgres";


COMMENT ON VIEW "public"."user_token_balances" IS 'Always use calculated_balance - ignore profile_balance. Shows discrepancy between calculated and stored balance.';



CREATE TABLE IF NOT EXISTS "public"."vibrational_event_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "default_category" "text",
    "field_map" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "analyzer_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vibrational_event_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vibrational_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_id" "uuid",
    "raw_text" "text",
    "emotional_valence" "text" NOT NULL,
    "dominant_emotions" "text"[] DEFAULT ARRAY[]::"text"[],
    "intensity" integer,
    "essence_word" "text",
    "is_contrast" boolean DEFAULT false NOT NULL,
    "summary_in_their_voice" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vibrational_events_emotional_valence_check" CHECK (("emotional_valence" = ANY (ARRAY['below_green_line'::"text", 'near_green_line'::"text", 'above_green_line'::"text"]))),
    CONSTRAINT "vibrational_events_intensity_check" CHECK ((("intensity" >= 1) AND ("intensity" <= 10)))
);


ALTER TABLE "public"."vibrational_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vibrational_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_a" "text" NOT NULL,
    "category_b" "text" NOT NULL,
    "strength" numeric NOT NULL,
    "shared_themes" "text"[] DEFAULT '{}'::"text"[],
    "connection_type" "text",
    "notes" "text",
    "evidence_count" integer DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vibrational_links_strength_check" CHECK ((("strength" >= (0)::numeric) AND ("strength" <= (1)::numeric)))
);


ALTER TABLE "public"."vibrational_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."video_mapping" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "original_s3_key" "text" NOT NULL,
    "original_url" "text" NOT NULL,
    "processed_s3_key" "text",
    "processed_url" "text",
    "folder" "text" NOT NULL,
    "entry_type" "text" NOT NULL,
    "entry_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."video_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vision_audios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vision_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'Life Vision Audio'::"text" NOT NULL,
    "description" "text",
    "voice_id" "text" DEFAULT 'alloy'::"text" NOT NULL,
    "format" "text" DEFAULT 'mp3'::"text" NOT NULL,
    "s3_bucket" "text" DEFAULT 'vibration-fit-client-storage'::"text" NOT NULL,
    "s3_key" "text" NOT NULL,
    "audio_url" "text" NOT NULL,
    "file_size_bytes" integer,
    "duration_seconds" integer,
    "content_hash" "text" NOT NULL,
    "sections_included" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "public"."vision_audio_status" DEFAULT 'pending'::"public"."vision_audio_status" NOT NULL,
    "error_message" "text",
    "generation_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "version_number" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "parent_audio_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vision_audios_format_check" CHECK (("format" = ANY (ARRAY['mp3'::"text", 'wav'::"text"])))
);


ALTER TABLE "public"."vision_audios" OWNER TO "postgres";


COMMENT ON TABLE "public"."vision_audios" IS 'Standalone audio files for life visions with versioning support - Migrated from audio_tracks and vision_versions.audio_url on 2025-01-25';



COMMENT ON COLUMN "public"."vision_audios"."content_hash" IS 'SHA-256 of normalized vision content for regeneration control';



COMMENT ON COLUMN "public"."vision_audios"."sections_included" IS 'Array of section keys that were included in this audio generation';



COMMENT ON COLUMN "public"."vision_audios"."generation_metadata" IS 'JSON metadata about generation process, costs, parameters, etc.';



COMMENT ON COLUMN "public"."vision_audios"."parent_audio_id" IS 'Reference to parent audio for versioning (NULL for original)';



CREATE TABLE IF NOT EXISTS "public"."vision_board_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "status" "text" DEFAULT 'active'::"text",
    "categories" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "actualized_at" timestamp with time zone,
    "actualized_image_url" "text",
    "actualization_story" "text"
);


ALTER TABLE "public"."vision_board_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."vision_board_items"."actualized_image_url" IS 'Evidence image showing the vision has been actualized. Displayed when status is actualized.';



COMMENT ON COLUMN "public"."vision_board_items"."actualization_story" IS 'Story describing how the vision was actualized. Only used when status is actualized.';



CREATE TABLE IF NOT EXISTS "public"."vision_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vision_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "path_chosen" "text",
    "messages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "vibrational_state" "text",
    "final_emotion_score" integer,
    "generated_vision" "text",
    "vision_generated_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vision_conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."vision_conversations" IS 'LEGACY: Old conversation-based vision gen. May be removable after audit.';



CREATE TABLE IF NOT EXISTS "public"."vision_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vision_id" "uuid" NOT NULL,
    "categories_completed" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "current_category" "text",
    "total_categories" integer DEFAULT 12 NOT NULL,
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."vision_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vision_versions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "completion_percent" integer DEFAULT 0,
    "forward" "text",
    "fun" "text",
    "travel" "text",
    "home" "text",
    "family" "text",
    "love" "text",
    "health" "text",
    "money" "text",
    "work" "text",
    "social" "text",
    "stuff" "text",
    "giving" "text",
    "spirituality" "text",
    "conclusion" "text",
    "has_audio" boolean DEFAULT false,
    "audio_url" "text",
    "audio_duration" "text",
    "voice_type" "text",
    "background_music" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_audio_generated_at" timestamp with time zone,
    "is_draft" boolean DEFAULT false,
    "is_active" boolean DEFAULT false,
    "activation_message" "text",
    "richness_metadata" "jsonb",
    "perspective" "text" DEFAULT 'singular'::"text",
    CONSTRAINT "vision_versions_perspective_check" CHECK (("perspective" = ANY (ARRAY['singular'::"text", 'plural'::"text"])))
);


ALTER TABLE "public"."vision_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."vision_versions" IS 'V3 Life Vision versions - cleaned 2025-11-11 (removed 7 deprecated columns)';



COMMENT ON COLUMN "public"."vision_versions"."forward" IS 'Forward / Introduction - Vibrational warmup section';



COMMENT ON COLUMN "public"."vision_versions"."fun" IS 'Fun / Recreation category content';



COMMENT ON COLUMN "public"."vision_versions"."travel" IS 'Travel / Adventure category content';



COMMENT ON COLUMN "public"."vision_versions"."home" IS 'Home / Environment category content';



COMMENT ON COLUMN "public"."vision_versions"."family" IS 'Family / Parenting category content';



COMMENT ON COLUMN "public"."vision_versions"."love" IS 'Love / Romance / Partnership category content';



COMMENT ON COLUMN "public"."vision_versions"."health" IS 'Health / Vitality category content';



COMMENT ON COLUMN "public"."vision_versions"."money" IS 'Money / Wealth category content';



COMMENT ON COLUMN "public"."vision_versions"."work" IS 'Work / Business / Career category content';



COMMENT ON COLUMN "public"."vision_versions"."social" IS 'Social / Friends category content';



COMMENT ON COLUMN "public"."vision_versions"."stuff" IS 'Stuff / Possessions / Lifestyle category content';



COMMENT ON COLUMN "public"."vision_versions"."giving" IS 'Giving / Legacy category content';



COMMENT ON COLUMN "public"."vision_versions"."spirituality" IS 'Spirituality / Growth category content';



COMMENT ON COLUMN "public"."vision_versions"."conclusion" IS 'Conclusion - Unifying final section';



COMMENT ON COLUMN "public"."vision_versions"."is_draft" IS 'True if this is a work-in-progress draft version';



COMMENT ON COLUMN "public"."vision_versions"."is_active" IS 'True if this is the current active version (only one per user)';



COMMENT ON COLUMN "public"."vision_versions"."activation_message" IS 'Step 6: Celebration message with next steps guidance';



COMMENT ON COLUMN "public"."vision_versions"."richness_metadata" IS 'Per-category richness data as JSONB: {"fun": {"inputChars": 500, "ideas": 5, "density": "medium"}, ...}';



COMMENT ON COLUMN "public"."vision_versions"."perspective" IS 'Whether the vision uses singular (I/my) or plural (we/our) perspective';



CREATE TABLE IF NOT EXISTS "public"."vision_versions_backup_20251111" (
    "id" "uuid",
    "user_id" "uuid",
    "version_number" integer,
    "title" "text",
    "status" "text",
    "completion_percent" integer,
    "forward" "text",
    "fun" "text",
    "travel" "text",
    "home" "text",
    "family" "text",
    "love" "text",
    "health" "text",
    "money" "text",
    "work" "text",
    "social" "text",
    "stuff" "text",
    "giving" "text",
    "spirituality" "text",
    "conclusion" "text",
    "has_audio" boolean,
    "audio_url" "text",
    "audio_duration" "text",
    "voice_type" "text",
    "background_music" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "vibe_assistant_refinements_count" integer,
    "last_vibe_assistant_refinement" timestamp with time zone,
    "vibe_assistant_refinement_notes" "text",
    "last_audio_generated_at" timestamp with time zone,
    "ai_generated" boolean,
    "conversation_count" integer,
    "emotional_patterns" "jsonb",
    "cross_category_themes" "text"[],
    "is_draft" boolean,
    "is_active" boolean,
    "activation_message" "text",
    "richness_metadata" "jsonb"
);


ALTER TABLE "public"."vision_versions_backup_20251111" OWNER TO "postgres";


COMMENT ON TABLE "public"."vision_versions_backup_20251111" IS 'Backup before dropping deprecated columns';



CREATE TABLE IF NOT EXISTS "public"."viva_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "session_id" "text" NOT NULL,
    "cycle_number" integer NOT NULL,
    "viva_prompt" "text" NOT NULL,
    "user_response" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."viva_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."voice_profiles" (
    "user_id" "uuid" NOT NULL,
    "word_flow" "text" NOT NULL,
    "emotional_range" "text" NOT NULL,
    "detail_level" "text" NOT NULL,
    "energy_tempo" "text" NOT NULL,
    "woo_level" smallint NOT NULL,
    "humor_personality" "text" NOT NULL,
    "speech_rhythm" "text" NOT NULL,
    "style_label" "text",
    "forbidden_styles" "text"[],
    "sample_phrases" "text"[],
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "emotional_intensity_preference" "text",
    "narrative_preference" "text",
    "depth_preference" "text",
    "last_refined_at" timestamp with time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "voice_profiles_woo_level_check" CHECK ((("woo_level" >= 1) AND ("woo_level" <= 3)))
);


ALTER TABLE "public"."voice_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."abundance_events"
    ADD CONSTRAINT "abundance_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."actualization_blueprints"
    ADD CONSTRAINT "actualization_blueprints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_action_token_overrides"
    ADD CONSTRAINT "ai_action_token_overrides_pkey" PRIMARY KEY ("action_type");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_insights"
    ADD CONSTRAINT "assessment_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_responses"
    ADD CONSTRAINT "assessment_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_results"
    ADD CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audio_sets"
    ADD CONSTRAINT "audio_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audio_tracks"
    ADD CONSTRAINT "audio_tracks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audio_tracks"
    ADD CONSTRAINT "audio_tracks_vision_audio_set_section_content_unique" UNIQUE ("vision_id", "audio_set_id", "section_key", "content_hash");



ALTER TABLE ONLY "public"."audio_variants"
    ADD CONSTRAINT "audio_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blueprint_insights"
    ADD CONSTRAINT "blueprint_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blueprint_phases"
    ADD CONSTRAINT "blueprint_phases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blueprint_tasks"
    ADD CONSTRAINT "blueprint_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_subscriptions"
    ADD CONSTRAINT "customer_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_subscriptions"
    ADD CONSTRAINT "customer_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."daily_papers"
    ADD CONSTRAINT "daily_papers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_papers"
    ADD CONSTRAINT "daily_papers_user_entry_unique" UNIQUE ("user_id", "entry_date");



ALTER TABLE ONLY "public"."emotional_snapshots"
    ADD CONSTRAINT "emotional_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emotional_snapshots"
    ADD CONSTRAINT "emotional_snapshots_user_id_category_key" UNIQUE ("user_id", "category");



ALTER TABLE ONLY "public"."frequency_flip"
    ADD CONSTRAINT "frequency_flip_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intensive_checklist"
    ADD CONSTRAINT "intensive_checklist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intensive_purchases"
    ADD CONSTRAINT "intensive_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."life_vision_category_state"
    ADD CONSTRAINT "life_vision_category_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."life_vision_category_state"
    ADD CONSTRAINT "life_vision_category_state_user_id_category_key" UNIQUE ("user_id", "category");



ALTER TABLE ONLY "public"."media_metadata"
    ADD CONSTRAINT "media_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_metadata"
    ADD CONSTRAINT "media_metadata_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."member_profiles"
    ADD CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_tiers"
    ADD CONSTRAINT "membership_tiers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."membership_tiers"
    ADD CONSTRAINT "membership_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_tiers"
    ADD CONSTRAINT "membership_tiers_stripe_price_id_key" UNIQUE ("stripe_price_id");



ALTER TABLE ONLY "public"."membership_tiers"
    ADD CONSTRAINT "membership_tiers_stripe_product_id_key" UNIQUE ("stripe_product_id");



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");



ALTER TABLE ONLY "public"."profile_versions"
    ADD CONSTRAINT "profile_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_versions"
    ADD CONSTRAINT "profile_versions_user_id_version_number_key" UNIQUE ("user_id", "version_number");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_suggestions_cache"
    ADD CONSTRAINT "prompt_suggestions_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scenes"
    ADD CONSTRAINT "scenes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_drips"
    ADD CONSTRAINT "token_drips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_transactions"
    ADD CONSTRAINT "token_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_usage"
    ADD CONSTRAINT "token_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_responses"
    ADD CONSTRAINT "unique_assessment_question" UNIQUE ("assessment_id", "question_id");



ALTER TABLE ONLY "public"."prompt_suggestions_cache"
    ADD CONSTRAINT "unique_prompt_cache" UNIQUE ("user_id", "category_key", "profile_id", "assessment_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."refinements"
    ADD CONSTRAINT "vibe_assistant_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vibrational_event_sources"
    ADD CONSTRAINT "vibrational_event_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vibrational_event_sources"
    ADD CONSTRAINT "vibrational_event_sources_source_key_key" UNIQUE ("source_key");



ALTER TABLE ONLY "public"."vibrational_events"
    ADD CONSTRAINT "vibrational_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vibrational_links"
    ADD CONSTRAINT "vibrational_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vibrational_links"
    ADD CONSTRAINT "vibrational_links_user_id_category_a_category_b_key" UNIQUE ("user_id", "category_a", "category_b");



ALTER TABLE ONLY "public"."video_mapping"
    ADD CONSTRAINT "video_mapping_original_s3_key_key" UNIQUE ("original_s3_key");



ALTER TABLE ONLY "public"."video_mapping"
    ADD CONSTRAINT "video_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vision_audios"
    ADD CONSTRAINT "vision_audios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vision_audios"
    ADD CONSTRAINT "vision_audios_vision_id_content_hash_voice_id_format_key" UNIQUE ("vision_id", "content_hash", "voice_id", "format");



ALTER TABLE ONLY "public"."vision_board_items"
    ADD CONSTRAINT "vision_board_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vision_conversations"
    ADD CONSTRAINT "vision_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vision_conversations"
    ADD CONSTRAINT "vision_conversations_vision_id_category_key" UNIQUE ("vision_id", "category");



ALTER TABLE ONLY "public"."vision_progress"
    ADD CONSTRAINT "vision_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vision_progress"
    ADD CONSTRAINT "vision_progress_vision_id_key" UNIQUE ("vision_id");



ALTER TABLE ONLY "public"."vision_versions"
    ADD CONSTRAINT "vision_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vision_versions"
    ADD CONSTRAINT "vision_versions_user_id_version_number_key" UNIQUE ("user_id", "version_number");



ALTER TABLE ONLY "public"."viva_conversations"
    ADD CONSTRAINT "viva_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voice_profiles"
    ADD CONSTRAINT "voice_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_abundance_events_user_date" ON "public"."abundance_events" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "idx_ai_conversations_conversation_id" ON "public"."ai_conversations" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_conversations_created_at" ON "public"."ai_conversations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ai_conversations_user_conversation" ON "public"."ai_conversations" USING "btree" ("user_id", "conversation_id", "created_at");



CREATE INDEX "idx_ai_conversations_user_id" ON "public"."ai_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_assessment_insights_assessment_id" ON "public"."assessment_insights" USING "btree" ("assessment_id");



CREATE INDEX "idx_assessment_insights_category" ON "public"."assessment_insights" USING "btree" ("category");



CREATE INDEX "idx_assessment_responses_assessment_id" ON "public"."assessment_responses" USING "btree" ("assessment_id");



CREATE INDEX "idx_assessment_responses_category" ON "public"."assessment_responses" USING "btree" ("category");



CREATE INDEX "idx_assessment_responses_question_id" ON "public"."assessment_responses" USING "btree" ("question_id");



CREATE INDEX "idx_assessment_results_created_at" ON "public"."assessment_results" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_assessment_results_profile_version" ON "public"."assessment_results" USING "btree" ("profile_version_id");



CREATE INDEX "idx_assessment_results_status" ON "public"."assessment_results" USING "btree" ("status");



CREATE INDEX "idx_assessment_results_user_id" ON "public"."assessment_results" USING "btree" ("user_id");



CREATE INDEX "idx_assessment_results_user_status" ON "public"."assessment_results" USING "btree" ("user_id", "status");



CREATE INDEX "idx_audio_sets_is_active" ON "public"."audio_sets" USING "btree" ("is_active");



CREATE INDEX "idx_audio_sets_user_id" ON "public"."audio_sets" USING "btree" ("user_id");



CREATE INDEX "idx_audio_sets_variant" ON "public"."audio_sets" USING "btree" ("variant");



CREATE INDEX "idx_audio_sets_vision_id" ON "public"."audio_sets" USING "btree" ("vision_id");



CREATE INDEX "idx_audio_tracks_audio_set_id" ON "public"."audio_tracks" USING "btree" ("audio_set_id");



CREATE INDEX "idx_audio_tracks_section_key" ON "public"."audio_tracks" USING "btree" ("section_key");



CREATE INDEX "idx_audio_tracks_status" ON "public"."audio_tracks" USING "btree" ("status");



CREATE INDEX "idx_audio_tracks_user_id" ON "public"."audio_tracks" USING "btree" ("user_id");



CREATE INDEX "idx_audio_tracks_vision_id" ON "public"."audio_tracks" USING "btree" ("vision_id");



CREATE INDEX "idx_audio_tracks_vision_id_audio_set_id" ON "public"."audio_tracks" USING "btree" ("vision_id", "audio_set_id");



CREATE INDEX "idx_audio_variants_id" ON "public"."audio_variants" USING "btree" ("id");



CREATE INDEX "idx_blueprints_category" ON "public"."actualization_blueprints" USING "btree" ("category");



CREATE INDEX "idx_blueprints_created_at" ON "public"."actualization_blueprints" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_blueprints_priority" ON "public"."actualization_blueprints" USING "btree" ("priority_level");



CREATE INDEX "idx_blueprints_status" ON "public"."actualization_blueprints" USING "btree" ("status");



CREATE INDEX "idx_blueprints_user_id" ON "public"."actualization_blueprints" USING "btree" ("user_id");



CREATE INDEX "idx_blueprints_vision_id" ON "public"."actualization_blueprints" USING "btree" ("vision_id");



CREATE INDEX "idx_conversation_sessions_category" ON "public"."conversation_sessions" USING "btree" ("category");



CREATE INDEX "idx_conversation_sessions_updated_at" ON "public"."conversation_sessions" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_conversation_sessions_user_category_vision" ON "public"."conversation_sessions" USING "btree" ("user_id", "category", "vision_id");



CREATE INDEX "idx_conversation_sessions_user_id" ON "public"."conversation_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_conversation_sessions_user_updated" ON "public"."conversation_sessions" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_conversation_sessions_vision_id" ON "public"."conversation_sessions" USING "btree" ("vision_id");



CREATE INDEX "idx_customer_subscriptions_status" ON "public"."customer_subscriptions" USING "btree" ("status");



CREATE INDEX "idx_customer_subscriptions_stripe_customer" ON "public"."customer_subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_customer_subscriptions_stripe_subscription" ON "public"."customer_subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_customer_subscriptions_user_id" ON "public"."customer_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_daily_papers_user_entry_date" ON "public"."daily_papers" USING "btree" ("user_id", "entry_date" DESC);



CREATE INDEX "idx_emotional_snapshots_user_category" ON "public"."emotional_snapshots" USING "btree" ("user_id", "category");



CREATE INDEX "idx_frequency_flip_category" ON "public"."frequency_flip" USING "btree" ("category");



CREATE INDEX "idx_frequency_flip_created_at" ON "public"."frequency_flip" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_frequency_flip_user_id" ON "public"."frequency_flip" USING "btree" ("user_id");



CREATE INDEX "idx_frequency_flip_vision_id" ON "public"."frequency_flip" USING "btree" ("vision_id");



CREATE INDEX "idx_insights_blueprint_id" ON "public"."blueprint_insights" USING "btree" ("blueprint_id");



CREATE INDEX "idx_insights_status" ON "public"."blueprint_insights" USING "btree" ("status");



CREATE INDEX "idx_insights_type" ON "public"."blueprint_insights" USING "btree" ("insight_type");



CREATE INDEX "idx_insights_user_id" ON "public"."blueprint_insights" USING "btree" ("user_id");



CREATE INDEX "idx_intensive_checklist_intensive" ON "public"."intensive_checklist" USING "btree" ("intensive_id");



CREATE INDEX "idx_intensive_checklist_user" ON "public"."intensive_checklist" USING "btree" ("user_id");



CREATE INDEX "idx_intensive_payment_intent" ON "public"."intensive_purchases" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_intensive_status" ON "public"."intensive_purchases" USING "btree" ("completion_status");



CREATE INDEX "idx_intensive_user" ON "public"."intensive_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_lv_category_state_blueprint" ON "public"."life_vision_category_state" USING "gin" ("blueprint_data");



CREATE INDEX "idx_lv_category_state_created" ON "public"."life_vision_category_state" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_lv_category_state_user_category" ON "public"."life_vision_category_state" USING "btree" ("user_id", "category");



CREATE INDEX "idx_media_metadata_bucket" ON "public"."media_metadata" USING "btree" ("bucket");



CREATE INDEX "idx_media_metadata_category" ON "public"."media_metadata" USING "btree" ("category");



CREATE INDEX "idx_media_metadata_file_type" ON "public"."media_metadata" USING "btree" ("file_type");



CREATE INDEX "idx_media_metadata_folder" ON "public"."media_metadata" USING "btree" ("folder");



CREATE INDEX "idx_media_metadata_tags" ON "public"."media_metadata" USING "gin" ("tags");



CREATE INDEX "idx_media_metadata_user_id" ON "public"."media_metadata" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_membership_tiers_active" ON "public"."membership_tiers" USING "btree" ("is_active");



CREATE INDEX "idx_membership_tiers_type" ON "public"."membership_tiers" USING "btree" ("tier_type");



CREATE INDEX "idx_payment_history_created_at" ON "public"."payment_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payment_history_subscription_id" ON "public"."payment_history" USING "btree" ("subscription_id");



CREATE INDEX "idx_payment_history_user_id" ON "public"."payment_history" USING "btree" ("user_id");



CREATE INDEX "idx_phases_blueprint_id" ON "public"."blueprint_phases" USING "btree" ("blueprint_id");



CREATE INDEX "idx_phases_status" ON "public"."blueprint_phases" USING "btree" ("status");



CREATE INDEX "idx_profile_versions_created_at" ON "public"."profile_versions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profile_versions_is_draft" ON "public"."profile_versions" USING "btree" ("is_draft");



CREATE INDEX "idx_profile_versions_user_id" ON "public"."profile_versions" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_membership_tier_id" ON "public"."profiles" USING "btree" ("membership_tier_id");



CREATE INDEX "idx_profiles_vibe_assistant_reset_date" ON "public"."profiles" USING "btree" ("vibe_assistant_monthly_reset_date");



CREATE INDEX "idx_profiles_vibe_assistant_tokens_used" ON "public"."profiles" USING "btree" ("vibe_assistant_tokens_used");



CREATE INDEX "idx_prompt_suggestions_assessment" ON "public"."prompt_suggestions_cache" USING "btree" ("assessment_id") WHERE ("assessment_id" IS NOT NULL);



CREATE INDEX "idx_prompt_suggestions_profile" ON "public"."prompt_suggestions_cache" USING "btree" ("profile_id") WHERE ("profile_id" IS NOT NULL);



CREATE INDEX "idx_prompt_suggestions_user_category" ON "public"."prompt_suggestions_cache" USING "btree" ("user_id", "category_key");



CREATE INDEX "idx_refinements_category" ON "public"."refinements" USING "btree" ("category");



CREATE INDEX "idx_refinements_created_at" ON "public"."refinements" USING "btree" ("created_at");



CREATE INDEX "idx_refinements_operation_type" ON "public"."refinements" USING "btree" ("operation_type");



CREATE INDEX "idx_refinements_user_id" ON "public"."refinements" USING "btree" ("user_id");



CREATE INDEX "idx_refinements_vision_id" ON "public"."refinements" USING "btree" ("vision_id");



CREATE INDEX "idx_scenes_category_created_at" ON "public"."scenes" USING "btree" ("category", "created_at" DESC);



CREATE INDEX "idx_scenes_user_category" ON "public"."scenes" USING "btree" ("user_id", "category");



CREATE INDEX "idx_tasks_blueprint_id" ON "public"."blueprint_tasks" USING "btree" ("blueprint_id");



CREATE INDEX "idx_tasks_due_date" ON "public"."blueprint_tasks" USING "btree" ("due_date");



CREATE INDEX "idx_tasks_phase_id" ON "public"."blueprint_tasks" USING "btree" ("phase_id");



CREATE INDEX "idx_tasks_status" ON "public"."blueprint_tasks" USING "btree" ("status");



CREATE INDEX "idx_token_drips_date" ON "public"."token_drips" USING "btree" ("drip_date" DESC);



CREATE INDEX "idx_token_drips_subscription" ON "public"."token_drips" USING "btree" ("subscription_id");



CREATE INDEX "idx_token_drips_user" ON "public"."token_drips" USING "btree" ("user_id");



CREATE INDEX "idx_token_transactions_action_type" ON "public"."token_transactions" USING "btree" ("action_type");



CREATE INDEX "idx_token_transactions_created_at" ON "public"."token_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_token_transactions_stripe_payment" ON "public"."token_transactions" USING "btree" ("stripe_payment_intent_id") WHERE ("stripe_payment_intent_id" IS NOT NULL);



CREATE INDEX "idx_token_transactions_subscription" ON "public"."token_transactions" USING "btree" ("subscription_id") WHERE ("subscription_id" IS NOT NULL);



CREATE INDEX "idx_token_transactions_user_action" ON "public"."token_transactions" USING "btree" ("user_id", "action_type");



CREATE INDEX "idx_token_transactions_user_id" ON "public"."token_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_token_usage_action_type" ON "public"."token_usage" USING "btree" ("action_type");



CREATE INDEX "idx_token_usage_created_at" ON "public"."token_usage" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_token_usage_model_used" ON "public"."token_usage" USING "btree" ("model_used");



CREATE INDEX "idx_token_usage_user_created" ON "public"."token_usage" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_token_usage_user_id" ON "public"."token_usage" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_created_at" ON "public"."user_profiles" USING "btree" ("created_at");



CREATE INDEX "idx_user_profiles_is_active" ON "public"."user_profiles" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_user_profiles_is_draft" ON "public"."user_profiles" USING "btree" ("user_id", "is_draft");



CREATE INDEX "idx_user_profiles_membership_tier_id" ON "public"."user_profiles" USING "btree" ("membership_tier_id");



CREATE UNIQUE INDEX "idx_user_profiles_one_active_per_user" ON "public"."user_profiles" USING "btree" ("user_id") WHERE (("is_active" = true) AND ("is_draft" = false));



CREATE UNIQUE INDEX "idx_user_profiles_one_draft_per_user" ON "public"."user_profiles" USING "btree" ("user_id") WHERE ("is_draft" = true);



CREATE INDEX "idx_user_profiles_parent_version" ON "public"."user_profiles" USING "btree" ("parent_version_id");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_version_number" ON "public"."user_profiles" USING "btree" ("user_id", "version_number" DESC);



CREATE INDEX "idx_user_profiles_vibe_assistant_reset_date" ON "public"."user_profiles" USING "btree" ("vibe_assistant_monthly_reset_date");



CREATE INDEX "idx_user_profiles_vibe_assistant_tokens_used" ON "public"."user_profiles" USING "btree" ("vibe_assistant_tokens_used");



CREATE INDEX "idx_vibrational_event_sources_enabled" ON "public"."vibrational_event_sources" USING "btree" ("enabled");



CREATE INDEX "idx_vibrational_event_sources_key" ON "public"."vibrational_event_sources" USING "btree" ("source_key");



CREATE INDEX "idx_vibrational_events_category_created_at" ON "public"."vibrational_events" USING "btree" ("category", "created_at" DESC);



CREATE INDEX "idx_vibrational_events_source" ON "public"."vibrational_events" USING "btree" ("source_type", "source_id");



CREATE INDEX "idx_vibrational_events_user_category_created_at" ON "public"."vibrational_events" USING "btree" ("user_id", "category", "created_at" DESC);



CREATE INDEX "idx_vibrational_links_category_a" ON "public"."vibrational_links" USING "btree" ("user_id", "category_a");



CREATE INDEX "idx_vibrational_links_strength" ON "public"."vibrational_links" USING "btree" ("user_id", "strength" DESC);



CREATE INDEX "idx_vibrational_links_themes" ON "public"."vibrational_links" USING "gin" ("shared_themes");



CREATE INDEX "idx_vibrational_links_user" ON "public"."vibrational_links" USING "btree" ("user_id");



CREATE INDEX "idx_vision_audios_active" ON "public"."vision_audios" USING "btree" ("is_active");



CREATE INDEX "idx_vision_audios_content_hash" ON "public"."vision_audios" USING "btree" ("content_hash");



CREATE INDEX "idx_vision_audios_created_at" ON "public"."vision_audios" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_vision_audios_status" ON "public"."vision_audios" USING "btree" ("status");



CREATE INDEX "idx_vision_audios_user_id" ON "public"."vision_audios" USING "btree" ("user_id");



CREATE INDEX "idx_vision_audios_vision_id" ON "public"."vision_audios" USING "btree" ("vision_id");



CREATE INDEX "idx_vision_conversations_category" ON "public"."vision_conversations" USING "btree" ("category");



CREATE INDEX "idx_vision_conversations_user_id" ON "public"."vision_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_vision_conversations_vision_id" ON "public"."vision_conversations" USING "btree" ("vision_id");



CREATE INDEX "idx_vision_progress_user_id" ON "public"."vision_progress" USING "btree" ("user_id");



CREATE INDEX "idx_vision_progress_vision_id" ON "public"."vision_progress" USING "btree" ("vision_id");



CREATE INDEX "idx_vision_versions_is_active" ON "public"."vision_versions" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_vision_versions_is_draft" ON "public"."vision_versions" USING "btree" ("user_id", "is_draft");



CREATE INDEX "idx_vision_versions_perspective" ON "public"."vision_versions" USING "btree" ("perspective");



CREATE INDEX "idx_vision_versions_richness_metadata" ON "public"."vision_versions" USING "gin" ("richness_metadata");



CREATE INDEX "idx_viva_conversations_session" ON "public"."viva_conversations" USING "btree" ("session_id");



CREATE INDEX "idx_viva_conversations_user_category" ON "public"."viva_conversations" USING "btree" ("user_id", "category");



CREATE UNIQUE INDEX "idx_voice_profiles_user_active" ON "public"."voice_profiles" USING "btree" ("user_id") WHERE "is_active";



CREATE INDEX "idx_voice_profiles_user_id" ON "public"."voice_profiles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "unique_active_assessment_per_user" ON "public"."assessment_results" USING "btree" ("user_id") WHERE "is_active";



CREATE UNIQUE INDEX "unique_active_subscription" ON "public"."customer_subscriptions" USING "btree" ("user_id") WHERE (("status" = 'active'::"public"."subscription_status") OR ("status" = 'trialing'::"public"."subscription_status"));



CREATE UNIQUE INDEX "unique_draft_assessment_per_user" ON "public"."assessment_results" USING "btree" ("user_id") WHERE "is_draft";



CREATE OR REPLACE TRIGGER "ai_conversations_update_session" AFTER INSERT ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_session"();



CREATE OR REPLACE TRIGGER "on_conversation_completed" AFTER UPDATE ON "public"."vision_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_vision_progress_on_completion"();



CREATE OR REPLACE TRIGGER "on_vision_created" AFTER INSERT ON "public"."vision_versions" FOR EACH ROW EXECUTE FUNCTION "public"."initialize_vision_progress"();



CREATE OR REPLACE TRIGGER "set_updated_at_on_emotional_snapshots" BEFORE UPDATE ON "public"."emotional_snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_on_scenes" BEFORE UPDATE ON "public"."scenes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_on_vibrational_event_sources" BEFORE UPDATE ON "public"."vibrational_event_sources" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_daily_papers_updated_at" BEFORE UPDATE ON "public"."daily_papers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_voice_profiles_updated_at" BEFORE UPDATE ON "public"."voice_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_audio_sets_updated_at" BEFORE UPDATE ON "public"."audio_sets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_audio_tracks_updated_at" BEFORE UPDATE ON "public"."audio_tracks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_blueprint_progress" AFTER INSERT OR UPDATE ON "public"."blueprint_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_blueprint_progress"();



CREATE OR REPLACE TRIGGER "trigger_update_membership_tiers_updated_at" BEFORE UPDATE ON "public"."membership_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_vision_refinement_tracking" AFTER INSERT ON "public"."refinements" FOR EACH ROW WHEN (((("new"."operation_type")::"text" = 'refine_vision'::"text") AND ("new"."vision_id" IS NOT NULL))) EXECUTE FUNCTION "public"."update_vision_refinement_tracking"();



CREATE OR REPLACE TRIGGER "trigger_vision_audios_updated_at" BEFORE UPDATE ON "public"."vision_audios" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_assessment_insights_updated_at" BEFORE UPDATE ON "public"."assessment_insights" FOR EACH ROW EXECUTE FUNCTION "public"."update_assessment_updated_at"();



CREATE OR REPLACE TRIGGER "update_assessment_responses_updated_at" BEFORE UPDATE ON "public"."assessment_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_assessment_updated_at"();



CREATE OR REPLACE TRIGGER "update_assessment_results_updated_at" BEFORE UPDATE ON "public"."assessment_results" FOR EACH ROW EXECUTE FUNCTION "public"."update_assessment_updated_at"();



CREATE OR REPLACE TRIGGER "update_customer_subscriptions_updated_at" BEFORE UPDATE ON "public"."customer_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_assessment_updated_at"();



CREATE OR REPLACE TRIGGER "update_generated_images_updated_at" BEFORE UPDATE ON "public"."generated_images" FOR EACH ROW EXECUTE FUNCTION "public"."update_generated_images_updated_at"();



CREATE OR REPLACE TRIGGER "update_lv_category_state_updated_at" BEFORE UPDATE ON "public"."life_vision_category_state" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_media_metadata_updated_at" BEFORE UPDATE ON "public"."media_metadata" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_membership_tiers_updated_at" BEFORE UPDATE ON "public"."membership_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."update_assessment_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_scores_on_response_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."assessment_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_assessment_scores"();



CREATE OR REPLACE TRIGGER "update_vibrational_links_updated_at" BEFORE UPDATE ON "public"."vibrational_links" FOR EACH ROW EXECUTE FUNCTION "public"."update_vibrational_links_updated_at"();



CREATE OR REPLACE TRIGGER "update_vision_versions_updated_at" BEFORE UPDATE ON "public"."vision_versions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."abundance_events"
    ADD CONSTRAINT "abundance_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."actualization_blueprints"
    ADD CONSTRAINT "actualization_blueprints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."actualization_blueprints"
    ADD CONSTRAINT "actualization_blueprints_vision_board_item_id_fkey" FOREIGN KEY ("vision_board_item_id") REFERENCES "public"."vision_board_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."actualization_blueprints"
    ADD CONSTRAINT "actualization_blueprints_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_insights"
    ADD CONSTRAINT "assessment_insights_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment_results"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_responses"
    ADD CONSTRAINT "assessment_responses_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment_results"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_results"
    ADD CONSTRAINT "assessment_results_profile_version_id_fkey" FOREIGN KEY ("profile_version_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assessment_results"
    ADD CONSTRAINT "assessment_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audio_sets"
    ADD CONSTRAINT "audio_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audio_sets"
    ADD CONSTRAINT "audio_sets_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audio_tracks"
    ADD CONSTRAINT "audio_tracks_audio_set_id_fkey" FOREIGN KEY ("audio_set_id") REFERENCES "public"."audio_sets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audio_tracks"
    ADD CONSTRAINT "audio_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audio_tracks"
    ADD CONSTRAINT "audio_tracks_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blueprint_insights"
    ADD CONSTRAINT "blueprint_insights_blueprint_id_fkey" FOREIGN KEY ("blueprint_id") REFERENCES "public"."actualization_blueprints"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blueprint_insights"
    ADD CONSTRAINT "blueprint_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blueprint_phases"
    ADD CONSTRAINT "blueprint_phases_blueprint_id_fkey" FOREIGN KEY ("blueprint_id") REFERENCES "public"."actualization_blueprints"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blueprint_tasks"
    ADD CONSTRAINT "blueprint_tasks_blueprint_id_fkey" FOREIGN KEY ("blueprint_id") REFERENCES "public"."actualization_blueprints"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blueprint_tasks"
    ADD CONSTRAINT "blueprint_tasks_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."blueprint_phases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_subscriptions"
    ADD CONSTRAINT "customer_subscriptions_membership_tier_id_fkey" FOREIGN KEY ("membership_tier_id") REFERENCES "public"."membership_tiers"("id");



ALTER TABLE ONLY "public"."customer_subscriptions"
    ADD CONSTRAINT "customer_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_papers"
    ADD CONSTRAINT "daily_papers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emotional_snapshots"
    ADD CONSTRAINT "emotional_snapshots_last_scene_id_fkey" FOREIGN KEY ("last_scene_id") REFERENCES "public"."scenes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."emotional_snapshots"
    ADD CONSTRAINT "emotional_snapshots_last_vision_id_fkey" FOREIGN KEY ("last_vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."emotional_snapshots"
    ADD CONSTRAINT "emotional_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."frequency_flip"
    ADD CONSTRAINT "frequency_flip_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."frequency_flip"
    ADD CONSTRAINT "frequency_flip_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intensive_checklist"
    ADD CONSTRAINT "intensive_checklist_intensive_id_fkey" FOREIGN KEY ("intensive_id") REFERENCES "public"."intensive_purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intensive_checklist"
    ADD CONSTRAINT "intensive_checklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intensive_purchases"
    ADD CONSTRAINT "intensive_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."life_vision_category_state"
    ADD CONSTRAINT "life_vision_category_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_metadata"
    ADD CONSTRAINT "media_metadata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_profiles"
    ADD CONSTRAINT "member_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."customer_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_versions"
    ADD CONSTRAINT "profile_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_membership_tier_id_fkey" FOREIGN KEY ("membership_tier_id") REFERENCES "public"."membership_tiers"("id");



ALTER TABLE ONLY "public"."prompt_suggestions_cache"
    ADD CONSTRAINT "prompt_suggestions_cache_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment_results"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_suggestions_cache"
    ADD CONSTRAINT "prompt_suggestions_cache_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_suggestions_cache"
    ADD CONSTRAINT "prompt_suggestions_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scenes"
    ADD CONSTRAINT "scenes_related_vision_id_fkey" FOREIGN KEY ("related_vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scenes"
    ADD CONSTRAINT "scenes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_drips"
    ADD CONSTRAINT "token_drips_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."customer_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."token_drips"
    ADD CONSTRAINT "token_drips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_transactions"
    ADD CONSTRAINT "token_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."token_transactions"
    ADD CONSTRAINT "token_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."customer_subscriptions"("id");



ALTER TABLE ONLY "public"."token_transactions"
    ADD CONSTRAINT "token_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_usage"
    ADD CONSTRAINT "token_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_membership_tier_id_fkey" FOREIGN KEY ("membership_tier_id") REFERENCES "public"."membership_tiers"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refinements"
    ADD CONSTRAINT "vibe_assistant_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refinements"
    ADD CONSTRAINT "vibe_assistant_logs_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vibrational_events"
    ADD CONSTRAINT "vibrational_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vibrational_links"
    ADD CONSTRAINT "vibrational_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vision_audios"
    ADD CONSTRAINT "vision_audios_parent_audio_id_fkey" FOREIGN KEY ("parent_audio_id") REFERENCES "public"."vision_audios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vision_audios"
    ADD CONSTRAINT "vision_audios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vision_audios"
    ADD CONSTRAINT "vision_audios_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vision_board_items"
    ADD CONSTRAINT "vision_board_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vision_conversations"
    ADD CONSTRAINT "vision_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vision_conversations"
    ADD CONSTRAINT "vision_conversations_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vision_progress"
    ADD CONSTRAINT "vision_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vision_progress"
    ADD CONSTRAINT "vision_progress_vision_id_fkey" FOREIGN KEY ("vision_id") REFERENCES "public"."vision_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vision_versions"
    ADD CONSTRAINT "vision_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viva_conversations"
    ADD CONSTRAINT "viva_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."voice_profiles"
    ADD CONSTRAINT "voice_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can insert site content metadata" ON "public"."media_metadata" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" IS NULL) AND ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%@vibrationfit.com'::"text"))));



CREATE POLICY "Admins can manage vibrational sources" ON "public"."vibrational_event_sources" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."email")::"text" = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::"text"[])) OR (("users"."raw_user_meta_data" ->> 'is_admin'::"text") = 'true'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."email")::"text" = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::"text"[])) OR (("users"."raw_user_meta_data" ->> 'is_admin'::"text") = 'true'::"text"))))));



CREATE POLICY "Admins can update site content metadata" ON "public"."media_metadata" FOR UPDATE TO "authenticated" USING ((("user_id" IS NULL) AND ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%@vibrationfit.com'::"text"))));



CREATE POLICY "Anyone can read audio variants" ON "public"."audio_variants" FOR SELECT USING (true);



CREATE POLICY "Anyone can view active membership tiers" ON "public"."membership_tiers" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view site content metadata" ON "public"."media_metadata" FOR SELECT USING (("user_id" IS NULL));



CREATE POLICY "Authenticated users can manage audio variants" ON "public"."audio_variants" USING (true) WITH CHECK (true);



CREATE POLICY "Membership tiers are viewable by everyone" ON "public"."membership_tiers" FOR SELECT USING (true);



CREATE POLICY "Only service role can modify membership tiers" ON "public"."membership_tiers" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can insert token transactions" ON "public"."token_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can manage all refinements" ON "public"."refinements" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "System can create assessment insights" ON "public"."assessment_insights" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create payment records" ON "public"."payment_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create subscriptions" ON "public"."customer_subscriptions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert token usage" ON "public"."token_usage" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can update subscriptions" ON "public"."customer_subscriptions" FOR UPDATE USING (true);



CREATE POLICY "Users can create own AI usage logs" ON "public"."ai_usage_logs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own journal entries" ON "public"."journal_entries" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own profile" ON "public"."member_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own vision board items" ON "public"."vision_board_items" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own assessment responses" ON "public"."assessment_responses" FOR INSERT WITH CHECK (("assessment_id" IN ( SELECT "assessment_results"."id"
   FROM "public"."assessment_results"
  WHERE ("assessment_results"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create their own assessments" ON "public"."assessment_results" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own generated images" ON "public"."generated_images" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own category state" ON "public"."life_vision_category_state" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own journal entries" ON "public"."journal_entries" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own media metadata" ON "public"."media_metadata" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own profile" ON "public"."user_profiles" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own vision board items" ON "public"."vision_board_items" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own visions" ON "public"."vision_versions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own assessment responses" ON "public"."assessment_responses" FOR DELETE USING (("assessment_id" IN ( SELECT "assessment_results"."id"
   FROM "public"."assessment_results"
  WHERE ("assessment_results"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete their own assessments" ON "public"."assessment_results" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own audio sets" ON "public"."audio_sets" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own audio tracks" ON "public"."audio_tracks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own blueprints" ON "public"."actualization_blueprints" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own conversation sessions" ON "public"."conversation_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own conversations" ON "public"."ai_conversations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own conversations" ON "public"."vision_conversations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own frequency flip seeds" ON "public"."frequency_flip" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own generated images" ON "public"."generated_images" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own profile versions" ON "public"."profile_versions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own progress" ON "public"."vision_progress" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own refinements" ON "public"."refinements" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own vision audios" ON "public"."vision_audios" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own vision versions" ON "public"."vision_versions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert media metadata" ON "public"."media_metadata" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own category state" ON "public"."life_vision_category_state" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own conversations" ON "public"."ai_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own stats" ON "public"."user_stats" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own visions" ON "public"."vision_versions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their abundance events" ON "public"."abundance_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own audio sets" ON "public"."audio_sets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own audio tracks" ON "public"."audio_tracks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own blueprints" ON "public"."actualization_blueprints" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own conversation sessions" ON "public"."conversation_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own conversations" ON "public"."ai_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own conversations" ON "public"."vision_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own conversations" ON "public"."viva_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own frequency flip seeds" ON "public"."frequency_flip" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own insights" ON "public"."blueprint_insights" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile versions" ON "public"."profile_versions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own progress" ON "public"."vision_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own refinements" ON "public"."refinements" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own vibrational links" ON "public"."vibrational_links" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own vision audios" ON "public"."vision_audios" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own vision versions" ON "public"."vision_versions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their scenes" ON "public"."scenes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their vibrational events" ON "public"."vibrational_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage phases for their blueprints" ON "public"."blueprint_phases" USING ((EXISTS ( SELECT 1
   FROM "public"."actualization_blueprints"
  WHERE (("actualization_blueprints"."id" = "blueprint_phases"."blueprint_id") AND ("actualization_blueprints"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage tasks for their blueprints" ON "public"."blueprint_tasks" USING ((EXISTS ( SELECT 1
   FROM "public"."actualization_blueprints"
  WHERE (("actualization_blueprints"."id" = "blueprint_tasks"."blueprint_id") AND ("actualization_blueprints"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their daily papers" ON "public"."daily_papers" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their voice profile" ON "public"."voice_profiles" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select their own audio sets" ON "public"."audio_sets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select their own audio tracks" ON "public"."audio_tracks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select their own vision audios" ON "public"."vision_audios" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own category state" ON "public"."life_vision_category_state" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own intensive checklist" ON "public"."intensive_checklist" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own journal entries" ON "public"."journal_entries" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own media metadata" ON "public"."media_metadata" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."member_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own stats" ON "public"."user_stats" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own vision board items" ON "public"."vision_board_items" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own visions" ON "public"."vision_versions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their abundance events" ON "public"."abundance_events" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their emotional snapshots" ON "public"."emotional_snapshots" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own assessment responses" ON "public"."assessment_responses" FOR UPDATE USING (("assessment_id" IN ( SELECT "assessment_results"."id"
   FROM "public"."assessment_results"
  WHERE ("assessment_results"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own assessments" ON "public"."assessment_results" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own audio sets" ON "public"."audio_sets" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own audio tracks" ON "public"."audio_tracks" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own blueprints" ON "public"."actualization_blueprints" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own conversation sessions" ON "public"."conversation_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own conversations" ON "public"."ai_conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own conversations" ON "public"."vision_conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own conversations" ON "public"."viva_conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own frequency flip seeds" ON "public"."frequency_flip" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own generated images" ON "public"."generated_images" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own insights" ON "public"."blueprint_insights" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile versions" ON "public"."profile_versions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own progress" ON "public"."vision_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own refinements" ON "public"."refinements" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own vibrational links" ON "public"."vibrational_links" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own vision audios" ON "public"."vision_audios" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own vision versions" ON "public"."vision_versions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their scenes" ON "public"."scenes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can upsert their emotional snapshots" ON "public"."emotional_snapshots" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view enabled vibrational sources" ON "public"."vibrational_event_sources" FOR SELECT USING ((("enabled" = true) OR (EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."email")::"text" = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::"text"[])) OR (("users"."raw_user_meta_data" ->> 'is_admin'::"text") = 'true'::"text")))))));



CREATE POLICY "Users can view own AI usage" ON "public"."ai_usage_logs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own category state" ON "public"."life_vision_category_state" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own conversations" ON "public"."ai_conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own intensive checklist" ON "public"."intensive_checklist" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own intensive purchases" ON "public"."intensive_purchases" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own journal entries" ON "public"."journal_entries" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own media metadata" ON "public"."media_metadata" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."member_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own stats" ON "public"."user_stats" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own token drips" ON "public"."token_drips" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own token transactions" ON "public"."token_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own vision board items" ON "public"."vision_board_items" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own visions" ON "public"."vision_versions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their abundance events" ON "public"."abundance_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their emotional snapshots" ON "public"."emotional_snapshots" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own assessment insights" ON "public"."assessment_insights" FOR SELECT USING (("assessment_id" IN ( SELECT "assessment_results"."id"
   FROM "public"."assessment_results"
  WHERE ("assessment_results"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own assessment responses" ON "public"."assessment_responses" FOR SELECT USING (("assessment_id" IN ( SELECT "assessment_results"."id"
   FROM "public"."assessment_results"
  WHERE ("assessment_results"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own assessments" ON "public"."assessment_results" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own blueprints" ON "public"."actualization_blueprints" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own conversation sessions" ON "public"."conversation_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own conversations" ON "public"."ai_conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own conversations" ON "public"."vision_conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own conversations" ON "public"."viva_conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own frequency flip seeds" ON "public"."frequency_flip" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own generated images" ON "public"."generated_images" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own insights" ON "public"."blueprint_insights" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own payment history" ON "public"."payment_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile versions" ON "public"."profile_versions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own progress" ON "public"."vision_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own refinements" ON "public"."refinements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."customer_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own token usage" ON "public"."token_usage" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own vibrational links" ON "public"."vibrational_links" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own vision versions" ON "public"."vision_versions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their scenes" ON "public"."scenes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their vibrational events" ON "public"."vibrational_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."abundance_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."actualization_blueprints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_action_token_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audio_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audio_tracks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audio_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blueprint_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blueprint_phases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blueprint_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_papers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."emotional_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."frequency_flip" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intensive_checklist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intensive_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."life_vision_category_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_tiers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "overrides_modify" ON "public"."ai_action_token_overrides" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "overrides_select" ON "public"."ai_action_token_overrides" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."payment_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_suggestions_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."refinements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scenes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."token_drips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."token_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."token_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vibrational_event_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vibrational_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vibrational_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."video_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vision_audios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vision_board_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vision_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vision_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vision_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viva_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."voice_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "cursor_reader";

























































































































































GRANT ALL ON FUNCTION "public"."apply_token_usage"("p_user_id" "uuid", "p_action_type" "text", "p_model_used" "text", "p_tokens_used" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate_cents" integer, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_token_usage"("p_user_id" "uuid", "p_action_type" "text", "p_model_used" "text", "p_tokens_used" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate_cents" integer, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_token_usage"("p_user_id" "uuid", "p_action_type" "text", "p_model_used" "text", "p_tokens_used" integer, "p_input_tokens" integer, "p_output_tokens" integer, "p_cost_estimate_cents" integer, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_blueprint_progress"("p_blueprint_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_blueprint_progress"("p_blueprint_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_blueprint_progress"("p_blueprint_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_category_score"("p_assessment_id" "uuid", "p_category" "public"."assessment_category") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_category_score"("p_assessment_id" "uuid", "p_category" "public"."assessment_category") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_category_score"("p_assessment_id" "uuid", "p_category" "public"."assessment_category") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("profile_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("profile_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_profile_completion"("profile_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_token_balance"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_token_balance"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_token_balance"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_version_diff"("p_old_version_id" "uuid", "p_new_version_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_version_diff"("p_old_version_id" "uuid", "p_new_version_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_version_diff"("p_old_version_id" "uuid", "p_new_version_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_version_number"("p_profile_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_version_number"("p_profile_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_version_number"("p_profile_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_vibe_assistant_cost"("p_tokens" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_vibe_assistant_cost"("p_tokens" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_vibe_assistant_cost"("p_tokens" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_vision_version_number"("p_vision_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_vision_version_number"("p_vision_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_vision_version_number"("p_vision_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_intensive_completion"("p_intensive_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_intensive_completion"("p_intensive_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_intensive_completion"("p_intensive_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_storage_quota"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_storage_quota"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_storage_quota"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."commit_draft_as_active"("p_draft_profile_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."commit_draft_as_active"("p_draft_profile_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."commit_draft_as_active"("p_draft_profile_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_draft_from_version"("p_source_profile_id" "uuid", "p_user_id" "uuid", "p_version_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_draft_from_version"("p_source_profile_id" "uuid", "p_user_id" "uuid", "p_version_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_draft_from_version"("p_source_profile_id" "uuid", "p_user_id" "uuid", "p_version_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_version"("user_uuid" "uuid", "profile_data" "jsonb", "is_draft" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_version"("user_uuid" "uuid", "profile_data" "jsonb", "is_draft" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_version"("user_uuid" "uuid", "profile_data" "jsonb", "is_draft" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_vibe_assistant_allowance"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_vibe_assistant_allowance"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_vibe_assistant_allowance"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_from_s3"("file_path" "text", "bucket_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_from_s3"("file_path" "text", "bucket_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_from_s3"("file_path" "text", "bucket_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."drip_tokens_28day"("p_user_id" "uuid", "p_subscription_id" "uuid", "p_cycle_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."drip_tokens_28day"("p_user_id" "uuid", "p_subscription_id" "uuid", "p_cycle_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."drip_tokens_28day"("p_user_id" "uuid", "p_subscription_id" "uuid", "p_cycle_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."estimate_vibe_assistant_tokens"("p_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."estimate_vibe_assistant_tokens"("p_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."estimate_vibe_assistant_tokens"("p_text" "text") TO "service_role";



GRANT ALL ON TABLE "public"."customer_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."customer_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_subscriptions" TO "service_role";
GRANT ALL ON TABLE "public"."customer_subscriptions" TO "cursor_reader";
GRANT ALL ON TABLE "public"."customer_subscriptions" TO "db_admin";



GRANT ALL ON FUNCTION "public"."get_active_subscription"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_subscription"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_subscription"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_field_label"("p_field_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_field_label"("p_field_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_field_label"("p_field_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_green_line_status"("p_score" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_green_line_status"("p_score" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_green_line_status"("p_score" integer) TO "service_role";



GRANT ALL ON TABLE "public"."intensive_checklist" TO "anon";
GRANT ALL ON TABLE "public"."intensive_checklist" TO "authenticated";
GRANT ALL ON TABLE "public"."intensive_checklist" TO "service_role";
GRANT ALL ON TABLE "public"."intensive_checklist" TO "cursor_reader";
GRANT ALL ON TABLE "public"."intensive_checklist" TO "db_admin";



GRANT ALL ON FUNCTION "public"."get_intensive_progress"("checklist_row" "public"."intensive_checklist") TO "anon";
GRANT ALL ON FUNCTION "public"."get_intensive_progress"("checklist_row" "public"."intensive_checklist") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_intensive_progress"("checklist_row" "public"."intensive_checklist") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_latest_profile_version"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_latest_profile_version"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_latest_profile_version"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_intensive_step"("checklist_row" "public"."intensive_checklist") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_intensive_step"("checklist_row" "public"."intensive_checklist") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_intensive_step"("checklist_row" "public"."intensive_checklist") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_version_number"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_version_number"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_version_number"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_completion_percentage"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_completion_percentage"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_completion_percentage"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_version_number"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_version_number"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_version_number"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."membership_tiers" TO "anon";
GRANT ALL ON TABLE "public"."membership_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_tiers" TO "service_role";
GRANT ALL ON TABLE "public"."membership_tiers" TO "cursor_reader";
GRANT ALL ON TABLE "public"."membership_tiers" TO "db_admin";



GRANT ALL ON FUNCTION "public"."get_user_tier"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tier"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tier"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_token_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_token_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_token_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vibe_assistant_allowance"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vibe_assistant_allowance"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vibe_assistant_allowance"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vision_version_number"("p_vision_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vision_version_number"("p_vision_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vision_version_number"("p_vision_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_annual_tokens"("p_user_id" "uuid", "p_subscription_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."grant_annual_tokens"("p_user_id" "uuid", "p_subscription_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_annual_tokens"("p_user_id" "uuid", "p_subscription_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_trial_tokens"("p_user_id" "uuid", "p_trial_amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."grant_trial_tokens"("p_user_id" "uuid", "p_trial_amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_trial_tokens"("p_user_id" "uuid", "p_trial_amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_ai_usage"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_ai_usage"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_ai_usage"("p_user_id" "uuid", "p_tokens" integer, "p_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_journal_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_journal_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_journal_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_vision_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_vision_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_vision_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_vibe_assistant_allowances"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_vibe_assistant_allowances"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_vibe_assistant_allowances"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_version_active"("p_profile_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_version_active"("p_profile_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_version_active"("p_profile_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_assessment_scores"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_assessment_scores"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_assessment_scores"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_assessment_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_assessment_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_assessment_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_blueprint_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_blueprint_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_blueprint_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_session"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_session"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_session"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_generated_images_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_generated_images_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_generated_images_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_stats"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_stats"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_stats"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vibrational_links_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vibrational_links_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vibrational_links_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vision_progress_on_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vision_progress_on_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vision_progress_on_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vision_refinement_tracking"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vision_refinement_tracking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vision_refinement_tracking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upload_to_s3"("file_path" "text", "file_data" "text", "content_type" "text", "bucket_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upload_to_s3"("file_path" "text", "file_data" "text", "content_type" "text", "bucket_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upload_to_s3"("file_path" "text", "file_data" "text", "content_type" "text", "bucket_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_feature"("p_user_id" "uuid", "p_feature" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_feature"("p_user_id" "uuid", "p_feature" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_feature"("p_user_id" "uuid", "p_feature" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."abundance_events" TO "anon";
GRANT ALL ON TABLE "public"."abundance_events" TO "authenticated";
GRANT ALL ON TABLE "public"."abundance_events" TO "service_role";
GRANT SELECT ON TABLE "public"."abundance_events" TO "cursor_reader";



GRANT ALL ON TABLE "public"."actualization_blueprints" TO "anon";
GRANT ALL ON TABLE "public"."actualization_blueprints" TO "authenticated";
GRANT ALL ON TABLE "public"."actualization_blueprints" TO "service_role";
GRANT ALL ON TABLE "public"."actualization_blueprints" TO "cursor_reader";
GRANT ALL ON TABLE "public"."actualization_blueprints" TO "db_admin";



GRANT ALL ON TABLE "public"."ai_action_token_overrides" TO "anon";
GRANT ALL ON TABLE "public"."ai_action_token_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_action_token_overrides" TO "service_role";
GRANT ALL ON TABLE "public"."ai_action_token_overrides" TO "cursor_reader";
GRANT ALL ON TABLE "public"."ai_action_token_overrides" TO "db_admin";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";
GRANT ALL ON TABLE "public"."ai_conversations" TO "cursor_reader";
GRANT ALL ON TABLE "public"."ai_conversations" TO "db_admin";



GRANT ALL ON TABLE "public"."ai_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "service_role";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "cursor_reader";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "db_admin";



GRANT ALL ON TABLE "public"."assessment_insights" TO "anon";
GRANT ALL ON TABLE "public"."assessment_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_insights" TO "service_role";
GRANT ALL ON TABLE "public"."assessment_insights" TO "cursor_reader";
GRANT ALL ON TABLE "public"."assessment_insights" TO "db_admin";



GRANT ALL ON TABLE "public"."assessment_responses" TO "anon";
GRANT ALL ON TABLE "public"."assessment_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_responses" TO "service_role";
GRANT ALL ON TABLE "public"."assessment_responses" TO "cursor_reader";
GRANT ALL ON TABLE "public"."assessment_responses" TO "db_admin";



GRANT ALL ON TABLE "public"."assessment_results" TO "anon";
GRANT ALL ON TABLE "public"."assessment_results" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_results" TO "service_role";
GRANT ALL ON TABLE "public"."assessment_results" TO "cursor_reader";
GRANT ALL ON TABLE "public"."assessment_results" TO "db_admin";



GRANT ALL ON TABLE "public"."audio_sets" TO "anon";
GRANT ALL ON TABLE "public"."audio_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."audio_sets" TO "service_role";
GRANT SELECT ON TABLE "public"."audio_sets" TO "cursor_reader";



GRANT ALL ON TABLE "public"."audio_tracks" TO "anon";
GRANT ALL ON TABLE "public"."audio_tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."audio_tracks" TO "service_role";
GRANT ALL ON TABLE "public"."audio_tracks" TO "cursor_reader";
GRANT ALL ON TABLE "public"."audio_tracks" TO "db_admin";



GRANT ALL ON TABLE "public"."audio_variants" TO "anon";
GRANT ALL ON TABLE "public"."audio_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."audio_variants" TO "service_role";
GRANT SELECT ON TABLE "public"."audio_variants" TO "cursor_reader";



GRANT ALL ON TABLE "public"."blueprint_insights" TO "anon";
GRANT ALL ON TABLE "public"."blueprint_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."blueprint_insights" TO "service_role";
GRANT ALL ON TABLE "public"."blueprint_insights" TO "cursor_reader";
GRANT ALL ON TABLE "public"."blueprint_insights" TO "db_admin";



GRANT ALL ON TABLE "public"."blueprint_phases" TO "anon";
GRANT ALL ON TABLE "public"."blueprint_phases" TO "authenticated";
GRANT ALL ON TABLE "public"."blueprint_phases" TO "service_role";
GRANT ALL ON TABLE "public"."blueprint_phases" TO "cursor_reader";
GRANT ALL ON TABLE "public"."blueprint_phases" TO "db_admin";



GRANT ALL ON TABLE "public"."blueprint_tasks" TO "anon";
GRANT ALL ON TABLE "public"."blueprint_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."blueprint_tasks" TO "service_role";
GRANT ALL ON TABLE "public"."blueprint_tasks" TO "cursor_reader";
GRANT ALL ON TABLE "public"."blueprint_tasks" TO "db_admin";



GRANT ALL ON TABLE "public"."conversation_sessions" TO "anon";
GRANT ALL ON TABLE "public"."conversation_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_sessions" TO "service_role";
GRANT SELECT ON TABLE "public"."conversation_sessions" TO "cursor_reader";



GRANT ALL ON TABLE "public"."daily_papers" TO "anon";
GRANT ALL ON TABLE "public"."daily_papers" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_papers" TO "service_role";
GRANT SELECT ON TABLE "public"."daily_papers" TO "cursor_reader";



GRANT ALL ON TABLE "public"."emotional_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."emotional_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."emotional_snapshots" TO "service_role";
GRANT SELECT ON TABLE "public"."emotional_snapshots" TO "cursor_reader";



GRANT ALL ON TABLE "public"."frequency_flip" TO "anon";
GRANT ALL ON TABLE "public"."frequency_flip" TO "authenticated";
GRANT ALL ON TABLE "public"."frequency_flip" TO "service_role";
GRANT SELECT ON TABLE "public"."frequency_flip" TO "cursor_reader";



GRANT ALL ON TABLE "public"."generated_images" TO "anon";
GRANT ALL ON TABLE "public"."generated_images" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_images" TO "service_role";
GRANT ALL ON TABLE "public"."generated_images" TO "cursor_reader";
GRANT ALL ON TABLE "public"."generated_images" TO "db_admin";



GRANT ALL ON TABLE "public"."intensive_purchases" TO "anon";
GRANT ALL ON TABLE "public"."intensive_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."intensive_purchases" TO "service_role";
GRANT ALL ON TABLE "public"."intensive_purchases" TO "cursor_reader";
GRANT ALL ON TABLE "public"."intensive_purchases" TO "db_admin";



GRANT ALL ON TABLE "public"."journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entries" TO "service_role";
GRANT ALL ON TABLE "public"."journal_entries" TO "cursor_reader";
GRANT ALL ON TABLE "public"."journal_entries" TO "db_admin";



GRANT ALL ON TABLE "public"."life_vision_category_state" TO "anon";
GRANT ALL ON TABLE "public"."life_vision_category_state" TO "authenticated";
GRANT ALL ON TABLE "public"."life_vision_category_state" TO "service_role";
GRANT SELECT ON TABLE "public"."life_vision_category_state" TO "cursor_reader";



GRANT ALL ON TABLE "public"."media_metadata" TO "anon";
GRANT ALL ON TABLE "public"."media_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."media_metadata" TO "service_role";
GRANT ALL ON TABLE "public"."media_metadata" TO "cursor_reader";
GRANT ALL ON TABLE "public"."media_metadata" TO "db_admin";



GRANT ALL ON TABLE "public"."member_profiles" TO "anon";
GRANT ALL ON TABLE "public"."member_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."member_profiles" TO "service_role";
GRANT ALL ON TABLE "public"."member_profiles" TO "cursor_reader";
GRANT ALL ON TABLE "public"."member_profiles" TO "db_admin";



GRANT ALL ON TABLE "public"."payment_history" TO "anon";
GRANT ALL ON TABLE "public"."payment_history" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_history" TO "service_role";
GRANT ALL ON TABLE "public"."payment_history" TO "cursor_reader";
GRANT ALL ON TABLE "public"."payment_history" TO "db_admin";



GRANT ALL ON TABLE "public"."profile_versions" TO "anon";
GRANT ALL ON TABLE "public"."profile_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_versions" TO "service_role";
GRANT ALL ON TABLE "public"."profile_versions" TO "cursor_reader";
GRANT ALL ON TABLE "public"."profile_versions" TO "db_admin";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."profiles" TO "cursor_reader";
GRANT ALL ON TABLE "public"."profiles" TO "db_admin";



GRANT ALL ON TABLE "public"."prompt_suggestions_cache" TO "anon";
GRANT ALL ON TABLE "public"."prompt_suggestions_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_suggestions_cache" TO "service_role";
GRANT SELECT ON TABLE "public"."prompt_suggestions_cache" TO "cursor_reader";



GRANT ALL ON TABLE "public"."refinements" TO "anon";
GRANT ALL ON TABLE "public"."refinements" TO "authenticated";
GRANT ALL ON TABLE "public"."refinements" TO "service_role";
GRANT ALL ON TABLE "public"."refinements" TO "cursor_reader";
GRANT ALL ON TABLE "public"."refinements" TO "db_admin";



GRANT ALL ON TABLE "public"."refinements_backup_20251111" TO "anon";
GRANT ALL ON TABLE "public"."refinements_backup_20251111" TO "authenticated";
GRANT ALL ON TABLE "public"."refinements_backup_20251111" TO "service_role";
GRANT SELECT ON TABLE "public"."refinements_backup_20251111" TO "cursor_reader";



GRANT ALL ON TABLE "public"."scenes" TO "anon";
GRANT ALL ON TABLE "public"."scenes" TO "authenticated";
GRANT ALL ON TABLE "public"."scenes" TO "service_role";
GRANT SELECT ON TABLE "public"."scenes" TO "cursor_reader";



GRANT ALL ON TABLE "public"."token_drips" TO "anon";
GRANT ALL ON TABLE "public"."token_drips" TO "authenticated";
GRANT ALL ON TABLE "public"."token_drips" TO "service_role";
GRANT ALL ON TABLE "public"."token_drips" TO "cursor_reader";
GRANT ALL ON TABLE "public"."token_drips" TO "db_admin";



GRANT ALL ON TABLE "public"."token_transactions" TO "anon";
GRANT ALL ON TABLE "public"."token_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."token_transactions" TO "service_role";
GRANT ALL ON TABLE "public"."token_transactions" TO "cursor_reader";
GRANT ALL ON TABLE "public"."token_transactions" TO "db_admin";



GRANT ALL ON TABLE "public"."token_usage" TO "anon";
GRANT ALL ON TABLE "public"."token_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."token_usage" TO "service_role";
GRANT ALL ON TABLE "public"."token_usage" TO "cursor_reader";
GRANT ALL ON TABLE "public"."token_usage" TO "db_admin";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";
GRANT ALL ON TABLE "public"."user_profiles" TO "cursor_reader";
GRANT ALL ON TABLE "public"."user_profiles" TO "db_admin";



GRANT ALL ON TABLE "public"."untracked_token_changes" TO "anon";
GRANT ALL ON TABLE "public"."untracked_token_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."untracked_token_changes" TO "service_role";
GRANT SELECT ON TABLE "public"."untracked_token_changes" TO "cursor_reader";



GRANT ALL ON TABLE "public"."user_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stats" TO "service_role";
GRANT ALL ON TABLE "public"."user_stats" TO "cursor_reader";
GRANT ALL ON TABLE "public"."user_stats" TO "db_admin";



GRANT ALL ON TABLE "public"."user_token_balances" TO "anon";
GRANT ALL ON TABLE "public"."user_token_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."user_token_balances" TO "service_role";
GRANT SELECT ON TABLE "public"."user_token_balances" TO "cursor_reader";



GRANT ALL ON TABLE "public"."vibrational_event_sources" TO "anon";
GRANT ALL ON TABLE "public"."vibrational_event_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."vibrational_event_sources" TO "service_role";
GRANT SELECT ON TABLE "public"."vibrational_event_sources" TO "cursor_reader";



GRANT ALL ON TABLE "public"."vibrational_events" TO "anon";
GRANT ALL ON TABLE "public"."vibrational_events" TO "authenticated";
GRANT ALL ON TABLE "public"."vibrational_events" TO "service_role";
GRANT SELECT ON TABLE "public"."vibrational_events" TO "cursor_reader";



GRANT ALL ON TABLE "public"."vibrational_links" TO "anon";
GRANT ALL ON TABLE "public"."vibrational_links" TO "authenticated";
GRANT ALL ON TABLE "public"."vibrational_links" TO "service_role";
GRANT SELECT ON TABLE "public"."vibrational_links" TO "cursor_reader";



GRANT ALL ON TABLE "public"."video_mapping" TO "anon";
GRANT ALL ON TABLE "public"."video_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."video_mapping" TO "service_role";
GRANT SELECT ON TABLE "public"."video_mapping" TO "cursor_reader";



GRANT ALL ON TABLE "public"."vision_audios" TO "anon";
GRANT ALL ON TABLE "public"."vision_audios" TO "authenticated";
GRANT ALL ON TABLE "public"."vision_audios" TO "service_role";
GRANT ALL ON TABLE "public"."vision_audios" TO "cursor_reader";
GRANT ALL ON TABLE "public"."vision_audios" TO "db_admin";



GRANT ALL ON TABLE "public"."vision_board_items" TO "anon";
GRANT ALL ON TABLE "public"."vision_board_items" TO "authenticated";
GRANT ALL ON TABLE "public"."vision_board_items" TO "service_role";
GRANT ALL ON TABLE "public"."vision_board_items" TO "cursor_reader";
GRANT ALL ON TABLE "public"."vision_board_items" TO "db_admin";



GRANT ALL ON TABLE "public"."vision_conversations" TO "anon";
GRANT ALL ON TABLE "public"."vision_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."vision_conversations" TO "service_role";
GRANT ALL ON TABLE "public"."vision_conversations" TO "cursor_reader";
GRANT ALL ON TABLE "public"."vision_conversations" TO "db_admin";



GRANT ALL ON TABLE "public"."vision_progress" TO "anon";
GRANT ALL ON TABLE "public"."vision_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."vision_progress" TO "service_role";
GRANT ALL ON TABLE "public"."vision_progress" TO "cursor_reader";
GRANT ALL ON TABLE "public"."vision_progress" TO "db_admin";



GRANT ALL ON TABLE "public"."vision_versions" TO "anon";
GRANT ALL ON TABLE "public"."vision_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."vision_versions" TO "service_role";
GRANT ALL ON TABLE "public"."vision_versions" TO "cursor_reader";
GRANT ALL ON TABLE "public"."vision_versions" TO "db_admin";



GRANT ALL ON TABLE "public"."vision_versions_backup_20251111" TO "anon";
GRANT ALL ON TABLE "public"."vision_versions_backup_20251111" TO "authenticated";
GRANT ALL ON TABLE "public"."vision_versions_backup_20251111" TO "service_role";
GRANT SELECT ON TABLE "public"."vision_versions_backup_20251111" TO "cursor_reader";



GRANT ALL ON TABLE "public"."viva_conversations" TO "anon";
GRANT ALL ON TABLE "public"."viva_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."viva_conversations" TO "service_role";
GRANT SELECT ON TABLE "public"."viva_conversations" TO "cursor_reader";



GRANT ALL ON TABLE "public"."voice_profiles" TO "anon";
GRANT ALL ON TABLE "public"."voice_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."voice_profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."voice_profiles" TO "cursor_reader";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,USAGE ON SEQUENCES TO "cursor_reader";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT ON TABLES TO "cursor_reader";































RESET ALL;
