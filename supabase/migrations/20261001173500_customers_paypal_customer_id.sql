-- PayPal vault customer id, stored next to stripe_customer_id.
-- PayPal creates this id when a card is vaulted. Keeping it on the customer
-- lets us list that buyer's saved cards even if a payment_methods row is missing.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS paypal_customer_id text;

COMMENT ON COLUMN public.customers.paypal_customer_id IS
  'PayPal vault customer id (created when a card is saved). Used to list and attach that buyer''s vaulted cards.';

CREATE INDEX IF NOT EXISTS customers_paypal_customer_id_idx
  ON public.customers (paypal_customer_id)
  WHERE paypal_customer_id IS NOT NULL;
