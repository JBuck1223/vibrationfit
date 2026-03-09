-- Auto-convert leads when a matching user signs up.
-- Matches by email (case-insensitive). Only converts leads that are not
-- already in a terminal state (converted / lost).

CREATE OR REPLACE FUNCTION public.convert_lead_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leads
  SET
    status = 'converted',
    converted_to_user_id = NEW.id,
    updated_at = now()
  WHERE
    LOWER(email) = LOWER(NEW.email)
    AND status NOT IN ('converted', 'lost');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_convert_lead ON auth.users;
CREATE TRIGGER on_auth_user_created_convert_lead
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.convert_lead_on_signup();
