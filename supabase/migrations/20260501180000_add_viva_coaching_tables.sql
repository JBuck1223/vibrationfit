-- VIVA Coach Tables
-- Adds coaching synopses (post-session cards) and coaching notes (case notes)

-- Coaching Synopses: Post-session artifacts that capture the shift
CREATE TABLE IF NOT EXISTS public.coaching_synopses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Coaching Session',
  came_in_feeling text,
  explored text,
  shift text,
  bridge_back text,
  practice text,
  closing_feeling text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for quick lookup by conversation
CREATE INDEX IF NOT EXISTS idx_coaching_synopses_conversation
  ON public.coaching_synopses(conversation_id);

-- Index for user's synopses list
CREATE INDEX IF NOT EXISTS idx_coaching_synopses_user_created
  ON public.coaching_synopses(user_id, created_at DESC);

-- RLS
ALTER TABLE public.coaching_synopses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own synopses"
  ON public.coaching_synopses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own synopses"
  ON public.coaching_synopses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own synopses"
  ON public.coaching_synopses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own synopses"
  ON public.coaching_synopses FOR DELETE
  USING (auth.uid() = user_id);


-- Memory Items: The core of VIVA's "knowing" of a person
-- This is how VIVA reproduces the "you know me" feeling.
-- Not raw data — synthesized, durable understanding that evolves over time.
CREATE TABLE IF NOT EXISTS public.viva_memory_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'preference',      -- how they like to be coached/spoken to
    'pattern',         -- recurring behaviors or emotional cycles
    'trigger',         -- things that reliably take them below the line
    'desire',          -- what they deeply want (distilled from vision/conversations)
    'voice_style',     -- how VIVA should speak to THIS person
    'life_context',    -- important life facts (job change, new baby, etc.)
    'coaching_note'    -- what works when coaching this person
  )),
  category text CHECK (category IN (
    'fun', 'health', 'travel', 'love', 'family', 'social',
    'home', 'work', 'money', 'stuff', 'giving', 'spirituality',
    NULL
  )),
  content text NOT NULL,
  confidence real DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  source_message_id uuid,
  source_conversation_id uuid,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Primary query: get recent/relevant memories for a user
CREATE INDEX IF NOT EXISTS idx_memory_items_user_type
  ON public.viva_memory_items(user_id, type, last_used_at DESC);

-- Category-based lookup
CREATE INDEX IF NOT EXISTS idx_memory_items_user_category
  ON public.viva_memory_items(user_id, category, last_used_at DESC);

-- Confidence-based filtering (surface high-confidence memories first)
CREATE INDEX IF NOT EXISTS idx_memory_items_user_confidence
  ON public.viva_memory_items(user_id, confidence DESC);

-- RLS
ALTER TABLE public.viva_memory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories"
  ON public.viva_memory_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own memories"
  ON public.viva_memory_items FOR ALL
  USING (auth.uid() = user_id);
