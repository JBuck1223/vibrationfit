-- Life Explorer — Activity Log (Florida homeschool portfolio)
-- Contemporaneous log of educational activities: what we did each day,
-- time spent schooling, reading material titles, and photo/video documentation.

-- ============================================================================
-- Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  expedition_id uuid REFERENCES public.le_expeditions(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  reading_materials text[] NOT NULL DEFAULT '{}',
  subjects text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_activity_logs_student_id_idx ON public.le_activity_logs(student_id);
CREATE INDEX IF NOT EXISTS le_activity_logs_entry_date_idx ON public.le_activity_logs(entry_date);
CREATE INDEX IF NOT EXISTS le_activity_logs_student_date_idx
  ON public.le_activity_logs(student_id, entry_date);

CREATE TABLE IF NOT EXISTS public.le_activity_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_log_id uuid NOT NULL REFERENCES public.le_activity_logs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  media_type text NOT NULL DEFAULT 'photo'
    CHECK (media_type = ANY (ARRAY['photo'::text, 'video'::text, 'file'::text])),
  url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_activity_media_activity_log_id_idx
  ON public.le_activity_media(activity_log_id);
CREATE INDEX IF NOT EXISTS le_activity_media_student_id_idx
  ON public.le_activity_media(student_id);

-- ============================================================================
-- RLS (owner or active household member, matching other le_* tables)
-- ============================================================================

ALTER TABLE public.le_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_activity_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "le_activity_logs_select" ON public.le_activity_logs FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_activity_logs_insert" ON public.le_activity_logs FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_activity_logs_update" ON public.le_activity_logs FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_activity_logs_delete" ON public.le_activity_logs FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );

CREATE POLICY "le_activity_media_select" ON public.le_activity_media FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_activity_media_insert" ON public.le_activity_media FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_activity_media_update" ON public.le_activity_media FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_activity_media_delete" ON public.le_activity_media FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );

COMMENT ON TABLE public.le_activity_logs IS 'Contemporaneous homeschool activity log (FL portfolio requirement): daily activities, time schooled, reading material titles';
COMMENT ON TABLE public.le_activity_media IS 'Photos/videos documenting learning, attached to activity log entries';
