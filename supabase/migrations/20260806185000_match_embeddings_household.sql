-- Extend semantic match to optionally include household-shared embeddings.
-- SECURITY INVOKER: RLS still gates partner rows behind mutual viva_mode opt-in.

DROP FUNCTION IF EXISTS public.match_member_embeddings(uuid, extensions.vector, int, float);

CREATE OR REPLACE FUNCTION public.match_member_embeddings(
  p_user_id uuid,
  p_query_embedding extensions.vector(1536),
  p_match_count int DEFAULT 6,
  p_min_similarity float DEFAULT 0.25,
  p_household_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
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
    me.user_id,
    me.entity_type,
    me.entity_id,
    me.category,
    me.content,
    me.source_date,
    1 - (me.embedding <=> p_query_embedding) AS similarity
  FROM public.member_embeddings me
  WHERE (
      me.user_id = p_user_id
      OR (p_household_id IS NOT NULL AND me.household_id = p_household_id)
    )
    AND 1 - (me.embedding <=> p_query_embedding) >= p_min_similarity
  ORDER BY me.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
