-- Member Embeddings: semantic memory for VIVA
-- One row per embedded member artifact (journal entry, coach message, story,
-- song essence, vision section). Enables "this connects to what you told me
-- in March" recall across a member's entire footprint.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.member_embeddings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,

  entity_type text NOT NULL CHECK (entity_type IN (
    'journal_entry',
    'coach_message',
    'story',
    'song',
    'vision_section',
    'daily_paper'
  )),
  -- Text key: uuid for whole-row entities, composite for sections ("<visionId>:<category>")
  entity_id text NOT NULL,
  category text,

  content text NOT NULL,
  embedding extensions.vector(1536) NOT NULL,

  source_date timestamptz,
  created_at timestamptz DEFAULT now(),

  UNIQUE (entity_type, entity_id)
);

-- ANN search index (cosine)
CREATE INDEX IF NOT EXISTS idx_member_embeddings_hnsw
  ON public.member_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_member_embeddings_user
  ON public.member_embeddings(user_id, entity_type);

-- RLS
ALTER TABLE public.member_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own embeddings"
  ON public.member_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own embeddings"
  ON public.member_embeddings FOR ALL
  USING (auth.uid() = user_id);

-- Semantic match over a member's artifacts.
-- SECURITY INVOKER: RLS on member_embeddings still applies.
CREATE OR REPLACE FUNCTION public.match_member_embeddings(
  p_user_id uuid,
  p_query_embedding extensions.vector(1536),
  p_match_count int DEFAULT 6,
  p_min_similarity float DEFAULT 0.25
)
RETURNS TABLE (
  entity_type text,
  entity_id text,
  category text,
  content text,
  source_date timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    me.entity_type,
    me.entity_id,
    me.category,
    me.content,
    me.source_date,
    1 - (me.embedding <=> p_query_embedding) AS similarity
  FROM public.member_embeddings me
  WHERE me.user_id = p_user_id
    AND 1 - (me.embedding <=> p_query_embedding) >= p_min_similarity
  ORDER BY me.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
