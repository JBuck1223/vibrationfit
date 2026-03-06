-- Drop intensive-related columns from order_items
-- These are now fully tracked on intensive_checklist (the single source of truth)
-- order_items retains only billing/payment data (amount, payment_plan, installments, etc.)

ALTER TABLE public.order_items
  DROP COLUMN IF EXISTS completion_status,
  DROP COLUMN IF EXISTS activation_deadline,
  DROP COLUMN IF EXISTS started_at,
  DROP COLUMN IF EXISTS completed_at,
  DROP COLUMN IF EXISTS refunded_at,
  DROP COLUMN IF EXISTS intensive_purchase_id;

-- Drop the now-orphaned constraint
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_valid_completion_status;

-- Drop the now-orphaned indexes
DROP INDEX IF EXISTS public.idx_order_items_started_at;
DROP INDEX IF EXISTS public.idx_order_items_status;
