-- Add hidden_from_users flag for admin session management
-- When true, sessions are hidden from member-facing pages but still visible to admins
ALTER TABLE public.video_sessions
ADD COLUMN IF NOT EXISTS hidden_from_users boolean NOT NULL DEFAULT false;

-- Index for efficient filtering on member-facing queries
CREATE INDEX IF NOT EXISTS idx_video_sessions_hidden
ON public.video_sessions (hidden_from_users)
WHERE hidden_from_users = false;

COMMENT ON COLUMN public.video_sessions.hidden_from_users IS 'Admin-only flag to hide sessions from member-facing pages without deleting them';
