-- VIVA chats are many-to-one with a manifestation (Journey history).
-- Chat from the detail page always starts a new thread; prior threads stay attached.

ALTER TABLE public.manifestation_assets
  DROP CONSTRAINT IF EXISTS manifestation_assets_slot_check;

ALTER TABLE public.manifestation_assets
  ADD CONSTRAINT manifestation_assets_slot_check
  CHECK (slot = ANY (ARRAY[
    'vision_draft'::text, 'story'::text, 'incantation'::text, 'spark_query'::text,
    'song'::text, 'voice'::text, 'mix'::text, 'vision_board'::text, 'journal'::text,
    'daily_paper'::text, 'abundance'::text, 'dream_destination'::text, 'trip'::text,
    'map_target'::text, 'map_commitment'::text, 'project'::text, 'conversation'::text
  ]));

INSERT INTO public.manifestation_assets (
  manifestation_id, layer, slot, status, entity_type, entity_id, pinned_by
)
SELECT
  m.id,
  'evidence',
  'conversation',
  'ready',
  'conversation_sessions',
  m.conversation_id,
  'viva'
FROM public.manifestations m
WHERE m.conversation_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.manifestation_assets a
    WHERE a.manifestation_id = m.id
      AND a.slot = 'conversation'
      AND a.entity_id = m.conversation_id
  );
