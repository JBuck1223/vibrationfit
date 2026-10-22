-- What each member listened to last, and where they left off, so Home can
-- offer "Continue Listening". One row per member per audio set (the global
-- player's set name), updated as they listen.

CREATE TABLE IF NOT EXISTS public.audio_listen_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_key text NOT NULL,
  category text NOT NULL DEFAULT 'life_vision',
  icon_key text,
  title text NOT NULL,
  artwork_url text,
  tracks jsonb NOT NULL,
  track_index integer NOT NULL DEFAULT 0,
  position_seconds numeric NOT NULL DEFAULT 0,
  duration_seconds numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, set_key)
);

CREATE INDEX IF NOT EXISTS audio_listen_history_recent_idx
  ON public.audio_listen_history (user_id, updated_at DESC);

ALTER TABLE public.audio_listen_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audio_listen_history_own ON public.audio_listen_history;
CREATE POLICY audio_listen_history_own ON public.audio_listen_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
