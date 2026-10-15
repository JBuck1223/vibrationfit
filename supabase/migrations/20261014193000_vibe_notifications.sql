-- In-app Vibe Tribe notifications for comments, replies, mentions, and hearts.
-- Members can read and mark their own rows read. Inserts come from API routes
-- via the service role. One action notifies each person once; mention wins
-- over reply or comment when both would apply.

CREATE TABLE IF NOT EXISTS vibe_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reply', 'mention', 'heart')),
  context TEXT CHECK (context IS NULL OR context IN ('post', 'comment')),
  post_id UUID NOT NULL REFERENCES vibe_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES vibe_comments(id) ON DELETE CASCADE,
  excerpt TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vibe_notifications_user_created
  ON vibe_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vibe_notifications_unread
  ON vibe_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

-- One heart notification per actor per target, so unheart/reheart does not pile up.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vibe_notifications_heart_post
  ON vibe_notifications (user_id, actor_id, post_id)
  WHERE type = 'heart' AND comment_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vibe_notifications_heart_comment
  ON vibe_notifications (user_id, actor_id, comment_id)
  WHERE type = 'heart' AND comment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.protect_vibe_notification_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.actor_id IS DISTINCT FROM OLD.actor_id
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.context IS DISTINCT FROM OLD.context
    OR NEW.post_id IS DISTINCT FROM OLD.post_id
    OR NEW.comment_id IS DISTINCT FROM OLD.comment_id
    OR NEW.excerpt IS DISTINCT FROM OLD.excerpt
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'vibe_notifications only allows read_at updates';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_vibe_notification_update ON vibe_notifications;
CREATE TRIGGER protect_vibe_notification_update
  BEFORE UPDATE ON vibe_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_vibe_notification_update();

ALTER TABLE vibe_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own vibe notifications"
  ON vibe_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own vibe notifications"
  ON vibe_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.vibe_notifications;
