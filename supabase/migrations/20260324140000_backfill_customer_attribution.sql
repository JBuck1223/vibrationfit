-- Backfill customer attribution from visitors table
-- Fixes customers that were created without copying first-touch data

UPDATE public.customers c
SET
  first_utm_source   = v.first_utm_source,
  first_utm_medium   = v.first_utm_medium,
  first_utm_campaign = v.first_utm_campaign,
  first_utm_content  = v.first_utm_content,
  first_utm_term     = v.first_utm_term,
  first_gclid        = v.first_gclid,
  first_fbclid       = v.first_fbclid,
  first_landing_page = v.first_landing_page,
  first_referrer     = v.first_referrer,
  first_url_params   = COALESCE(v.first_url_params, '{}'::jsonb),
  first_seen_at      = COALESCE(v.first_seen_at, c.created_at),
  updated_at         = now()
FROM public.visitors v
WHERE c.visitor_id = v.id
  AND c.first_seen_at IS NULL;
