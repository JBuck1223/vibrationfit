-- New referral codes use first name + last name (lowercase, punctuation stripped).
-- Email local-part remains the fallback when no name is on the signup.

CREATE OR REPLACE FUNCTION public.auto_enroll_referral()
RETURNS TRIGGER AS $$
DECLARE
  base_code TEXT;
  candidate TEXT;
  counter INT := 0;
  existing_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_display_name TEXT;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO existing_id
  FROM public.referral_participants
  WHERE email = NEW.email;

  IF existing_id IS NOT NULL THEN
    UPDATE public.referral_participants
    SET user_id = NEW.id
    WHERE id = existing_id AND user_id IS NULL;
    RETURN NEW;
  END IF;

  v_first_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), '');
  v_last_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), '');

  IF v_first_name IS NULL AND v_last_name IS NULL THEN
    v_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
    IF v_full_name IS NOT NULL THEN
      v_first_name := NULLIF(SPLIT_PART(v_full_name, ' ', 1), '');
      IF POSITION(' ' IN v_full_name) > 0 THEN
        v_last_name := NULLIF(TRIM(SUBSTRING(v_full_name FROM POSITION(' ' IN v_full_name) + 1)), '');
      END IF;
    END IF;
  END IF;

  base_code := lower(regexp_replace(COALESCE(v_first_name, '') || COALESCE(v_last_name, ''), '[^a-zA-Z0-9]', '', 'g'));
  IF length(base_code) < 2 THEN
    base_code := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  END IF;
  IF length(base_code) < 2 THEN
    base_code := 'vibe';
  END IF;
  base_code := left(base_code, 15);
  candidate := base_code;

  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.referral_participants WHERE referral_code = candidate
    ) AND NOT EXISTS (
      SELECT 1 FROM public.referral_code_history WHERE old_code = candidate
    );

    counter := counter + 1;
    candidate := base_code || (floor(random() * 9000) + 1000)::int::text;

    IF counter > 50 THEN
      candidate := left(base_code || extract(epoch from now())::bigint::text, 20);
      EXIT;
    END IF;
  END LOOP;

  v_display_name := NULLIF(TRIM(CONCAT_WS(' ', v_first_name, v_last_name)), '');
  IF v_display_name IS NULL THEN
    v_display_name := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.referral_participants (user_id, email, referral_code, display_name)
  VALUES (NEW.id, NEW.email, candidate, v_display_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
