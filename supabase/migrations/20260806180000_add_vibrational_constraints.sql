-- Vibrational Constraints Ledger
-- First-class tracking of limiting beliefs uncovered in VIVA coaching.
-- Each constraint moves through a status arc as the member works with it:
--   uncovered -> witnessed -> flipped -> integrated

CREATE TABLE IF NOT EXISTS public.vibrational_constraints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,

  -- The belief in the member's own words ("my effort has a lower return than everyone else's")
  statement text NOT NULL,
  -- Where it came from, if known ("comparison to a charismatic sibling growing up")
  origin text,
  -- Evidence from the member's actual life that contradicts the belief
  evidence_against text,
  -- The flipped/replacement belief once one lands
  flipped_statement text,

  category text CHECK (category IN (
    'fun', 'health', 'travel', 'love', 'family', 'social',
    'home', 'work', 'money', 'stuff', 'giving', 'spirituality',
    NULL
  )),
  status text NOT NULL DEFAULT 'uncovered' CHECK (status IN (
    'uncovered',   -- named for the first time
    'witnessed',   -- member has observed it operating in real time
    'flipped',     -- a believable replacement belief has landed
    'integrated'   -- the new belief is the default lens
  )),

  confidence real DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  source_conversation_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vibrational_constraints_user_status
  ON public.vibrational_constraints(user_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vibrational_constraints_user_category
  ON public.vibrational_constraints(user_id, category);

-- RLS: owner-only for now (household sharing arrives with the VIVA household lens)
ALTER TABLE public.vibrational_constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own constraints"
  ON public.vibrational_constraints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own constraints"
  ON public.vibrational_constraints FOR ALL
  USING (auth.uid() = user_id);

-- Realtime invalidation (TanStack Query bridge)
ALTER PUBLICATION supabase_realtime ADD TABLE public.vibrational_constraints;
