-- Add cached_system_prompt to conversation_sessions
-- This prevents rebuilding the massive context on every message

ALTER TABLE conversation_sessions
ADD COLUMN IF NOT EXISTS cached_system_prompt TEXT;

COMMENT ON COLUMN conversation_sessions.cached_system_prompt IS 'Cached system prompt built once at session start. Contains profile, assessment, vision context. Prevents wasteful rebuilding on every message.';
