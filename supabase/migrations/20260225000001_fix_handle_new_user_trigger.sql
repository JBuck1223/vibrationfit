-- Fix handle_new_user() to properly parse full_name into first_name/last_name
-- and sync phone from user_metadata.
--
-- The checkout API passes user_metadata: { full_name, phone }
-- but the old trigger only looked for first_name / last_name keys (which were never set).

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_phone text;
BEGIN
  -- Try explicit first_name / last_name first
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name  := NEW.raw_user_meta_data->>'last_name';

  -- Fall back to splitting full_name if individual names are missing
  IF v_first_name IS NULL AND v_last_name IS NULL THEN
    v_full_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    IF v_full_name != '' THEN
      v_first_name := SPLIT_PART(v_full_name, ' ', 1);
      -- Everything after the first space becomes last_name
      IF POSITION(' ' IN v_full_name) > 0 THEN
        v_last_name := TRIM(SUBSTRING(v_full_name FROM POSITION(' ' IN v_full_name) + 1));
      END IF;
    END IF;
  END IF;

  v_phone := NEW.raw_user_meta_data->>'phone';

  INSERT INTO public.user_accounts (id, email, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(TRIM(v_first_name), ''),
    NULLIF(TRIM(v_last_name), ''),
    NULLIF(TRIM(v_phone), '')
  );

  RETURN NEW;
END;
$$;
