-- Public Assessment for Lead Generation
-- Allows assessment_results to be created without a user account (linked to a lead instead)

-- 1. Add 'assessment' to leads type CHECK constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_type_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_type_check
  CHECK (type = ANY(ARRAY['contact','demo','intensive_intake','assessment']));

-- 2. Make user_id nullable on assessment_results (for lead-based assessments)
ALTER TABLE public.assessment_results ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add lead_id, email, and metadata columns to assessment_results
ALTER TABLE public.assessment_results
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id),
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_assessment_results_lead_id ON public.assessment_results(lead_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_email ON public.assessment_results(email);

-- 4. Account linking trigger: when a new user signs up, attach any lead assessments
CREATE OR REPLACE FUNCTION public.link_lead_assessments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.assessment_results
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL
    AND lead_id IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_link_assessments ON auth.users;
CREATE TRIGGER on_auth_user_created_link_assessments
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_lead_assessments();
