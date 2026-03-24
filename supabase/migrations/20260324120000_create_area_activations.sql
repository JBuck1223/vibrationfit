-- Generic area activations table for tracking visit-based daily activations.
-- Used initially for Vision Board page visits; reusable for any area.

CREATE TABLE public.area_activations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area text NOT NULL,
  activation_date date DEFAULT CURRENT_DATE NOT NULL,
  activated_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_area_activations_user_area
  ON public.area_activations (user_id, area, activation_date DESC);

CREATE INDEX idx_area_activations_area
  ON public.area_activations (area);

-- One activation per user per area per calendar day
CREATE UNIQUE INDEX idx_area_activations_unique_daily
  ON public.area_activations (user_id, area, activation_date);

ALTER TABLE public.area_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activations"
  ON public.area_activations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activations"
  ON public.area_activations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
