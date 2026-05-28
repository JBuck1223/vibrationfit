-- Optional journal reflection linked to a MAP commitment occurrence
ALTER TABLE public.commitment_occurrences
  ADD COLUMN IF NOT EXISTS journal_entry_id uuid
    REFERENCES public.journal_entries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_occurrences_journal_entry
  ON public.commitment_occurrences(journal_entry_id)
  WHERE journal_entry_id IS NOT NULL;

COMMENT ON COLUMN public.commitment_occurrences.journal_entry_id IS
  'Optional Conscious Creation Journal entry attached to this occurrence (user-initiated only).';
