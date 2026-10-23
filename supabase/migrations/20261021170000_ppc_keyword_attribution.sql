-- ============================================================================
-- PPC KEYWORD ATTRIBUTION
-- Google Ads Final URL suffix params (kw, mt, ag, cr, dev) captured per session
-- and first-touch on visitors, so leads/revenue can be rolled up by the exact
-- search keyword and ad that drove them.
-- ============================================================================

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ppc_keyword text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ppc_match_type text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ppc_ad_group_id text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ppc_creative_id text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ppc_device text;

ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS first_ppc_keyword text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS first_ppc_match_type text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS first_ppc_ad_group_id text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS first_ppc_creative_id text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS first_ppc_device text;

COMMENT ON COLUMN public.sessions.ppc_keyword IS 'Google Ads {keyword} from the kw URL param.';
COMMENT ON COLUMN public.sessions.ppc_match_type IS 'Google Ads {matchtype} from the mt URL param: e (exact), p (phrase), b (broad).';
COMMENT ON COLUMN public.sessions.ppc_ad_group_id IS 'Google Ads {adgroupid} from the ag URL param.';
COMMENT ON COLUMN public.sessions.ppc_creative_id IS 'Google Ads {creative} (ad ID) from the cr URL param.';
COMMENT ON COLUMN public.sessions.ppc_device IS 'Google Ads {device} from the dev URL param: m (mobile), t (tablet), c (computer).';

COMMENT ON COLUMN public.visitors.first_ppc_keyword IS 'Keyword of the first paid Google click (set with first_gclid).';
COMMENT ON COLUMN public.visitors.first_ppc_match_type IS 'Match type of the first paid Google click.';
COMMENT ON COLUMN public.visitors.first_ppc_ad_group_id IS 'Ad group of the first paid Google click.';
COMMENT ON COLUMN public.visitors.first_ppc_creative_id IS 'Ad (creative) of the first paid Google click.';
COMMENT ON COLUMN public.visitors.first_ppc_device IS 'Device of the first paid Google click.';

CREATE INDEX IF NOT EXISTS idx_sessions_ppc_keyword ON public.sessions (ppc_keyword) WHERE ppc_keyword IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitors_first_ppc_keyword ON public.visitors (first_ppc_keyword) WHERE first_ppc_keyword IS NOT NULL;
