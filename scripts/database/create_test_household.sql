-- Create a test household for the current user
-- Run this in Supabase SQL Editor to quickly create a household for testing

-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- You can find your user ID by running: SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
  v_household_id UUID;
BEGIN
  -- Create household
  INSERT INTO households (
    admin_user_id,
    name,
    plan_type,
    max_members,
    shared_tokens_enabled
  ) VALUES (
    v_user_id,
    'Test Household',
    'household',
    2,
    true
  )
  RETURNING id INTO v_household_id;
  
  RAISE NOTICE 'Created household: %', v_household_id;
  
  -- Add user as household member
  INSERT INTO household_members (
    household_id,
    user_id,
    role,
    status,
    allow_shared_tokens,
    joined_at,
    accepted_at
  ) VALUES (
    v_household_id,
    v_user_id,
    'admin',
    'active',
    true,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Added user as household member';
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    household_id = v_household_id,
    is_household_admin = true,
    allow_shared_tokens = true
  WHERE user_id = v_user_id;
  
  RAISE NOTICE 'Updated user profile';
  
  RAISE NOTICE 'Test household created successfully! You can now test invitations.';
END $$;

