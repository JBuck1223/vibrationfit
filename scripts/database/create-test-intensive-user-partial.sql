-- ============================================================================
-- Create Test User with PARTIAL Intensive Progress
-- ============================================================================
-- Use this to test specific stages of the intensive without completing
-- all prior steps manually.
--
-- CUSTOMIZE: Set which steps should be marked as complete below
-- ============================================================================

-- Set your test user details and progress here
DO $$
DECLARE
  v_test_email TEXT := 'test-intensive-partial@vibrationfit.com';  -- CHANGE THIS
  v_test_first_name TEXT := 'Tester';
  v_test_last_name TEXT := 'Partial';
  v_test_phone TEXT := '+15559876543';
  
  -- ============================================================================
  -- CONFIGURE WHICH STEPS ARE COMPLETED (set to TRUE to pre-complete)
  -- ============================================================================
  -- Phase 1: Setup
  v_settings_done BOOLEAN := TRUE;       -- Step 1: Account Settings (filled in user_accounts)
  v_intake_done BOOLEAN := TRUE;         -- Step 2: Baseline Intake
  
  -- Phase 2: Foundation
  v_profile_done BOOLEAN := TRUE;        -- Step 3: Profile
  v_assessment_done BOOLEAN := TRUE;     -- Step 4: Assessment
  
  -- Phase 3: Vision Creation
  v_vision_built_done BOOLEAN := TRUE;   -- Step 5: Build Life Vision
  v_vision_refined_done BOOLEAN := FALSE; -- Step 6: Refine Vision (TEST FROM HERE)
  
  -- Phase 4: Audio
  v_audio_generated_done BOOLEAN := FALSE; -- Step 7: Generate Audio
  v_audios_mixed_done BOOLEAN := FALSE;    -- Step 9: Audio Mix
  
  -- Phase 5: Activation
  v_vision_board_done BOOLEAN := FALSE;    -- Step 10: Vision Board
  v_journal_done BOOLEAN := FALSE;         -- Step 11: First Journal Entry
  v_call_scheduled_done BOOLEAN := FALSE;  -- Step 12: Book Calibration Call
  
  -- Phase 6: Completion
  v_activation_protocol_done BOOLEAN := FALSE; -- Step 13: Activation Protocol
  v_unlock_done BOOLEAN := FALSE;              -- Step 14: Platform Unlock
  -- ============================================================================

  v_user_id UUID;
  v_intensive_id UUID;
  v_now TIMESTAMP := NOW();
BEGIN
  -- ============================================================================
  -- STEP 1: Create or get the auth user
  -- ============================================================================
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_test_email;

  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_test_email,
      '',
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('first_name', v_test_first_name, 'last_name', v_test_last_name),
      NOW(),
      NOW(),
      '',
      ''
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Created auth user: %', v_user_id;
  ELSE
    RAISE NOTICE 'Using existing auth user: %', v_user_id;
  END IF;

  -- ============================================================================
  -- STEP 2: Create/update user_accounts (Step 1 Settings data)
  -- ============================================================================
  INSERT INTO public.user_accounts (
    id, email, first_name, last_name, phone, role, created_at, updated_at
  ) VALUES (
    v_user_id,
    v_test_email,
    CASE WHEN v_settings_done THEN v_test_first_name ELSE NULL END,
    CASE WHEN v_settings_done THEN v_test_last_name ELSE NULL END,
    CASE WHEN v_settings_done THEN v_test_phone ELSE NULL END,
    'member',
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = CASE WHEN v_settings_done THEN v_test_first_name ELSE NULL END,
    last_name = CASE WHEN v_settings_done THEN v_test_last_name ELSE NULL END,
    phone = CASE WHEN v_settings_done THEN v_test_phone ELSE NULL END,
    updated_at = v_now;

  -- ============================================================================
  -- STEP 3: Create intensive_purchases
  -- ============================================================================
  -- Delete any existing intensive for clean slate
  DELETE FROM public.intensive_checklist WHERE user_id = v_user_id;
  DELETE FROM public.intensive_purchases WHERE user_id = v_user_id;

  INSERT INTO public.intensive_purchases (
    id,
    user_id,
    stripe_payment_intent_id,
    amount,
    currency,
    payment_plan,
    installments_total,
    installments_paid,
    completion_status,
    activation_deadline,
    started_at,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'test_partial_' || EXTRACT(EPOCH FROM v_now)::TEXT,
    49900,
    'usd',
    'full',
    1,
    1,
    'pending',
    v_now + INTERVAL '72 hours', -- Set deadline 72h from now
    v_now, -- Already started
    v_now
  )
  RETURNING id INTO v_intensive_id;

  RAISE NOTICE 'Created intensive purchase: %', v_intensive_id;

  -- ============================================================================
  -- STEP 4: Create intensive_checklist with configured progress
  -- ============================================================================
  INSERT INTO public.intensive_checklist (
    id,
    intensive_id,
    user_id,
    status,
    started_at,
    
    -- Phase 1: Setup
    intake_completed,
    intake_completed_at,
    
    -- Phase 2: Foundation
    profile_completed,
    profile_completed_at,
    assessment_completed,
    assessment_completed_at,
    
    -- Phase 3: Vision Creation
    vision_built,
    vision_built_at,
    vision_refined,
    vision_refined_at,
    
    -- Phase 4: Audio
    audio_generated,
    audio_generated_at,
    audios_generated,
    audios_generated_at,
    
    -- Phase 5: Activation
    vision_board_completed,
    vision_board_completed_at,
    first_journal_entry,
    first_journal_entry_at,
    call_scheduled,
    call_scheduled_at,
    
    -- Phase 6: Completion
    activation_protocol_completed,
    activation_protocol_completed_at,
    unlock_completed,
    unlock_completed_at,
    
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_intensive_id,
    v_user_id,
    'in_progress', -- Started
    v_now,         -- started_at
    
    -- Phase 1
    v_intake_done,
    CASE WHEN v_intake_done THEN v_now - INTERVAL '1 hour' ELSE NULL END,
    
    -- Phase 2
    v_profile_done,
    CASE WHEN v_profile_done THEN v_now - INTERVAL '50 minutes' ELSE NULL END,
    v_assessment_done,
    CASE WHEN v_assessment_done THEN v_now - INTERVAL '40 minutes' ELSE NULL END,
    
    -- Phase 3
    v_vision_built_done,
    CASE WHEN v_vision_built_done THEN v_now - INTERVAL '30 minutes' ELSE NULL END,
    v_vision_refined_done,
    CASE WHEN v_vision_refined_done THEN v_now - INTERVAL '20 minutes' ELSE NULL END,
    
    -- Phase 4
    v_audio_generated_done,
    CASE WHEN v_audio_generated_done THEN v_now - INTERVAL '15 minutes' ELSE NULL END,
    v_audios_mixed_done,
    CASE WHEN v_audios_mixed_done THEN v_now - INTERVAL '10 minutes' ELSE NULL END,
    
    -- Phase 5
    v_vision_board_done,
    CASE WHEN v_vision_board_done THEN v_now - INTERVAL '8 minutes' ELSE NULL END,
    v_journal_done,
    CASE WHEN v_journal_done THEN v_now - INTERVAL '5 minutes' ELSE NULL END,
    v_call_scheduled_done,
    CASE WHEN v_call_scheduled_done THEN v_now - INTERVAL '3 minutes' ELSE NULL END,
    
    -- Phase 6
    v_activation_protocol_done,
    CASE WHEN v_activation_protocol_done THEN v_now - INTERVAL '2 minutes' ELSE NULL END,
    v_unlock_done,
    CASE WHEN v_unlock_done THEN v_now - INTERVAL '1 minute' ELSE NULL END,
    
    v_now,
    v_now
  );

  -- ============================================================================
  -- Summary
  -- ============================================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PARTIAL PROGRESS TEST USER CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', v_test_email;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Intensive ID: %', v_intensive_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Completed Steps:';
  RAISE NOTICE '  [%] Step 1: Settings', CASE WHEN v_settings_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 2: Intake', CASE WHEN v_intake_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 3: Profile', CASE WHEN v_profile_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 4: Assessment', CASE WHEN v_assessment_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 5: Vision Built', CASE WHEN v_vision_built_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 6: Vision Refined', CASE WHEN v_vision_refined_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 7: Audio Generated', CASE WHEN v_audio_generated_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 9: Audio Mix', CASE WHEN v_audios_mixed_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 10: Vision Board', CASE WHEN v_vision_board_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 11: Journal', CASE WHEN v_journal_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 12: Book Call', CASE WHEN v_call_scheduled_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 13: Activation Protocol', CASE WHEN v_activation_protocol_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '  [%] Step 14: Unlock', CASE WHEN v_unlock_done THEN 'X' ELSE ' ' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Login via Magic Link to: %', v_test_email;
  RAISE NOTICE '========================================';

END $$;
