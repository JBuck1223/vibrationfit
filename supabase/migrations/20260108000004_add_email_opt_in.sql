-- Add email_opt_in to user_accounts
-- Migration: 20260108000004_add_email_opt_in.sql

-- Add email_opt_in column with default true (opt-in by default)
ALTER TABLE public.user_accounts
ADD COLUMN IF NOT EXISTS email_opt_in BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.user_accounts.email_opt_in IS 'User email notification opt-in preference';

-- Create index for email opt-in queries
CREATE INDEX IF NOT EXISTS idx_user_accounts_email_opt_in 
ON public.user_accounts USING btree (email_opt_in) TABLESPACE pg_default
WHERE (email_opt_in = true);
