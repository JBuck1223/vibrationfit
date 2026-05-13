-- /audio Music tab: year-round catalog lists by sort_order; keep High Vibe Christmas at 501+
-- and assign consecutive sort_order for all other active rows ordered alphabetically by title.

UPDATE public.music_catalog m
SET
  sort_order = 9 + ranked.rn,
  updated_at = now()
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY LOWER(title)) AS rn
  FROM public.music_catalog
  WHERE is_active = true
    AND (album IS NULL OR album <> 'High Vibe Christmas')
) ranked
WHERE m.id = ranked.id;
