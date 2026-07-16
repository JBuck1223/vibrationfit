-- Add manual ordering to user playlists
ALTER TABLE public.user_playlists
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.user_playlists.sort_order IS 'Manual ordering of playlists per user (lower = first)';

-- Backfill: preserve the current visible order (updated_at desc) per user
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) - 1 AS rn
  FROM public.user_playlists
)
UPDATE public.user_playlists p
SET sort_order = ranked.rn
FROM ranked
WHERE p.id = ranked.id;

CREATE INDEX idx_user_playlists_user_sort ON public.user_playlists(user_id, sort_order);
