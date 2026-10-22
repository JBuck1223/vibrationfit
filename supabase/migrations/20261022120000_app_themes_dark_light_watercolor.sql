-- Three more system themes: Dark (no imagery, plain charcoal), Light (bright
-- daylight imagery) and Watercolor (painted imagery). Images for Light and
-- Watercolor are attached by scripts/themes/seed-themes.ts.
INSERT INTO public.themes (slug, name, kind, is_published, sort_order) VALUES
  ('dark', 'Dark', 'system', true, 5),
  ('light', 'Light', 'system', true, 6),
  ('watercolor', 'Watercolor', 'system', true, 7)
ON CONFLICT (slug) DO NOTHING;
