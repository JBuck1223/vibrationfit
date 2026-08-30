-- PayPal DB-driven billing foundation.
-- The database becomes the subscription engine: vaulted payment methods are
-- stored in payment_methods, and customer_subscriptions gains the schedule
-- columns (amount_cents / billing_interval_days / next_billing_at) that the
-- billing cron charges from. No PayPal plans or price IDs exist anywhere.

-- ---------------------------------------------------------------------------
-- 1. Vaulted payment methods (provider-agnostic; PayPal card vault for now)
-- ---------------------------------------------------------------------------
CREATE TABLE public.payment_methods (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL DEFAULT 'paypal' CHECK (provider IN ('paypal', 'stripe')),
    paypal_vault_id text,
    paypal_customer_id text,
    brand text,
    last4 text,
    expiry text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    is_default boolean NOT NULL DEFAULT true,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payment_methods IS 'Saved payment methods (PayPal vault tokens). Charged by the billing cron for subscription renewals.';

CREATE UNIQUE INDEX payment_methods_paypal_vault_id_key
    ON public.payment_methods (paypal_vault_id) WHERE paypal_vault_id IS NOT NULL;
CREATE INDEX payment_methods_user_id_idx ON public.payment_methods (user_id);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
    ON public.payment_methods FOR SELECT
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. customer_subscriptions becomes the billing schedule source of truth
-- ---------------------------------------------------------------------------
ALTER TABLE public.customer_subscriptions
    ADD COLUMN provider text NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe', 'paypal')),
    ADD COLUMN payment_method_id uuid REFERENCES public.payment_methods(id),
    ADD COLUMN amount_cents integer,
    ADD COLUMN billing_interval_days integer,
    ADD COLUMN next_billing_at timestamptz,
    ADD COLUMN failure_count integer NOT NULL DEFAULT 0;

-- Stripe rows always have a Stripe customer; PayPal rows never do.
ALTER TABLE public.customer_subscriptions ALTER COLUMN stripe_customer_id DROP NOT NULL;

COMMENT ON COLUMN public.customer_subscriptions.amount_cents IS 'Renewal charge amount in cents (PayPal DB-driven billing). NULL for Stripe-managed rows.';
COMMENT ON COLUMN public.customer_subscriptions.billing_interval_days IS 'Days between renewals (e.g. 28). NULL for Stripe-managed rows.';
COMMENT ON COLUMN public.customer_subscriptions.next_billing_at IS 'When the billing cron should next charge this subscription.';

CREATE INDEX customer_subscriptions_next_billing_idx
    ON public.customer_subscriptions (next_billing_at)
    WHERE provider = 'paypal' AND next_billing_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Orders + payment history: provider + PayPal ids
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
    ADD COLUMN provider text NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe', 'paypal')),
    ADD COLUMN paypal_order_id text,
    ADD COLUMN paypal_capture_id text,
    ADD COLUMN paypal_refund_id text;

CREATE UNIQUE INDEX orders_paypal_order_id_key
    ON public.orders (paypal_order_id) WHERE paypal_order_id IS NOT NULL;

ALTER TABLE public.payment_history
    ADD COLUMN provider text NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe', 'paypal')),
    ADD COLUMN paypal_order_id text,
    ADD COLUMN paypal_capture_id text;

-- ---------------------------------------------------------------------------
-- 4. Checkout context bridge between create-order and capture (service-role only)
-- ---------------------------------------------------------------------------
CREATE TABLE public.paypal_checkout_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    paypal_order_id text NOT NULL UNIQUE,
    cart_session_id uuid,
    context jsonb NOT NULL DEFAULT '{}'::jsonb,
    amount_cents integer NOT NULL,
    currency text NOT NULL DEFAULT 'usd',
    status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'captured', 'fulfilled', 'failed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.paypal_checkout_sessions IS 'Server-side checkout context created at PayPal order creation, consumed at capture/fulfillment. Service-role access only.';

ALTER TABLE public.paypal_checkout_sessions ENABLE ROW LEVEL SECURITY;
