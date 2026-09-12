-- Get to Know You: member_roster (WORLD facts — continuity) and
-- member_persona (living understanding — recognition). Both one row per
-- user, populated by the background extractor during the first Life Vision
-- conversation and fed into every VIVA prompt. Additive — replaces nothing;
-- user_profiles stays live until the later Profile transition.
-- NOTE: supabase/COMPLETE_SCHEMA_DUMP.sql is stale for these tables; the
-- user regenerates it after this migration is applied.

-- ---------------------------------------------------------------------------
-- member_roster — "What is objectively true about my world?"
-- Facts VIVA must never forget: people, dates, place, vocation, losses.
-- Confirm-card editable. Partial dates stored as strings:
-- "2018-06-12", "2018-06", or "2018".
-- ---------------------------------------------------------------------------
CREATE TABLE public.member_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- { name, birthday, married_on }
  partner jsonb,
  -- [{ name, birthday }]
  children jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{ name, kind, age }]
  pets jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{ name, role, birthday, deceased }] — parents, siblings, best friends
  people jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- { city, region }
  place jsonb,
  -- [{ name, what }] — the boat, the '72 Bronco, the lake house
  named_things jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{ who, note, date }] — losses and griefs VIVA holds with care
  tender_ground jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{ date, what, weight: 'celebrate' | 'gentle' }]
  days_that_matter jsonb NOT NULL DEFAULT '[]'::jsonb,
  vocation text,
  -- Only when explicitly stated or supplied elsewhere — never inferred.
  pronouns text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TRIGGER member_roster_set_updated_at
  BEFORE UPDATE ON public.member_roster
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.member_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_roster_owner_select"
  ON public.member_roster FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "member_roster_owner_insert"
  ON public.member_roster FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member_roster_owner_update"
  ON public.member_roster FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member_roster_owner_delete"
  ON public.member_roster FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "member_roster_service_all"
  ON public.member_roster FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- member_persona — "What helps VIVA understand me?"
-- Living understanding, populated opportunistically, no completion concept,
-- no confirmation UI. Every item carries provenance:
--   { value, source: 'stated' | 'inferred', evidence?: string[] }
-- Array fields are jsonb arrays of those objects; scalar fields are single
-- objects. Sections are jsonb so future extractors (vision commit, coach
-- sessions, journals) can deepen the same persona without schema churn.
-- ---------------------------------------------------------------------------
CREATE TABLE public.member_persona (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- SELF: identity_language[], core_values[], joy_sources[], hobbies[],
  -- strengths[], important_roles[], what_matters_most[], feels_most_like_me[],
  -- non_negotiables[], formative_stories[]
  self jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- CURRENT_SEASON: season_name, what_is_working[], current_tensions[],
  -- ready_for_more[], ready_to_release[]
  season jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- DESIRE: deferred_dreams[], secret_wants[], desired_experiences[],
  -- desired_identity[], freedom_means, enough_means, success_means
  desire jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- RELATING: coaching_style, challenge_level, processing_style,
  -- support_preferences[], meaning_frame, preferred_spiritual_language[],
  -- language_to_avoid[]
  relating jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TRIGGER member_persona_set_updated_at
  BEFORE UPDATE ON public.member_persona
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.member_persona ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_persona_owner_select"
  ON public.member_persona FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "member_persona_owner_insert"
  ON public.member_persona FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member_persona_owner_update"
  ON public.member_persona FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member_persona_owner_delete"
  ON public.member_persona FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "member_persona_service_all"
  ON public.member_persona FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER PUBLICATION supabase_realtime ADD TABLE public.member_roster;
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_persona;
