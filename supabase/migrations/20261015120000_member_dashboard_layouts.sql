-- Member dashboard widget layout (order, size, visibility) — one row per member.
CREATE TABLE IF NOT EXISTS public.member_dashboard_layouts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.member_dashboard_layouts IS 'Per-member dashboard widget layout: { version, widgets: [{ id, size, visible }] }';

ALTER TABLE public.member_dashboard_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage own dashboard layout" ON public.member_dashboard_layouts;
CREATE POLICY "Members manage own dashboard layout"
  ON public.member_dashboard_layouts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_member_dashboard_layouts_updated_at ON public.member_dashboard_layouts;
CREATE TRIGGER trg_member_dashboard_layouts_updated_at
  BEFORE UPDATE ON public.member_dashboard_layouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime invalidation for dashboard widgets (TanStack Query cache bridge)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'member_dashboard_layouts',
    'daily_papers',
    'abundance_events',
    'vibe_posts',
    'video_sessions',
    'video_session_participants',
    'area_activations'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
