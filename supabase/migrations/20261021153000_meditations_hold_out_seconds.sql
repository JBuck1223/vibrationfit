-- Breath hold at empty lungs after the out-breath (e.g. box breathing). 0 means no hold.

ALTER TABLE public.meditations
  ADD COLUMN IF NOT EXISTS hold_out_seconds integer NOT NULL DEFAULT 0;

ALTER TABLE public.meditations DROP CONSTRAINT IF EXISTS meditations_hold_out_check;
ALTER TABLE public.meditations
  ADD CONSTRAINT meditations_hold_out_check CHECK (hold_out_seconds BETWEEN 0 AND 20);
