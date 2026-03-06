-- Allow week and custom period_type for abundance goals
ALTER TABLE public.abundance_goals
  DROP CONSTRAINT IF EXISTS abundance_goals_period_type_check;

ALTER TABLE public.abundance_goals
  ADD CONSTRAINT abundance_goals_period_type_check
  CHECK (period_type IN ('week', 'month', 'quarter', 'year', 'custom'));

COMMENT ON TABLE public.abundance_goals IS 'Money goals per period (week/month/quarter/year/custom) for abundance tracker.';
