-- The finer "what's it like right now?" choice inside a Green Line check-in
-- (a feeling id from src/lib/flows/catalog.ts FEELINGS).
ALTER TABLE public.green_line_checkins ADD COLUMN IF NOT EXISTS feeling text;
