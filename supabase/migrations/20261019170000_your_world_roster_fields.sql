-- Your World (Getting Started): facts the Life Vision writing step does not collect.
-- The address stays on the user_accounts shipping columns. These hold the rest.

ALTER TABLE public.member_roster
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS ethnicity text,
  ADD COLUMN IF NOT EXISTS social_preference text,
  ADD COLUMN IF NOT EXISTS hobbies text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS work jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS money jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.member_roster.gender IS 'Your World. Explicit only.';
COMMENT ON COLUMN public.member_roster.ethnicity IS 'Your World. Explicit only.';
COMMENT ON COLUMN public.member_roster.social_preference IS 'Your World. introvert, ambivert, or extrovert.';
COMMENT ON COLUMN public.member_roster.hobbies IS 'Your World. Current hobbies, member-stated.';
COMMENT ON COLUMN public.member_roster.work IS 'Your World work facts: employment_type, occupation, company, time_in_role, education, education_description.';
COMMENT ON COLUMN public.member_roster.money IS 'Your World money brackets: currency, household_income, savings_retirement, assets_equity, consumer_debt.';
