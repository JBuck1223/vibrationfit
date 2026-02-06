-- ============================================================================
-- Create Test User for Activation Intensive Testing
-- ============================================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates a complete test user enrolled in the Activation Intensive
-- 
-- IMPORTANT: After running this, the test user can log in via Magic Link
-- Send a magic link to the test email address to log in!
-- ============================================================================

-- Set your test user details here
DO $$
DECLARE
  v_test_email TEXT := 'test-intensive@vibrationfit.com';  -- CHANGE THIS to your test email
  v_test_first_name TEXT := 'Test';
  v_test_last_name TEXT := 'Intensive';
  v_test_phone TEXT := '+15551234567';
  v_user_id UUID;
  v_intensive_id UUID;
BEGIN
  -- ============================================================================
  -- STEP 1: Create the auth user (if not exists)
  -- ============================================================================
  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_test_email;

  IF v_user_id IS NULL THEN
    -- Create the auth user
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
      '', -- Empty password - will use magic link
      NOW(), -- Email already confirmed
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object(
        'first_name', v_test_first_name,
        'last_name', v_test_last_name
      ),
      NOW(),
      NOW(),
      '',
      ''
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Created new auth user with ID: %', v_user_id;
  ELSE
    RAISE NOTICE 'User already exists with ID: %', v_user_id;
  END IF;

  -- ============================================================================
  -- STEP 2: Create or update user_accounts row
  -- ============================================================================
  INSERT INTO public.user_accounts (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_test_email,
    v_test_first_name,
    v_test_last_name,
    v_test_phone,
    'member',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  RAISE NOTICE 'User account created/updated for user ID: %', v_user_id;

  -- ============================================================================
  -- STEP 3: Create intensive order item
  -- ============================================================================
  SELECT oi.id INTO v_intensive_id
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.products p ON p.id = oi.product_id
  WHERE o.user_id = v_user_id
    AND p.product_type = 'intensive'
    AND oi.completion_status IN ('pending', 'in_progress')
  LIMIT 1;

  IF v_intensive_id IS NULL THEN
    INSERT INTO public.orders (
      id,
      user_id,
      total_amount,
      currency,
      status,
      paid_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      49900,
      'usd',
      'paid',
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_intensive_id;

    INSERT INTO public.order_items (
      id,
      order_id,
      product_id,
      quantity,
      amount,
      currency,
      is_subscription,
      stripe_payment_intent_id,
      payment_plan,
      installments_total,
      installments_paid,
      completion_status,
      activation_deadline,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_intensive_id,
      (SELECT id FROM public.products WHERE key = 'intensive' LIMIT 1),
      1,
      49900,
      'usd',
      FALSE,
      'test_manual_enrollment_' || EXTRACT(EPOCH FROM NOW())::TEXT,
      'full',
      1,
      1,
      'pending',
      NULL,
      NOW()
    )
    RETURNING id INTO v_intensive_id;

    RAISE NOTICE 'Created intensive order item with ID: %', v_intensive_id;
  ELSE
    RAISE NOTICE 'User already has active intensive order item with ID: %', v_intensive_id;
  END IF;

  -- ============================================================================
  -- STEP 4: Create intensive_checklist row
  -- ============================================================================
  INSERT INTO public.intensive_checklist (
    id,
    intensive_id,
    user_id,
    status,
    -- All steps start as false (not completed)
    intake_completed,
    profile_completed,
    assessment_completed,
    vision_built,
    vision_refined,
    audio_generated,
    audios_generated,
    vision_board_completed,
    first_journal_entry,
    call_scheduled,
    activation_protocol_completed,
    unlock_completed,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_intensive_id,
    v_user_id,
    'pending', -- Status: pending (not started yet)
    false, -- intake_completed
    false, -- profile_completed
    false, -- assessment_completed
    false, -- vision_built
    false, -- vision_refined
    false, -- audio_generated
    false, -- audios_generated
    false, -- vision_board_completed
    false, -- first_journal_entry
    false, -- call_scheduled
    false, -- activation_protocol_completed
    false, -- unlock_completed
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING; -- Skip if already exists

  RAISE NOTICE 'Intensive checklist created for user ID: %', v_user_id;

  -- ============================================================================
  -- DONE! Summary
  -- ============================================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST USER CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', v_test_email;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Intensive ID: %', v_intensive_id;
  RAISE NOTICE '';
  RAISE NOTICE 'To log in:';
  RAISE NOTICE '1. Go to your app login page';
  RAISE NOTICE '2. Enter: %', v_test_email;
  RAISE NOTICE '3. Click "Send Magic Link"';
  RAISE NOTICE '4. Check your email for the magic link';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm)
-- ============================================================================

-- Check the user was created:
-- SELECT id, email, created_at FROM auth.users WHERE email = 'test-intensive@vibrationfit.com';

-- Check user_accounts:
-- SELECT id, email, first_name, last_name, phone FROM public.user_accounts WHERE email = 'test-intensive@vibrationfit.com';

-- Check intensive order_items:
-- SELECT * FROM public.order_items WHERE order_id IN (
--   SELECT id FROM public.orders WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-intensive@vibrationfit.com')
-- );

-- Check intensive_checklist:
-- SELECT * FROM public.intensive_checklist WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-intensive@vibrationfit.com');
