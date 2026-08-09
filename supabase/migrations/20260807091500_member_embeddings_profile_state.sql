-- Allow profile "current state" snapshots (state_family, state_love, ...)
-- in the semantic memory index. These are embedded per category from the
-- member's active profile so VIVA can recall their family landscape and
-- other life-area snapshots in any conversation.

ALTER TABLE public.member_embeddings
  DROP CONSTRAINT IF EXISTS member_embeddings_entity_type_check;

ALTER TABLE public.member_embeddings
  ADD CONSTRAINT member_embeddings_entity_type_check CHECK (entity_type IN (
    'journal_entry',
    'coach_message',
    'story',
    'song',
    'vision_section',
    'daily_paper',
    'profile_state'
  ));
