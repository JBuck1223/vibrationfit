-- Life Explorer (Vibration Fit Homeschool)
-- Curiosity-driven curriculum: students, expeditions, wonder wall, lessons, evidence, skills

-- ============================================================================
-- Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  name text NOT NULL,
  grade_level text NOT NULL DEFAULT '1',
  current_age integer,
  interests text[] NOT NULL DEFAULT '{}',
  strengths text[] NOT NULL DEFAULT '{}',
  skills_needing_support text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_students_created_by_idx ON public.le_students(created_by);
CREATE INDEX IF NOT EXISTS le_students_household_id_idx ON public.le_students(household_id);

CREATE TABLE IF NOT EXISTS public.le_expeditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  life_category text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text])),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  essential_questions text[] NOT NULL DEFAULT '{}',
  core_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT le_expeditions_life_category_check CHECK (
    life_category = ANY (ARRAY[
      'fun','health','travel','love','family','social',
      'home','work','money','stuff','giving','spirituality'
    ])
  )
);

CREATE INDEX IF NOT EXISTS le_expeditions_student_id_idx ON public.le_expeditions(student_id);
CREATE INDEX IF NOT EXISTS le_expeditions_status_idx ON public.le_expeditions(status);

-- At most one active expedition per student
CREATE UNIQUE INDEX IF NOT EXISTS le_expeditions_one_active_per_student
  ON public.le_expeditions(student_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.le_wonder_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid NOT NULL REFERENCES public.le_expeditions(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind = ANY (ARRAY['know'::text, 'wonder'::text, 'learned'::text])),
  statement text NOT NULL,
  interest_level integer CHECK (interest_level IS NULL OR (interest_level >= 1 AND interest_level <= 5)),
  status text NOT NULL DEFAULT 'unexplored'
    CHECK (status = ANY (ARRAY['unexplored'::text, 'exploring'::text, 'answered'::text])),
  source text NOT NULL DEFAULT 'student',
  original_language boolean NOT NULL DEFAULT true,
  evidence_id uuid,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_wonder_items_expedition_id_idx ON public.le_wonder_items(expedition_id);
CREATE INDEX IF NOT EXISTS le_wonder_items_kind_idx ON public.le_wonder_items(kind);

CREATE TABLE IF NOT EXISTS public.le_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid NOT NULL REFERENCES public.le_expeditions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  lesson_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  essential_question text,
  status text NOT NULL DEFAULT 'ready'
    CHECK (status = ANY (ARRAY['ready'::text, 'in_progress'::text, 'completed'::text, 'skipped'::text])),
  estimated_total_minutes integer,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  planned_for date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_lessons_expedition_id_idx ON public.le_lessons(expedition_id);
CREATE INDEX IF NOT EXISTS le_lessons_student_status_idx ON public.le_lessons(student_id, status);
CREATE INDEX IF NOT EXISTS le_lessons_planned_for_idx ON public.le_lessons(planned_for);

CREATE TABLE IF NOT EXISTS public.le_lesson_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL UNIQUE REFERENCES public.le_lessons(id) ON DELETE CASCADE,
  expedition_id uuid NOT NULL REFERENCES public.le_expeditions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  recorded_on date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'completed'
    CHECK (status = ANY (ARRAY['completed'::text, 'partial'::text, 'skipped'::text])),
  activities_completed text[] NOT NULL DEFAULT '{}',
  activities_skipped text[] NOT NULL DEFAULT '{}',
  student_engagement integer CHECK (student_engagement IS NULL OR (student_engagement >= 1 AND student_engagement <= 5)),
  enjoyed_most text,
  created_said_demonstrated text,
  easy_or_difficult text,
  new_questions text[] NOT NULL DEFAULT '{}',
  skills_observed text[] NOT NULL DEFAULT '{}',
  direction text CHECK (direction IS NULL OR direction = ANY (ARRAY['continue'::text, 'deepen'::text, 'change'::text])),
  parent_notes text,
  recommended_next_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_lesson_records_student_id_idx ON public.le_lesson_records(student_id);
CREATE INDEX IF NOT EXISTS le_lesson_records_expedition_id_idx ON public.le_lesson_records(expedition_id);

CREATE TABLE IF NOT EXISTS public.le_learning_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  expedition_id uuid REFERENCES public.le_expeditions(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.le_lessons(id) ON DELETE SET NULL,
  lesson_record_id uuid REFERENCES public.le_lesson_records(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'other'
    CHECK (type = ANY (ARRAY[
      'photo'::text, 'writing'::text, 'experiment_record'::text,
      'build'::text, 'presentation'::text, 'drawing'::text,
      'journal'::text, 'recording'::text, 'other'::text
    ])),
  title text NOT NULL,
  file_url text,
  photo_url text,
  student_explanation text,
  parent_observation text,
  academic_tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_learning_evidence_student_id_idx ON public.le_learning_evidence(student_id);
CREATE INDEX IF NOT EXISTS le_learning_evidence_expedition_id_idx ON public.le_learning_evidence(expedition_id);

ALTER TABLE public.le_wonder_items
  DROP CONSTRAINT IF EXISTS le_wonder_items_evidence_id_fkey;
ALTER TABLE public.le_wonder_items
  ADD CONSTRAINT le_wonder_items_evidence_id_fkey
  FOREIGN KEY (evidence_id) REFERENCES public.le_learning_evidence(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.le_skill_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  skill text NOT NULL,
  subject text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'developing'
    CHECK (status = ANY (ARRAY['emerging'::text, 'developing'::text, 'secure'::text, 'needs_support'::text])),
  last_observed date,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_skill_progress_student_id_idx ON public.le_skill_progress(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS le_skill_progress_student_skill_subject_idx
  ON public.le_skill_progress(student_id, skill, subject);

-- ============================================================================
-- Token usage action type
-- ============================================================================

ALTER TABLE public.token_usage DROP CONSTRAINT IF EXISTS token_usage_action_type_check;
ALTER TABLE public.token_usage ADD CONSTRAINT token_usage_action_type_check
  CHECK (action_type = ANY (ARRAY[
    'assessment_scoring'::text,
    'vision_generation'::text,
    'vision_refinement'::text,
    'blueprint_generation'::text,
    'chat_conversation'::text,
    'audio_generation'::text,
    'image_generation'::text,
    'transcription'::text,
    'admin_grant'::text,
    'admin_deduct'::text,
    'subscription_grant'::text,
    'trial_grant'::text,
    'token_pack_purchase'::text,
    'life_vision_category_summary'::text,
    'life_vision_master_assembly'::text,
    'prompt_suggestions'::text,
    'frequency_flip'::text,
    'vibrational_analysis'::text,
    'viva_scene_generation'::text,
    'north_star_reflection'::text,
    'voice_profile_analysis'::text,
    'vision_board_ideas'::text,
    'life_vision_category_generation'::text,
    'imagination_starter'::text,
    'focus_story_generation'::text,
    'incantation_generation'::text,
    'spark_query_generation'::text,
    'story_refinement'::text,
    'song_lyrics_generation'::text,
    'project_organize'::text,
    'song_music_generation'::text,
    'song_stems_generation'::text,
    'video_generation'::text,
    'background_processing'::text,
    'admin_tool'::text,
    'life_explorer_lesson'::text,
    'life_explorer_checkin'::text
  ]));

-- ============================================================================
-- RLS helpers access (reuse existing is_active_household_member)
-- ============================================================================

ALTER TABLE public.le_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_wonder_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_lesson_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_learning_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_skill_progress ENABLE ROW LEVEL SECURITY;

-- Students
CREATE POLICY "le_students_select" ON public.le_students FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_students_insert" ON public.le_students FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_students_update" ON public.le_students FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_students_delete" ON public.le_students FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_household_admin(household_id, auth.uid()))
  );

-- Expeditions
CREATE POLICY "le_expeditions_select" ON public.le_expeditions FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_expeditions_insert" ON public.le_expeditions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_expeditions_update" ON public.le_expeditions FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_expeditions_delete" ON public.le_expeditions FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_household_admin(household_id, auth.uid()))
  );

-- Wonder items
CREATE POLICY "le_wonder_items_select" ON public.le_wonder_items FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_wonder_items_insert" ON public.le_wonder_items FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_wonder_items_update" ON public.le_wonder_items FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_wonder_items_delete" ON public.le_wonder_items FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );

-- Lessons
CREATE POLICY "le_lessons_select" ON public.le_lessons FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_lessons_insert" ON public.le_lessons FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_lessons_update" ON public.le_lessons FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_lessons_delete" ON public.le_lessons FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_household_admin(household_id, auth.uid()))
  );

-- Lesson records
CREATE POLICY "le_lesson_records_select" ON public.le_lesson_records FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_lesson_records_insert" ON public.le_lesson_records FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_lesson_records_update" ON public.le_lesson_records FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_lesson_records_delete" ON public.le_lesson_records FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_household_admin(household_id, auth.uid()))
  );

-- Learning evidence
CREATE POLICY "le_learning_evidence_select" ON public.le_learning_evidence FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_learning_evidence_insert" ON public.le_learning_evidence FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_learning_evidence_update" ON public.le_learning_evidence FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_learning_evidence_delete" ON public.le_learning_evidence FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );

-- Skill progress
CREATE POLICY "le_skill_progress_select" ON public.le_skill_progress FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_skill_progress_insert" ON public.le_skill_progress FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_skill_progress_update" ON public.le_skill_progress FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_skill_progress_delete" ON public.le_skill_progress FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_household_admin(household_id, auth.uid()))
  );

COMMENT ON TABLE public.le_students IS 'Life Explorer student profiles (household/parent-scoped)';
COMMENT ON TABLE public.le_expeditions IS 'Life Explorer expeditions (Life Category + topic)';
COMMENT ON TABLE public.le_wonder_items IS 'Wonder Wall: know / wonder / learned';
COMMENT ON TABLE public.le_lessons IS 'Generated daily lessons with full contract payload';
COMMENT ON TABLE public.le_lesson_records IS 'Post-lesson parent check-in and completion records';
COMMENT ON TABLE public.le_learning_evidence IS 'Portfolio artifacts and demonstrations';
COMMENT ON TABLE public.le_skill_progress IS 'Calm academic skill tracking (not grades)';
