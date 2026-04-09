-- Add is_active flag to user_accounts for CRM exclusion
ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.user_accounts.is_active IS 'When false, user is excluded from all CRM segments and email communications';

-- Mark inactive members
UPDATE public.user_accounts
SET is_active = false, updated_at = now()
WHERE id IN (
  '0d0efa35-514e-47cf-ba46-6e4fdef1fb53',  -- Star Rougeau Rogers
  'feab1cdb-e3ba-4cb3-80f7-e2bad9292bab'   -- Jeanie King
);
