-- Two-pass read-aloud: cold read, then helped read with tap-to-hear.
-- Word results are a first-pass alignment (hit / miss / sub), not a fluency score.

CREATE TABLE IF NOT EXISTS public.le_book_read_alouds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.le_books(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.le_book_pages(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  pass smallint NOT NULL CHECK (pass IN (1, 2)),
  expected_text text NOT NULL,
  transcript text,
  audio_url text,
  duration_seconds numeric,
  word_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  hit_count integer NOT NULL DEFAULT 0,
  miss_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_book_read_alouds_page_id_idx
  ON public.le_book_read_alouds(page_id, pass, created_at DESC);
CREATE INDEX IF NOT EXISTS le_book_read_alouds_book_id_idx
  ON public.le_book_read_alouds(book_id);
CREATE INDEX IF NOT EXISTS le_book_read_alouds_student_id_idx
  ON public.le_book_read_alouds(student_id);

ALTER TABLE public.le_book_read_alouds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "le_book_read_alouds_select" ON public.le_book_read_alouds
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_book_read_alouds_insert" ON public.le_book_read_alouds
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_book_read_alouds_delete" ON public.le_book_read_alouds
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_household_admin(household_id, auth.uid()))
  );

COMMENT ON TABLE public.le_book_read_alouds IS
  'Child read-aloud takes for a storybook page (pass 1 cold, pass 2 with tap-to-hear)';
