-- Life Explorer is the curriculum.
-- Life I Choose, World Map, year arc, week arc; VIVA composes; mastery + semester mix.

-- ============================================================================
-- Students: the why
-- ============================================================================

ALTER TABLE public.le_students
  ADD COLUMN IF NOT EXISTS life_i_choose text,
  ADD COLUMN IF NOT EXISTS life_i_choose_audio_url text;

COMMENT ON COLUMN public.le_students.life_i_choose IS
  'The child''s whole-life vision. VIVA composes days from this why. Parent writes; VIVA may tighten diction only.';
COMMENT ON COLUMN public.le_students.life_i_choose_audio_url IS
  'Hear-it recording of the Life I Choose (CDN URL).';

-- ============================================================================
-- Expeditions: why this world belongs to that life
-- ============================================================================

ALTER TABLE public.le_expeditions
  ADD COLUMN IF NOT EXISTS why_this_matters text;

COMMENT ON COLUMN public.le_expeditions.why_this_matters IS
  'One or two sentences from the Life I Choose — why this expedition is this life, not a subject unit.';

-- ============================================================================
-- World Map — what of the universe he will taste
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_world_map_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  cluster text NOT NULL CHECK (cluster = ANY (ARRAY[
    'sky'::text, 'earth'::text, 'water'::text, 'motion'::text,
    'living'::text, 'places'::text, 'making'::text, 'people'::text
  ])),
  name text NOT NULL,
  taste_looks_like text,
  status text NOT NULL DEFAULT 'unvisited'
    CHECK (status = ANY (ARRAY['unvisited'::text, 'tasted'::text, 'wobbly'::text, 'secure'::text])),
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_world_map_items_student_id_idx
  ON public.le_world_map_items(student_id);
CREATE INDEX IF NOT EXISTS le_world_map_items_cluster_idx
  ON public.le_world_map_items(student_id, cluster);

COMMENT ON TABLE public.le_world_map_items IS
  'Ours. Sky / Earth / Water / Motion / Living / Places / Making / People. Not a publisher unit list.';

-- ============================================================================
-- Year arc — 9-month he-will-taste, with semester windows
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_year_arcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  school_year text NOT NULL,
  semester_1_start date NOT NULL,
  semester_1_end date NOT NULL,
  semester_2_start date NOT NULL,
  semester_2_end date NOT NULL,
  months jsonb NOT NULL DEFAULT '[]'::jsonb,
  parent_worlds_dump text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text])),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS le_year_arcs_one_active_per_student
  ON public.le_year_arcs(student_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS le_year_arcs_student_id_idx
  ON public.le_year_arcs(student_id);

COMMENT ON TABLE public.le_year_arcs IS
  'VIVA-drafted 9-month arc. Sem 1 = this grade secure. Sem 2 = mix next grade only where earned.';
COMMENT ON COLUMN public.le_year_arcs.months IS
  'JSON array of { month, tastes: [{ cluster, name, why }], notes }.';

-- ============================================================================
-- Week arc — five unique days VIVA composed
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_week_arcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  week_start date NOT NULL,
  days jsonb NOT NULL DEFAULT '[]'::jsonb,
  materials jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status = ANY (ARRAY['draft'::text, 'ready'::text, 'in_progress'::text, 'done'::text])),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, week_start)
);

CREATE INDEX IF NOT EXISTS le_week_arcs_student_id_idx
  ON public.le_week_arcs(student_id);
CREATE INDEX IF NOT EXISTS le_week_arcs_week_start_idx
  ON public.le_week_arcs(week_start);

COMMENT ON TABLE public.le_week_arcs IS
  'Coming week: five unique days from Life I Choose + World Map + mastery + semester. Generate fills each morning.';
COMMENT ON COLUMN public.le_week_arcs.days IS
  'JSON array of five { weekday, why, world_taste, math_rung, reading_rung, mix_next_grade, story_chapter, hook_seed, mission_seed, artifact_seed }.';

-- ============================================================================
-- Token usage: VIVA sidekick + compose (map / arc / week / diction)
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
    'travel_parse'::text,
    'song_music_generation'::text,
    'song_stems_generation'::text,
    'video_generation'::text,
    'background_processing'::text,
    'admin_tool'::text,
    'life_explorer_lesson'::text,
    'life_explorer_checkin'::text,
    'life_explorer_wall_photo'::text,
    'life_explorer_book'::text,
    'life_explorer_sidekick'::text,
    'life_explorer_compose'::text
  ]));

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.le_world_map_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_year_arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_week_arcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "le_world_map_items_select" ON public.le_world_map_items FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_world_map_items_insert" ON public.le_world_map_items FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_world_map_items_update" ON public.le_world_map_items FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_world_map_items_delete" ON public.le_world_map_items FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );

CREATE POLICY "le_year_arcs_select" ON public.le_year_arcs FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_year_arcs_insert" ON public.le_year_arcs FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_year_arcs_update" ON public.le_year_arcs FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_year_arcs_delete" ON public.le_year_arcs FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );

CREATE POLICY "le_week_arcs_select" ON public.le_week_arcs FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_week_arcs_insert" ON public.le_week_arcs FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_week_arcs_update" ON public.le_week_arcs FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_week_arcs_delete" ON public.le_week_arcs FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
