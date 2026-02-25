-- ============================================================================
-- TRACKING, CUSTOMERS, AND CART SESSIONS
-- Visitor/session attribution system + cart-based checkout + customers SSOT
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. visitors — anonymous cookie-based tracking
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    fingerprint text NOT NULL UNIQUE,

    first_landing_page text,
    first_referrer text,

    first_utm_source text,
    first_utm_medium text,
    first_utm_campaign text,
    first_utm_content text,
    first_utm_term text,

    first_gclid text,
    first_fbclid text,
    first_msclkid text,
    first_ttclid text,

    first_url_params jsonb DEFAULT '{}'::jsonb,

    last_utm_source text,
    last_utm_medium text,
    last_utm_campaign text,

    session_count integer DEFAULT 0 NOT NULL,
    total_pageviews integer DEFAULT 0 NOT NULL,

    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    first_seen_at timestamptz DEFAULT now() NOT NULL,
    last_seen_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visitors_fingerprint ON public.visitors (fingerprint);
CREATE INDEX IF NOT EXISTS idx_visitors_user_id ON public.visitors (user_id);
CREATE INDEX IF NOT EXISTS idx_visitors_first_utm_source ON public.visitors (first_utm_source);
CREATE INDEX IF NOT EXISTS idx_visitors_first_seen_at ON public.visitors (first_seen_at);

COMMENT ON TABLE public.visitors IS 'Anonymous cookie-based visitor tracking. Linked to auth.users after account creation (waterfall).';

-- --------------------------------------------------------------------------
-- 2. sessions — per-visit with attribution
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    visitor_id uuid NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,

    landing_page text,
    referrer text,

    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,

    gclid text,
    fbclid text,
    msclkid text,
    ttclid text,
    li_fat_id text,
    gbraid text,
    wbraid text,

    url_params jsonb DEFAULT '{}'::jsonb,

    device_type text,
    browser text,
    os text,

    pageview_count integer DEFAULT 0 NOT NULL,
    converted boolean DEFAULT false NOT NULL,
    conversion_type text,

    started_at timestamptz DEFAULT now() NOT NULL,
    last_activity_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON public.sessions (visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions (started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_utm_source ON public.sessions (utm_source);

COMMENT ON TABLE public.sessions IS 'Individual visit sessions with per-session attribution data.';

-- --------------------------------------------------------------------------
-- 3. page_views — individual page views per session
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    visitor_id uuid NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,

    page_path text NOT NULL,
    page_title text,

    view_order integer DEFAULT 0 NOT NULL,
    time_on_page_seconds integer,

    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views (visitor_id);

COMMENT ON TABLE public.page_views IS 'Every page viewed, per session.';

-- --------------------------------------------------------------------------
-- 4. customers — Single Source of Truth for customer journey
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_id uuid REFERENCES public.visitors(id) ON DELETE SET NULL,
    stripe_customer_id text,
    lead_id uuid,

    first_utm_source text,
    first_utm_medium text,
    first_utm_campaign text,
    first_utm_content text,
    first_utm_term text,

    first_gclid text,
    first_fbclid text,

    first_landing_page text,
    first_referrer text,
    first_url_params jsonb DEFAULT '{}'::jsonb,

    first_seen_at timestamptz,
    email_captured_at timestamptz,
    first_purchase_at timestamptz,
    last_purchase_at timestamptz,
    last_active_at timestamptz,

    status text DEFAULT 'customer' NOT NULL
        CHECK (status IN ('visitor', 'lead', 'customer', 'active_subscriber', 'churned')),

    total_orders integer DEFAULT 0 NOT NULL,
    total_spent integer DEFAULT 0 NOT NULL,

    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers (user_id);
CREATE INDEX IF NOT EXISTS idx_customers_visitor_id ON public.customers (visitor_id);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id ON public.customers (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_first_utm_source ON public.customers (first_utm_source);

COMMENT ON TABLE public.customers IS 'Single Source of Truth for the customer journey. 1:1 with auth.users. Attribution waterfalled from visitors on account creation.';

-- --------------------------------------------------------------------------
-- 5. cart_sessions — cart-based checkout
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    visitor_id uuid REFERENCES public.visitors(id) ON DELETE SET NULL,
    session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,

    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    email text,

    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    promo_code text,
    referral_source text,
    campaign_name text,

    utm_source text,
    utm_medium text,
    utm_campaign text,

    status text DEFAULT 'active' NOT NULL
        CHECK (status IN ('active', 'checkout_started', 'completed', 'abandoned', 'expired')),

    expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cart_sessions_visitor_id ON public.cart_sessions (visitor_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON public.cart_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_status ON public.cart_sessions (status);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_email ON public.cart_sessions (email);

COMMENT ON TABLE public.cart_sessions IS 'Cart-based checkout sessions. UUID used directly in checkout URLs and abandoned cart recovery emails.';

-- --------------------------------------------------------------------------
-- 6. journey_events — funnel milestones
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.journey_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    visitor_id uuid REFERENCES public.visitors(id) ON DELETE SET NULL,
    session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    lead_id uuid,
    cart_session_id uuid REFERENCES public.cart_sessions(id) ON DELETE SET NULL,

    event_type text NOT NULL
        CHECK (event_type IN (
            'email_captured',
            'cart_created',
            'checkout_started',
            'purchase_completed'
        )),
    event_data jsonb DEFAULT '{}'::jsonb,

    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journey_events_visitor_id ON public.journey_events (visitor_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_user_id ON public.journey_events (user_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_event_type ON public.journey_events (event_type);
CREATE INDEX IF NOT EXISTS idx_journey_events_created_at ON public.journey_events (created_at);

COMMENT ON TABLE public.journey_events IS 'Key milestones in the customer journey funnel.';

-- --------------------------------------------------------------------------
-- 7. Alter existing tables
-- --------------------------------------------------------------------------

-- leads: add visitor_id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'visitor_id'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN visitor_id uuid REFERENCES public.visitors(id) ON DELETE SET NULL;
    END IF;
END $$;

-- orders: add customer_id and cart_session_id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cart_session_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN cart_session_id uuid REFERENCES public.cart_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- --------------------------------------------------------------------------
-- 8. RLS Policies
-- --------------------------------------------------------------------------
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything on tracking tables
CREATE POLICY "Service role full access on visitors"
    ON public.visitors FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on sessions"
    ON public.sessions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on page_views"
    ON public.page_views FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on journey_events"
    ON public.journey_events FOR ALL
    USING (auth.role() = 'service_role');

-- Customers: service role full access, users can read own row
CREATE POLICY "Service role full access on customers"
    ON public.customers FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own customer record"
    ON public.customers FOR SELECT
    USING (auth.uid() = user_id);

-- Cart sessions: anyone can read by id (for checkout URLs), service role writes
CREATE POLICY "Service role full access on cart_sessions"
    ON public.cart_sessions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read cart sessions"
    ON public.cart_sessions FOR SELECT
    USING (true);
