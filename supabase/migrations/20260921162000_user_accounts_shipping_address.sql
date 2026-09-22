-- Optional mailing address on the account, for sending physical items.
-- Separate from the Life Profile home section.

ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS shipping_line1 text,
  ADD COLUMN IF NOT EXISTS shipping_line2 text,
  ADD COLUMN IF NOT EXISTS shipping_city text,
  ADD COLUMN IF NOT EXISTS shipping_state text,
  ADD COLUMN IF NOT EXISTS shipping_postal_code text,
  ADD COLUMN IF NOT EXISTS shipping_country text;

COMMENT ON COLUMN public.user_accounts.shipping_line1 IS 'Street address for sending physical items. Optional.';
COMMENT ON COLUMN public.user_accounts.shipping_line2 IS 'Apartment, suite, or unit. Optional.';
COMMENT ON COLUMN public.user_accounts.shipping_city IS 'Shipping city. Optional.';
COMMENT ON COLUMN public.user_accounts.shipping_state IS 'Shipping state or region. Optional.';
COMMENT ON COLUMN public.user_accounts.shipping_postal_code IS 'Shipping postal code. Optional.';
COMMENT ON COLUMN public.user_accounts.shipping_country IS 'Shipping country. Optional.';
