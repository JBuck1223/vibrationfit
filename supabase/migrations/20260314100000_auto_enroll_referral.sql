-- Auto-enroll every new user in the referral program
-- Also backfills existing users who don't have a referral entry

-- ============================================================================
-- TRIGGER FUNCTION: auto-create referral_participants on user signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_enroll_referral()
RETURNS TRIGGER AS $$
DECLARE
  base_code TEXT;
  candidate TEXT;
  counter INT := 0;
  existing_id UUID;
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

  base_code := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '', 'g'));
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
      candidate := base_code || extract(epoch from now())::bigint::text;
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.referral_participants (user_id, email, referral_code, display_name)
  VALUES (NEW.id, NEW.email, candidate, split_part(NEW.email, '@', 1));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_enroll_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enroll_referral();

-- ============================================================================
-- BACKFILL: enroll existing users who don't have a referral entry
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  base_code TEXT;
  candidate TEXT;
  counter INT;
BEGIN
  FOR r IN
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN public.referral_participants rp ON rp.email = u.email
    WHERE rp.id IS NULL AND u.email IS NOT NULL
  LOOP
    base_code := lower(regexp_replace(split_part(r.email, '@', 1), '[^a-z0-9]', '', 'g'));
    IF length(base_code) < 2 THEN
      base_code := 'vibe';
    END IF;
    base_code := left(base_code, 15);
    candidate := base_code;
    counter := 0;

    LOOP
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.referral_participants WHERE referral_code = candidate
      ) AND NOT EXISTS (
        SELECT 1 FROM public.referral_code_history WHERE old_code = candidate
      );

      counter := counter + 1;
      candidate := base_code || (floor(random() * 9000) + 1000)::int::text;

      IF counter > 50 THEN
        candidate := base_code || extract(epoch from now())::bigint::text;
        EXIT;
      END IF;
    END LOOP;

    INSERT INTO public.referral_participants (user_id, email, referral_code, display_name)
    VALUES (r.id, r.email, candidate, split_part(r.email, '@', 1))
    ON CONFLICT (email) DO UPDATE SET user_id = r.id
    WHERE referral_participants.user_id IS NULL;
  END LOOP;
END $$;
