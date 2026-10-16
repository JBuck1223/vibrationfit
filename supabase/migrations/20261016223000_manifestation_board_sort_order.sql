-- Board position for /manifestations. Lower numbers appear first.
-- Backfill matches the previous newest-first order.

ALTER TABLE public.manifestations
  ADD COLUMN IF NOT EXISTS sort_order integer;

WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at DESC NULLS LAST, id
    ) - 1)::integer AS rn
  FROM public.manifestations
)
UPDATE public.manifestations AS m
SET sort_order = ranked.rn
FROM ranked
WHERE m.id = ranked.id
  AND m.sort_order IS NULL;

UPDATE public.manifestations
SET sort_order = 0
WHERE sort_order IS NULL;

ALTER TABLE public.manifestations
  ALTER COLUMN sort_order SET DEFAULT 0;

ALTER TABLE public.manifestations
  ALTER COLUMN sort_order SET NOT NULL;

CREATE INDEX IF NOT EXISTS manifestations_user_sort_order_idx
  ON public.manifestations (user_id, sort_order);

COMMENT ON COLUMN public.manifestations.sort_order IS
  'Owner board position. Lower numbers appear first on /manifestations.';
