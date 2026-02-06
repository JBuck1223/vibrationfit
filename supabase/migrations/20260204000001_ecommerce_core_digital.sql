-- Digital-only ecommerce core (orders, products, order items)
-- Safe to apply; does not remove existing tables

-- ============================================================================
-- PRODUCTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  product_type text NOT NULL DEFAULT 'other',
  is_subscription boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_product_type_check
    CHECK (product_type IN ('membership', 'intensive', 'storage', 'tokens', 'coaching', 'addon', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);

-- ============================================================================
-- PRODUCT PRICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stripe_price_id text UNIQUE,
  currency text NOT NULL DEFAULT 'usd',
  unit_amount integer NOT NULL,
  interval_unit text,
  interval_count integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_prices_interval_check
    CHECK (interval_unit IS NULL OR interval_unit IN ('day', 'week', 'month', 'year'))
);

CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON public.product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_active ON public.product_prices(is_active);

-- ============================================================================
-- BACKFILL PRODUCTS/PRICES FROM MEMBERSHIP TIERS
-- ============================================================================
INSERT INTO public.products (
  key,
  name,
  description,
  product_type,
  is_subscription,
  is_active,
  metadata
)
SELECT
  mt.tier_type::text AS key,
  mt.name,
  mt.description,
  CASE
    WHEN mt.plan_category = 'subscription' THEN 'membership'
    WHEN mt.plan_category = 'intensive' THEN 'intensive'
    WHEN mt.plan_category = 'addon' THEN 'addon'
    ELSE 'other'
  END AS product_type,
  (mt.plan_category = 'subscription') AS is_subscription,
  mt.is_active,
  jsonb_build_object(
    'source', 'membership_tiers',
    'tier_id', mt.id,
    'tier_type', mt.tier_type,
    'plan_category', mt.plan_category
  ) AS metadata
FROM public.membership_tiers mt
ON CONFLICT (key) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'membership_tiers'
      AND column_name = 'product_id'
  ) THEN
    UPDATE public.membership_tiers mt
    SET product_id = p.id
    FROM public.products p
    WHERE p.key = mt.tier_type::text
      AND mt.product_id IS NULL;
  END IF;
END
$$;

INSERT INTO public.product_prices (
  product_id,
  stripe_price_id,
  currency,
  unit_amount,
  interval_unit,
  interval_count,
  is_active,
  metadata
)
SELECT
  p.id AS product_id,
  mt.stripe_price_id,
  'usd' AS currency,
  CASE
    WHEN mt.billing_interval = 'year' THEN COALESCE(mt.price_yearly, mt.price_monthly, 0)
    WHEN mt.billing_interval IN ('month', 'one-time') THEN COALESCE(mt.price_monthly, 0)
    ELSE COALESCE(mt.price_monthly, 0)
  END AS unit_amount,
  CASE
    WHEN mt.billing_interval IN ('year', 'month') THEN mt.billing_interval
    ELSE NULL
  END AS interval_unit,
  1 AS interval_count,
  mt.is_active,
  jsonb_build_object(
    'source', 'membership_tiers',
    'tier_id', mt.id,
    'billing_interval', mt.billing_interval
  ) AS metadata
FROM public.membership_tiers mt
JOIN public.products p
  ON p.key = mt.tier_type::text
WHERE (
  (mt.billing_interval = 'year' AND COALESCE(mt.price_yearly, mt.price_monthly, 0) > 0)
  OR (mt.billing_interval IN ('month', 'one-time') AND COALESCE(mt.price_monthly, 0) > 0)
)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- ============================================================================
-- ORDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  total_amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  promo_code text,
  referral_source text,
  campaign_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'paid', 'canceled', 'refunded', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ============================================================================
-- ORDER ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  price_id uuid REFERENCES public.product_prices(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  is_subscription boolean NOT NULL DEFAULT false,
  subscription_id uuid REFERENCES public.customer_subscriptions(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================================================
-- LINK EXISTING TABLES TO PRODUCTS/ORDERS (OPTIONAL, FORWARD COMPATIBLE)
-- ============================================================================
ALTER TABLE public.membership_tiers
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.customer_subscriptions
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE TRIGGER trigger_update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_product_prices_updated_at
BEFORE UPDATE ON public.product_prices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read active
CREATE POLICY "Active products are viewable by everyone"
ON public.products FOR SELECT
USING (is_active = true);

CREATE POLICY "Active product prices are viewable by everyone"
ON public.product_prices FOR SELECT
USING (is_active = true);

-- Orders: users can view their own
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.user_id = auth.uid()
  )
);

-- Service role can manage new ecommerce tables
CREATE POLICY "Service role can manage products"
ON public.products
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage product prices"
ON public.product_prices
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage orders"
ON public.orders
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage order items"
ON public.order_items
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
