-- Realtime invalidation for VIVA conversation threads
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_sessions;
