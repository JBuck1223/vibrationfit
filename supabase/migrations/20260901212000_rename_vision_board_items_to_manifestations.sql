-- vision_board_items becomes manifestations.
-- The record IS the manifestation; the board is just its visualizer, so the table
-- carries the real concept name. Triggers, RLS policies, FKs, and the realtime
-- publication entry all follow the rename automatically.
-- NOTE: supabase/COMPLETE_SCHEMA_DUMP.sql is stale for this table; user regenerates it.

ALTER TABLE public.vision_board_items RENAME TO manifestations;

-- The currently-deployed build still reads/writes vision_board_items. Keep it
-- working until the new build ships via an updatable compatibility view.
-- security_invoker makes the base table's RLS run as the calling member.
CREATE VIEW public.vision_board_items
WITH (security_invoker = true)
AS SELECT * FROM public.manifestations;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vision_board_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vision_board_items TO anon;
GRANT ALL ON public.vision_board_items TO service_role;

-- Join-table rows that point at the record follow the concept rename
UPDATE public.manifestation_assets
SET entity_type = 'manifestations'
WHERE entity_type = 'vision_board_items';
