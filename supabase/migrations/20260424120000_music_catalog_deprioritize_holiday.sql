-- Move High Vibe Christmas (and any Holiday-genre album rows) to sort after the main catalog
-- so /audio Listen > Music does not list holiday tracks first.

UPDATE public.music_catalog
SET
  sort_order = 500 + COALESCE(track_number, 0),
  updated_at = now()
WHERE album = 'High Vibe Christmas';

COMMENT ON COLUMN public.music_catalog.sort_order IS 'Lower first; holiday catalog (High Vibe Christmas) uses 500+ so year-round music appears first';
