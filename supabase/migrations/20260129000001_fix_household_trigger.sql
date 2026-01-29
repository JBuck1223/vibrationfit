-- Fix create_solo_household_for_new_account trigger function
-- The function was using incorrect column names:
-- - billing_status (should be subscription_status)
-- - max_household_members (should be max_members)

CREATE OR REPLACE FUNCTION public.create_solo_household_for_new_account() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Only create household if user doesn't already have one
  IF NEW.household_id IS NULL THEN
    -- Create solo household
    INSERT INTO households (
      admin_user_id,
      name,
      plan_type,
      subscription_status,
      max_members,
      shared_tokens_enabled
    ) VALUES (
      NEW.id,
      'My Household',
      'solo',
      'trialing', -- New users start in trial
      1,
      FALSE
    )
    RETURNING id INTO new_household_id;

    -- Create household_members record
    INSERT INTO household_members (
      household_id,
      user_id,
      role,
      status,
      allow_shared_tokens,
      joined_at,
      accepted_at
    ) VALUES (
      new_household_id,
      NEW.id,
      'admin',
      'active',
      TRUE,
      NOW(),
      NOW()
    );

    -- Update the user_accounts record with the household_id
    NEW.household_id := new_household_id;
    NEW.is_household_admin := TRUE;
  END IF;

  RETURN NEW;
END;
$$;
