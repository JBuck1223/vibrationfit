-- Foundation: the child's current-state profile across the 12 life categories.
-- Mirrors the user_profiles pattern (per-category state_<key> columns).
-- The parent fills this in; VIVA drafts the Life I Choose from it; the child edits.

-- ============================================================================
-- le_student_profiles — one row per student, state_<key> per life category
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  state_fun text,
  state_health text,
  state_travel text,
  state_love text,
  state_family text,
  state_social text,
  state_home text,
  state_work text,
  state_money text,
  state_stuff text,
  state_giving text,
  state_spirituality text,
  parent_hopes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_student_profiles_student_id_idx
  ON public.le_student_profiles(student_id);

COMMENT ON TABLE public.le_student_profiles IS
  'Current-state profile of the child across the 12 life categories (kid lens). Seeds the VIVA draft of the Life I Choose.';
COMMENT ON COLUMN public.le_student_profiles.parent_hopes IS
  'What the parent hopes this year holds for the child, in the parent''s words.';

-- ============================================================================
-- le_students — vision provenance + evaluation anniversary
-- ============================================================================

ALTER TABLE public.le_students
  ADD COLUMN IF NOT EXISTS life_i_choose_source text
    CHECK (life_i_choose_source = ANY (ARRAY['profile_draft'::text, 'child_edited'::text])),
  ADD COLUMN IF NOT EXISTS notice_of_intent_date date;

COMMENT ON COLUMN public.le_students.life_i_choose_source IS
  'profile_draft = VIVA-drafted from the current-state profile; child_edited = the child has made it theirs.';
COMMENT ON COLUMN public.le_students.notice_of_intent_date IS
  'Florida Notice of Intent filing date. Annual evaluation is due each year on this anniversary (F.S. 1002.41).';

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.le_student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "le_student_profiles_select" ON public.le_student_profiles FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_student_profiles_insert" ON public.le_student_profiles FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_student_profiles_update" ON public.le_student_profiles FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_student_profiles_delete" ON public.le_student_profiles FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
