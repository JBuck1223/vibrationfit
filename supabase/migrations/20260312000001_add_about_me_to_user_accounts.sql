-- Add about_me field to user_accounts for public profile blurbs
ALTER TABLE public.user_accounts
ADD COLUMN IF NOT EXISTS about_me text;

COMMENT ON COLUMN public.user_accounts.about_me IS 'Short bio/about me blurb displayed on the member snapshot page';
