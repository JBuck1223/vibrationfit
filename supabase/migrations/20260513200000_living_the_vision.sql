-- MAP v2: Living The Vision
-- Vision Targets + Commitments + Commitment Occurrences
-- Three-layer model: Life Vision -> Vision Targets -> Commitments -> Occurrences

-- Vision Targets: concrete goals extracted from life vision categories
CREATE TABLE public.vision_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_version_id uuid REFERENCES public.vision_versions(id) ON DELETE SET NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'achieved', 'archived')),
  achieved_at timestamptz,
  achievement_note text,
  achievement_journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Commitments: bite-size actions that feed a vision target
CREATE TABLE public.commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_target_id uuid REFERENCES public.vision_targets(id) ON DELETE SET NULL,
  category text NOT NULL,
  parent_commitment_id uuid REFERENCES public.commitments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('recurring', 'project')),
  title text NOT NULL,
  description text,
  cadence jsonb,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  imported_from_map_item_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Occurrences: one row per scheduled instance, pure Yes/No/Skip tracking
CREATE TABLE public.commitment_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occurred_on date NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'yes', 'no', 'skipped')),
  verified_at timestamptz,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (commitment_id, occurred_on)
);

-- Indexes
CREATE INDEX idx_vision_targets_user_status ON public.vision_targets(user_id, status);
CREATE INDEX idx_vision_targets_category ON public.vision_targets(user_id, category);
CREATE INDEX idx_commitments_user_status ON public.commitments(user_id, status);
CREATE INDEX idx_commitments_target ON public.commitments(vision_target_id);
CREATE INDEX idx_commitments_parent ON public.commitments(parent_commitment_id);
CREATE INDEX idx_occurrences_user_date ON public.commitment_occurrences(user_id, occurred_on);
CREATE INDEX idx_occurrences_commitment ON public.commitment_occurrences(commitment_id, occurred_on);

-- RLS: vision_targets
ALTER TABLE public.vision_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own targets"
  ON public.vision_targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own targets"
  ON public.vision_targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own targets"
  ON public.vision_targets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own targets"
  ON public.vision_targets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: commitments
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commitments"
  ON public.commitments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitments"
  ON public.commitments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commitments"
  ON public.commitments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own commitments"
  ON public.commitments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: commitment_occurrences
ALTER TABLE public.commitment_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own occurrences"
  ON public.commitment_occurrences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own occurrences"
  ON public.commitment_occurrences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own occurrences"
  ON public.commitment_occurrences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own occurrences"
  ON public.commitment_occurrences FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger function (reuse if exists, create if not)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END
$$;

CREATE TRIGGER set_vision_targets_updated_at
  BEFORE UPDATE ON public.vision_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_commitments_updated_at
  BEFORE UPDATE ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_commitment_occurrences_updated_at
  BEFORE UPDATE ON public.commitment_occurrences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
