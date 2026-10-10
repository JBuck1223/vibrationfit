-- Activation cross-category seeds.
-- VIVA captures short keyed notes for every life category that enters the
-- free Activation conversation (not just the chosen one). They drive the
-- 12-category progress board and pre-fill the member's first Draft Session.
-- Do not edit COMPLETE_SCHEMA_DUMP.sql; the user regenerates it.

ALTER TABLE public.activations
  ADD COLUMN IF NOT EXISTS seeds jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.activations.seeds IS
  'Array of { category, polarity, key, text, turn } notes VIVA captured across all 12 life categories during intake.';
