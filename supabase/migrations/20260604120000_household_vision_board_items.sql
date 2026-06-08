Clean up-- Household-aware Vision Boards
-- Adds an optional household_id to vision_board_items so members can share
-- creations with their household, mirroring the vision_versions household model.
--
-- Sharing model:
--   household_id IS NULL  -> personal & private (default; opt-in privacy preserved)
--   household_id = <id>   -> shared with that household; all active members can view
--
-- The "shared household board" is simply the set of items where household_id is set.
-- Toggling "Include in household" on a personal item sets/clears household_id.

-- Step 1: Column + FK + index
ALTER TABLE public.vision_board_items
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vision_board_items_household_id
  ON public.vision_board_items(household_id)
  WHERE household_id IS NOT NULL;

COMMENT ON COLUMN public.vision_board_items.household_id IS
  'NULL = personal/private item. Set = shared with the household; all active members can view. Creator is still tracked via user_id.';

-- Step 2: Ensure table-level GRANTs exist (matches vision_versions setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vision_board_items TO authenticated;

-- Step 3: Household policies (supplement existing personal auth.uid() = user_id policies)

-- SELECT: any active household member can view shared items
DROP POLICY IF EXISTS "household_members_can_view_vision_board_items" ON public.vision_board_items;
CREATE POLICY "household_members_can_view_vision_board_items"
  ON public.vision_board_items FOR SELECT TO authenticated
  USING (
    household_id IS NOT NULL
    AND public.is_active_household_member(household_id, auth.uid())
  );

-- INSERT: a member can create an item directly into their household (must be creator)
DROP POLICY IF EXISTS "household_members_can_insert_vision_board_items" ON public.vision_board_items;
CREATE POLICY "household_members_can_insert_vision_board_items"
  ON public.vision_board_items FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND user_id = auth.uid()
    AND public.is_active_household_member(household_id, auth.uid())
  );

-- UPDATE: any active member can collaboratively edit shared items
-- (e.g. mark a shared creation as actualized together)
DROP POLICY IF EXISTS "household_members_can_update_vision_board_items" ON public.vision_board_items;
CREATE POLICY "household_members_can_update_vision_board_items"
  ON public.vision_board_items FOR UPDATE TO authenticated
  USING (
    household_id IS NOT NULL
    AND public.is_active_household_member(household_id, auth.uid())
  )
  WITH CHECK (
    household_id IS NOT NULL
    AND public.is_active_household_member(household_id, auth.uid())
  );

-- DELETE: only the creator or a household admin can delete a shared item
-- (protects a partner's contribution from accidental removal)
DROP POLICY IF EXISTS "household_creator_or_admin_can_delete_vision_board_items" ON public.vision_board_items;
CREATE POLICY "household_creator_or_admin_can_delete_vision_board_items"
  ON public.vision_board_items FOR DELETE TO authenticated
  USING (
    household_id IS NOT NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_members.household_id = vision_board_items.household_id
          AND household_members.user_id = auth.uid()
          AND household_members.status = 'active'
          AND household_members.role = 'admin'
      )
    )
  );

COMMENT ON TABLE public.vision_board_items IS
  'Vision board creations. Personal items have household_id = NULL. Household items have household_id set and are visible to all active household members.';
