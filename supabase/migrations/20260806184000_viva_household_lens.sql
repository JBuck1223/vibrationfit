-- VIVA Household Lens (opt-in)
-- When BOTH members of a household turn on VIVA sharing, their VIVA memory,
-- constraints, and embeddings become mutually visible so the coach can hold
-- the shared family story ("Knowing you two...").

-- Opt-in flag, consistent with the per-feature mode pattern
ALTER TABLE public.household_sharing_settings
  ADD COLUMN IF NOT EXISTS viva_mode text NOT NULL DEFAULT 'off'
  CHECK (viva_mode IN ('off', 'all'));

-- Memory items gain a household stamp (constraints + embeddings already have one)
ALTER TABLE public.viva_memory_items
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id) ON DELETE SET NULL;

-- Mutual opt-in check: true when owner and viewer are active members of the
-- same household AND both have viva_mode = 'all'
CREATE OR REPLACE FUNCTION public.viva_household_shared(owner_id uuid, viewer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
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
      JOIN public.household_sharing_settings os
        ON os.household_id = om.household_id
       AND os.user_id = owner_id
       AND os.viva_mode = 'all'
      JOIN public.household_sharing_settings vs
        ON vs.household_id = om.household_id
       AND vs.user_id = viewer_id
       AND vs.viva_mode = 'all'
      WHERE om.user_id = owner_id
        AND om.status = 'active'
    );
$$;

-- Household read policies (owner policies already exist)
CREATE POLICY "Household members can view shared memories"
  ON public.viva_memory_items FOR SELECT
  USING (household_id IS NOT NULL AND public.viva_household_shared(user_id, auth.uid()));

CREATE POLICY "Household members can view shared constraints"
  ON public.vibrational_constraints FOR SELECT
  USING (household_id IS NOT NULL AND public.viva_household_shared(user_id, auth.uid()));

CREATE POLICY "Household members can view shared embeddings"
  ON public.member_embeddings FOR SELECT
  USING (household_id IS NOT NULL AND public.viva_household_shared(user_id, auth.uid()));
