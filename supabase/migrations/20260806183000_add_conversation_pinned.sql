-- Pinnable VIVA threads
ALTER TABLE public.conversation_sessions
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_pinned
  ON public.conversation_sessions(user_id, pinned, last_message_at DESC);
