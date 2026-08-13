-- Life Explorer Storybooks
-- AI-generated picture books starring a recurring cast of Life Explorer characters.

-- ============================================================================
-- Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.le_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  student_id uuid REFERENCES public.le_students(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  species text,
  personality text NOT NULL,
  catchphrase text,
  visual_description text NOT NULL,
  portrait_url text,
  is_starter boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_characters_created_by_idx ON public.le_characters(created_by);
CREATE INDEX IF NOT EXISTS le_characters_student_id_idx ON public.le_characters(student_id);
-- One row per starter character per user (portraits are generated per-user)
CREATE UNIQUE INDEX IF NOT EXISTS le_characters_user_slug_idx
  ON public.le_characters(created_by, slug);

CREATE TABLE IF NOT EXISTS public.le_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.le_students(id) ON DELETE CASCADE,
  expedition_id uuid REFERENCES public.le_expeditions(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  title text NOT NULL,
  premise text,
  topic text NOT NULL,
  reading_mode text NOT NULL DEFAULT 'read_to_me'
    CHECK (reading_mode = ANY (ARRAY['i_read'::text, 'read_to_me'::text])),
  status text NOT NULL DEFAULT 'generating'
    CHECK (status = ANY (ARRAY['generating'::text, 'ready'::text, 'failed'::text])),
  status_detail text,
  cover_url text,
  cover_image_prompt text,
  style_notes text,
  character_ids uuid[] NOT NULL DEFAULT '{}',
  page_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_books_student_id_idx ON public.le_books(student_id);
CREATE INDEX IF NOT EXISTS le_books_expedition_id_idx ON public.le_books(expedition_id);
CREATE INDEX IF NOT EXISTS le_books_created_by_idx ON public.le_books(created_by);

CREATE TABLE IF NOT EXISTS public.le_book_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.le_books(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  page_number integer NOT NULL,
  text text NOT NULL,
  image_prompt text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status = ANY (ARRAY['pending'::text, 'ready'::text, 'failed'::text])),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, page_number)
);

CREATE INDEX IF NOT EXISTS le_book_pages_book_id_idx ON public.le_book_pages(book_id);

-- ============================================================================
-- Token usage action types
-- Restores life_explorer_* types dropped by 20260808121000 and adds
-- life_explorer_book for storybook text generation.
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
    'life_explorer_book'::text
  ]));

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.le_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.le_book_pages ENABLE ROW LEVEL SECURITY;

-- Characters
CREATE POLICY "le_characters_select" ON public.le_characters FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_characters_insert" ON public.le_characters FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_characters_update" ON public.le_characters FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_characters_delete" ON public.le_characters FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_household_admin(household_id, auth.uid()))
  );

-- Books
CREATE POLICY "le_books_select" ON public.le_books FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_books_insert" ON public.le_books FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_books_update" ON public.le_books FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_books_delete" ON public.le_books FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_household_admin(household_id, auth.uid()))
  );

-- Book pages
CREATE POLICY "le_book_pages_select" ON public.le_book_pages FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_book_pages_insert" ON public.le_book_pages FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "le_book_pages_update" ON public.le_book_pages FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
  );
CREATE POLICY "le_book_pages_delete" ON public.le_book_pages FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (household_id IS NOT NULL AND public.is_household_admin(household_id, auth.uid()))
  );

COMMENT ON TABLE public.le_characters IS 'Life Explorers storybook cast — starter characters plus custom ones';
COMMENT ON TABLE public.le_books IS 'AI-generated picture books (Life Explorer Storybooks)';
COMMENT ON TABLE public.le_book_pages IS 'Pages of a generated storybook: text + illustration';
