-- Life Explorer — Lesson as a self-contained container.
-- Every lesson becomes a "holding bucket" (like a project with tasks):
--   * le_lesson_items  — action items prescribed by the lesson (print this,
--     fill out the Wonder Wall, do the experiment) plus parent-added ones
--   * le_lesson_notes  — notes on the lesson or on an individual item
--   * le_lesson_links  — reference links on the lesson or an item
--   * le_lesson_media  — uploaded documents/photos/videos on the lesson,
--     an item, or a note
-- Plus wall-clock start/end on the lesson itself so the expedition log can
-- show "Lesson 1 — this date, start time, end time, total time".

-- ============================================================================
-- Lesson timing
-- ============================================================================

ALTER TABLE public.le_lessons
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

COMMENT ON COLUMN public.le_lessons.started_at IS 'Wall-clock moment the lesson was opened/started';
COMMENT ON COLUMN public.le_lessons.completed_at IS 'Wall-clock moment the lesson was finished';

-- ============================================================================
-- Action items (checklist inside the lesson)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_lesson_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.le_lessons(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  title text NOT NULL,
  detail text,
  kind text NOT NULL DEFAULT 'custom'
    CHECK (kind = ANY (ARRAY['prep'::text, 'activity'::text, 'wrap_up'::text, 'custom'::text])),
  source text NOT NULL DEFAULT 'custom'
    CHECK (source = ANY (ARRAY['generated'::text, 'custom'::text])),
  is_complete boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_lesson_items_lesson_id_idx ON public.le_lesson_items(lesson_id);
CREATE INDEX IF NOT EXISTS le_lesson_items_student_id_idx ON public.le_lesson_items(student_id);

-- ============================================================================
-- Notes (lesson-level or scoped to one action item)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.le_lessons(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.le_lesson_items(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_lesson_notes_lesson_id_idx ON public.le_lesson_notes(lesson_id);
CREATE INDEX IF NOT EXISTS le_lesson_notes_item_id_idx ON public.le_lesson_notes(item_id);

-- ============================================================================
-- Reference links (lesson-level or scoped to one action item)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_lesson_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.le_lessons(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.le_lesson_items(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  url text NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_lesson_links_lesson_id_idx ON public.le_lesson_links(lesson_id);
CREATE INDEX IF NOT EXISTS le_lesson_links_item_id_idx ON public.le_lesson_links(item_id);

-- ============================================================================
-- Media / documents (lesson-level, or scoped to an item or a note)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_lesson_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.le_lessons(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.le_lesson_items(id) ON DELETE CASCADE,
  note_id uuid REFERENCES public.le_lesson_notes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  media_type text NOT NULL DEFAULT 'photo'
    CHECK (media_type = ANY (ARRAY['photo'::text, 'video'::text, 'file'::text])),
  url text NOT NULL,
  file_name text,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_lesson_media_lesson_id_idx ON public.le_lesson_media(lesson_id);
CREATE INDEX IF NOT EXISTS le_lesson_media_item_id_idx ON public.le_lesson_media(item_id);
CREATE INDEX IF NOT EXISTS le_lesson_media_note_id_idx ON public.le_lesson_media(note_id);

-- ============================================================================
-- RLS (owner or active household member, matching other le_* tables)
-- ============================================================================

ALTER TABLE public.le_lesson_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_lesson_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_lesson_media ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['le_lesson_items', 'le_lesson_notes', 'le_lesson_links', 'le_lesson_media']
  LOOP
    EXECUTE format($f$
      CREATE POLICY "%1$s_select" ON public.%1$I FOR SELECT TO authenticated
        USING (
          created_by = auth.uid()
          OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
        );
      CREATE POLICY "%1$s_insert" ON public.%1$I FOR INSERT TO authenticated
        WITH CHECK (created_by = auth.uid());
      CREATE POLICY "%1$s_update" ON public.%1$I FOR UPDATE TO authenticated
        USING (
          created_by = auth.uid()
          OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
        )
        WITH CHECK (
          created_by = auth.uid()
          OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
        );
      CREATE POLICY "%1$s_delete" ON public.%1$I FOR DELETE TO authenticated
        USING (
          created_by = auth.uid()
          OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
        );
    $f$, t);
  END LOOP;
END $$;

COMMENT ON TABLE public.le_lesson_items IS 'Action items prescribed by a lesson (print, gather, do, log) plus parent-added ones — the lesson checklist';
COMMENT ON TABLE public.le_lesson_notes IS 'Notes on a lesson or on one of its action items';
COMMENT ON TABLE public.le_lesson_links IS 'Reference links on a lesson or on one of its action items';
COMMENT ON TABLE public.le_lesson_media IS 'Uploaded documents/photos/videos attached to a lesson, action item, or note';
