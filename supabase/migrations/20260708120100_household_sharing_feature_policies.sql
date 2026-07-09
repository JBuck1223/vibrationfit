-- Household Sharing System: per-feature household_id columns + RLS policies
--
-- Extends the vision-board sharing pattern (20260604120000) to abundance,
-- audio, projects, and stories, and adds "share all" policies (driven by
-- household_sharing_settings via household_shares_all()) to every feature,
-- including the two features that already support per-item sharing
-- (vision_versions, vision_board_items).
--
-- Effective visibility per row (uniform across features):
--   1. owner (user_id / created_by = auth.uid())            [existing policies]
--   2. explicitly shared item (household_id set + active member)
--   3. owner has "share all" for the feature (query-time, no backfill)
--
-- UPDATE mirrors SELECT (full-edit collaboration), EXCEPT audio, where
-- generation/mixing stays owner-only (members listen, not edit).
-- DELETE: explicit shared items -> creator or household admin;
--         share-all items keep owner-only delete (a mode toggle must never
--         let someone else delete your personal content).

-- ============================================================================
-- 1. LIFE VISIONS (vision_versions) - share-all for committed personal visions
-- ============================================================================

-- Drafts are works-in-progress and are NOT exposed by share-all mode.
DROP POLICY IF EXISTS "share_all_can_view_personal_visions" ON public.vision_versions;
CREATE POLICY "share_all_can_view_personal_visions"
  ON public.vision_versions FOR SELECT TO authenticated
  USING (
    is_draft = false
    AND public.household_shares_all(user_id, 'life_visions', auth.uid())
  );

DROP POLICY IF EXISTS "share_all_can_update_personal_visions" ON public.vision_versions;
CREATE POLICY "share_all_can_update_personal_visions"
  ON public.vision_versions FOR UPDATE TO authenticated
  USING (
    is_draft = false
    AND public.household_shares_all(user_id, 'life_visions', auth.uid())
  )
  WITH CHECK (
    is_draft = false
    AND public.household_shares_all(user_id, 'life_visions', auth.uid())
  );

-- ============================================================================
-- 2. VISION BOARD (vision_board_items) - share-all supplement
-- ============================================================================

DROP POLICY IF EXISTS "share_all_can_view_vision_board_items" ON public.vision_board_items;
CREATE POLICY "share_all_can_view_vision_board_items"
  ON public.vision_board_items FOR SELECT TO authenticated
  USING (public.household_shares_all(user_id, 'vision_board', auth.uid()));

DROP POLICY IF EXISTS "share_all_can_update_vision_board_items" ON public.vision_board_items;
CREATE POLICY "share_all_can_update_vision_board_items"
  ON public.vision_board_items FOR UPDATE TO authenticated
  USING (public.household_shares_all(user_id, 'vision_board', auth.uid()))
  WITH CHECK (public.household_shares_all(user_id, 'vision_board', auth.uid()));

-- ============================================================================
-- 3. ABUNDANCE TRACKER (abundance_events, abundance_goals)
-- ============================================================================

ALTER TABLE public.abundance_events
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_abundance_events_household_id
  ON public.abundance_events(household_id) WHERE household_id IS NOT NULL;
COMMENT ON COLUMN public.abundance_events.household_id IS
  'NULL = personal/private. Set = shared with the household. Creator tracked via user_id.';

ALTER TABLE public.abundance_goals
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_abundance_goals_household_id
  ON public.abundance_goals(household_id) WHERE household_id IS NOT NULL;
COMMENT ON COLUMN public.abundance_goals.household_id IS
  'NULL = personal/private. Set = shared with the household. Creator tracked via user_id.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.abundance_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abundance_goals TO authenticated;

-- abundance_events
DROP POLICY IF EXISTS "household_can_view_abundance_events" ON public.abundance_events;
CREATE POLICY "household_can_view_abundance_events"
  ON public.abundance_events FOR SELECT TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'abundance', auth.uid())
  );

DROP POLICY IF EXISTS "household_can_update_abundance_events" ON public.abundance_events;
CREATE POLICY "household_can_update_abundance_events"
  ON public.abundance_events FOR UPDATE TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'abundance', auth.uid())
  )
  WITH CHECK (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'abundance', auth.uid())
  );

DROP POLICY IF EXISTS "household_can_insert_abundance_events" ON public.abundance_events;
CREATE POLICY "household_can_insert_abundance_events"
  ON public.abundance_events FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND user_id = auth.uid()
    AND public.is_active_household_member(household_id, auth.uid())
  );

DROP POLICY IF EXISTS "household_creator_or_admin_can_delete_abundance_events" ON public.abundance_events;
CREATE POLICY "household_creator_or_admin_can_delete_abundance_events"
  ON public.abundance_events FOR DELETE TO authenticated
  USING (
    household_id IS NOT NULL
    AND (user_id = auth.uid() OR public.is_household_admin(household_id, auth.uid()))
  );

-- abundance_goals
DROP POLICY IF EXISTS "household_can_view_abundance_goals" ON public.abundance_goals;
CREATE POLICY "household_can_view_abundance_goals"
  ON public.abundance_goals FOR SELECT TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'abundance', auth.uid())
  );

DROP POLICY IF EXISTS "household_can_update_abundance_goals" ON public.abundance_goals;
CREATE POLICY "household_can_update_abundance_goals"
  ON public.abundance_goals FOR UPDATE TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'abundance', auth.uid())
  )
  WITH CHECK (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'abundance', auth.uid())
  );

DROP POLICY IF EXISTS "household_can_insert_abundance_goals" ON public.abundance_goals;
CREATE POLICY "household_can_insert_abundance_goals"
  ON public.abundance_goals FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND user_id = auth.uid()
    AND public.is_active_household_member(household_id, auth.uid())
  );

DROP POLICY IF EXISTS "household_creator_or_admin_can_delete_abundance_goals" ON public.abundance_goals;
CREATE POLICY "household_creator_or_admin_can_delete_abundance_goals"
  ON public.abundance_goals FOR DELETE TO authenticated
  USING (
    household_id IS NOT NULL
    AND (user_id = auth.uid() OR public.is_household_admin(household_id, auth.uid()))
  );

-- ============================================================================
-- 4. AUDIO (audio_sets + audio_tracks) - members LISTEN, owner generates/mixes
-- ============================================================================

ALTER TABLE public.audio_sets
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_audio_sets_household_id
  ON public.audio_sets(household_id) WHERE household_id IS NOT NULL;
COMMENT ON COLUMN public.audio_sets.household_id IS
  'NULL = personal. Set = shared with the household (set automatically for household-vision audio, or via per-item sharing). Creator tracked via user_id.';

-- A set is household-listenable when any of:
--   owner, explicitly shared set, owner shares all audio,
--   the set belongs to a household vision the viewer can access,
--   the set is the audio of a story shared with the viewer.
CREATE OR REPLACE FUNCTION public.can_listen_audio_set(set_id uuid, u uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.audio_sets s
    WHERE s.id = set_id
      AND (
        s.user_id = u
        OR (s.household_id IS NOT NULL AND public.is_active_household_member(s.household_id, u))
        OR public.household_shares_all(s.user_id, 'audio', u)
        OR EXISTS (
          SELECT 1 FROM public.vision_versions vv
          WHERE vv.id = s.vision_id
            AND vv.household_id IS NOT NULL
            AND public.is_active_household_member(vv.household_id, u)
        )
        OR EXISTS (
          SELECT 1 FROM public.stories st
          WHERE st.audio_set_id = s.id
            AND (
              (st.household_id IS NOT NULL AND public.is_active_household_member(st.household_id, u))
              OR public.household_shares_all(st.user_id, 'stories', u)
            )
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_listen_audio_set(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_listen_audio_set(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.can_listen_audio_set(uuid, uuid) IS
  'SECURITY DEFINER: true when the user may listen to an audio set (owner, shared set, audio share-all, household-vision audio, or shared-story audio).';

DROP POLICY IF EXISTS "household_can_view_audio_sets" ON public.audio_sets;
CREATE POLICY "household_can_view_audio_sets"
  ON public.audio_sets FOR SELECT TO authenticated
  USING (public.can_listen_audio_set(id, auth.uid()));

DROP POLICY IF EXISTS "household_can_view_audio_tracks" ON public.audio_tracks;
CREATE POLICY "household_can_view_audio_tracks"
  ON public.audio_tracks FOR SELECT TO authenticated
  USING (
    audio_set_id IS NOT NULL
    AND public.can_listen_audio_set(audio_set_id, auth.uid())
  );

-- ============================================================================
-- 5. PROJECTS (projects + child tables) - full-edit collaboration
-- ============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_household_id
  ON public.projects(household_id) WHERE household_id IS NOT NULL;
COMMENT ON COLUMN public.projects.household_id IS
  'NULL = personal/private. Set = shared with the household; all active members can view and edit. Creator tracked via created_by.';

-- Household-collaborative access to a project (owner covered by existing policies).
CREATE OR REPLACE FUNCTION public.can_collaborate_on_project(p_project_id uuid, u uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
      AND (
        p.created_by = u
        OR (p.household_id IS NOT NULL AND public.is_active_household_member(p.household_id, u))
        OR public.household_shares_all(p.created_by, 'projects', u)
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_collaborate_on_project(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_collaborate_on_project(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.can_collaborate_on_project(uuid, uuid) IS
  'SECURITY DEFINER: true when the user owns the project or can collaborate on it via household sharing (explicit share or share-all).';

DROP POLICY IF EXISTS "household_can_view_projects" ON public.projects;
CREATE POLICY "household_can_view_projects"
  ON public.projects FOR SELECT TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(created_by, 'projects', auth.uid())
  );

DROP POLICY IF EXISTS "household_can_update_projects" ON public.projects;
CREATE POLICY "household_can_update_projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(created_by, 'projects', auth.uid())
  )
  WITH CHECK (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(created_by, 'projects', auth.uid())
  );

DROP POLICY IF EXISTS "household_can_insert_projects" ON public.projects;
CREATE POLICY "household_can_insert_projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND created_by = auth.uid()
    AND public.is_active_household_member(household_id, auth.uid())
  );

DROP POLICY IF EXISTS "household_creator_or_admin_can_delete_projects" ON public.projects;
CREATE POLICY "household_creator_or_admin_can_delete_projects"
  ON public.projects FOR DELETE TO authenticated
  USING (
    household_id IS NOT NULL
    AND (created_by = auth.uid() OR public.is_household_admin(household_id, auth.uid()))
  );

-- Child tables: collaboration follows the parent project (full edit incl. delete
-- of child rows - completing/removing tasks is part of collaborating).
DROP POLICY IF EXISTS "household_can_manage_project_tasks" ON public.project_tasks;
CREATE POLICY "household_can_manage_project_tasks"
  ON public.project_tasks FOR ALL TO authenticated
  USING (public.can_collaborate_on_project(project_id, auth.uid()))
  WITH CHECK (public.can_collaborate_on_project(project_id, auth.uid()));

DROP POLICY IF EXISTS "household_can_manage_project_comments" ON public.project_comments;
CREATE POLICY "household_can_manage_project_comments"
  ON public.project_comments FOR ALL TO authenticated
  USING (public.can_collaborate_on_project(project_id, auth.uid()))
  WITH CHECK (public.can_collaborate_on_project(project_id, auth.uid()));

DROP POLICY IF EXISTS "household_can_manage_project_attachments" ON public.project_attachments;
CREATE POLICY "household_can_manage_project_attachments"
  ON public.project_attachments FOR ALL TO authenticated
  USING (public.can_collaborate_on_project(project_id, auth.uid()))
  WITH CHECK (public.can_collaborate_on_project(project_id, auth.uid()));

DROP POLICY IF EXISTS "household_can_manage_project_custom_field_values" ON public.project_custom_field_values;
CREATE POLICY "household_can_manage_project_custom_field_values"
  ON public.project_custom_field_values FOR ALL TO authenticated
  USING (public.can_collaborate_on_project(project_id, auth.uid()))
  WITH CHECK (public.can_collaborate_on_project(project_id, auth.uid()));

DROP POLICY IF EXISTS "household_can_manage_project_tag_links" ON public.project_tag_links;
CREATE POLICY "household_can_manage_project_tag_links"
  ON public.project_tag_links FOR ALL TO authenticated
  USING (public.can_collaborate_on_project(project_id, auth.uid()))
  WITH CHECK (public.can_collaborate_on_project(project_id, auth.uid()));

DROP POLICY IF EXISTS "household_can_manage_project_links" ON public.project_links;
CREATE POLICY "household_can_manage_project_links"
  ON public.project_links FOR ALL TO authenticated
  USING (public.can_collaborate_on_project(source_project_id, auth.uid()))
  WITH CHECK (public.can_collaborate_on_project(source_project_id, auth.uid()));

-- ============================================================================
-- 6. STORIES (stories) - written + user-recorded audio both live on the row
-- ============================================================================

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_stories_household_id
  ON public.stories(household_id) WHERE household_id IS NOT NULL;
COMMENT ON COLUMN public.stories.household_id IS
  'NULL = personal/private. Set = shared with the household. Creator tracked via user_id. Generated audio follows the story via can_listen_audio_set().';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;

DROP POLICY IF EXISTS "household_can_view_stories" ON public.stories;
CREATE POLICY "household_can_view_stories"
  ON public.stories FOR SELECT TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'stories', auth.uid())
  );

DROP POLICY IF EXISTS "household_can_update_stories" ON public.stories;
CREATE POLICY "household_can_update_stories"
  ON public.stories FOR UPDATE TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'stories', auth.uid())
  )
  WITH CHECK (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'stories', auth.uid())
  );

DROP POLICY IF EXISTS "household_can_insert_stories" ON public.stories;
CREATE POLICY "household_can_insert_stories"
  ON public.stories FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND user_id = auth.uid()
    AND public.is_active_household_member(household_id, auth.uid())
  );

DROP POLICY IF EXISTS "household_creator_or_admin_can_delete_stories" ON public.stories;
CREATE POLICY "household_creator_or_admin_can_delete_stories"
  ON public.stories FOR DELETE TO authenticated
  USING (
    household_id IS NOT NULL
    AND (user_id = auth.uid() OR public.is_household_admin(household_id, auth.uid()))
  );

-- ============================================================================
-- 7. Backfill: audio sets already generated for household visions become
--    household-visible so both partners can play them.
-- ============================================================================
UPDATE public.audio_sets s
SET household_id = vv.household_id
FROM public.vision_versions vv
WHERE s.vision_id = vv.id
  AND vv.household_id IS NOT NULL
  AND s.household_id IS NULL;
