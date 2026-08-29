-- ============================================================================
-- MARKETING SIGNAL OVERHAUL
-- 1. Meta browser identifiers (_fbp / _fbc) on visitors + sessions
-- 2. engagement_events — first-party record of video milestones and page
--    engagement, sharing dedup event IDs with the Meta Pixel / CAPI
-- 3. get_marketing_performance() — campaign funnel rollup for the admin
--    Ad Performance dashboard (first-touch visitor cohorts)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Meta identifiers
-- --------------------------------------------------------------------------
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS first_fbp text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS first_fbc text;

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS fbp text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS fbc text;

COMMENT ON COLUMN public.visitors.first_fbp IS 'Meta browser ID (_fbp cookie) at first capture. Sent with CAPI events for match quality.';
COMMENT ON COLUMN public.visitors.first_fbc IS 'Meta click ID cookie (_fbc) at first capture. fb.1.<ts>.<fbclid> format.';

-- --------------------------------------------------------------------------
-- 2. engagement_events
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.engagement_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    visitor_id uuid REFERENCES public.visitors(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,

    event_name text NOT NULL
        CHECK (event_name IN ('page_engagement', 'video_start', 'video_milestone', 'video_complete')),

    -- Dedup ID shared between the browser pixel (eventID) and Meta CAPI
    -- (event_id) so Meta counts each event exactly once.
    event_id uuid NOT NULL UNIQUE,

    page_path text,
    video_id text,
    milestone_percent integer CHECK (milestone_percent IN (25, 50, 75, 95)),
    watch_time_seconds numeric(8,1),
    dwell_seconds integer,
    scroll_depth_percent integer,

    -- False for bounce-recording page_engagement rows that never crossed the
    -- engagement threshold (no pixel/CAPI event was fired for those).
    engaged boolean DEFAULT true NOT NULL,

    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_engagement_events_visitor_id ON public.engagement_events (visitor_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_session_id ON public.engagement_events (session_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_event_name ON public.engagement_events (event_name);
CREATE INDEX IF NOT EXISTS idx_engagement_events_video_id ON public.engagement_events (video_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_created_at ON public.engagement_events (created_at);

COMMENT ON TABLE public.engagement_events IS 'First-party engagement signals (video milestones, page engagement) mirrored to Meta CAPI with shared dedup event IDs.';

ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on engagement_events"
    ON public.engagement_events FOR ALL
    USING (auth.role() = 'service_role');

-- --------------------------------------------------------------------------
-- 3. Campaign performance rollup (first-touch visitor cohorts)
--
-- Cohort = visitors whose FIRST touch landed in the window, grouped by their
-- first-touch UTM triple. All downstream activity (sessions, engagement,
-- leads, revenue) is credited to that first touch, matching the customers
-- SSOT waterfall model.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_marketing_performance(
    p_start timestamptz,
    p_end timestamptz
)
RETURNS TABLE (
    utm_source text,
    utm_medium text,
    utm_campaign text,
    visitors bigint,
    sessions bigint,
    pageviews bigint,
    engaged_visitors bigint,
    video_starts bigint,
    video_25 bigint,
    video_50 bigint,
    video_75 bigint,
    video_95 bigint,
    leads bigint,
    purchases bigint,
    revenue_cents bigint,
    spend numeric,
    budget numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH cohort AS (
    SELECT
        v.id,
        COALESCE(v.first_utm_source, CASE WHEN v.first_referrer IS NOT NULL AND v.first_referrer <> '' THEN 'referral' ELSE 'direct' END) AS src,
        COALESCE(v.first_utm_medium, '') AS med,
        COALESCE(v.first_utm_campaign, '') AS camp
    FROM visitors v
    WHERE v.first_seen_at >= p_start AND v.first_seen_at < p_end
),
triples AS (
    SELECT DISTINCT src, med, camp FROM cohort
),
agg_visitors AS (
    SELECT src, med, camp, COUNT(*) AS visitors
    FROM cohort GROUP BY 1, 2, 3
),
agg_sessions AS (
    SELECT c.src, c.med, c.camp,
           COUNT(s.id) AS sessions,
           COALESCE(SUM(s.pageview_count), 0) AS pageviews
    FROM cohort c
    JOIN sessions s ON s.visitor_id = c.id
    GROUP BY 1, 2, 3
),
agg_engagement AS (
    SELECT c.src, c.med, c.camp,
           COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.event_name = 'page_engagement' AND e.engaged) AS engaged_visitors,
           COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.event_name = 'video_start') AS video_starts,
           COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.event_name = 'video_milestone' AND e.milestone_percent = 25) AS video_25,
           COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.event_name = 'video_milestone' AND e.milestone_percent = 50) AS video_50,
           COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.event_name = 'video_milestone' AND e.milestone_percent = 75) AS video_75,
           COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.event_name = 'video_milestone' AND e.milestone_percent = 95) AS video_95
    FROM cohort c
    JOIN engagement_events e ON e.visitor_id = c.id
    GROUP BY 1, 2, 3
),
agg_leads AS (
    SELECT c.src, c.med, c.camp, COUNT(l.id) AS leads
    FROM cohort c
    JOIN leads l ON l.visitor_id = c.id
    GROUP BY 1, 2, 3
),
agg_revenue AS (
    SELECT c.src, c.med, c.camp,
           COUNT(o.id) AS purchases,
           COALESCE(SUM(o.total_amount), 0) AS revenue_cents
    FROM cohort c
    JOIN customers cu ON cu.visitor_id = c.id
    JOIN orders o ON o.customer_id = cu.id AND o.status = 'paid'
    GROUP BY 1, 2, 3
),
agg_spend AS (
    SELECT mc.utm_campaign AS camp,
           SUM(COALESCE(mc.total_spent, 0)) AS spend,
           SUM(COALESCE(mc.budget, 0)) AS budget
    FROM marketing_campaigns mc
    WHERE mc.utm_campaign IS NOT NULL
    GROUP BY 1
)
SELECT
    t.src AS utm_source,
    t.med AS utm_medium,
    t.camp AS utm_campaign,
    COALESCE(av.visitors, 0) AS visitors,
    COALESCE(ags.sessions, 0) AS sessions,
    COALESCE(ags.pageviews, 0) AS pageviews,
    COALESCE(ae.engaged_visitors, 0) AS engaged_visitors,
    COALESCE(ae.video_starts, 0) AS video_starts,
    COALESCE(ae.video_25, 0) AS video_25,
    COALESCE(ae.video_50, 0) AS video_50,
    COALESCE(ae.video_75, 0) AS video_75,
    COALESCE(ae.video_95, 0) AS video_95,
    COALESCE(al.leads, 0) AS leads,
    COALESCE(ar.purchases, 0) AS purchases,
    COALESCE(ar.revenue_cents, 0) AS revenue_cents,
    COALESCE(asp.spend, 0) AS spend,
    COALESCE(asp.budget, 0) AS budget
FROM triples t
LEFT JOIN agg_visitors av ON av.src = t.src AND av.med = t.med AND av.camp = t.camp
LEFT JOIN agg_sessions ags ON ags.src = t.src AND ags.med = t.med AND ags.camp = t.camp
LEFT JOIN agg_engagement ae ON ae.src = t.src AND ae.med = t.med AND ae.camp = t.camp
LEFT JOIN agg_leads al ON al.src = t.src AND al.med = t.med AND al.camp = t.camp
LEFT JOIN agg_revenue ar ON ar.src = t.src AND ar.med = t.med AND ar.camp = t.camp
LEFT JOIN agg_spend asp ON asp.camp = t.camp
ORDER BY COALESCE(ar.revenue_cents, 0) DESC, COALESCE(av.visitors, 0) DESC;
$$;

REVOKE ALL ON FUNCTION public.get_marketing_performance(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_marketing_performance(timestamptz, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.get_marketing_performance(timestamptz, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketing_performance(timestamptz, timestamptz) TO service_role;
