-- Kill "kit" from the schema. Manifestations are hubs, not kits.
-- Also rename stored VIVA mode kit → builder.

-- ---------------------------------------------------------------------------
-- Drop kit-named policies (recreated after rename)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own kits" ON public.manifestation_kits;
DROP POLICY IF EXISTS "Users can manage own kits" ON public.manifestation_kits;
DROP POLICY IF EXISTS "Users can view own kit assets" ON public.manifestation_kit_assets;
DROP POLICY IF EXISTS "Users can manage own kit assets" ON public.manifestation_kit_assets;
DROP POLICY IF EXISTS "Users can view own kit activations" ON public.manifestation_kit_activations;
DROP POLICY IF EXISTS "Users can manage own kit activations" ON public.manifestation_kit_activations;

-- ---------------------------------------------------------------------------
-- Rename tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.manifestation_kits RENAME TO manifestations;
ALTER TABLE public.manifestation_kit_assets RENAME TO manifestation_assets;
ALTER TABLE public.manifestation_kit_activations RENAME TO manifestation_activations;

-- ---------------------------------------------------------------------------
-- Rename columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.manifestation_assets RENAME COLUMN kit_id TO manifestation_id;
ALTER TABLE public.manifestation_activations RENAME COLUMN kit_id TO manifestation_id;
ALTER TABLE public.projects RENAME COLUMN manifestation_kit_id TO manifestation_id;

-- ---------------------------------------------------------------------------
-- Rename indexes
-- ---------------------------------------------------------------------------
ALTER INDEX IF EXISTS idx_manifestation_kits_user_status RENAME TO idx_manifestations_user_status;
ALTER INDEX IF EXISTS idx_manifestation_kits_conversation RENAME TO idx_manifestations_conversation;
ALTER INDEX IF EXISTS idx_manifestation_kit_assets_kit_layer RENAME TO idx_manifestation_assets_layer;
ALTER INDEX IF EXISTS idx_manifestation_kit_activations_kit_date RENAME TO idx_manifestation_activations_date;
ALTER INDEX IF EXISTS idx_projects_manifestation_kit RENAME TO idx_projects_manifestation;

-- ---------------------------------------------------------------------------
-- Rename constraints
-- ---------------------------------------------------------------------------
ALTER TABLE public.manifestations RENAME CONSTRAINT manifestation_kits_pkey TO manifestations_pkey;
ALTER TABLE public.manifestations RENAME CONSTRAINT manifestation_kits_user_id_fkey TO manifestations_user_id_fkey;
ALTER TABLE public.manifestations RENAME CONSTRAINT manifestation_kits_household_id_fkey TO manifestations_household_id_fkey;
ALTER TABLE public.manifestations RENAME CONSTRAINT manifestation_kits_conversation_id_fkey TO manifestations_conversation_id_fkey;
ALTER TABLE public.manifestations RENAME CONSTRAINT manifestation_kits_vision_draft_id_fkey TO manifestations_vision_draft_id_fkey;
ALTER TABLE public.manifestations RENAME CONSTRAINT manifestation_kits_vision_version_id_fkey TO manifestations_vision_version_id_fkey;
ALTER TABLE public.manifestations RENAME CONSTRAINT manifestation_kits_status_check TO manifestations_status_check;

ALTER TABLE public.manifestation_assets RENAME CONSTRAINT manifestation_kit_assets_pkey TO manifestation_assets_pkey;
ALTER TABLE public.manifestation_assets RENAME CONSTRAINT manifestation_kit_assets_kit_id_fkey TO manifestation_assets_manifestation_id_fkey;
ALTER TABLE public.manifestation_assets RENAME CONSTRAINT manifestation_kit_assets_layer_check TO manifestation_assets_layer_check;
ALTER TABLE public.manifestation_assets RENAME CONSTRAINT manifestation_kit_assets_slot_check TO manifestation_assets_slot_check;
ALTER TABLE public.manifestation_assets RENAME CONSTRAINT manifestation_kit_assets_status_check TO manifestation_assets_status_check;
ALTER TABLE public.manifestation_assets RENAME CONSTRAINT manifestation_kit_assets_pinned_by_check TO manifestation_assets_pinned_by_check;

ALTER TABLE public.manifestation_activations RENAME CONSTRAINT manifestation_kit_activations_pkey TO manifestation_activations_pkey;
ALTER TABLE public.manifestation_activations RENAME CONSTRAINT manifestation_kit_activations_kit_id_fkey TO manifestation_activations_manifestation_id_fkey;
ALTER TABLE public.manifestation_activations RENAME CONSTRAINT manifestation_kit_activations_user_id_fkey TO manifestation_activations_user_id_fkey;
ALTER TABLE public.manifestation_activations RENAME CONSTRAINT manifestation_kit_activations_kit_id_area_activation_date_key TO manifestation_activations_unique_day;

ALTER TABLE public.projects RENAME CONSTRAINT projects_manifestation_kit_id_fkey TO projects_manifestation_id_fkey;

-- ---------------------------------------------------------------------------
-- Recreate RLS
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own manifestations"
  ON public.manifestations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own manifestations"
  ON public.manifestations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own manifestation assets"
  ON public.manifestation_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.manifestations m
      WHERE m.id = manifestation_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own manifestation assets"
  ON public.manifestation_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.manifestations m
      WHERE m.id = manifestation_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own manifestation activations"
  ON public.manifestation_activations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own manifestation activations"
  ON public.manifestation_activations FOR ALL
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- VIVA mode: kit → builder
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversation_sessions
  DROP CONSTRAINT IF EXISTS conversation_sessions_viva_mode_check;

UPDATE public.conversation_sessions
  SET viva_mode = 'builder'
  WHERE viva_mode = 'kit';

ALTER TABLE public.conversation_sessions
  ADD CONSTRAINT conversation_sessions_viva_mode_check
  CHECK (viva_mode IN ('auto', 'friend', 'coach', 'builder', 'assistant'));

ALTER TABLE public.viva_mode_switches
  DROP CONSTRAINT IF EXISTS viva_mode_switches_from_mode_check;
ALTER TABLE public.viva_mode_switches
  DROP CONSTRAINT IF EXISTS viva_mode_switches_to_mode_check;

UPDATE public.viva_mode_switches SET from_mode = 'builder' WHERE from_mode = 'kit';
UPDATE public.viva_mode_switches SET to_mode = 'builder' WHERE to_mode = 'kit';

ALTER TABLE public.viva_mode_switches
  ADD CONSTRAINT viva_mode_switches_from_mode_check
  CHECK (from_mode IN ('auto', 'friend', 'coach', 'builder', 'assistant'));
ALTER TABLE public.viva_mode_switches
  ADD CONSTRAINT viva_mode_switches_to_mode_check
  CHECK (to_mode IN ('auto', 'friend', 'coach', 'builder', 'assistant'));
