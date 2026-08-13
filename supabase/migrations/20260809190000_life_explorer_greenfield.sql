-- Life Explorer greenfield reorganization
-- 1. Expedition Flashback (spaced retrieval) tracking on learned items
-- 2. Student state code for the State Requirements Engine (Florida first)

ALTER TABLE public.le_wonder_items
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reviewed_at date,
  ADD COLUMN IF NOT EXISTS next_review_at date;

COMMENT ON COLUMN public.le_wonder_items.review_count IS
  'Expedition Flashback: consecutive successful spaced-retrieval recalls';
COMMENT ON COLUMN public.le_wonder_items.next_review_at IS
  'Expedition Flashback: next spaced-retrieval due date (1d/3d/7d/30d schedule)';

CREATE INDEX IF NOT EXISTS idx_le_wonder_items_next_review
  ON public.le_wonder_items (next_review_at)
  WHERE kind = 'learned';

ALTER TABLE public.le_students
  ADD COLUMN IF NOT EXISTS state_code text NOT NULL DEFAULT 'FL';

COMMENT ON COLUMN public.le_students.state_code IS
  'Two-letter state for the State Requirements Engine (compliance profile)';
