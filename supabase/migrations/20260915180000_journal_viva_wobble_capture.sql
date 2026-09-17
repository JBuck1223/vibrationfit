-- VIVA chat → Journal: keep the source thread and the wobble journey as
-- structured fields. Manual entries stay null. Do not regenerate
-- COMPLETE_SCHEMA_DUMP.sql here.

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS wobble_summary text,
  ADD COLUMN IF NOT EXISTS clarity text,
  ADD COLUMN IF NOT EXISTS chosen_truth text,
  ADD COLUMN IF NOT EXISTS recommended_tool text;

CREATE INDEX IF NOT EXISTS idx_journal_entries_conversation_id
  ON public.journal_entries (conversation_id)
  WHERE conversation_id IS NOT NULL;

COMMENT ON COLUMN public.journal_entries.conversation_id IS 'VIVA conversation this entry was captured from';
COMMENT ON COLUMN public.journal_entries.wobble_summary IS 'What they were experiencing — contrast, in their words';
COMMENT ON COLUMN public.journal_entries.clarity IS 'Insight VIVA noticed; not forced into first person';
COMMENT ON COLUMN public.journal_entries.chosen_truth IS 'The member''s chosen sentence, first person when they have one';
COMMENT ON COLUMN public.journal_entries.recommended_tool IS 'Next experience VIVA offered after this capture, if any';
