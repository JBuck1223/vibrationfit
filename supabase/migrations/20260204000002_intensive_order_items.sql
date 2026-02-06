-- Move intensive purchase data into order_items and remove intensive_purchases

-- ============================================================================
-- ORDER_ITEMS: ADD INTENSIVE FIELDS
-- ============================================================================
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS payment_plan text DEFAULT 'full'::text,
  ADD COLUMN IF NOT EXISTS installments_total integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS installments_paid integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_installment_date timestamp without time zone,
  ADD COLUMN IF NOT EXISTS completion_status text DEFAULT 'pending'::text,
  ADD COLUMN IF NOT EXISTS activation_deadline timestamp without time zone,
  ADD COLUMN IF NOT EXISTS started_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS completed_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS refunded_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS campaign_name text;

ALTER TABLE public.order_items
  DROP COLUMN IF EXISTS intensive_purchase_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'order_items_valid_completion_status'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_valid_completion_status
      CHECK (
        completion_status IS NULL OR completion_status = ANY (
          ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'refunded'::text]
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'order_items_valid_payment_plan'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_valid_payment_plan
      CHECK (
        payment_plan IS NULL OR payment_plan = ANY (
          ARRAY['full'::text, '2pay'::text, '3pay'::text]
        )
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_order_items_status ON public.order_items(completion_status);
CREATE INDEX IF NOT EXISTS idx_order_items_started_at ON public.order_items(started_at);

-- ============================================================================
-- BACKFILL FROM intensive_purchases (if exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'intensive_purchases'
  ) THEN
    UPDATE public.order_items oi
    SET
      stripe_payment_intent_id = ip.stripe_payment_intent_id,
      stripe_checkout_session_id = ip.stripe_checkout_session_id,
      payment_plan = ip.payment_plan,
      installments_total = ip.installments_total,
      installments_paid = ip.installments_paid,
      next_installment_date = ip.next_installment_date,
      completion_status = ip.completion_status,
      activation_deadline = ip.activation_deadline,
      started_at = ip.started_at,
      completed_at = ip.completed_at,
      refunded_at = ip.refunded_at,
      promo_code = ip.promo_code,
      referral_source = ip.referral_source,
      campaign_name = ip.campaign_name
    FROM public.intensive_purchases ip
    WHERE oi.id = ip.order_item_id;
  END IF;
END
$$;

-- ============================================================================
-- UPDATE CHECKLIST/RESPONSES TO REFERENCE ORDER_ITEMS
-- ============================================================================
ALTER TABLE public.intensive_checklist
  DROP CONSTRAINT IF EXISTS intensive_checklist_intensive_id_fkey;

ALTER TABLE public.intensive_checklist
  ADD CONSTRAINT intensive_checklist_intensive_id_fkey
  FOREIGN KEY (intensive_id) REFERENCES public.order_items(id) ON DELETE CASCADE;

ALTER TABLE public.intensive_responses
  DROP CONSTRAINT IF EXISTS intensive_responses_intensive_id_fkey;

ALTER TABLE public.intensive_responses
  ADD CONSTRAINT intensive_responses_intensive_id_fkey
  FOREIGN KEY (intensive_id) REFERENCES public.order_items(id) ON DELETE CASCADE;

-- ============================================================================
-- DROP intensive_purchases (no longer needed)
-- ============================================================================
DROP TABLE IF EXISTS public.intensive_purchases CASCADE;
