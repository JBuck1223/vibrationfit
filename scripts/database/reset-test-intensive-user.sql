-- ============================================================================
-- Reset Test User's Intensive Progress
-- ============================================================================
-- Use this to reset a test user back to the beginning of the intensive
-- without deleting the user account.
-- ============================================================================

DO $$
DECLARE
  v_test_email TEXT := 'test-intensive@vibrationfit.com';  -- CHANGE THIS
  v_user_id UUID;
  v_intensive_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_test_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', v_test_email;
  END IF;

  -- Delete existing intensive data
  DELETE FROM public.intensive_checklist WHERE user_id = v_user_id;
  DELETE FROM public.intensive_purchases WHERE user_id = v_user_id;

  -- Create fresh intensive purchase
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
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'test_reset_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    49900,
    'usd',
    'full',
    1,
    1,
    'pending',
    NOW()
  )
  RETURNING id INTO v_intensive_id;

  -- Create fresh checklist (all steps incomplete, not started)
  INSERT INTO public.intensive_checklist (
    id,
    intensive_id,
    user_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_intensive_id,
    v_user_id,
    'pending',
    NOW(),
    NOW()
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'USER INTENSIVE RESET COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', v_test_email;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'New Intensive ID: %', v_intensive_id;
  RAISE NOTICE '';
  RAISE NOTICE 'User can now start the intensive from Step 0 (Start)';
  RAISE NOTICE '========================================';

END $$;
