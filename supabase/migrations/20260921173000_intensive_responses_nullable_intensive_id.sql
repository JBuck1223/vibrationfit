-- Life Activation surveys reuse intensive_responses without an Intensive order.
ALTER TABLE public.intensive_responses
  ALTER COLUMN intensive_id DROP NOT NULL;

COMMENT ON COLUMN public.intensive_responses.intensive_id IS
  'Order item for Activation Intensive. Null when the same survey is saved from Life Activation (/begin) without an intensive checklist.';
