-- Household Sharing System: core settings + helpers
--
-- Each household member controls, per feature, whether ALL of their content is
-- shared with the household ('all') or only items they explicitly select
-- ('select', the default). "Share all" is evaluated at query time via the
-- household_shares_all() helper, so toggling the setting is instant with no
-- backfill or data mutation.
--
-- IMPORTANT: all membership checks in policies/functions MUST go through
-- SECURITY DEFINER helpers (is_active_household_member, is_household_admin,
-- household_shares_all). Raw subqueries on household_members inside RLS caused
-- the infinite-recursion bug fixed in 20260706140000_fix_households_rls_recursion.sql.

-- ============================================================================
-- Step 1: Settings table (one row per member per household)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.household_sharing_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Per-feature share mode: 'all' = everything I create is household-visible,
  -- 'select' = only items I explicitly share (per-item household_id toggle).
  life_visions_mode text NOT NULL DEFAULT 'select' CHECK (life_visions_mode IN ('all', 'select')),
  vision_board_mode text NOT NULL DEFAULT 'select' CHECK (vision_board_mode IN ('all', 'select')),
  abundance_mode    text NOT NULL DEFAULT 'select' CHECK (abundance_mode    IN ('all', 'select')),
  audio_mode        text NOT NULL DEFAULT 'select' CHECK (audio_mode        IN ('all', 'select')),
  projects_mode     text NOT NULL DEFAULT 'select' CHECK (projects_mode     IN ('all', 'select')),
  stories_mode      text NOT NULL DEFAULT 'select' CHECK (stories_mode      IN ('all', 'select')),

  -- Seeds the scope toggle (Me / Both / Everyone) across features.
  default_view text NOT NULL DEFAULT 'me' CHECK (default_view IN ('me', 'both')),

  -- Stamped when the member completes the one-time sharing setup (onboarding).
  setup_completed_at timestamptz,

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_sharing_settings_user
  ON public.household_sharing_settings (user_id);

COMMENT ON TABLE public.household_sharing_settings IS
  'Per-member, per-feature household sharing preferences. share mode all = everything shared at query time via household_shares_all(); select = only items with household_id set.';

CREATE TRIGGER trg_household_sharing_settings_updated_at
  BEFORE UPDATE ON public.household_sharing_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- Step 2: SECURITY DEFINER helpers
-- ============================================================================

-- True when the owner has "share all" enabled for the feature and both owner
-- and viewer are active members of the same household.
CREATE OR REPLACE FUNCTION public.household_shares_all(owner_id uuid, feature text, viewer_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT owner_id IS NOT NULL
    AND viewer_id IS NOT NULL
    AND owner_id <> viewer_id
    AND EXISTS (
      SELECT 1
      FROM public.household_members om
      JOIN public.household_members vm
        ON vm.household_id = om.household_id
       AND vm.user_id = viewer_id
       AND vm.status = 'active'
      JOIN public.household_sharing_settings s
        ON s.household_id = om.household_id
       AND s.user_id = owner_id
      WHERE om.user_id = owner_id
        AND om.status = 'active'
        AND CASE feature
          WHEN 'life_visions' THEN s.life_visions_mode = 'all'
          WHEN 'vision_board' THEN s.vision_board_mode = 'all'
          WHEN 'abundance'    THEN s.abundance_mode    = 'all'
          WHEN 'audio'        THEN s.audio_mode        = 'all'
          WHEN 'projects'     THEN s.projects_mode     = 'all'
          WHEN 'stories'      THEN s.stories_mode      = 'all'
          ELSE false
        END
    );
$$;

REVOKE EXECUTE ON FUNCTION public.household_shares_all(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.household_shares_all(uuid, text, uuid) TO authenticated;

COMMENT ON FUNCTION public.household_shares_all(uuid, text, uuid) IS
  'SECURITY DEFINER: true when owner shares ALL content for a feature (life_visions|vision_board|abundance|audio|projects|stories) with a household the viewer actively belongs to.';

-- Admin membership check (avoids raw household_members subqueries in policies).
CREATE OR REPLACE FUNCTION public.is_household_admin(h uuid, u uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = h
      AND user_id = u
      AND status = 'active'
      AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_household_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_household_admin(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.is_household_admin(uuid, uuid) IS
  'SECURITY DEFINER function to check if user is an active household admin. Bypasses RLS for membership checks.';

-- ============================================================================
-- Step 3: RLS for the settings table
-- ============================================================================
ALTER TABLE public.household_sharing_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_sharing_settings TO authenticated;

-- Members manage their own settings row.
CREATE POLICY "Users manage own sharing settings"
  ON public.household_sharing_settings FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Household members can view each other's settings (hub/attribution UX).
CREATE POLICY "Household members can view sharing settings"
  ON public.household_sharing_settings FOR SELECT TO authenticated
  USING (public.is_active_household_member(household_id, auth.uid()));
