-- Add favorite_quote column to user_accounts for member profiles
ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS favorite_quote text;
