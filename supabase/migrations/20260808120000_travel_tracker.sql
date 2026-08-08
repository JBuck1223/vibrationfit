-- Travel Tracker: trips, flights, media, links, dream destinations
--
-- A full travel area modeled on the Abundance tracker (owner + household RLS)
-- and Projects (attachments + reference links pattern). Includes:
--   1. trips                  - core trip records (manual, email-imported, migrated)
--   2. trip_flights           - flight segments per trip
--   3. dream_destinations     - bucket list ("Dream List") entries
--   4. travel_attachments     - media rows (S3 URLs) for trips OR dream destinations
--   5. travel_reference_links - external URL bookmarks for trips OR dream destinations
--   6. household sharing      - travel_mode setting + household_shares_all('travel')
--   7. realtime publication   - TanStack Query invalidation bridge
--   8. data migration         - copy user_profiles.trips (active profile) into trips

-- ============================================================================
-- 1. trips
-- ============================================================================
CREATE TABLE public.trips (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  -- 'past' = taken, 'upcoming' = planned, 'draft_import' = parsed from email,
  -- awaiting user review/confirmation.
  status text NOT NULL DEFAULT 'past' CHECK (status IN ('past', 'upcoming', 'draft_import')),
  start_date date,
  end_date date,
  -- Year-only precision for entries migrated from user_profiles.trips.
  year integer CHECK (year IS NULL OR (year >= 1900 AND year <= 2200)),
  duration_text text,
  -- [{name, countryCode, lat?, lng?}] - countryCode (ISO 3166-1 alpha-2) powers the map.
  destinations jsonb NOT NULL DEFAULT '[]'::jsonb,
  trip_type text,
  story text,
  cover_image_url text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'email', 'migrated')),
  -- For email imports: { fromAddress, subject, receivedAt, messageId }
  import_meta jsonb,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_user ON public.trips(user_id);
CREATE INDEX idx_trips_household ON public.trips(household_id) WHERE household_id IS NOT NULL;
CREATE INDEX idx_trips_status ON public.trips(user_id, status);

COMMENT ON TABLE public.trips IS
  'Travel Tracker trip records. destinations JSONB: [{name, countryCode, lat?, lng?}].';
COMMENT ON COLUMN public.trips.household_id IS
  'NULL = personal/private. Set = shared with the household. Creator tracked via user_id.';

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. trip_flights
-- ============================================================================
CREATE TABLE public.trip_flights (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  airline text,
  flight_number text,
  depart_airport text, -- IATA code, e.g. ATL
  arrive_airport text, -- IATA code, e.g. CDG
  depart_at timestamptz,
  arrive_at timestamptz,
  -- Great-circle distance computed server-side from airport coordinates.
  distance_miles numeric(8,1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_flights_trip ON public.trip_flights(trip_id);

COMMENT ON TABLE public.trip_flights IS
  'Flight segments belonging to a trip. Airports are IATA codes; distance_miles is derived.';

-- ============================================================================
-- 3. dream_destinations (Dream List / bucket list)
-- ============================================================================
CREATE TABLE public.dream_destinations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  country_code text, -- ISO 3166-1 alpha-2
  notes text,
  priority integer NOT NULL DEFAULT 0,
  cover_image_url text,
  -- Set when the dream is actualized into a real trip.
  actualized_trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dream_destinations_user ON public.dream_destinations(user_id);
CREATE INDEX idx_dream_destinations_household ON public.dream_destinations(household_id) WHERE household_id IS NOT NULL;

COMMENT ON TABLE public.dream_destinations IS
  'Travel Dream List entries. actualized_trip_id links a dream to the trip that actualized it.';

CREATE TRIGGER trg_dream_destinations_updated_at
  BEFORE UPDATE ON public.dream_destinations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. travel_attachments (media for trips OR dream destinations)
-- ============================================================================
CREATE TABLE public.travel_attachments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  dream_destination_id uuid REFERENCES public.dream_destinations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT travel_attachments_parent_check
    CHECK (trip_id IS NOT NULL OR dream_destination_id IS NOT NULL)
);

CREATE INDEX idx_travel_attachments_trip ON public.travel_attachments(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_travel_attachments_dream ON public.travel_attachments(dream_destination_id) WHERE dream_destination_id IS NOT NULL;

COMMENT ON TABLE public.travel_attachments IS
  'Photo/video/file rows (S3 URLs) attached to a trip or a dream destination.';

-- ============================================================================
-- 5. travel_reference_links (external URL bookmarks)
-- ============================================================================
CREATE TABLE public.travel_reference_links (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  dream_destination_id uuid REFERENCES public.dream_destinations(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT travel_reference_links_parent_check
    CHECK (trip_id IS NOT NULL OR dream_destination_id IS NOT NULL)
);

CREATE INDEX idx_travel_reference_links_trip ON public.travel_reference_links(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_travel_reference_links_dream ON public.travel_reference_links(dream_destination_id) WHERE dream_destination_id IS NOT NULL;

COMMENT ON TABLE public.travel_reference_links IS
  'External URL bookmarks attached to a trip or a dream destination.';

-- ============================================================================
-- 6. Household sharing: travel_mode setting + household_shares_all('travel')
-- ============================================================================
ALTER TABLE public.household_sharing_settings
  ADD COLUMN IF NOT EXISTS travel_mode text NOT NULL DEFAULT 'select'
    CHECK (travel_mode IN ('all', 'select'));

COMMENT ON COLUMN public.household_sharing_settings.travel_mode IS
  'Household share mode for the Travel Tracker: all = every trip/dream shared, select = per-item.';

-- Extend the feature switch with 'travel'.
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
          WHEN 'travel'       THEN s.travel_mode       = 'all'
          ELSE false
        END
    );
$$;

COMMENT ON FUNCTION public.household_shares_all(uuid, text, uuid) IS
  'SECURITY DEFINER: true when owner shares ALL content for a feature (life_visions|vision_board|abundance|audio|projects|stories|travel) with a household the viewer actively belongs to.';

-- Access helpers for child tables (owner, explicit household share, or share-all).
CREATE OR REPLACE FUNCTION public.can_access_trip(t_id uuid, u uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = t_id
      AND (
        t.user_id = u
        OR (t.household_id IS NOT NULL AND public.is_active_household_member(t.household_id, u))
        OR public.household_shares_all(t.user_id, 'travel', u)
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_trip(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_trip(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.can_access_trip(uuid, uuid) IS
  'SECURITY DEFINER: true when the user owns the trip or can access it via household sharing (explicit share or travel share-all).';

CREATE OR REPLACE FUNCTION public.can_access_dream_destination(d_id uuid, u uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dream_destinations d
    WHERE d.id = d_id
      AND (
        d.user_id = u
        OR (d.household_id IS NOT NULL AND public.is_active_household_member(d.household_id, u))
        OR public.household_shares_all(d.user_id, 'travel', u)
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_dream_destination(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_dream_destination(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.can_access_dream_destination(uuid, uuid) IS
  'SECURITY DEFINER: true when the user owns the dream destination or can access it via household sharing.';

-- ============================================================================
-- 7. RLS
-- ============================================================================
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_reference_links ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_flights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dream_destinations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_reference_links TO authenticated;

-- trips: owner full access
CREATE POLICY "Users manage own trips"
  ON public.trips FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access on trips"
  ON public.trips FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- trips: household overlay (explicit share + share-all), same shape as abundance
CREATE POLICY "household_can_view_trips"
  ON public.trips FOR SELECT TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'travel', auth.uid())
  );

CREATE POLICY "household_can_update_trips"
  ON public.trips FOR UPDATE TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'travel', auth.uid())
  )
  WITH CHECK (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'travel', auth.uid())
  );

CREATE POLICY "household_can_insert_trips"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND user_id = auth.uid()
    AND public.is_active_household_member(household_id, auth.uid())
  );

CREATE POLICY "household_creator_or_admin_can_delete_trips"
  ON public.trips FOR DELETE TO authenticated
  USING (
    household_id IS NOT NULL
    AND (user_id = auth.uid() OR public.is_household_admin(household_id, auth.uid()))
  );

-- dream_destinations: owner + household overlay
CREATE POLICY "Users manage own dream_destinations"
  ON public.dream_destinations FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access on dream_destinations"
  ON public.dream_destinations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "household_can_view_dream_destinations"
  ON public.dream_destinations FOR SELECT TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'travel', auth.uid())
  );

CREATE POLICY "household_can_update_dream_destinations"
  ON public.dream_destinations FOR UPDATE TO authenticated
  USING (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'travel', auth.uid())
  )
  WITH CHECK (
    (household_id IS NOT NULL AND public.is_active_household_member(household_id, auth.uid()))
    OR public.household_shares_all(user_id, 'travel', auth.uid())
  );

CREATE POLICY "household_can_insert_dream_destinations"
  ON public.dream_destinations FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND user_id = auth.uid()
    AND public.is_active_household_member(household_id, auth.uid())
  );

CREATE POLICY "household_creator_or_admin_can_delete_dream_destinations"
  ON public.dream_destinations FOR DELETE TO authenticated
  USING (
    household_id IS NOT NULL
    AND (user_id = auth.uid() OR public.is_household_admin(household_id, auth.uid()))
  );

-- Child tables follow the parent (trip or dream destination).
CREATE POLICY "can_manage_trip_flights"
  ON public.trip_flights FOR ALL TO authenticated
  USING (public.can_access_trip(trip_id, auth.uid()))
  WITH CHECK (public.can_access_trip(trip_id, auth.uid()));

CREATE POLICY "Service role full access on trip_flights"
  ON public.trip_flights FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "can_manage_travel_attachments"
  ON public.travel_attachments FOR ALL TO authenticated
  USING (
    (trip_id IS NOT NULL AND public.can_access_trip(trip_id, auth.uid()))
    OR (dream_destination_id IS NOT NULL AND public.can_access_dream_destination(dream_destination_id, auth.uid()))
  )
  WITH CHECK (
    (trip_id IS NOT NULL AND public.can_access_trip(trip_id, auth.uid()))
    OR (dream_destination_id IS NOT NULL AND public.can_access_dream_destination(dream_destination_id, auth.uid()))
  );

CREATE POLICY "Service role full access on travel_attachments"
  ON public.travel_attachments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "can_manage_travel_reference_links"
  ON public.travel_reference_links FOR ALL TO authenticated
  USING (
    (trip_id IS NOT NULL AND public.can_access_trip(trip_id, auth.uid()))
    OR (dream_destination_id IS NOT NULL AND public.can_access_dream_destination(dream_destination_id, auth.uid()))
  )
  WITH CHECK (
    (trip_id IS NOT NULL AND public.can_access_trip(trip_id, auth.uid()))
    OR (dream_destination_id IS NOT NULL AND public.can_access_dream_destination(dream_destination_id, auth.uid()))
  );

CREATE POLICY "Service role full access on travel_reference_links"
  ON public.travel_reference_links FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 8. Realtime publication (TanStack Query invalidation bridge)
-- ============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'trips',
    'trip_flights',
    'dream_destinations',
    'travel_attachments',
    'travel_reference_links'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 9. Data migration: copy user_profiles.trips (active, non-draft profile only)
--    into trips. Handles both known shapes:
--      production UI: {destination, year, duration}
--      seed data:     {destination, date, type}
-- ============================================================================
INSERT INTO public.trips (user_id, title, status, year, duration_text, trip_type, destinations, source)
SELECT
  up.user_id,
  trip->>'destination',
  'past',
  CASE
    WHEN trip->>'year' ~ '^\d{4}' THEN (substring(trip->>'year' from '^\d{4}'))::integer
    WHEN trip->>'date' ~ '^\d{4}' THEN (substring(trip->>'date' from '^\d{4}'))::integer
    ELSE NULL
  END,
  trip->>'duration',
  trip->>'type',
  jsonb_build_array(jsonb_build_object('name', trip->>'destination')),
  'migrated'
FROM public.user_profiles up
CROSS JOIN LATERAL jsonb_array_elements(up.trips) AS trip
WHERE up.is_active = true
  AND up.is_draft = false
  AND jsonb_typeof(up.trips) = 'array'
  AND COALESCE(trip->>'destination', '') <> '';
