-- Abundance goals: one goal per user per period (month, quarter, or year)
CREATE TABLE public.abundance_goals (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type text NOT NULL CHECK (period_type IN ('month', 'quarter', 'year')),
  period_key text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, period_type, period_key)
);

CREATE INDEX idx_abundance_goals_user_period
  ON public.abundance_goals (user_id, period_type, period_key);

ALTER TABLE public.abundance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their abundance goals"
  ON public.abundance_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their abundance goals"
  ON public.abundance_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their abundance goals"
  ON public.abundance_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their abundance goals"
  ON public.abundance_goals FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_abundance_goals_updated_at
  BEFORE UPDATE ON public.abundance_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.abundance_goals IS 'Money goals per period (month/quarter/year) for abundance tracker.';
