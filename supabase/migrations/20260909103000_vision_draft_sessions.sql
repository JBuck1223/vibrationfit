-- First-vision Draft Session: contrast + clarity notes gathered before VIVA
-- composes the Life Vision. Additive — does not change vision_versions or
-- vision_new_category_state.
-- NOTE: supabase/COMPLETE_SCHEMA_DUMP.sql is stale for these tables; the user
-- regenerates it after this migration is applied.

CREATE TABLE public.vision_draft_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  draft_id uuid NOT NULL REFERENCES public.vision_versions (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'gathering'
    CHECK (status = ANY (ARRAY['gathering', 'composed'])),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (draft_id)
);

CREATE INDEX idx_vision_draft_sessions_user
  ON public.vision_draft_sessions (user_id);

CREATE TRIGGER vision_draft_sessions_set_updated_at
  BEFORE UPDATE ON public.vision_draft_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vision_draft_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vision_draft_sessions_owner_select"
  ON public.vision_draft_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "vision_draft_sessions_owner_insert"
  ON public.vision_draft_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vision_draft_sessions_owner_update"
  ON public.vision_draft_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vision_draft_sessions_owner_delete"
  ON public.vision_draft_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "vision_draft_sessions_service_all"
  ON public.vision_draft_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE public.vision_draft_session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.vision_draft_sessions (id) ON DELETE CASCADE,
  category text NOT NULL
    CHECK (category = ANY (ARRAY[
      'fun', 'health', 'travel', 'love', 'family', 'social',
      'home', 'work', 'money', 'stuff', 'giving', 'spirituality'
    ])),
  polarity text NOT NULL CHECK (polarity = ANY (ARRAY['contrast', 'clarity'])),
  text text NOT NULL,
  source text NOT NULL CHECK (source = ANY (ARRAY['activation', 'viva'])),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vision_draft_session_notes_session
  ON public.vision_draft_session_notes (session_id, created_at);

CREATE INDEX idx_vision_draft_session_notes_coverage
  ON public.vision_draft_session_notes (session_id, category, polarity);

ALTER TABLE public.vision_draft_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vision_draft_session_notes_owner_select"
  ON public.vision_draft_session_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vision_draft_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "vision_draft_session_notes_owner_insert"
  ON public.vision_draft_session_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vision_draft_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "vision_draft_session_notes_owner_delete"
  ON public.vision_draft_session_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vision_draft_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "vision_draft_session_notes_service_all"
  ON public.vision_draft_session_notes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER PUBLICATION supabase_realtime ADD TABLE public.vision_draft_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vision_draft_session_notes;
