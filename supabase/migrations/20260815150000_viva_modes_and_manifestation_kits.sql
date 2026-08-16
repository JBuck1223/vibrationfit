-- VIVA in-thread modes + My Manifestations kits
-- conversation_sessions.viva_mode restores the last composer mode.
-- viva_mode_switches is the analytics grain (Friend → Coach → Kit funnels).
-- manifestation_kits hold a chosen reality; assets are a join table only.
-- projects.manifestation_kit_id nests inspired-action lists inside a kit.

-- ---------------------------------------------------------------------------
-- In-thread mode on the session (restore only)
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversation_sessions
  ADD COLUMN IF NOT EXISTS viva_mode text NOT NULL DEFAULT 'auto';

DO $$ BEGIN
  ALTER TABLE public.conversation_sessions
    ADD CONSTRAINT conversation_sessions_viva_mode_check
    CHECK (viva_mode IN ('auto', 'friend', 'coach', 'kit', 'assistant'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Mode switch events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.viva_mode_switches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  from_mode text NOT NULL CHECK (from_mode IN ('auto', 'friend', 'coach', 'kit', 'assistant')),
  to_mode text NOT NULL CHECK (to_mode IN ('auto', 'friend', 'coach', 'kit', 'assistant')),
  switched_at timestamptz NOT NULL DEFAULT now(),
  message_count_at_switch integer NOT NULL DEFAULT 0,
  source text NOT NULL CHECK (source IN ('composer', 'restore'))
);

CREATE INDEX IF NOT EXISTS idx_viva_mode_switches_user_conversation
  ON public.viva_mode_switches(user_id, conversation_id, switched_at DESC);

ALTER TABLE public.viva_mode_switches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mode switches"
  ON public.viva_mode_switches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mode switches"
  ON public.viva_mode_switches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all mode switches"
  ON public.viva_mode_switches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_accounts
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Manifestation kits
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manifestation_kits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  title text NOT NULL,
  chosen_reality text,
  life_categories text[] NOT NULL DEFAULT '{}',
  conversation_id uuid REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  vision_draft_id uuid REFERENCES public.vision_versions(id) ON DELETE SET NULL,
  vision_version_id uuid REFERENCES public.vision_versions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'actualized', 'archived')),
  actualized_at timestamptz,
  actualization_story_id uuid,
  flow jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manifestation_kits_user_status
  ON public.manifestation_kits(user_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_manifestation_kits_conversation
  ON public.manifestation_kits(conversation_id);

ALTER TABLE public.manifestation_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kits"
  ON public.manifestation_kits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own kits"
  ON public.manifestation_kits FOR ALL
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Kit assets (join table — do not add kit_id to journal/board/abundance/papers)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manifestation_kit_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  kit_id uuid NOT NULL REFERENCES public.manifestation_kits(id) ON DELETE CASCADE,
  layer text NOT NULL CHECK (layer IN ('suite', 'project', 'evidence', 'milestone')),
  slot text NOT NULL CHECK (slot IN (
    'vision_draft', 'story', 'incantation', 'spark_query', 'song', 'voice', 'mix',
    'vision_board', 'journal', 'daily_paper', 'abundance', 'dream_destination',
    'trip', 'map_target', 'map_commitment', 'project'
  )),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'ready', 'handoff', 'skipped', 'actualized')),
  entity_type text,
  entity_id uuid,
  handoff_path text,
  pinned_by text CHECK (pinned_by IN ('viva', 'member')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manifestation_kit_assets_kit_layer
  ON public.manifestation_kit_assets(kit_id, layer, sort_order);

ALTER TABLE public.manifestation_kit_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kit assets"
  ON public.manifestation_kit_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.manifestation_kits k
      WHERE k.id = kit_id AND k.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own kit assets"
  ON public.manifestation_kit_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.manifestation_kits k
      WHERE k.id = kit_id AND k.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Kit-scoped activations (do not overload area_activations unique key)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manifestation_kit_activations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  kit_id uuid NOT NULL REFERENCES public.manifestation_kits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area text NOT NULL,
  activation_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kit_id, area, activation_date)
);

CREATE INDEX IF NOT EXISTS idx_manifestation_kit_activations_kit_date
  ON public.manifestation_kit_activations(kit_id, activation_date DESC);

ALTER TABLE public.manifestation_kit_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kit activations"
  ON public.manifestation_kit_activations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own kit activations"
  ON public.manifestation_kit_activations FOR ALL
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Nest projects inside a kit
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS manifestation_kit_id uuid REFERENCES public.manifestation_kits(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_manifestation_kit
  ON public.projects(manifestation_kit_id);

-- ---------------------------------------------------------------------------
-- Realtime invalidation
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.viva_mode_switches;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.manifestation_kits;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.manifestation_kit_assets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.manifestation_kit_activations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
