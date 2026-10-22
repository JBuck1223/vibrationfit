-- The color overlay a member picks in Account > Appearance (a preset id from
-- src/lib/app-shell/overlays.ts). Null means "use the theme's own overlay".
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS theme_overlay text;
