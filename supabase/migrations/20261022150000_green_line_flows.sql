-- Green Line flows: how a member is arriving today, and the guided path they
-- chose from there. Flow definitions live in code (src/lib/flows/catalog.ts).

CREATE TABLE IF NOT EXISTS public.green_line_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL CHECK (state IN ('below', 'on', 'above')),
  flow_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS green_line_checkins_user_recent_idx
  ON public.green_line_checkins (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.flow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_id uuid REFERENCES public.green_line_checkins(id) ON DELETE SET NULL,
  flow_id text NOT NULL,
  current_step text,
  branch text,
  steps jsonb NOT NULL DEFAULT '{}'::jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  abandoned_at timestamptz
);

CREATE INDEX IF NOT EXISTS flow_runs_user_open_idx
  ON public.flow_runs (user_id, started_at DESC)
  WHERE completed_at IS NULL AND abandoned_at IS NULL;

ALTER TABLE public.green_line_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS green_line_checkins_own ON public.green_line_checkins;
CREATE POLICY green_line_checkins_own ON public.green_line_checkins
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS flow_runs_own ON public.flow_runs;
CREATE POLICY flow_runs_own ON public.flow_runs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
