-- Household seats + recurring add-ons for DB-driven billing.
-- subscription_addons itemizes everything charged on top of a subscription's
-- base tier price; the billing cron sums active rows into the renewal charge
-- and applies each row's grant (tokens/storage) every cycle. Seats are
-- capacity-only rows (no grant).

-- ---------------------------------------------------------------------------
-- 1. subscription_addons
-- ---------------------------------------------------------------------------
CREATE TABLE public.subscription_addons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id uuid NOT NULL REFERENCES public.customer_subscriptions(id) ON DELETE CASCADE,
    addon_type text NOT NULL CHECK (addon_type IN ('seat', 'tokens', 'storage')),
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_amount_cents integer NOT NULL DEFAULT 0 CHECK (unit_amount_cents >= 0),
    grant_amount bigint NOT NULL DEFAULT 0,
    grant_unit text CHECK (grant_unit IS NULL OR grant_unit IN ('tokens', 'storage_gb')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled')),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subscription_addons IS 'Recurring items charged on top of a subscription base price (seats, token/storage add-ons). Billing cron charges base + sum(active addons) and applies grants each cycle.';

CREATE INDEX subscription_addons_subscription_idx ON public.subscription_addons (subscription_id) WHERE status = 'active';

ALTER TABLE public.subscription_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription addons"
    ON public.subscription_addons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.customer_subscriptions cs
            WHERE cs.id = subscription_addons.subscription_id
              AND cs.user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- 2. Seat pricing: product_prices is the single authority.
--    Reconcile the stale $19 sync to the $29/$290-equivalent shown in the
--    current member-facing preview, and tag rows with addon_key for lookup.
-- ---------------------------------------------------------------------------
UPDATE public.product_prices pp
SET unit_amount = 2900,
    metadata = pp.metadata || '{"addon_key": "seat_addon_28day"}'::jsonb,
    updated_at = now()
FROM public.products p
WHERE p.id = pp.product_id AND p.key = 'household_addon_28day';

UPDATE public.product_prices pp
SET unit_amount = 29000,
    metadata = pp.metadata || '{"addon_key": "seat_addon_annual"}'::jsonb,
    updated_at = now()
FROM public.products p
WHERE p.id = pp.product_id AND p.key = 'household_addon_annual';

-- ---------------------------------------------------------------------------
-- 3. Family Activation Intensive as a real product (was hardcoded $199)
-- ---------------------------------------------------------------------------
INSERT INTO public.products (key, name, description, product_type, is_active)
VALUES (
    'family_activation',
    'Family Activation Intensive',
    'Activation Intensive for an additional household member',
    'intensive',
    true
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.product_prices (product_id, unit_amount, currency, interval_unit, is_active, metadata)
SELECT p.id, 19900, 'usd', NULL, true, '{"addon_key": "family_activation"}'::jsonb
FROM public.products p
WHERE p.key = 'family_activation'
  AND NOT EXISTS (
      SELECT 1 FROM public.product_prices pp
      WHERE pp.product_id = p.id AND pp.metadata->>'addon_key' = 'family_activation'
  );
