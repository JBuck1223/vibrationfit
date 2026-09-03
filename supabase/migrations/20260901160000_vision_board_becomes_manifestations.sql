-- Vision Board becomes Manifestations.
-- vision_board_items is promoted to THE manifestation record (one row per desire).
-- The legacy hub table (manifestations) merges into items and is archived.
-- manifestation_assets / manifestation_activations / projects repoint to items.
-- NOTE: supabase/COMPLETE_SCHEMA_DUMP.sql is stale for these tables; the user
-- regenerates it after this migration is applied.

-- ---------------------------------------------------------------------------
-- 1. Depth columns on vision_board_items (owned text — no FK to vision_versions;
--    Life Vision only seeds language at creation time)
-- ---------------------------------------------------------------------------
ALTER TABLE public.vision_board_items
  ADD COLUMN IF NOT EXISTS why_it_matters text,
  ADD COLUMN IF NOT EXISTS what_it_feels_like text,
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversation_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vision_board_items_conversation
  ON public.vision_board_items(conversation_id);

-- ---------------------------------------------------------------------------
-- 2. Hub → item mapping (dropped at the end)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._manifestation_merge_map (
  hub_id uuid PRIMARY KEY,
  item_id uuid NOT NULL
);

-- Primary board item per hub = earliest vision_board asset owned by the same user
INSERT INTO public._manifestation_merge_map (hub_id, item_id)
SELECT DISTINCT ON (m.id) m.id, a.entity_id
FROM public.manifestations m
JOIN public.manifestation_assets a
  ON a.manifestation_id = m.id AND a.slot = 'vision_board' AND a.entity_id IS NOT NULL
JOIN public.vision_board_items i
  ON i.id = a.entity_id AND i.user_id = m.user_id
ORDER BY m.id, a.sort_order, a.created_at
ON CONFLICT (hub_id) DO NOTHING;

-- Merge hub depth into the primary item
UPDATE public.vision_board_items i
SET why_it_matters = COALESCE(i.why_it_matters, m.chosen_reality),
    conversation_id = COALESCE(i.conversation_id, m.conversation_id),
    categories = CASE
      WHEN i.categories IS NULL OR cardinality(i.categories) = 0 THEN m.life_categories
      ELSE i.categories
    END,
    status = CASE WHEN m.status = 'actualized' AND i.status <> 'actualized' THEN 'actualized' ELSE i.status END,
    actualized_at = COALESCE(i.actualized_at, m.actualized_at),
    updated_at = now()
FROM public._manifestation_merge_map hm
JOIN public.manifestations m ON m.id = hm.hub_id
WHERE i.id = hm.item_id;

-- Hub-only rows (no board item) become new items
DO $$
DECLARE
  m record;
  new_id uuid;
BEGIN
  FOR m IN
    SELECT * FROM public.manifestations
    WHERE id NOT IN (SELECT hub_id FROM public._manifestation_merge_map)
  LOOP
    INSERT INTO public.vision_board_items
      (user_id, household_id, name, why_it_matters, categories, conversation_id, status, actualized_at, created_at, updated_at)
    VALUES (
      m.user_id,
      m.household_id,
      m.title,
      m.chosen_reality,
      COALESCE(m.life_categories, '{}'),
      m.conversation_id,
      CASE m.status WHEN 'open' THEN 'active' WHEN 'actualized' THEN 'actualized' ELSE 'inactive' END,
      m.actualized_at,
      m.created_at,
      now()
    )
    RETURNING id INTO new_id;

    INSERT INTO public._manifestation_merge_map (hub_id, item_id) VALUES (m.id, new_id);
  END LOOP;
END $$;

-- Preserve hub actualization stories and vision drafts as assets (idempotent)
INSERT INTO public.manifestation_assets (manifestation_id, layer, slot, status, entity_type, entity_id, pinned_by)
SELECT m.id, 'evidence', 'journal', 'ready', 'journal_entries', m.actualization_story_id, 'member'
FROM public.manifestations m
WHERE m.actualization_story_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.manifestation_assets a
    WHERE a.manifestation_id = m.id AND a.slot = 'journal' AND a.entity_id = m.actualization_story_id
  );

INSERT INTO public.manifestation_assets (manifestation_id, layer, slot, status, entity_type, entity_id, pinned_by)
SELECT m.id, 'suite', 'vision_draft', 'ready', 'vision_versions', m.vision_draft_id, 'member'
FROM public.manifestations m
WHERE m.vision_draft_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.manifestation_assets a
    WHERE a.manifestation_id = m.id AND a.slot = 'vision_draft' AND a.entity_id = m.vision_draft_id
  );

-- ---------------------------------------------------------------------------
-- 3. Repoint manifestation_assets → vision_board_items
-- ---------------------------------------------------------------------------
ALTER TABLE public.manifestation_assets
  DROP CONSTRAINT IF EXISTS manifestation_assets_manifestation_id_fkey;

-- Drop the self-referencing vision_board asset (the item IS the manifestation now)
DELETE FROM public.manifestation_assets a
USING public._manifestation_merge_map hm
WHERE a.manifestation_id = hm.hub_id
  AND a.slot = 'vision_board'
  AND a.entity_id = hm.item_id;

UPDATE public.manifestation_assets a
SET manifestation_id = hm.item_id
FROM public._manifestation_merge_map hm
WHERE a.manifestation_id = hm.hub_id;

-- Orphans (should be none)
DELETE FROM public.manifestation_assets
WHERE manifestation_id NOT IN (SELECT id FROM public.vision_board_items);

ALTER TABLE public.manifestation_assets
  ADD CONSTRAINT manifestation_assets_manifestation_id_fkey
  FOREIGN KEY (manifestation_id) REFERENCES public.vision_board_items(id) ON DELETE CASCADE;

-- RLS now checks item ownership
DROP POLICY IF EXISTS "Users can view own manifestation assets" ON public.manifestation_assets;
DROP POLICY IF EXISTS "Users can manage own manifestation assets" ON public.manifestation_assets;

CREATE POLICY "Users can view own manifestation assets"
  ON public.manifestation_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vision_board_items i
      WHERE i.id = manifestation_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own manifestation assets"
  ON public.manifestation_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vision_board_items i
      WHERE i.id = manifestation_id AND i.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Repoint manifestation_activations → vision_board_items
-- ---------------------------------------------------------------------------
ALTER TABLE public.manifestation_activations
  DROP CONSTRAINT IF EXISTS manifestation_activations_manifestation_id_fkey;

UPDATE public.manifestation_activations a
SET manifestation_id = hm.item_id
FROM public._manifestation_merge_map hm
WHERE a.manifestation_id = hm.hub_id;

DELETE FROM public.manifestation_activations
WHERE manifestation_id NOT IN (SELECT id FROM public.vision_board_items);

ALTER TABLE public.manifestation_activations
  ADD CONSTRAINT manifestation_activations_manifestation_id_fkey
  FOREIGN KEY (manifestation_id) REFERENCES public.vision_board_items(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 5. Repoint projects.manifestation_id → vision_board_items
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_manifestation_id_fkey;

UPDATE public.projects p
SET manifestation_id = hm.item_id
FROM public._manifestation_merge_map hm
WHERE p.manifestation_id = hm.hub_id;

UPDATE public.projects
SET manifestation_id = NULL
WHERE manifestation_id IS NOT NULL
  AND manifestation_id NOT IN (SELECT id FROM public.vision_board_items);

ALTER TABLE public.projects
  ADD CONSTRAINT projects_manifestation_id_fkey
  FOREIGN KEY (manifestation_id) REFERENCES public.vision_board_items(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 6. Fold standalone member projects in: each becomes a manifestation
--    (all current standalone rows are member-facing; admin Project Hub rows
--    would carry category_id and are excluded defensively)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  p record;
  new_id uuid;
BEGIN
  FOR p IN
    SELECT * FROM public.projects
    WHERE manifestation_id IS NULL
      AND status <> 'archived'
      AND category_id IS NULL
      AND created_by IS NOT NULL
  LOOP
    INSERT INTO public.vision_board_items
      (user_id, household_id, name, description, categories, status, created_at, updated_at)
    VALUES (
      p.created_by,
      p.household_id,
      p.title,
      p.description,
      COALESCE(p.life_categories, '{}'),
      'active',
      p.created_at,
      now()
    )
    RETURNING id INTO new_id;

    UPDATE public.projects SET manifestation_id = new_id, updated_at = now() WHERE id = p.id;

    INSERT INTO public.manifestation_assets
      (manifestation_id, layer, slot, status, entity_type, entity_id, pinned_by)
    VALUES (new_id, 'project', 'project', 'ready', 'projects', p.id, 'member');
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 7. Archive the legacy hub table
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.manifestations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.manifestations RENAME TO manifestations_legacy_hub;

-- Ensure vision_board_items is on realtime (manifestation queries hang off it now)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vision_board_items;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TABLE public._manifestation_merge_map;
