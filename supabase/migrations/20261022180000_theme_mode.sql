-- A theme is either dark (light text on dark glass) or light (dark text on
-- light glass). Light has no imagery: it is the plain light mode.
ALTER TABLE public.themes ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'dark' CHECK (mode IN ('dark','light'));
UPDATE public.themes SET mode = 'light' WHERE slug = 'light';
DELETE FROM public.theme_images WHERE theme_id = (SELECT id FROM public.themes WHERE slug = 'light');
