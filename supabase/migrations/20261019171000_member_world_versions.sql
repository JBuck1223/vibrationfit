-- Your World versions. Works like user_profiles versioning: draft, commit,
-- switch active, compare. The active version is copied into member_roster
-- (and the address into user_accounts) so every reader keeps one current row.

ALTER TABLE public.member_roster
  ADD COLUMN IF NOT EXISTS say_as text;

COMMENT ON COLUMN public.member_roster.say_as IS 'How to say the member''s own first name: hyphenated syllables, stressed one in caps.';

CREATE TABLE IF NOT EXISTS public.member_world_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  is_draft boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT false,
  parent_id uuid REFERENCES public.member_world_versions (id) ON DELETE SET NULL,
  -- Every Your World field, address included. Shape: src/lib/your-world/types.ts
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  version_notes text,
  -- 'member' | 'getting_started' | 'viva' | 'profile_port'
  source text NOT NULL DEFAULT 'member',
  source_profile_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  committed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS member_world_versions_user_version_idx
  ON public.member_world_versions (user_id, version_number);

CREATE UNIQUE INDEX IF NOT EXISTS member_world_versions_one_active_idx
  ON public.member_world_versions (user_id) WHERE is_active;

CREATE UNIQUE INDEX IF NOT EXISTS member_world_versions_one_draft_idx
  ON public.member_world_versions (user_id) WHERE is_draft;

CREATE TRIGGER member_world_versions_set_updated_at
  BEFORE UPDATE ON public.member_world_versions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.member_world_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_world_versions_owner_select"
  ON public.member_world_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "member_world_versions_owner_insert"
  ON public.member_world_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member_world_versions_owner_update"
  ON public.member_world_versions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member_world_versions_owner_delete"
  ON public.member_world_versions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "member_world_versions_service_all"
  ON public.member_world_versions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER PUBLICATION supabase_realtime ADD TABLE public.member_world_versions;
