-- Breath hold at full lungs between in and out (e.g. 4-7-8 breathing). 0 means no hold.

ALTER TABLE public.meditations
  ADD COLUMN IF NOT EXISTS hold_seconds integer NOT NULL DEFAULT 0;

ALTER TABLE public.meditations DROP CONSTRAINT IF EXISTS meditations_hold_check;
ALTER TABLE public.meditations
  ADD CONSTRAINT meditations_hold_check CHECK (hold_seconds BETWEEN 0 AND 20);
