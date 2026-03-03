-- Create premium_applications table for Premium Activation application form submissions

CREATE TABLE IF NOT EXISTS public.premium_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  current_situation text NOT NULL,
  desired_vision text NOT NULL,
  tried_before text NOT NULL,
  commitment_level integer NOT NULL CHECK (commitment_level BETWEEN 1 AND 10),
  able_to_invest boolean NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'enrolled', 'declined')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.premium_applications IS 'Application submissions for the Premium Activation Intensive';

ALTER TABLE public.premium_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage premium applications"
  ON public.premium_applications
  FOR ALL
  USING (true)
  WITH CHECK (true);
