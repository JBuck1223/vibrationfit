-- Create journal_tag enum matching the vibe_tag pattern
CREATE TYPE public.journal_tag AS ENUM ('vision', 'win', 'wobble');

-- Add journal_tag column to journal_entries (nullable for existing rows)
ALTER TABLE public.journal_entries
  ADD COLUMN journal_tag public.journal_tag;

COMMENT ON COLUMN public.journal_entries.journal_tag IS 'Optional entry type tag: vision, win, or wobble';
