--
-- PostgreSQL database dump
--

\restrict BgaVFla6tm6gePB7AxVNpXvXw0Qv3zCfZCkxQerxHHfVmiZWjCTyIJd4dbsib73

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: assessment_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assessment_category AS ENUM (
    'love',
    'work',
    'stuff',
    'money',
    'health',
    'family',
    'social',
    'fun',
    'travel',
    'home',
    'giving',
    'spirituality'
);


--
-- Name: TYPE assessment_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.assessment_category IS 'Life categories for assessments - uses unified keys (love, work, stuff)';


--
-- Name: assessment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assessment_status AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);


--
-- Name: audio_generation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audio_generation_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


--
-- Name: green_line_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.green_line_status AS ENUM (
    'above',
    'transition',
    'below'
);


--
-- Name: lifestyle_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lifestyle_category AS ENUM (
    'minimalist',
    'moderate',
    'comfortable',
    'luxury'
);


--
-- Name: membership_tier_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.membership_tier_type AS ENUM (
    'free',
    'starter',
    'pro',
    'elite',
    'vision_pro_annual',
    'vision_pro_28day',
    'vision_pro_household_annual',
    'vision_pro_household_28day',
    'household_addon_28day',
    'household_addon_annual',
    'intensive',
    'intensive_household'
);


--
-- Name: scheduled_message_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.scheduled_message_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'cancelled'
);


--
-- Name: social_preference; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.social_preference AS ENUM (
    'introvert',
    'ambivert',
    'extrovert'
);


--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid'
);


--
-- Name: template_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.template_category AS ENUM (
    'onboarding',
    'sessions',
    'billing',
    'support',
    'marketing',
    'reminders',
    'notifications',
    'household',
    'intensive',
    'other'
);


--
-- Name: template_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.template_status AS ENUM (
    'active',
    'draft',
    'archived'
);


--
-- Name: token_action_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.token_action_type AS ENUM (
    'chat',
    'refinement',
    'blueprint',
    'audio_generation',
    'transcription',
    'image_generation',
    'assessment',
    'manual_adjustment',
    'subscription_grant',
    'renewal_grant',
    'pack_purchase',
    'admin_grant',
    'admin_deduct',
    'trial_grant',
    'token_pack_purchase'
);


--
-- Name: travel_frequency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.travel_frequency AS ENUM (
    'never',
    'yearly',
    'quarterly',
    'monthly'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'member',
    'coach',
    'admin',
    'super_admin'
);


--
-- Name: vibe_media_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vibe_media_type AS ENUM (
    'none',
    'image',
    'video',
    'mixed'
);


--
-- Name: vibe_tag; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vibe_tag AS ENUM (
    'win',
    'wobble',
    'vision',
    'collaboration'
);


--
-- Name: TYPE vibe_tag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.vibe_tag IS 'Categories for Vibe Tribe posts: win, wobble, vision, practice';


--
-- Name: video_recording_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.video_recording_status AS ENUM (
    'none',
    'recording',
    'processing',
    'ready',
    'uploaded',
    'failed'
);


--
-- Name: video_session_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.video_session_status AS ENUM (
    'scheduled',
    'waiting',
    'live',
    'completed',
    'cancelled',
    'no_show'
);


--
-- Name: video_session_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.video_session_type AS ENUM (
    'one_on_one',
    'group',
    'workshop',
    'webinar',
    'alignment_gym'
);


--
-- Name: vision_audio_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vision_audio_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: apply_token_usage(uuid, text, text, integer, integer, integer, integer, jsonb, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_token_usage(p_user_id uuid, p_action_type text, p_model_used text, p_tokens_used integer, p_input_tokens integer, p_output_tokens integer, p_cost_estimate_cents integer, p_metadata jsonb DEFAULT '{}'::jsonb, p_audio_seconds numeric DEFAULT NULL::numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_effective_tokens integer;
  v_override integer;
  v_calculated_cost integer;
  v_audio_formatted text;
BEGIN
  IF p_tokens_used IS NULL THEN
    p_tokens_used := 0;
  END IF;

  -- Check for token override
  SELECT token_value INTO v_override
  FROM public.ai_action_token_overrides
  WHERE action_type = p_action_type;

  -- Calculate effective tokens
  v_effective_tokens := COALESCE(NULLIF(p_input_tokens, 0), 0) + COALESCE(NULLIF(p_output_tokens, 0), 0);
  IF v_effective_tokens = 0 THEN
    v_effective_tokens := COALESCE(NULLIF(p_tokens_used, 0), 0);
  END IF;
  IF v_effective_tokens = 0 THEN
    v_effective_tokens := COALESCE(v_override, 0);
  END IF;

  -- Calculate accurate cost using ai_model_pricing
  v_calculated_cost := public.calculate_ai_cost(
    p_model_used,
    COALESCE(p_input_tokens, 0),
    COALESCE(p_output_tokens, 0),
    p_audio_seconds  -- Pass audio seconds for Whisper/audio models
  );

  -- Format audio duration if provided (e.g., "2m 30s")
  IF p_audio_seconds IS NOT NULL AND p_audio_seconds > 0 THEN
    v_audio_formatted := CASE
      WHEN p_audio_seconds < 60 THEN ROUND(p_audio_seconds, 1)::text || 's'
      WHEN p_audio_seconds < 3600 THEN 
        FLOOR(p_audio_seconds / 60)::text || 'm ' || 
        ROUND(p_audio_seconds % 60)::text || 's'
      ELSE
        FLOOR(p_audio_seconds / 3600)::text || 'h ' ||
        FLOOR((p_audio_seconds % 3600) / 60)::text || 'm ' ||
        ROUND(p_audio_seconds % 60)::text || 's'
    END;
  END IF;

  -- Insert token_usage record with BOTH old estimate and new calculated cost
  INSERT INTO public.token_usage(
    user_id,
    action_type,
    model_used,
    tokens_used,
    input_tokens,
    output_tokens,
    audio_seconds,               -- NEW: Audio duration
    audio_duration_formatted,    -- NEW: Human-readable duration
    cost_estimate,               -- Keep old estimate for reference
    calculated_cost_cents,       -- NEW: Accurate cost
    success,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_action_type,
    p_model_used,
    v_effective_tokens,
    COALESCE(p_input_tokens, 0),
    COALESCE(p_output_tokens, 0),
    p_audio_seconds,              -- NEW: Audio duration
    v_audio_formatted,            -- NEW: Formatted duration
    COALESCE(p_cost_estimate_cents, 0),  -- Old estimate
    v_calculated_cost,                    -- NEW: Calculated cost
    true,
    COALESCE(p_metadata, '{}'),
    NOW()
  );

END;
$$;


--
-- Name: FUNCTION apply_token_usage(p_user_id uuid, p_action_type text, p_model_used text, p_tokens_used integer, p_input_tokens integer, p_output_tokens integer, p_cost_estimate_cents integer, p_metadata jsonb, p_audio_seconds numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.apply_token_usage(p_user_id uuid, p_action_type text, p_model_used text, p_tokens_used integer, p_input_tokens integer, p_output_tokens integer, p_cost_estimate_cents integer, p_metadata jsonb, p_audio_seconds numeric) IS 'Tracks token usage with accurate cost calculation from ai_model_pricing';


--
-- Name: calculate_ai_cost(text, integer, integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_ai_cost(p_model_name text, p_prompt_tokens integer, p_completion_tokens integer, p_units numeric DEFAULT NULL::numeric) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_input_price numeric;
  v_output_price numeric;
  v_unit_price numeric;
  v_total_cost numeric;
BEGIN
  -- Get pricing for the model
  SELECT 
    input_price_per_1k,
    output_price_per_1k,
    price_per_unit
  INTO 
    v_input_price,
    v_output_price,
    v_unit_price
  FROM public.ai_model_pricing
  WHERE model_name = p_model_name
    AND is_active = true
  LIMIT 1;
  
  -- If model not found, return 0
  IF v_input_price IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate cost based on model type
  IF v_unit_price IS NOT NULL AND p_units IS NOT NULL THEN
    -- Audio/Image model - use unit pricing
    v_total_cost := v_unit_price * p_units;
  ELSE
    -- Text model - use token pricing
    v_total_cost := 
      (p_prompt_tokens / 1000.0) * v_input_price +
      (p_completion_tokens / 1000.0) * v_output_price;
  END IF;
  
  -- Return cost in cents (multiply by 100)
  RETURN ROUND(v_total_cost * 100);
END;
$$;


--
-- Name: FUNCTION calculate_ai_cost(p_model_name text, p_prompt_tokens integer, p_completion_tokens integer, p_units numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_ai_cost(p_model_name text, p_prompt_tokens integer, p_completion_tokens integer, p_units numeric) IS 'Calculates cost in cents for a given AI model usage';


--
-- Name: calculate_blueprint_progress(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_blueprint_progress(p_blueprint_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Count total tasks
    SELECT COUNT(*) INTO total_tasks
    FROM blueprint_tasks
    WHERE blueprint_id = p_blueprint_id;
    
    -- Count completed tasks
    SELECT COUNT(*) INTO completed_tasks
    FROM blueprint_tasks
    WHERE blueprint_id = p_blueprint_id AND status = 'completed';
    
    -- Calculate percentage
    IF total_tasks > 0 THEN
        progress_percentage := ROUND((completed_tasks::DECIMAL / total_tasks) * 100);
    ELSE
        progress_percentage := 0;
    END IF;
    
    RETURN progress_percentage;
END;
$$;


--
-- Name: FUNCTION calculate_blueprint_progress(p_blueprint_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_blueprint_progress(p_blueprint_id uuid) IS 'Calculates progress percentage based on completed tasks';


--
-- Name: calculate_category_score(uuid, public.assessment_category); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_category_score(p_assessment_id uuid, p_category public.assessment_category) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_total_score INTEGER;
BEGIN
  -- Calculate sum of response values for this category
  SELECT COALESCE(SUM(response_value), 0)
  INTO v_total_score
  FROM assessment_responses
  WHERE assessment_id = p_assessment_id
    AND category = p_category;
  
  RETURN v_total_score;
END;
$$;


--
-- Name: FUNCTION calculate_category_score(p_assessment_id uuid, p_category public.assessment_category); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_category_score(p_assessment_id uuid, p_category public.assessment_category) IS 'Calculates total score for a category in an assessment';


--
-- Name: calculate_profile_completion(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_profile_completion(profile_data jsonb) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_fields INTEGER := 18; -- Adjusted to match actual profile fields
  completed_fields INTEGER := 0;
BEGIN
  -- Personal Info (6 fields)
  IF (profile_data->>'first_name') IS NOT NULL AND (profile_data->>'first_name') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'last_name') IS NOT NULL AND (profile_data->>'last_name') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'email') IS NOT NULL AND (profile_data->>'email') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'phone') IS NOT NULL AND (profile_data->>'phone') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'date_of_birth') IS NOT NULL AND (profile_data->>'date_of_birth') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'gender') IS NOT NULL AND (profile_data->>'gender') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Relationship (1 field - relationship_status is the main one)
  IF (profile_data->>'relationship_status') IS NOT NULL AND (profile_data->>'relationship_status') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Family (2 fields)
  IF (profile_data->>'has_children') IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  END IF;
  -- Number of children is only required if has_children is true
  IF (profile_data->>'has_children') = 'true' AND (profile_data->>'number_of_children') IS NOT NULL AND (profile_data->>'number_of_children') != '0' THEN
    completed_fields := completed_fields + 1;
  ELSIF (profile_data->>'has_children') = 'false' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Health (1 field - exercise frequency is the main one)
  IF (profile_data->>'exercise_frequency') IS NOT NULL AND (profile_data->>'exercise_frequency') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Location (4 fields)
  IF (profile_data->>'living_situation') IS NOT NULL AND (profile_data->>'living_situation') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'time_at_location') IS NOT NULL AND (profile_data->>'time_at_location') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'city') IS NOT NULL AND (profile_data->>'city') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'state') IS NOT NULL AND (profile_data->>'state') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Career (2 fields)
  IF (profile_data->>'employment_type') IS NOT NULL AND (profile_data->>'employment_type') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  IF (profile_data->>'occupation') IS NOT NULL AND (profile_data->>'occupation') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Financial (1 field)
  IF (profile_data->>'household_income') IS NOT NULL AND (profile_data->>'household_income') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Profile Picture (1 field) - optional but counts if present
  IF (profile_data->>'profile_picture_url') IS NOT NULL AND (profile_data->>'profile_picture_url') != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  RETURN ROUND((completed_fields::DECIMAL / total_fields) * 100);
END;
$$;


--
-- Name: calculate_token_balance(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_token_balance(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_grants INTEGER;
  v_usage INTEGER;
  v_deductions INTEGER;
BEGIN
  -- Get total grants from token_transactions (source of truth)
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_grants
  FROM token_transactions
  WHERE user_id = p_user_id
    AND action_type IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase')
    AND tokens_used > 0;

  -- Get total AI usage from token_usage
  SELECT COALESCE(SUM(tokens_used), 0) INTO v_usage
  FROM token_usage
  WHERE user_id = p_user_id
    AND action_type NOT IN ('admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase', 'admin_deduct')
    AND tokens_used > 0
    AND success = true;

  -- Get deductions from token_transactions
  SELECT COALESCE(SUM(ABS(tokens_used)), 0) INTO v_deductions
  FROM token_transactions
  WHERE user_id = p_user_id
    AND (action_type = 'admin_deduct' OR tokens_used < 0);

  -- Return calculated balance (grants - usage - deductions)
  RETURN GREATEST(0, v_grants - v_usage - v_deductions);
END;
$$;


--
-- Name: FUNCTION calculate_token_balance(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_token_balance(p_user_id uuid) IS 'Calculates token balance from transactions/usage. Source of truth - ignores user_profiles.vibe_assistant_tokens_remaining';


--
-- Name: calculate_version_diff(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_version_diff(p_old_version_id uuid, p_new_version_id uuid, p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  old_profile JSONB;
  new_profile JSONB;
  diff JSONB := '{}'::JSONB;
  field_name TEXT;
  old_value TEXT;
  new_value TEXT;
  old_array_value JSONB;
  new_array_value JSONB;
BEGIN
  -- Get both versions and verify they belong to the user
  -- Convert to JSONB for dynamic field access
  SELECT to_jsonb(p.*) INTO old_profile
  FROM user_profiles p
  WHERE p.id = p_old_version_id AND p.user_id = p_user_id;
  
  SELECT to_jsonb(p.*) INTO new_profile
  FROM user_profiles p
  WHERE p.id = p_new_version_id AND p.user_id = p_user_id;
  
  -- Verify both profiles exist
  IF old_profile IS NULL THEN
    RAISE EXCEPTION 'Old version not found or access denied';
  END IF;
  
  IF new_profile IS NULL THEN
    RAISE EXCEPTION 'New version not found or access denied';
  END IF;
  
  -- Compare all fields (excluding versioning/metadata fields)
  -- We'll check each field individually to handle NULLs properly
  FOR field_name IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND table_schema = 'public'
    AND column_name NOT IN (
      'id', 'user_id', 'version_number', 'is_draft', 'is_active', 
      'parent_version_id', 'created_at', 'updated_at', 'ai_tags',
      'vibe_assistant_tokens_used', 'vibe_assistant_tokens_remaining',
      'vibe_assistant_total_cost', 'token_rollover_cycles', 'token_last_drip_date',
      'auto_topup_enabled', 'auto_topup_pack_id', 'storage_quota_gb'
    )
  LOOP
    -- Get values, handling NULLs and normalizing
    -- Extract as text, normalize empty strings to NULL, trim whitespace
    old_value := NULLIF(TRIM(COALESCE(old_profile->>field_name, '')), '');
    new_value := NULLIF(TRIM(COALESCE(new_profile->>field_name, '')), '');
    
    -- Compare values (handle arrays and JSONB specially)
    IF field_name IN ('children_ages', 'hobbies', 'progress_photos') THEN
      -- Array comparison - extract as JSONB array
      old_array_value := old_profile->field_name;
      new_array_value := new_profile->field_name;
      
      -- Compare arrays (handle NULL as empty array)
      IF COALESCE(old_array_value, '[]'::jsonb) IS DISTINCT FROM COALESCE(new_array_value, '[]'::jsonb) THEN
        diff := diff || jsonb_build_object(
          field_name,
          jsonb_build_object(
            'old', COALESCE(old_profile->>field_name, '[]'),
            'new', COALESCE(new_profile->>field_name, '[]'),
            'type', 'array'
          )
        );
      END IF;
    ELSIF field_name = 'story_recordings' THEN
      -- JSONB comparison - extract as JSONB
      old_array_value := old_profile->field_name;
      new_array_value := new_profile->field_name;
      
      IF COALESCE(old_array_value, 'null'::jsonb) IS DISTINCT FROM COALESCE(new_array_value, 'null'::jsonb) THEN
        diff := diff || jsonb_build_object(
          field_name,
          jsonb_build_object(
            'old', COALESCE(old_profile->>field_name, 'null'),
            'new', COALESCE(new_profile->>field_name, 'null'),
            'type', 'jsonb'
          )
        );
      END IF;
    ELSE
      -- Standard field comparison
      -- Use IS DISTINCT FROM to handle NULLs correctly
      -- Two NULLs are considered equal, NULL and non-NULL are different
      IF old_value IS DISTINCT FROM new_value THEN
        diff := diff || jsonb_build_object(
          field_name,
          jsonb_build_object(
            'old', old_value,
            'new', new_value,
            'type', 'text'
          )
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN diff;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error calculating version diff: %', SQLERRM;
END;
$$;


--
-- Name: FUNCTION calculate_version_diff(p_old_version_id uuid, p_new_version_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_version_diff(p_old_version_id uuid, p_new_version_id uuid, p_user_id uuid) IS 'Calculates differences between two profile versions. Returns JSONB with changed fields.';


--
-- Name: calculate_version_number(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_version_number(p_profile_id uuid, p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  profile_created_at TIMESTAMP WITH TIME ZONE;
  version_num INTEGER;
BEGIN
  -- Get the created_at timestamp for this profile
  SELECT created_at INTO profile_created_at
  FROM user_profiles
  WHERE id = p_profile_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Count how many profiles were created before or at the same time as this one
  -- Order: oldest first = version 1, newest = highest version
  -- This ensures sequential numbering even after deletions
  SELECT COUNT(*) INTO version_num
  FROM user_profiles
  WHERE user_id = p_user_id
    AND created_at <= profile_created_at
    AND id != p_profile_id; -- Don't count self (will add 1 below)
  
  -- Add 1 because we want 1-based indexing
  RETURN version_num + 1;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;


--
-- Name: FUNCTION calculate_version_number(p_profile_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_version_number(p_profile_id uuid, p_user_id uuid) IS 'Calculates version number based on chronological order (created_at) for a user. Returns sequential numbers (1, 2, 3...) without gaps even after deletions.';


--
-- Name: calculate_vibe_assistant_cost(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_vibe_assistant_cost(p_tokens integer) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
BEGIN
    -- GPT-4 pricing as of 2024: $0.03 per 1K input tokens, $0.06 per 1K output tokens
    -- Using average of input/output pricing for estimation
    RETURN (p_tokens * 0.045) / 1000.0;
END;
$_$;


--
-- Name: FUNCTION calculate_vibe_assistant_cost(p_tokens integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_vibe_assistant_cost(p_tokens integer) IS 'Calculates cost in USD for given token count';


--
-- Name: calculate_vision_version_number(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_vision_version_number(p_vision_id uuid, p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  vision_created_at TIMESTAMP WITH TIME ZONE;
  vision_household_id UUID;
  version_num INTEGER;
BEGIN
  -- Get the created_at timestamp and household_id for this vision
  SELECT created_at, household_id 
  INTO vision_created_at, vision_household_id
  FROM vision_versions
  WHERE id = p_vision_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Separate numbering based on personal vs household
  IF vision_household_id IS NULL THEN
    -- PERSONAL VISION: Count only personal visions for this user
    SELECT COUNT(*) INTO version_num
    FROM vision_versions
    WHERE user_id = p_user_id
      AND household_id IS NULL  -- Only personal visions
      AND created_at <= vision_created_at
      AND id != p_vision_id;
  ELSE
    -- HOUSEHOLD VISION: Count only household visions for this household
    SELECT COUNT(*) INTO version_num
    FROM vision_versions
    WHERE household_id = vision_household_id  -- Same household
      AND created_at <= vision_created_at
      AND id != p_vision_id;
  END IF;
  
  -- Add 1 because we want 1-based indexing
  RETURN version_num + 1;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;


--
-- Name: FUNCTION calculate_vision_version_number(p_vision_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_vision_version_number(p_vision_id uuid, p_user_id uuid) IS 'Calculates version number with separate sequences: Personal visions (household_id IS NULL) count only personal. Household visions count only household visions for that household.';


--
-- Name: check_intensive_completion(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_intensive_completion(p_intensive_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_checklist RECORD;
  v_required_items INTEGER := 0;
  v_completed_items INTEGER := 0;
  v_completion_pct NUMERIC;
  v_is_complete BOOLEAN := false;
BEGIN
  SELECT * INTO v_checklist
  FROM intensive_checklist
  WHERE intensive_id = p_intensive_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Checklist not found');
  END IF;
  
  -- Count required items for guarantee
  v_required_items := 4; -- intake, builder, calibration, activation protocol
  
  v_completed_items := 0;
  IF v_checklist.intake_completed THEN v_completed_items := v_completed_items + 1; END IF;
  IF v_checklist.builder_session_completed THEN v_completed_items := v_completed_items + 1; END IF;
  IF v_checklist.calibration_attended THEN v_completed_items := v_completed_items + 1; END IF;
  IF v_checklist.activation_protocol_started THEN v_completed_items := v_completed_items + 1; END IF;
  
  v_completion_pct := ROUND((v_completed_items::NUMERIC / v_required_items * 100), 1);
  v_is_complete := v_completed_items >= v_required_items;
  
  RETURN jsonb_build_object(
    'intensive_id', p_intensive_id,
    'required_items', v_required_items,
    'completed_items', v_completed_items,
    'completion_percentage', v_completion_pct,
    'is_complete', v_is_complete,
    'checklist', row_to_json(v_checklist)
  );
END;
$$;


--
-- Name: FUNCTION check_intensive_completion(p_intensive_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_intensive_completion(p_intensive_id uuid) IS 'Check if intensive checklist meets guarantee requirements';


--
-- Name: check_storage_quota(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_storage_quota(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_quota_gb INTEGER;
  v_used_bytes BIGINT;
  v_used_gb NUMERIC;
  v_percentage NUMERIC;
  v_over_quota BOOLEAN;
BEGIN
  -- Get user's storage quota
  SELECT COALESCE(storage_quota_gb, 100) INTO v_quota_gb
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Calculate current usage from storage.objects
  -- Note: This is a placeholder - actual implementation depends on your storage setup
  SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0) INTO v_used_bytes
  FROM storage.objects
  WHERE owner = p_user_id::TEXT;
  
  v_used_gb := ROUND((v_used_bytes / 1073741824.0)::NUMERIC, 2); -- Convert to GB
  v_percentage := ROUND(((v_used_gb / v_quota_gb) * 100)::NUMERIC, 1);
  v_over_quota := v_used_gb > v_quota_gb;
  
  RETURN jsonb_build_object(
    'quota_gb', v_quota_gb,
    'used_gb', v_used_gb,
    'used_bytes', v_used_bytes,
    'percentage', v_percentage,
    'over_quota', v_over_quota,
    'remaining_gb', GREATEST(0, v_quota_gb - v_used_gb),
    'warning_90pct', v_percentage >= 90,
    'warning_80pct', v_percentage >= 80
  );
END;
$$;


--
-- Name: FUNCTION check_storage_quota(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_storage_quota(p_user_id uuid) IS 'Check user storage quota and usage';


--
-- Name: commit_draft_as_active(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commit_draft_as_active(p_draft_profile_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  draft_exists BOOLEAN;
  next_version INTEGER;
BEGIN
  -- Verify the draft exists (don't need full SELECT * - just check existence)
  SELECT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = p_draft_profile_id AND user_id = p_user_id AND is_draft = true
  ) INTO draft_exists;
  
  IF NOT draft_exists THEN
    RAISE EXCEPTION 'Draft profile not found or access denied';
  END IF;
  
  -- Get next version number
  next_version := get_next_version_number(p_user_id);
  
  -- Deactivate current active version
  UPDATE user_profiles 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true AND is_draft = false;
  
  -- Commit the draft as the new active version
  UPDATE user_profiles 
  SET 
    is_draft = false,
    is_active = true,
    version_number = next_version,
    updated_at = NOW()
  WHERE id = p_draft_profile_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;


--
-- Name: FUNCTION commit_draft_as_active(p_draft_profile_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.commit_draft_as_active(p_draft_profile_id uuid, p_user_id uuid) IS 'Commits a draft as the new active version';


--
-- Name: commit_vision_draft_as_active(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.commit_vision_draft_as_active(p_draft_vision_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_draft RECORD;
BEGIN
  -- Get the draft vision
  SELECT id, user_id, household_id, is_draft
  INTO v_draft
  FROM vision_versions
  WHERE id = p_draft_vision_id AND is_draft = true;
  
  -- Verify draft exists
  IF v_draft.id IS NULL THEN
    RAISE EXCEPTION 'Draft vision not found: %', p_draft_vision_id;
  END IF;
  
  -- Verify user has access
  IF v_draft.household_id IS NOT NULL THEN
    -- For household visions, check membership
    IF NOT is_active_household_member(v_draft.household_id, p_user_id) THEN
      RAISE EXCEPTION 'User % does not have access to household draft %', p_user_id, p_draft_vision_id;
    END IF;
  ELSE
    -- For personal visions, check ownership
    IF v_draft.user_id != p_user_id THEN
      RAISE EXCEPTION 'User % does not own draft vision %', p_user_id, p_draft_vision_id;
    END IF;
  END IF;
  
  -- Deactivate other active visions in the same scope
  IF v_draft.household_id IS NOT NULL THEN
    -- Deactivate other household visions
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE 
      household_id = v_draft.household_id
      AND is_active = true
      AND is_draft = false
      AND id != p_draft_vision_id;
  ELSE
    -- Deactivate other personal visions
    UPDATE vision_versions
    SET is_active = false, updated_at = NOW()
    WHERE 
      user_id = v_draft.user_id
      AND household_id IS NULL
      AND is_active = true
      AND is_draft = false
      AND id != p_draft_vision_id;
  END IF;
  
  -- Convert draft to active version (update in place)
  UPDATE vision_versions
  SET 
    is_draft = false,
    is_active = true,
    updated_at = NOW()
  WHERE id = p_draft_vision_id;
  
  RETURN true;
END;
$$;


--
-- Name: FUNCTION commit_vision_draft_as_active(p_draft_vision_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.commit_vision_draft_as_active(p_draft_vision_id uuid, p_user_id uuid) IS 'Commits a draft vision as the new active version, deactivating others in the same scope (personal or household)';


--
-- Name: create_calendar_event_for_booking(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_calendar_event_for_booking() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO calendar_events (
    staff_id,
    user_id,
    title,
    description,
    scheduled_at,
    end_at,
    timezone,
    event_source,
    event_category,
    blocks_availability,
    booking_id,
    video_session_id,
    status
  ) VALUES (
    NEW.staff_id,
    NEW.user_id,
    COALESCE(NEW.title, 'Booking: ' || NEW.event_type),
    NEW.description,
    NEW.scheduled_at,
    NEW.scheduled_at + (NEW.duration_minutes || ' minutes')::INTERVAL,
    NEW.timezone,
    'booking',
    'client_call',
    true,
    NEW.id,
    NEW.video_session_id,
    CASE WHEN NEW.status = 'pending' THEN 'tentative' ELSE 'confirmed' END
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: create_draft_from_version(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_draft_from_version(p_source_profile_id uuid, p_user_id uuid, p_version_notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  new_profile_id UUID;
  next_version INTEGER;
  sql_text TEXT;
BEGIN
  -- Get next version number
  next_version := get_next_version_number(p_user_id);
  
  -- Delete any existing draft for this user
  DELETE FROM user_profiles 
  WHERE user_id = p_user_id AND is_draft = true;
  
  -- Build dynamic INSERT statement that excludes completion_percentage
  -- Get all column names except completion_percentage and versioning fields
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO sql_text
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name NOT IN ('id', 'completion_percentage', 'user_id', 'version_number', 'is_draft', 'is_active', 'version_notes', 'parent_version_id', 'created_at', 'updated_at');
  
  -- Execute dynamic INSERT
  EXECUTE format('
    INSERT INTO user_profiles (
      user_id, version_number, is_draft, is_active, version_notes, parent_version_id,
      %s,
      created_at, updated_at
    )
    SELECT 
      %L as user_id,
      %s as version_number,
      true as is_draft,
      false as is_active,
      %L as version_notes,
      %L as parent_version_id,
      %s,
      NOW() as created_at,
      NOW() as updated_at
    FROM user_profiles
    WHERE id = %L AND user_id = %L
    RETURNING id
  ', sql_text, p_user_id, next_version, p_version_notes, p_source_profile_id, sql_text, p_source_profile_id, p_user_id) INTO new_profile_id;
  
  IF new_profile_id IS NULL THEN
    RAISE EXCEPTION 'Source profile not found or access denied';
  END IF;
  
  RETURN new_profile_id;
EXCEPTION
  WHEN undefined_column THEN
    -- If completion_percentage doesn't exist (already dropped), exclude it from the column list
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO sql_text
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name NOT IN ('id', 'user_id', 'version_number', 'is_draft', 'is_active', 'version_notes', 'parent_version_id', 'created_at', 'updated_at');
    
    EXECUTE format('
      INSERT INTO user_profiles (
        user_id, version_number, is_draft, is_active, version_notes, parent_version_id,
        %s,
        created_at, updated_at
      )
      SELECT 
        %L as user_id,
        %s as version_number,
        true as is_draft,
        false as is_active,
        %L as version_notes,
        %L as parent_version_id,
        %s,
        NOW() as created_at,
        NOW() as updated_at
      FROM user_profiles
      WHERE id = %L AND user_id = %L
      RETURNING id
    ', sql_text, p_user_id, next_version, p_version_notes, p_source_profile_id, sql_text, p_source_profile_id, p_user_id) INTO new_profile_id;
    
    IF new_profile_id IS NULL THEN
      RAISE EXCEPTION 'Source profile not found or access denied';
    END IF;
    
    RETURN new_profile_id;
END;
$$;


--
-- Name: FUNCTION create_draft_from_version(p_source_profile_id uuid, p_user_id uuid, p_version_notes text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_draft_from_version(p_source_profile_id uuid, p_user_id uuid, p_version_notes text) IS 'Creates a draft version from an existing version';


--
-- Name: create_profile_version(uuid, jsonb, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_profile_version(user_uuid uuid, profile_data jsonb, is_draft boolean DEFAULT true) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  next_version INTEGER;
  new_version_id UUID;
  completion_pct INTEGER;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM profile_versions
  WHERE user_id = user_uuid;
  
  -- Calculate completion percentage
  completion_pct := calculate_profile_completion(profile_data);
  
  -- Insert the new version
  INSERT INTO profile_versions (user_id, version_number, profile_data, completion_percentage, is_draft)
  VALUES (user_uuid, next_version, profile_data, completion_pct, is_draft)
  RETURNING id INTO new_version_id;
  
  RETURN new_version_id;
END;
$$;


--
-- Name: create_solo_household_for_new_account(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_solo_household_for_new_account() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  new_household_id UUID;
BEGIN
  IF NEW.household_id IS NULL THEN
    INSERT INTO households (
      admin_user_id,
      name,
      plan_type,
      subscription_status,
      max_members,
      shared_tokens_enabled
    ) VALUES (
      NEW.id,
      'My Household',
      'solo',
      'trialing',
      1,
      FALSE
    )
    RETURNING id INTO new_household_id;

    INSERT INTO household_members (
      household_id,
      user_id,
      role,
      status,
      allow_shared_tokens,
      joined_at,
      accepted_at
    ) VALUES (
      new_household_id,
      NEW.id,
      'admin',
      'active',
      TRUE,
      NOW(),
      NOW()
    );

    NEW.household_id := new_household_id;
    NEW.is_household_admin := TRUE;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: debug_delete_auth_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_delete_auth_user(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'storage'
    AS $$
DECLARE
  fk_info jsonb := '[]'::jsonb;
  r RECORD;
BEGIN
  -- First, report all FK constraints pointing at auth.users for this user
  FOR r IN
    SELECT
      c.conrelid::regclass::text AS table_name,
      c.conname                  AS constraint_name,
      a.attname                  AS column_name,
      CASE c.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
      END AS on_delete
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.contype   = 'f'
      AND c.confrelid = 'auth.users'::regclass
    ORDER BY c.conrelid::regclass::text
  LOOP
    fk_info := fk_info || jsonb_build_object(
      'table', r.table_name,
      'constraint', r.constraint_name,
      'column', r.column_name,
      'on_delete', r.on_delete
    );
  END LOOP;

  -- Now try the actual delete and catch the error
  BEGIN
    DELETE FROM auth.users WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'message', 'User deleted successfully',
      'fk_constraints', fk_info
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_message', SQLERRM,
      'error_detail', SQLSTATE,
      'fk_constraints', fk_info
    );
  END;
END;
$$;


--
-- Name: decrement_vibe_assistant_allowance(uuid, integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrement_vibe_assistant_allowance(p_user_id uuid, p_tokens integer, p_cost numeric) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    current_tokens INTEGER;
    monthly_limit INTEGER;
    cost_limit DECIMAL(10,4);
    current_cost DECIMAL(10,4);
BEGIN
    -- Get current allowance and limits
    SELECT 
        p.vibe_assistant_tokens_remaining,
        COALESCE(mt.monthly_vibe_assistant_tokens, 0),
        COALESCE(mt.monthly_vibe_assistant_cost_limit, 0.00),
        p.vibe_assistant_total_cost
    INTO current_tokens, monthly_limit, cost_limit, current_cost
    FROM profiles p
    LEFT JOIN membership_tiers mt ON p.membership_tier_id = mt.id
    WHERE p.user_id = p_user_id;
    
    -- Check if user has sufficient tokens and hasn't exceeded cost limit
    IF current_tokens >= p_tokens AND (current_cost + p_cost) <= cost_limit THEN
        -- Decrement tokens and add cost
        UPDATE profiles 
        SET 
            vibe_assistant_tokens_remaining = vibe_assistant_tokens_remaining - p_tokens,
            vibe_assistant_tokens_used = vibe_assistant_tokens_used + p_tokens,
            vibe_assistant_total_cost = vibe_assistant_total_cost + p_cost,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;


--
-- Name: FUNCTION decrement_vibe_assistant_allowance(p_user_id uuid, p_tokens integer, p_cost numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.decrement_vibe_assistant_allowance(p_user_id uuid, p_tokens integer, p_cost numeric) IS 'Decrements user allowance and returns success status';


--
-- Name: delete_from_s3(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_from_s3(file_path text, bucket_name text DEFAULT 'vibration-fit-client-storage'::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a placeholder implementation
  -- In production, you would need to:
  -- 1. Install the AWS SDK extension in Supabase
  -- 2. Configure AWS credentials
  -- 3. Implement actual S3 delete logic
  
  -- For now, we'll just return success
  -- The actual S3 delete would happen here using AWS SDK
  
  result := json_build_object(
    'success', true,
    'message', 'File deleted successfully (placeholder)',
    'path', file_path,
    'bucket', bucket_name
  );
  
  RETURN result;
END;
$$;


--
-- Name: delete_user_storage_objects(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_user_storage_objects(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'storage', 'public'
    AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Supabase storage.protect_delete trigger blocks direct DELETE unless this is set
  PERFORM set_config('storage.allow_delete_query', 'true', true);
  DELETE FROM storage.objects WHERE owner = p_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


--
-- Name: FUNCTION delete_user_storage_objects(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.delete_user_storage_objects(p_user_id uuid) IS 'Deletes all Supabase Storage objects owned by the user. Must be called before auth.admin.deleteUser() to avoid FK constraint violation.';


--
-- Name: drip_tokens_28day(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.drip_tokens_28day(p_user_id uuid, p_subscription_id uuid, p_cycle_number integer DEFAULT 1) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  -- Get Vision Pro 28-Day tier ID
  SELECT id INTO v_tier_id
  FROM membership_tiers
  WHERE tier_type = 'vision_pro_28day'
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vision Pro 28-Day tier not found';
  END IF;
  
  RETURN grant_tokens_for_tier(p_user_id, v_tier_id, p_subscription_id);
END;
$$;


--
-- Name: estimate_vibe_assistant_tokens(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.estimate_vibe_assistant_tokens(p_text text) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    -- Rough estimation: ~4 characters per token for English text
    -- Add buffer for system prompts and formatting
    RETURN GREATEST(100, LENGTH(p_text) / 4 + 200);
END;
$$;


--
-- Name: FUNCTION estimate_vibe_assistant_tokens(p_text text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.estimate_vibe_assistant_tokens(p_text text) IS 'Estimates token count for given text';


--
-- Name: expire_old_invitations(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.expire_old_invitations() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE household_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;


--
-- Name: generate_ticket_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_ticket_number() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  next_num INTEGER;
  ticket_num TEXT;
BEGIN
  -- Use advisory lock to prevent concurrent ticket number generation
  PERFORM pg_advisory_xact_lock(hashtext('ticket_number_gen'));
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM support_tickets;
  
  ticket_num := 'SUPP-' || LPAD(next_num::TEXT, 4, '0');
  RETURN ticket_num;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customer_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    membership_tier_id uuid NOT NULL,
    stripe_customer_id text NOT NULL,
    stripe_subscription_id text,
    stripe_price_id text,
    status public.subscription_status DEFAULT 'incomplete'::public.subscription_status NOT NULL,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    canceled_at timestamp with time zone,
    trial_start timestamp with time zone,
    trial_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    promo_code text,
    referral_source text,
    campaign_name text,
    order_id uuid,
    order_item_id uuid
);


--
-- Name: TABLE customer_subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.customer_subscriptions IS 'Source of truth for user subscriptions. Join with membership_tiers for pricing. Use payment_history to calculate LTV/MRR.';


--
-- Name: COLUMN customer_subscriptions.promo_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.customer_subscriptions.promo_code IS 'Promo/coupon code used for this subscription (e.g., VISIONPRO50, EARLYBIRD)';


--
-- Name: COLUMN customer_subscriptions.referral_source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.customer_subscriptions.referral_source IS 'Marketing source/affiliate identifier (e.g., partner_john, instagram_ad, email_campaign)';


--
-- Name: COLUMN customer_subscriptions.campaign_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.customer_subscriptions.campaign_name IS 'Campaign name for grouping (e.g., Vision Pro Launch, Black Friday 2024)';


--
-- Name: get_active_subscription(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_active_subscription(p_user_id uuid) RETURNS public.customer_subscriptions
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_subscription customer_subscriptions;
BEGIN
  SELECT * INTO v_subscription
  FROM customer_subscriptions
  WHERE user_id = p_user_id
    AND (status = 'active' OR status = 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN v_subscription;
END;
$$;


--
-- Name: FUNCTION get_active_subscription(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_active_subscription(p_user_id uuid) IS 'Returns user''s active or trialing subscription';


--
-- Name: get_ai_tool_config(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_ai_tool_config(p_tool_key text) RETURNS TABLE(tool_key text, tool_name text, model_name text, temperature numeric, max_tokens integer, system_prompt text, supports_temperature boolean, supports_json_mode boolean, supports_streaming boolean, is_reasoning_model boolean, max_tokens_param text, token_multiplier integer, context_window integer, input_price_per_1m numeric, output_price_per_1m numeric)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT 
    t.tool_key,
    t.tool_name,
    t.model_name,
    t.temperature,
    t.max_tokens,
    t.system_prompt,
    m.supports_temperature,
    m.supports_json_mode,
    m.supports_streaming,
    m.is_reasoning_model,
    m.max_tokens_param,
    m.token_multiplier,
    m.context_window,
    m.input_price_per_1m,
    m.output_price_per_1m
  FROM ai_tools t
  JOIN ai_model_pricing m ON t.model_name = m.model_name
  WHERE t.tool_key = p_tool_key
    AND t.is_active = true
    AND m.is_active = true;
$$;


--
-- Name: FUNCTION get_ai_tool_config(p_tool_key text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_ai_tool_config(p_tool_key text) IS 'Returns complete AI tool configuration including model capabilities and pricing (per 1M tokens). Used by all VIVA endpoints.';


--
-- Name: get_field_label(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_field_label(p_field_name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  field_labels JSONB := '{
    "clarity_health": "Health Clarity",
    "clarity_love": "Love Clarity",
    "clarity_family": "Family Clarity",
    "clarity_work": "Work Clarity",
    "clarity_money": "Money Clarity",
    "clarity_fun": "Fun Clarity",
    "clarity_travel": "Travel Clarity",
    "clarity_social": "Social Clarity",
    "clarity_home": "Home Clarity",
    "clarity_stuff": "Stuff Clarity",
    "clarity_spirituality": "Spirituality Clarity",
    "clarity_giving": "Giving Clarity",
    "contrast_health": "Health Contrast",
    "contrast_love": "Love Contrast",
    "contrast_family": "Family Contrast",
    "contrast_work": "Work Contrast",
    "contrast_money": "Money Contrast",
    "contrast_fun": "Fun Contrast",
    "contrast_travel": "Travel Contrast",
    "contrast_social": "Social Contrast",
    "contrast_home": "Home Contrast",
    "contrast_stuff": "Stuff Contrast",
    "contrast_spirituality": "Spirituality Contrast",
    "contrast_giving": "Giving Contrast"
  }';
BEGIN
  -- Return the label from the JSONB object, or the p_field_name if not found
  RETURN COALESCE(field_labels->>p_field_name, p_field_name);
END;
$$;


--
-- Name: FUNCTION get_field_label(p_field_name text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_field_label(p_field_name text) IS 'Returns human-readable labels for profile field keys (dream/worry fields removed)';


--
-- Name: get_green_line_status(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_green_line_status(p_score integer) RETURNS public.green_line_status
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_percentage NUMERIC;
BEGIN
  -- Calculate percentage (max score per category is 35 points: 7 questions × 5 points each)
  v_percentage := (p_score::NUMERIC / 35.0) * 100;
  
  -- Determine status
  IF v_percentage >= 80 THEN
    RETURN 'above'::green_line_status;
  ELSIF v_percentage >= 60 THEN
    RETURN 'transition'::green_line_status;
  ELSE
    RETURN 'below'::green_line_status;
  END IF;
END;
$$;


--
-- Name: FUNCTION get_green_line_status(p_score integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_green_line_status(p_score integer) IS 'Determines Green Line status based on score percentage (max 35 points per category)';


--
-- Name: intensive_checklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intensive_checklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intensive_id uuid NOT NULL,
    user_id uuid NOT NULL,
    intake_completed boolean DEFAULT false,
    intake_completed_at timestamp without time zone,
    vision_drafted boolean DEFAULT false,
    vision_drafted_at timestamp without time zone,
    builder_session_started boolean DEFAULT false,
    builder_session_started_at timestamp without time zone,
    builder_session_completed boolean DEFAULT false,
    builder_session_completed_at timestamp without time zone,
    vision_board_created boolean DEFAULT false,
    vision_board_created_at timestamp without time zone,
    calibration_scheduled boolean DEFAULT false,
    calibration_scheduled_at timestamp without time zone,
    calibration_attended boolean DEFAULT false,
    calibration_attended_at timestamp without time zone,
    audios_generated boolean DEFAULT false,
    audios_generated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    profile_completed boolean DEFAULT false,
    profile_completed_at timestamp without time zone,
    assessment_completed boolean DEFAULT false,
    assessment_completed_at timestamp without time zone,
    call_scheduled boolean DEFAULT false,
    call_scheduled_at timestamp without time zone,
    call_scheduled_time timestamp without time zone,
    vision_built boolean DEFAULT false,
    vision_built_at timestamp without time zone,
    vision_refined boolean DEFAULT false,
    vision_refined_at timestamp without time zone,
    audio_generated boolean DEFAULT false,
    audio_generated_at timestamp without time zone,
    vision_board_completed boolean DEFAULT false,
    vision_board_completed_at timestamp without time zone,
    first_journal_entry boolean DEFAULT false,
    first_journal_entry_at timestamp without time zone,
    calibration_call_completed boolean DEFAULT false,
    calibration_call_completed_at timestamp without time zone,
    activation_protocol_completed boolean DEFAULT false,
    activation_protocol_completed_at timestamp without time zone,
    status text DEFAULT 'pending'::text,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    unlock_completed boolean DEFAULT false,
    unlock_completed_at timestamp without time zone,
    voice_recording_skipped boolean DEFAULT false,
    voice_recording_skipped_at timestamp with time zone,
    CONSTRAINT intensive_checklist_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: TABLE intensive_checklist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.intensive_checklist IS '
Tracks progress through the 14-step Activation Intensive:
Step 1: Settings (tracked via user_accounts table)
Step 2: Baseline Intake (intake_completed)
Step 3: Profile (profile_completed)
Step 4: Assessment (assessment_completed)
Step 5: Life Vision (vision_built)
Step 6: Refine Vision (vision_refined)
Step 7: Generate Audio (audio_generated)
Step 8: Record Audio (optional, can be skipped)
Step 9: Audio Mix (audios_generated)
Step 10: Vision Board (vision_board_completed)
Step 11: Journal (first_journal_entry)
Step 12: Book Call (call_scheduled)
Step 13: Activation Protocol (activation_protocol_completed)
Step 14: Platform Unlock (unlock_completed)
';


--
-- Name: COLUMN intensive_checklist.intake_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.intake_completed IS 'DEPRECATED: Use profile_completed instead';


--
-- Name: COLUMN intensive_checklist.vision_drafted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.vision_drafted IS 'DEPRECATED: Use vision_built instead';


--
-- Name: COLUMN intensive_checklist.builder_session_started; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.builder_session_started IS 'DEPRECATED: Use vision_built instead';


--
-- Name: COLUMN intensive_checklist.builder_session_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.builder_session_completed IS 'DEPRECATED: Use vision_built instead';


--
-- Name: COLUMN intensive_checklist.vision_board_created; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.vision_board_created IS 'DEPRECATED: Use vision_board_completed instead';


--
-- Name: COLUMN intensive_checklist.calibration_scheduled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.calibration_scheduled IS 'DEPRECATED: Use call_scheduled instead';


--
-- Name: COLUMN intensive_checklist.calibration_attended; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.calibration_attended IS 'DEPRECATED: Use calibration_call_completed instead';


--
-- Name: COLUMN intensive_checklist.audios_generated; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.audios_generated IS 'DEPRECATED: Use audio_generated instead';


--
-- Name: COLUMN intensive_checklist.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.status IS 'Source of truth for intensive enrollment: pending, in_progress, completed';


--
-- Name: COLUMN intensive_checklist.started_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.started_at IS 'When user clicked Start button (begins 72-hour timer)';


--
-- Name: COLUMN intensive_checklist.completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.completed_at IS 'When user completed all steps and graduated';


--
-- Name: COLUMN intensive_checklist.voice_recording_skipped; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.voice_recording_skipped IS 'True if user explicitly skipped Step 8 (Record Voice)';


--
-- Name: COLUMN intensive_checklist.voice_recording_skipped_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_checklist.voice_recording_skipped_at IS 'Timestamp when user skipped Step 8';


--
-- Name: get_intensive_progress(public.intensive_checklist); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_intensive_progress(checklist_row public.intensive_checklist) RETURNS integer
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  total_steps INTEGER := 10;
  completed_steps INTEGER := 0;
BEGIN
  IF checklist_row.profile_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.assessment_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.call_scheduled THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.vision_built THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.vision_refined THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.audio_generated THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.vision_board_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.first_journal_entry THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.calibration_call_completed THEN completed_steps := completed_steps + 1; END IF;
  IF checklist_row.activation_protocol_completed THEN completed_steps := completed_steps + 1; END IF;
  
  RETURN (completed_steps * 100 / total_steps);
END;
$$;


--
-- Name: get_latest_profile_version(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_latest_profile_version(user_uuid uuid) RETURNS TABLE(id uuid, user_id uuid, version_number integer, profile_data jsonb, completion_percentage integer, is_draft boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT pv.id, pv.user_id, pv.version_number, pv.profile_data, 
         pv.completion_percentage, pv.is_draft, pv.created_at, pv.updated_at
  FROM profile_versions pv
  WHERE pv.user_id = user_uuid
  ORDER BY pv.version_number DESC
  LIMIT 1;
END;
$$;


--
-- Name: get_next_intensive_step(public.intensive_checklist); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_intensive_step(checklist_row public.intensive_checklist) RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  IF NOT checklist_row.profile_completed THEN RETURN 'profile'; END IF;
  IF NOT checklist_row.assessment_completed THEN RETURN 'assessment'; END IF;
  IF NOT checklist_row.call_scheduled THEN RETURN 'schedule_call'; END IF;
  IF NOT checklist_row.vision_built THEN RETURN 'build_vision'; END IF;
  IF NOT checklist_row.vision_refined THEN RETURN 'refine_vision'; END IF;
  IF NOT checklist_row.audio_generated THEN RETURN 'generate_audio'; END IF;
  IF NOT checklist_row.vision_board_completed THEN RETURN 'vision_board'; END IF;
  IF NOT checklist_row.first_journal_entry THEN RETURN 'journal'; END IF;
  IF NOT checklist_row.calibration_call_completed THEN RETURN 'calibration_call'; END IF;
  IF NOT checklist_row.activation_protocol_completed THEN RETURN 'activation'; END IF;
  
  RETURN 'completed';
END;
$$;


--
-- Name: get_next_version_number(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_version_number(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  RETURN next_version;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 1;
END;
$$;


--
-- Name: FUNCTION get_next_version_number(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_version_number(p_user_id uuid) IS 'Gets the next version number for a user';


--
-- Name: get_profile_completion_percentage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_profile_completion_percentage(user_uuid uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  total_fields INTEGER := 24; -- Total number of profile fields
  completed_fields INTEGER := 0;
  profile_record user_profiles%ROWTYPE;
BEGIN
  -- Get the user's profile
  SELECT * INTO profile_record FROM user_profiles WHERE user_id = user_uuid;
  
  -- If no profile exists, return 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Count completed fields
  IF profile_record.profile_picture_url IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.date_of_birth IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.gender IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.ethnicity IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.relationship_status IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.relationship_length IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.has_children IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.number_of_children IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.children_ages IS NOT NULL AND array_length(profile_record.children_ages, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.units IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.height IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.weight IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.exercise_frequency IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.living_situation IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.time_at_location IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.city IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.state IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.postal_code IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.country IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.employment_type IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.occupation IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.company IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.time_in_role IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.household_income IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  
  -- Return percentage
  RETURN ROUND((completed_fields::DECIMAL / total_fields::DECIMAL) * 100);
END;
$$;


--
-- Name: get_profile_version_number(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_profile_version_number(p_profile_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  profile_user_id UUID;
  version_num INTEGER;
BEGIN
  -- Get the user_id for this profile
  SELECT user_id INTO profile_user_id
  FROM user_profiles
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate version number
  SELECT calculate_version_number(p_profile_id, profile_user_id) INTO version_num;
  
  RETURN version_num;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;


--
-- Name: FUNCTION get_profile_version_number(p_profile_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_profile_version_number(p_profile_id uuid) IS 'Gets the calculated version number for a profile based on chronological order.';


--
-- Name: get_refined_categories(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_refined_categories(draft_vision_id uuid) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
  refined_cats TEXT[];
BEGIN
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(refined_categories)
    FROM vision_versions
    WHERE id = draft_vision_id
    AND is_draft = true
  ) INTO refined_cats;
  
  RETURN COALESCE(refined_cats, ARRAY[]::TEXT[]);
END;
$$;


--
-- Name: membership_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membership_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tier_type public.membership_tier_type,
    price_monthly integer DEFAULT 0 NOT NULL,
    price_yearly integer,
    features jsonb DEFAULT '[]'::jsonb,
    viva_tokens_monthly integer DEFAULT 0 NOT NULL,
    max_visions integer,
    is_popular boolean DEFAULT false,
    display_order integer DEFAULT 0,
    stripe_product_id text,
    stripe_price_id text,
    annual_token_grant integer DEFAULT 0,
    monthly_token_grant integer DEFAULT 0,
    billing_interval text DEFAULT 'month'::text,
    storage_quota_gb integer DEFAULT 100,
    included_seats integer DEFAULT 1,
    max_household_members integer,
    rollover_max_cycles integer,
    plan_category text DEFAULT 'subscription'::text,
    is_household_plan boolean DEFAULT false,
    product_id uuid
);


--
-- Name: TABLE membership_tiers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.membership_tiers IS 'Single source of truth for all billing configuration, token grants, and plan features';


--
-- Name: COLUMN membership_tiers.storage_quota_gb; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.membership_tiers.storage_quota_gb IS 'Storage quota in GB for this tier';


--
-- Name: COLUMN membership_tiers.included_seats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.membership_tiers.included_seats IS 'Number of user seats included (1 for solo, 2+ for household)';


--
-- Name: COLUMN membership_tiers.max_household_members; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.membership_tiers.max_household_members IS 'Maximum household members (NULL = solo plan, 6 = household)';


--
-- Name: COLUMN membership_tiers.rollover_max_cycles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.membership_tiers.rollover_max_cycles IS 'Max billing cycles tokens can roll over (NULL = no rollover/annual reset)';


--
-- Name: COLUMN membership_tiers.plan_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.membership_tiers.plan_category IS 'Plan category: subscription, intensive, or addon';


--
-- Name: COLUMN membership_tiers.is_household_plan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.membership_tiers.is_household_plan IS 'Whether this is a household plan (vs solo)';


--
-- Name: get_tier_by_stripe_price_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_tier_by_stripe_price_id(p_price_id text) RETURNS public.membership_tiers
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_tier membership_tiers;
BEGIN
  SELECT * INTO v_tier
  FROM membership_tiers
  WHERE stripe_price_id = p_price_id
  AND is_active = TRUE;
  
  RETURN v_tier;
END;
$$;


--
-- Name: get_tier_by_type(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_tier_by_type(p_tier_type text) RETURNS public.membership_tiers
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_tier membership_tiers;
BEGIN
  SELECT * INTO v_tier
  FROM membership_tiers
  WHERE tier_type = p_tier_type::membership_tier_type
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tier not found: %', p_tier_type;
  END IF;
  
  RETURN v_tier;
END;
$$;


--
-- Name: FUNCTION get_tier_by_type(p_tier_type text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_tier_by_type(p_tier_type text) IS 'Get tier configuration by tier_type enum value';


--
-- Name: get_tier_config(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_tier_config(p_tier_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'id', id,
      'name', name,
      'tier_type', tier_type,
      'tokens', CASE 
        WHEN billing_interval = 'year' THEN annual_token_grant
        ELSE monthly_token_grant
      END,
      'storage_gb', storage_quota_gb,
      'seats', included_seats,
      'max_members', max_household_members,
      'rollover_cycles', rollover_max_cycles,
      'is_household', is_household_plan,
      'price_monthly', price_monthly,
      'price_yearly', price_yearly
    )
    FROM membership_tiers
    WHERE id = p_tier_id
  );
END;
$$;


--
-- Name: get_user_household_summary(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_household_summary(p_user_id uuid) RETURNS TABLE(household_id uuid, household_name text, is_admin boolean, plan_type text, shared_tokens_enabled boolean, member_count bigint, can_use_shared_tokens boolean, admin_user_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id AS household_id,
    h.name AS household_name,
    (h.admin_user_id = p_user_id) AS is_admin,
    h.plan_type,
    h.shared_tokens_enabled,
    (SELECT COUNT(*) FROM household_members WHERE household_id = h.id AND status = 'active') AS member_count,
    (h.shared_tokens_enabled AND hm.allow_shared_tokens) AS can_use_shared_tokens,
    h.admin_user_id
  FROM households h
  INNER JOIN household_members hm ON hm.household_id = h.id AND hm.user_id = p_user_id AND hm.status = 'active';
END;
$$;


--
-- Name: FUNCTION get_user_household_summary(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_household_summary(p_user_id uuid) IS 'Get complete household info for a user (token balances calculated separately via get_user_token_balance)';


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid()) RETURNS public.user_role
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result user_role;
BEGIN
  SELECT role INTO result FROM user_accounts WHERE id = user_id;
  RETURN COALESCE(result, 'member');
END;
$$;


--
-- Name: FUNCTION get_user_role(user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_role(user_id uuid) IS 'Get the role of a user';


--
-- Name: get_user_session_ids(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_session_ids(user_uuid uuid) RETURNS SETOF uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT session_id 
  FROM video_session_participants 
  WHERE user_id = user_uuid
$$;


--
-- Name: get_user_storage_quota(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_storage_quota(p_user_id uuid) RETURNS TABLE(total_quota_gb integer)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(quota_gb), 0)::INTEGER as total_quota_gb
  FROM user_storage
  WHERE user_id = p_user_id;
END;
$$;


--
-- Name: FUNCTION get_user_storage_quota(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_storage_quota(p_user_id uuid) IS 'Returns total storage quota for user (sum of all grants). Usage calculated from S3.';


--
-- Name: get_user_tier(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_tier(p_user_id uuid) RETURNS public.membership_tiers
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_tier membership_tiers;
  v_subscription customer_subscriptions;
BEGIN
  -- Get active subscription
  v_subscription := get_active_subscription(p_user_id);
  
  IF v_subscription IS NOT NULL THEN
    -- User has active subscription
    SELECT * INTO v_tier
    FROM membership_tiers
    WHERE id = v_subscription.membership_tier_id;
  ELSE
    -- Default to free tier
    SELECT * INTO v_tier
    FROM membership_tiers
    WHERE tier_type = 'free';
  END IF;
  
  RETURN v_tier;
END;
$$;


--
-- Name: FUNCTION get_user_tier(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_tier(p_user_id uuid) IS 'Returns user''s current membership tier (defaults to free)';


--
-- Name: get_user_token_balance(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_token_balance(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_total_granted BIGINT;
  v_total_used BIGINT;
  v_total_expired BIGINT;
  v_active_balance BIGINT;
  v_grants JSONB;
BEGIN
  -- Calculate total granted from unexpired grants
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_granted
  FROM token_transactions
  WHERE user_id = p_user_id
    AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_grant')
    AND tokens_used > 0
    AND (expires_at IS NULL OR expires_at > NOW()); -- Only count unexpired
  
  -- Calculate total expired
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_expired
  FROM token_transactions
  WHERE user_id = p_user_id
    AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'admin_grant')
    AND tokens_used > 0
    AND expires_at IS NOT NULL
    AND expires_at <= NOW(); -- Expired grants
  
  -- Calculate total used from token_usage
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_used
  FROM token_usage
  WHERE user_id = p_user_id
    AND success = true
    AND action_type NOT IN ('admin_grant', 'subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_deduct');
  
  -- Active balance = unexpired grants - usage
  v_active_balance := v_total_granted - v_total_used;
  
  -- Ensure balance never goes negative
  IF v_active_balance < 0 THEN
    v_active_balance := 0;
  END IF;
  
  -- Get grants summary (grouped by type)
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'action_type', action_type,
      'total_granted', total_granted,
      'expires_at', expires_at,
      'is_expired', (expires_at IS NOT NULL AND expires_at <= NOW())
    )
  )
  INTO v_grants
  FROM (
    SELECT 
      action_type,
      SUM(tokens_used) as total_granted,
      MAX(expires_at) as expires_at
    FROM token_transactions
    WHERE user_id = p_user_id
      AND action_type IN ('subscription_grant', 'renewal_grant', 'trial_grant', 'token_pack_purchase', 'pack_purchase', 'admin_grant')
      AND tokens_used > 0
    GROUP BY action_type
    ORDER BY MAX(created_at)
  ) grants_summary;
  
  RETURN JSONB_BUILD_OBJECT(
    'total_active', v_active_balance,
    'total_granted', v_total_granted,
    'total_used', v_total_used,
    'total_expired', v_total_expired,
    'grants', COALESCE(v_grants, '[]'::jsonb)
  );
END;
$$;


--
-- Name: FUNCTION get_user_token_balance(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_token_balance(p_user_id uuid) IS 'Calculate user token balance from token_transactions and token_usage (simple: unexpired grants - usage)';


--
-- Name: get_user_token_summary(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_token_summary(p_user_id uuid) RETURNS TABLE(total_tokens_used bigint, total_cost_usd numeric, tokens_by_action jsonb, recent_transactions jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total tokens used (sum of all positive values)
    COALESCE(SUM(CASE WHEN tokens_used > 0 THEN tokens_used ELSE 0 END), 0)::BIGINT,
    
    -- Total cost
    COALESCE(SUM(estimated_cost_usd), 0)::DECIMAL,
    
    -- Breakdown by action type
    (
      SELECT jsonb_object_agg(action_type, token_sum)
      FROM (
        SELECT 
          action_type::TEXT,
          SUM(CASE WHEN tokens_used > 0 THEN tokens_used ELSE 0 END) as token_sum
        FROM token_transactions
        WHERE user_id = p_user_id
        GROUP BY action_type
      ) action_breakdown
    ),
    
    -- Recent transactions (last 10)
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'action_type', action_type,
          'tokens_used', tokens_used,
          'tokens_remaining', tokens_remaining,
          'created_at', created_at,
          'metadata', metadata
        )
        ORDER BY created_at DESC
      )
      FROM (
        SELECT *
        FROM token_transactions
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    )
  FROM token_transactions
  WHERE user_id = p_user_id;
END;
$$;


--
-- Name: FUNCTION get_user_token_summary(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_token_summary(p_user_id uuid) IS 'Returns comprehensive token usage analytics for a user';


--
-- Name: get_user_total_audio_plays(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_total_audio_plays(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(play_count), 0)::INTEGER
    FROM audio_tracks
    WHERE user_id = p_user_id
  );
END;
$$;


--
-- Name: FUNCTION get_user_total_audio_plays(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_total_audio_plays(p_user_id uuid) IS 'Returns the total number of audio plays (activations) for a user';


--
-- Name: get_user_total_refinements(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_total_refinements(p_user_id uuid) RETURNS TABLE(total_refinement_count integer, refined_category_list text[])
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_count integer;
  all_categories text[];
BEGIN
  -- Sum the length of refined_categories arrays across all versions
  SELECT 
    COALESCE(SUM(jsonb_array_length(refined_categories)), 0)::integer
  INTO total_count
  FROM vision_versions
  WHERE user_id = p_user_id
    AND refined_categories IS NOT NULL
    AND jsonb_array_length(refined_categories) > 0;

  -- Get unique list of all categories that have been refined
  SELECT 
    ARRAY_AGG(DISTINCT elem ORDER BY elem)
  INTO all_categories
  FROM vision_versions,
       LATERAL jsonb_array_elements_text(refined_categories) AS elem
  WHERE user_id = p_user_id
    AND refined_categories IS NOT NULL
    AND jsonb_array_length(refined_categories) > 0;

  -- Return total count and list of all unique categories
  RETURN QUERY
  SELECT 
    COALESCE(total_count, 0)::integer,
    COALESCE(all_categories, ARRAY[]::text[]);
END;
$$;


--
-- Name: FUNCTION get_user_total_refinements(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_total_refinements(p_user_id uuid) IS 'Returns the total sum of all category refinements across all vision versions for a user.';


--
-- Name: get_vibe_assistant_allowance(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_vibe_assistant_allowance(p_user_id uuid) RETURNS TABLE(tokens_remaining integer, tokens_used integer, monthly_limit integer, cost_limit numeric, reset_date timestamp with time zone, tier_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.vibe_assistant_tokens_remaining,
        p.vibe_assistant_tokens_used,
        COALESCE(mt.monthly_vibe_assistant_tokens, 0),
        COALESCE(mt.monthly_vibe_assistant_cost_limit, 0.00),
        p.vibe_assistant_monthly_reset_date,
        COALESCE(mt.name, 'Free')
    FROM profiles p
    LEFT JOIN membership_tiers mt ON p.membership_tier_id = mt.id
    WHERE p.user_id = p_user_id;
END;
$$;


--
-- Name: FUNCTION get_vibe_assistant_allowance(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_vibe_assistant_allowance(p_user_id uuid) IS 'Returns current Vibe Assistant allowance info for a user';


--
-- Name: get_vision_version_number(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_vision_version_number(p_vision_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  vision_user_id UUID;
  version_num INTEGER;
BEGIN
  -- Get the user_id for this vision
  SELECT user_id INTO vision_user_id
  FROM vision_versions
  WHERE id = p_vision_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate version number
  SELECT calculate_vision_version_number(p_vision_id, vision_user_id) INTO version_num;
  
  RETURN version_num;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;


--
-- Name: FUNCTION get_vision_version_number(p_vision_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_vision_version_number(p_vision_id uuid) IS 'Gets the calculated version number for a vision based on chronological order.';


--
-- Name: grant_annual_tokens(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_annual_tokens(p_user_id uuid, p_subscription_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  -- Get Vision Pro Annual tier ID
  SELECT id INTO v_tier_id
  FROM membership_tiers
  WHERE tier_type = 'vision_pro_annual'
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vision Pro Annual tier not found';
  END IF;
  
  RETURN grant_tokens_for_tier(p_user_id, v_tier_id, p_subscription_id);
END;
$$;


--
-- Name: grant_tokens_by_stripe_price_id(uuid, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_tokens_by_stripe_price_id(p_user_id uuid, p_stripe_price_id text, p_subscription_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  -- Look up tier by Stripe price ID
  SELECT id INTO v_tier_id
  FROM membership_tiers
  WHERE stripe_price_id = p_stripe_price_id
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active tier found for Stripe price ID: %', p_stripe_price_id;
  END IF;
  
  -- Grant tokens for that tier
  RETURN grant_tokens_for_tier(p_user_id, v_tier_id, p_subscription_id);
END;
$$;


--
-- Name: FUNCTION grant_tokens_by_stripe_price_id(p_user_id uuid, p_stripe_price_id text, p_subscription_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.grant_tokens_by_stripe_price_id(p_user_id uuid, p_stripe_price_id text, p_subscription_id uuid) IS 'Grant tokens by looking up tier from Stripe price ID (for webhooks)';


--
-- Name: grant_tokens_for_tier(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_tokens_for_tier(p_user_id uuid, p_tier_id uuid, p_subscription_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_tier membership_tiers;
  v_current_balance INTEGER;
  v_grant_amount INTEGER;
  v_new_balance INTEGER;
  v_expires_at TIMESTAMPTZ;
  v_action_type token_action_type;
BEGIN
  -- Get tier configuration
  SELECT * INTO v_tier
  FROM membership_tiers
  WHERE id = p_tier_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tier not found: %', p_tier_id;
  END IF;
  
  -- Calculate current balance
  SELECT (get_user_token_balance(p_user_id)->>'total_active')::INTEGER
  INTO v_current_balance;
  
  -- Determine grant amount and expiration based on billing interval
  IF v_tier.billing_interval = 'year' THEN
    v_grant_amount := v_tier.annual_token_grant;
    v_expires_at := NOW() + INTERVAL '364 days';
    v_action_type := 'subscription_grant';
  ELSIF v_tier.billing_interval = 'month' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NOW() + INTERVAL '84 days'; -- 28-day grants expire after 3 cycles
    v_action_type := 'subscription_grant';
  ELSIF v_tier.billing_interval = 'one-time' THEN
    v_grant_amount := v_tier.monthly_token_grant;
    v_expires_at := NULL; -- Intensive tokens never expire
    v_action_type := 'trial_grant';
  ELSE
    RAISE EXCEPTION 'Unknown billing interval: %', v_tier.billing_interval;
  END IF;
  
  v_new_balance := v_current_balance + v_grant_amount;
  
  -- Insert token grant into token_transactions with expiration
  INSERT INTO token_transactions (
    user_id,
    action_type,
    tokens_used,
    tokens_remaining,
    subscription_id,
    metadata,
    expires_at
  ) VALUES (
    p_user_id,
    v_action_type,
    -v_grant_amount, -- Negative because it's a grant
    v_grant_amount, -- Initial remaining equals granted
    p_subscription_id,
    jsonb_build_object(
      'tier_id', p_tier_id,
      'tier_type', v_tier.tier_type,
      'tier_name', v_tier.name,
      'plan_category', v_tier.plan_category,
      'grant_type', v_tier.billing_interval
    ),
    v_expires_at
  );
  
  -- Insert storage grant
  INSERT INTO user_storage (
    user_id,
    storage_quota_gb,
    subscription_id,
    metadata
  ) VALUES (
    p_user_id,
    v_tier.storage_quota_gb,
    p_subscription_id,
    jsonb_build_object(
      'tier_id', p_tier_id,
      'tier_type', v_tier.tier_type,
      'granted_at', NOW()
    )
  )
  ON CONFLICT (user_id, subscription_id)
  DO UPDATE SET
    storage_quota_gb = EXCLUDED.storage_quota_gb,
    updated_at = NOW(),
    metadata = EXCLUDED.metadata;
  
  RETURN jsonb_build_object(
    'success', true,
    'tokens_granted', v_grant_amount,
    'new_balance', v_new_balance,
    'storage_quota_gb', v_tier.storage_quota_gb,
    'expires_at', v_expires_at,
    'tier', jsonb_build_object(
      'id', v_tier.id,
      'name', v_tier.name,
      'tier_type', v_tier.tier_type
    )
  );
END;
$$;


--
-- Name: FUNCTION grant_tokens_for_tier(p_user_id uuid, p_tier_id uuid, p_subscription_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.grant_tokens_for_tier(p_user_id uuid, p_tier_id uuid, p_subscription_id uuid) IS 'Universal token grant function that reads from membership_tiers table. Intensive tokens never expire. 28-day tokens expire in 84 days. Annual tokens expire in 364 days.';


--
-- Name: grant_trial_tokens(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_trial_tokens(p_user_id uuid, p_intensive_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  -- Get Intensive tier ID
  SELECT id INTO v_tier_id
  FROM membership_tiers
  WHERE tier_type = 'intensive'
  AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intensive tier not found';
  END IF;
  
  RETURN grant_tokens_for_tier(p_user_id, v_tier_id, p_intensive_id);
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_accounts (id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_user_hearted_comment(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_user_hearted_comment(p_user_id uuid, p_comment_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vibe_hearts 
    WHERE user_id = p_user_id AND comment_id = p_comment_id
  );
END;
$$;


--
-- Name: has_user_hearted_post(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_user_hearted_post(p_user_id uuid, p_post_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vibe_hearts 
    WHERE user_id = p_user_id AND post_id = p_post_id
  );
END;
$$;


--
-- Name: increment_ai_usage(uuid, integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_ai_usage(p_user_id uuid, p_tokens integer, p_cost numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_ai_calls, total_tokens_used, estimated_ai_cost)
  VALUES (p_user_id, 1, p_tokens, p_cost)
  ON CONFLICT (user_id) DO UPDATE SET
    total_ai_calls = user_stats.total_ai_calls + 1,
    total_tokens_used = user_stats.total_tokens_used + p_tokens,
    estimated_ai_cost = user_stats.estimated_ai_cost + p_cost,
    updated_at = NOW();
END;
$$;


--
-- Name: increment_audio_play(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_audio_play(p_track_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE audio_tracks 
  SET play_count = play_count + 1 
  WHERE id = p_track_id; 
END;
$$;


--
-- Name: FUNCTION increment_audio_play(p_track_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.increment_audio_play(p_track_id uuid) IS 'Increments the play count for a specific audio track';


--
-- Name: increment_journal_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_journal_stats(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_last_date DATE;
  v_streak INTEGER;
BEGIN
  SELECT last_journal_date, journal_streak
  INTO v_last_date, v_streak
  FROM user_stats
  WHERE user_id = p_user_id;
  
  IF v_last_date IS NULL THEN
    v_streak := 1;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := v_streak + 1;
  ELSIF v_last_date < CURRENT_DATE THEN
    v_streak := 1;
  END IF;
  
  INSERT INTO user_stats (user_id, total_journal_entries, journal_streak, last_journal_date)
  VALUES (p_user_id, 1, v_streak, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_journal_entries = user_stats.total_journal_entries + 1,
    journal_streak = v_streak,
    last_journal_date = CURRENT_DATE,
    updated_at = NOW();
END;
$$;


--
-- Name: initialize_vision_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_vision_progress() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  insert into public.vision_progress (user_id, vision_id, total_categories)
  values (new.user_id, new.id, 12)
  on conflict (vision_id) do nothing;
  
  return new;
end;
$$;


--
-- Name: is_active_household_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_active_household_member(h uuid, u uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = h
      AND user_id = u
      AND status = 'active'
  );
$$;


--
-- Name: FUNCTION is_active_household_member(h uuid, u uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_active_household_member(h uuid, u uuid) IS 'SECURITY DEFINER function to check if user is active household member. Bypasses RLS for membership checks.';


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_accounts
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$;


--
-- Name: FUNCTION is_admin(user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_admin(user_id uuid) IS 'Check if user has admin or super_admin role';


--
-- Name: is_admin_account(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_account(check_user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_accounts
    WHERE id = check_user_id AND role IN ('admin', 'super_admin')
  );
$$;


--
-- Name: is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_accounts
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$;


--
-- Name: is_super_admin_account(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin_account(check_user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_accounts
    WHERE id = check_user_id AND role = 'super_admin'
  );
$$;


--
-- Name: mark_category_refined(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_category_refined(draft_vision_id uuid, category_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_refined JSONB;
  cat_exists BOOLEAN;
BEGIN
  -- Get current refined_categories
  SELECT refined_categories INTO current_refined
  FROM vision_versions
  WHERE id = draft_vision_id
  AND is_draft = true;
  
  IF current_refined IS NULL THEN
    current_refined := '[]'::jsonb;
  END IF;
  
  -- Check if already marked
  cat_exists := current_refined ? category_name;
  
  -- Add if not present
  IF NOT cat_exists THEN
    UPDATE vision_versions
    SET refined_categories = current_refined || jsonb_build_array(category_name)
    WHERE id = draft_vision_id;
  END IF;
END;
$$;


--
-- Name: prepare_user_for_deletion(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prepare_user_for_deletion(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'storage'
    AS $_$
DECLARE
  r RECORD;
  result jsonb := '[]'::jsonb;
  row_count int;
BEGIN
  -- 1. Delete Supabase Storage objects owned by this user
  PERFORM set_config('storage.allow_delete_query', 'true', true);
  DELETE FROM storage.objects WHERE owner = p_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  result := result || jsonb_build_object('step', 'storage_objects', 'deleted', row_count);

  -- 2. Delete rows where SET NULL would violate a CHECK constraint
  DELETE FROM video_session_participants WHERE user_id = p_user_id AND email IS NULL;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  result := result || jsonb_build_object('step', 'video_session_participants', 'deleted', row_count);

  -- 3. Find and null out any FK columns referencing auth.users with NO ACTION
  FOR r IN
    SELECT
      c.conrelid::regclass::text AS table_name,
      a.attname                  AS column_name
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.contype    = 'f'
      AND c.confrelid  = 'auth.users'::regclass
      AND c.confdeltype = 'a'
  LOOP
    EXECUTE format(
      'UPDATE %s SET %I = NULL WHERE %I = $1',
      r.table_name, r.column_name, r.column_name
    ) USING p_user_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    result := result || jsonb_build_object(
      'step', r.table_name || '.' || r.column_name,
      'nulled', row_count
    );
  END LOOP;

  RETURN result;
END;
$_$;


--
-- Name: reset_monthly_vibe_assistant_allowances(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_monthly_vibe_assistant_allowances() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    reset_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Find users whose monthly reset date has passed
    FOR user_record IN 
        SELECT 
            p.user_id,
            COALESCE(mt.monthly_vibe_assistant_tokens, 100) as monthly_tokens
        FROM profiles p
        LEFT JOIN membership_tiers mt ON p.membership_tier_id = mt.id
        WHERE p.vibe_assistant_monthly_reset_date < CURRENT_TIMESTAMP
    LOOP
        -- Reset tokens for this user
        UPDATE profiles 
        SET 
            vibe_assistant_tokens_remaining = user_record.monthly_tokens,
            vibe_assistant_tokens_used = 0,
            vibe_assistant_total_cost = 0.00,
            vibe_assistant_monthly_reset_date = CURRENT_TIMESTAMP + INTERVAL '1 month',
            vibe_assistant_allowance_reset_count = vibe_assistant_allowance_reset_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = user_record.user_id;
        
        reset_count := reset_count + 1;
    END LOOP;
    
    RETURN reset_count;
END;
$$;


--
-- Name: FUNCTION reset_monthly_vibe_assistant_allowances(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.reset_monthly_vibe_assistant_allowances() IS 'Resets monthly allowances for all eligible users';


--
-- Name: set_draft_parent_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_draft_parent_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If creating a draft and parent_id is not set, try to find the active profile
  IF NEW.is_draft = true AND NEW.parent_id IS NULL THEN
    SELECT id INTO NEW.parent_id
    FROM user_profiles
    WHERE user_id = NEW.user_id
      AND is_active = true
      AND is_draft = false
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: set_ticket_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_ticket_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION set_updated_at(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.set_updated_at() IS 'Sets updated_at timestamp to now() before update triggers.';


--
-- Name: set_version_active(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_version_active(p_profile_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Check if the profile exists and belongs to the user
  SELECT EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = p_profile_id AND user_id = p_user_id
  ) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RETURN false;
  END IF;
  
  -- Deactivate all other active versions for this user
  UPDATE user_profiles 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true AND is_draft = false;
  
  -- Set the specified version as active
  UPDATE user_profiles 
  SET is_active = true, is_draft = false, updated_at = NOW()
  WHERE id = p_profile_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;


--
-- Name: FUNCTION set_version_active(p_profile_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.set_version_active(p_profile_id uuid, p_user_id uuid) IS 'Sets a version as active and deactivates others';


--
-- Name: sync_refined_categories_from_active(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_refined_categories_from_active(draft_vision_id uuid, active_vision_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  draft_vision RECORD;
  active_vision RECORD;
  refined_cats JSONB := '[]'::jsonb;
BEGIN
  -- Get both visions
  SELECT * INTO draft_vision FROM vision_versions WHERE id = draft_vision_id;
  SELECT * INTO active_vision FROM vision_versions WHERE id = active_vision_id;
  
  -- Compare each category and build list
  IF (draft_vision.forward IS DISTINCT FROM active_vision.forward) THEN
    refined_cats := refined_cats || jsonb_build_array('forward');
  END IF;
  
  IF (draft_vision.fun IS DISTINCT FROM active_vision.fun) THEN
    refined_cats := refined_cats || jsonb_build_array('fun');
  END IF;
  
  IF (draft_vision.travel IS DISTINCT FROM active_vision.travel) THEN
    refined_cats := refined_cats || jsonb_build_array('travel');
  END IF;
  
  IF (draft_vision.home IS DISTINCT FROM active_vision.home) THEN
    refined_cats := refined_cats || jsonb_build_array('home');
  END IF;
  
  IF (draft_vision.family IS DISTINCT FROM active_vision.family) THEN
    refined_cats := refined_cats || jsonb_build_array('family');
  END IF;
  
  IF (draft_vision.love IS DISTINCT FROM active_vision.love OR 
      draft_vision.romance IS DISTINCT FROM active_vision.romance) THEN
    refined_cats := refined_cats || jsonb_build_array('love');
  END IF;
  
  IF (draft_vision.health IS DISTINCT FROM active_vision.health) THEN
    refined_cats := refined_cats || jsonb_build_array('health');
  END IF;
  
  IF (draft_vision.money IS DISTINCT FROM active_vision.money) THEN
    refined_cats := refined_cats || jsonb_build_array('money');
  END IF;
  
  IF (draft_vision.work IS DISTINCT FROM active_vision.work OR 
      draft_vision.business IS DISTINCT FROM active_vision.business) THEN
    refined_cats := refined_cats || jsonb_build_array('work');
  END IF;
  
  IF (draft_vision.social IS DISTINCT FROM active_vision.social) THEN
    refined_cats := refined_cats || jsonb_build_array('social');
  END IF;
  
  IF (draft_vision.stuff IS DISTINCT FROM active_vision.stuff OR 
      draft_vision.possessions IS DISTINCT FROM active_vision.possessions) THEN
    refined_cats := refined_cats || jsonb_build_array('stuff');
  END IF;
  
  IF (draft_vision.giving IS DISTINCT FROM active_vision.giving) THEN
    refined_cats := refined_cats || jsonb_build_array('giving');
  END IF;
  
  IF (draft_vision.spirituality IS DISTINCT FROM active_vision.spirituality) THEN
    refined_cats := refined_cats || jsonb_build_array('spirituality');
  END IF;
  
  IF (draft_vision.conclusion IS DISTINCT FROM active_vision.conclusion) THEN
    refined_cats := refined_cats || jsonb_build_array('conclusion');
  END IF;
  
  -- Update draft with refined categories
  UPDATE vision_versions
  SET refined_categories = refined_cats
  WHERE id = draft_vision_id;
  
  RETURN refined_cats;
END;
$$;


--
-- Name: FUNCTION sync_refined_categories_from_active(draft_vision_id uuid, active_vision_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sync_refined_categories_from_active(draft_vision_id uuid, active_vision_id uuid) IS 'Compares draft vision with active vision and populates refined_categories array. Useful for migration or fixing discrepancies.';


--
-- Name: sync_user_accounts_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_user_accounts_email() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE user_accounts SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: sync_user_profile_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_user_profile_email() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Update user_profiles email when auth.users email changes
  UPDATE user_profiles
  SET email = NEW.email,
      updated_at = NOW()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;


--
-- Name: track_category_refinement(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_category_refinement() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  category_field TEXT;
  refined_cats JSONB;
  active_vision RECORD;
  draft_value TEXT;
  active_value TEXT;
BEGIN
  -- Only track for draft visions
  IF NEW.is_draft = true AND NEW.is_active = false THEN
    
    -- Get the baseline vision for comparison
    -- First try to get via parent_id (the source this draft was created from)
    IF NEW.parent_id IS NOT NULL THEN
      SELECT * INTO active_vision 
      FROM vision_versions 
      WHERE id = NEW.parent_id
      LIMIT 1;
    END IF;
    
    -- If no parent, get current active vision for this user as baseline
    IF active_vision IS NULL THEN
      SELECT * INTO active_vision 
      FROM vision_versions 
      WHERE user_id = NEW.user_id 
        AND is_active = true 
        AND is_draft = false
      LIMIT 1;
    END IF;
    
    -- If still no baseline vision, skip tracking
    IF active_vision IS NULL THEN
      RAISE NOTICE 'No baseline vision found for draft %, skipping refinement tracking', NEW.id;
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Comparing draft % against baseline %', NEW.id, active_vision.id;
    
    -- ALWAYS recalculate refined_categories to ensure accuracy
    -- This fixes the bug where clicking save without changes marks categories as refined
    RAISE NOTICE 'Recalculating refined_categories based on comparison with baseline';
    
    refined_cats := '[]'::jsonb;
    
    -- Check all category fields and build refined_categories array
    -- Only include categories that differ from the baseline
    
    -- Forward
    IF COALESCE(TRIM(NEW.forward), '') <> COALESCE(TRIM(active_vision.forward), '') THEN
      refined_cats := refined_cats || jsonb_build_array('forward');
    END IF;
    
    -- Fun
    IF COALESCE(TRIM(NEW.fun), '') <> COALESCE(TRIM(active_vision.fun), '') THEN
      refined_cats := refined_cats || jsonb_build_array('fun');
    END IF;
    
    -- Travel
    IF COALESCE(TRIM(NEW.travel), '') <> COALESCE(TRIM(active_vision.travel), '') THEN
      refined_cats := refined_cats || jsonb_build_array('travel');
    END IF;
    
    -- Home
    IF COALESCE(TRIM(NEW.home), '') <> COALESCE(TRIM(active_vision.home), '') THEN
      refined_cats := refined_cats || jsonb_build_array('home');
    END IF;
    
    -- Family
    IF COALESCE(TRIM(NEW.family), '') <> COALESCE(TRIM(active_vision.family), '') THEN
      refined_cats := refined_cats || jsonb_build_array('family');
    END IF;
    
    -- Love
    IF COALESCE(TRIM(NEW.love), '') <> COALESCE(TRIM(active_vision.love), '') THEN
      refined_cats := refined_cats || jsonb_build_array('love');
    END IF;
    
    -- Health
    IF COALESCE(TRIM(NEW.health), '') <> COALESCE(TRIM(active_vision.health), '') THEN
      refined_cats := refined_cats || jsonb_build_array('health');
    END IF;
    
    -- Money
    IF COALESCE(TRIM(NEW.money), '') <> COALESCE(TRIM(active_vision.money), '') THEN
      refined_cats := refined_cats || jsonb_build_array('money');
    END IF;
    
    -- Work
    IF COALESCE(TRIM(NEW.work), '') <> COALESCE(TRIM(active_vision.work), '') THEN
      refined_cats := refined_cats || jsonb_build_array('work');
    END IF;
    
    -- Social
    IF COALESCE(TRIM(NEW.social), '') <> COALESCE(TRIM(active_vision.social), '') THEN
      refined_cats := refined_cats || jsonb_build_array('social');
    END IF;
    
    -- Stuff
    IF COALESCE(TRIM(NEW.stuff), '') <> COALESCE(TRIM(active_vision.stuff), '') THEN
      refined_cats := refined_cats || jsonb_build_array('stuff');
    END IF;
    
    -- Giving
    IF COALESCE(TRIM(NEW.giving), '') <> COALESCE(TRIM(active_vision.giving), '') THEN
      refined_cats := refined_cats || jsonb_build_array('giving');
    END IF;
    
    -- Spirituality
    IF COALESCE(TRIM(NEW.spirituality), '') <> COALESCE(TRIM(active_vision.spirituality), '') THEN
      refined_cats := refined_cats || jsonb_build_array('spirituality');
    END IF;
    
    -- Conclusion
    IF COALESCE(TRIM(NEW.conclusion), '') <> COALESCE(TRIM(active_vision.conclusion), '') THEN
      refined_cats := refined_cats || jsonb_build_array('conclusion');
    END IF;
  
    RAISE NOTICE 'Calculated refined_categories: %', refined_cats;
    NEW.refined_categories := refined_cats;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION track_category_refinement(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.track_category_refinement() IS 'Tracks which vision categories have been refined compared to the baseline (parent or active) vision. 
Always recalculates refined_categories on every update to ensure accuracy and handle reverts correctly.
Categories are only marked as refined if their text differs from the baseline.';


--
-- Name: update_ai_model_pricing_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ai_model_pricing_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_assessment_scores(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_assessment_scores() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_category_score INTEGER;
  v_green_line_status green_line_status;
  v_total_score INTEGER;
  v_category_scores JSONB;
  v_green_line_statuses JSONB;
  v_category_key TEXT;
BEGIN
  -- Get the assessment_id from the new or old row
  IF TG_OP = 'DELETE' THEN
    v_category_key := OLD.assessment_id::TEXT;
  ELSE
    v_category_key := NEW.assessment_id::TEXT;
  END IF;
  
  -- Recalculate all category scores for this assessment
  v_category_scores := '{}'::JSONB;
  v_green_line_statuses := '{}'::JSONB;
  v_total_score := 0;
  
  -- Loop through each category
  FOR v_category_key IN 
    SELECT DISTINCT category::TEXT 
    FROM assessment_responses 
    WHERE assessment_id = COALESCE(NEW.assessment_id, OLD.assessment_id)
  LOOP
    -- Calculate category score
    SELECT calculate_category_score(
      COALESCE(NEW.assessment_id, OLD.assessment_id),
      v_category_key::assessment_category
    ) INTO v_category_score;
    
    -- Get Green Line status
    v_green_line_status := get_green_line_status(v_category_score);
    
    -- Add to JSONB objects
    v_category_scores := v_category_scores || jsonb_build_object(v_category_key, v_category_score);
    v_green_line_statuses := v_green_line_statuses || jsonb_build_object(v_category_key, v_green_line_status);
    v_total_score := v_total_score + v_category_score;
  END LOOP;
  
  -- Update the assessment_results table
  UPDATE assessment_results
  SET 
    category_scores = v_category_scores,
    green_line_status = v_green_line_statuses,
    total_score = v_total_score,
    overall_percentage = ROUND((v_total_score::NUMERIC / max_possible_score::NUMERIC) * 100),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.assessment_id, OLD.assessment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: FUNCTION update_assessment_scores(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_assessment_scores() IS 'Automatically updates assessment totals when responses change';


--
-- Name: update_assessment_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_assessment_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_audio_generation_batches_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_audio_generation_batches_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_blueprint_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_blueprint_progress() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update the blueprint's progress percentage
    UPDATE actualization_blueprints
    SET 
        progress_percentage = calculate_blueprint_progress(NEW.blueprint_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.blueprint_id;
    
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION update_blueprint_progress(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_blueprint_progress() IS 'Automatically updates blueprint progress when tasks change';


--
-- Name: update_calendar_event_for_booking(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_calendar_event_for_booking() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE calendar_events
  SET 
    status = CASE 
      WHEN NEW.status IN ('cancelled', 'no_show') THEN 'cancelled'
      WHEN NEW.status = 'pending' THEN 'tentative'
      ELSE 'confirmed'
    END,
    scheduled_at = NEW.scheduled_at,
    end_at = NEW.scheduled_at + (NEW.duration_minutes || ' minutes')::INTERVAL,
    title = COALESCE(NEW.title, 'Booking: ' || NEW.event_type),
    staff_id = NEW.staff_id
  WHERE booking_id = NEW.id;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_campaign_metrics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_campaign_metrics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update metrics for the NEW campaign (INSERT/UPDATE)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.campaign_id IS NOT NULL THEN
      UPDATE marketing_campaigns
      SET 
        total_leads = (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id),
        total_conversions = (SELECT COUNT(*) FROM leads WHERE campaign_id = NEW.campaign_id AND status = 'converted'),
        revenue_generated = (SELECT COALESCE(SUM(conversion_value), 0) FROM leads WHERE campaign_id = NEW.campaign_id AND status = 'converted'),
        updated_at = NOW()
      WHERE id = NEW.campaign_id;
    END IF;
  END IF;

  -- Update metrics for the OLD campaign (UPDATE that changes campaign_id, or DELETE)
  IF TG_OP = 'UPDATE' AND OLD.campaign_id IS NOT NULL AND OLD.campaign_id IS DISTINCT FROM NEW.campaign_id THEN
    UPDATE marketing_campaigns
    SET 
      total_leads = (SELECT COUNT(*) FROM leads WHERE campaign_id = OLD.campaign_id),
      total_conversions = (SELECT COUNT(*) FROM leads WHERE campaign_id = OLD.campaign_id AND status = 'converted'),
      revenue_generated = (SELECT COALESCE(SUM(conversion_value), 0) FROM leads WHERE campaign_id = OLD.campaign_id AND status = 'converted'),
      updated_at = NOW()
    WHERE id = OLD.campaign_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.campaign_id IS NOT NULL THEN
      UPDATE marketing_campaigns
      SET 
        total_leads = (SELECT COUNT(*) FROM leads WHERE campaign_id = OLD.campaign_id),
        total_conversions = (SELECT COUNT(*) FROM leads WHERE campaign_id = OLD.campaign_id AND status = 'converted'),
        revenue_generated = (SELECT COALESCE(SUM(conversion_value), 0) FROM leads WHERE campaign_id = OLD.campaign_id AND status = 'converted'),
        updated_at = NOW()
      WHERE id = OLD.campaign_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_comment_hearts_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_comment_hearts_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vibe_comments SET hearts_count = hearts_count + 1 WHERE id = NEW.comment_id;
    -- Update hearts_received for comment author
    UPDATE user_community_stats 
    SET hearts_received = hearts_received + 1, updated_at = now()
    WHERE user_id = (SELECT user_id FROM vibe_comments WHERE id = NEW.comment_id);
    -- Update hearts_given for the user who hearted
    UPDATE user_community_stats 
    SET hearts_given = hearts_given + 1, updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vibe_comments SET hearts_count = hearts_count - 1 WHERE id = OLD.comment_id;
    -- Update hearts_received for comment author
    UPDATE user_community_stats 
    SET hearts_received = GREATEST(0, hearts_received - 1), updated_at = now()
    WHERE user_id = (SELECT user_id FROM vibe_comments WHERE id = OLD.comment_id);
    -- Update hearts_given for the user who removed heart
    UPDATE user_community_stats 
    SET hearts_given = GREATEST(0, hearts_given - 1), updated_at = now()
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_conversation_session(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_session() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update the conversation session's last_message_at and message_count
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversation_sessions
    SET 
      updated_at = NOW(),
      last_message_at = NEW.created_at,
      message_count = (
        SELECT COUNT(*) 
        FROM ai_conversations 
        WHERE conversation_id = NEW.conversation_id
      )
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_generated_images_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_generated_images_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_households_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_households_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_intensive_responses_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_intensive_responses_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_messaging_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_messaging_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_post_comments_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_post_comments_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vibe_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    -- Update total_comments for the commenter
    UPDATE user_community_stats 
    SET total_comments = total_comments + 1, updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false) THEN
    UPDATE vibe_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = COALESCE(OLD.post_id, NEW.post_id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_post_hearts_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_post_hearts_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vibe_posts SET hearts_count = hearts_count + 1 WHERE id = NEW.post_id;
    -- Update hearts_received for post author
    UPDATE user_community_stats 
    SET hearts_received = hearts_received + 1, updated_at = now()
    WHERE user_id = (SELECT user_id FROM vibe_posts WHERE id = NEW.post_id);
    -- Update hearts_given for the user who hearted
    UPDATE user_community_stats 
    SET hearts_given = hearts_given + 1, updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vibe_posts SET hearts_count = hearts_count - 1 WHERE id = OLD.post_id;
    -- Update hearts_received for post author
    UPDATE user_community_stats 
    SET hearts_received = GREATEST(0, hearts_received - 1), updated_at = now()
    WHERE user_id = (SELECT user_id FROM vibe_posts WHERE id = OLD.post_id);
    -- Update hearts_given for the user who removed heart
    UPDATE user_community_stats 
    SET hearts_given = GREATEST(0, hearts_given - 1), updated_at = now()
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_profile_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_stats(user_uuid uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Update user stats table if it exists
  INSERT INTO user_stats (user_id, profiles_created, last_profile_update)
  VALUES (user_uuid, 1, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    profiles_created = user_stats.profiles_created + 1,
    last_profile_update = NOW();
END;
$$;


--
-- Name: update_schedules_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_schedules_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_stories_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_stories_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_accounts_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_accounts_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_post_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_post_stats() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  last_date DATE;
  current_streak INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get or create user stats
    INSERT INTO user_community_stats (user_id, total_posts, last_post_date, streak_days)
    VALUES (NEW.user_id, 1, CURRENT_DATE, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_posts = user_community_stats.total_posts + 1,
      streak_days = CASE
        WHEN user_community_stats.last_post_date = CURRENT_DATE THEN user_community_stats.streak_days
        WHEN user_community_stats.last_post_date = CURRENT_DATE - 1 THEN user_community_stats.streak_days + 1
        ELSE 1
      END,
      longest_streak = GREATEST(
        user_community_stats.longest_streak,
        CASE
          WHEN user_community_stats.last_post_date = CURRENT_DATE THEN user_community_stats.streak_days
          WHEN user_community_stats.last_post_date = CURRENT_DATE - 1 THEN user_community_stats.streak_days + 1
          ELSE 1
        END
      ),
      last_post_date = CURRENT_DATE,
      updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false) THEN
    UPDATE user_community_stats 
    SET total_posts = GREATEST(0, total_posts - 1), updated_at = now()
    WHERE user_id = COALESCE(OLD.user_id, NEW.user_id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_user_profiles_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_profiles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_vibrational_links_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_vibrational_links_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_video_session_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_video_session_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_vision_focus_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_vision_focus_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_vision_progress_on_completion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_vision_progress_on_completion() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  -- Only proceed if conversation was just completed
  if new.completed_at is not null and (old.completed_at is null or old.completed_at is distinct from new.completed_at) then
    -- Update vision_progress
    update public.vision_progress
    set 
      categories_completed = array_append(
        array_remove(categories_completed, new.category), 
        new.category
      ),
      last_activity = now(),
      completed_at = case 
        when array_length(array_append(array_remove(categories_completed, new.category), new.category), 1) = total_categories 
        then now() 
        else null 
      end
    where vision_id = new.vision_id;
    
    -- Update vision_versions conversation count
    update public.vision_versions
    set conversation_count = (
      select count(*) 
      from public.vision_conversations 
      where vision_id = new.vision_id and completed_at is not null
    )
    where id = new.vision_id;
  end if;
  
  return new;
end;
$$;


--
-- Name: update_vision_refinement_tracking(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_vision_refinement_tracking() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update vision_versions table with refinement info
    UPDATE vision_versions 
    SET 
        vibe_assistant_refinements_count = vibe_assistant_refinements_count + 1,
        last_vibe_assistant_refinement = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.vision_id;
    
    RETURN NEW;
END;
$$;


--
-- Name: upload_to_s3(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upload_to_s3(file_path text, file_data text, content_type text, bucket_name text DEFAULT 'vibration-fit-client-storage'::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a placeholder implementation
  -- In production, you would need to:
  -- 1. Install the AWS SDK extension in Supabase
  -- 2. Configure AWS credentials
  -- 3. Implement actual S3 upload logic
  
  -- For now, we'll just return success
  -- The actual S3 upload would happen here using AWS SDK
  
  result := json_build_object(
    'success', true,
    'message', 'File uploaded successfully (placeholder)',
    'path', file_path,
    'bucket', bucket_name
  );
  
  RETURN result;
END;
$$;


--
-- Name: user_has_feature(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_feature(p_user_id uuid, p_feature text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_tier membership_tiers;
BEGIN
  v_tier := get_user_tier(p_user_id);
  
  -- Check if feature is in the tier's features array
  RETURN v_tier.features @> to_jsonb(ARRAY[p_feature]);
END;
$$;


--
-- Name: FUNCTION user_has_feature(p_user_id uuid, p_feature text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_has_feature(p_user_id uuid, p_feature text) IS 'Checks if user has access to a specific feature';


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: abundance_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abundance_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    value_type text NOT NULL,
    amount numeric(12,2),
    vision_category text,
    entry_category text,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT abundance_events_value_type_check CHECK ((value_type = ANY (ARRAY['money'::text, 'value'::text])))
);


--
-- Name: ai_action_token_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_action_token_overrides (
    action_type text NOT NULL,
    token_value integer NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_action_token_overrides_token_value_check CHECK ((token_value >= 0))
);


--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    message text NOT NULL,
    context_used jsonb,
    created_at timestamp with time zone DEFAULT now(),
    context jsonb DEFAULT '{}'::jsonb
);


--
-- Name: TABLE ai_conversations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_conversations IS 'Stores individual chat messages between users and VIVA';


--
-- Name: COLUMN ai_conversations.conversation_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_conversations.conversation_id IS 'Links messages to a conversation session (nullable for backward compatibility)';


--
-- Name: ai_model_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_model_pricing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_name text NOT NULL,
    provider text DEFAULT 'openai'::text NOT NULL,
    model_family text,
    input_price_per_1m numeric(10,2) NOT NULL,
    output_price_per_1m numeric(10,2) NOT NULL,
    price_per_unit numeric(10,6),
    unit_type text,
    is_active boolean DEFAULT true,
    effective_date timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    supports_temperature boolean DEFAULT true,
    supports_json_mode boolean DEFAULT true,
    supports_streaming boolean DEFAULT true,
    is_reasoning_model boolean DEFAULT false,
    max_tokens_param text DEFAULT 'max_tokens'::text,
    token_multiplier integer DEFAULT 1,
    context_window integer,
    capabilities_notes text
);


--
-- Name: TABLE ai_model_pricing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_model_pricing IS 'Only contains models actively used in ai_tools. Dated OpenAI versions (e.g., gpt-4o-2024-08-06) are auto-normalized to base names (gpt-4o) in code.';


--
-- Name: COLUMN ai_model_pricing.supports_temperature; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_model_pricing.supports_temperature IS 'Whether model supports custom temperature - configure in admin';


--
-- Name: COLUMN ai_model_pricing.supports_json_mode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_model_pricing.supports_json_mode IS 'Whether model supports response_format json_object mode - configure in admin';


--
-- Name: COLUMN ai_model_pricing.supports_streaming; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_model_pricing.supports_streaming IS 'Whether model supports streaming responses - configure in admin';


--
-- Name: COLUMN ai_model_pricing.is_reasoning_model; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_model_pricing.is_reasoning_model IS 'Whether model uses tokens for internal reasoning - configure in admin';


--
-- Name: COLUMN ai_model_pricing.max_tokens_param; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_model_pricing.max_tokens_param IS 'OpenAI parameter name: max_tokens or max_completion_tokens - configure in admin';


--
-- Name: COLUMN ai_model_pricing.token_multiplier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_model_pricing.token_multiplier IS 'Token allocation multiplier (e.g., reasoning models may need more) - configure in admin';


--
-- Name: COLUMN ai_model_pricing.context_window; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_model_pricing.context_window IS 'Maximum context window size in tokens - configure in admin';


--
-- Name: ai_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_tools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tool_key text NOT NULL,
    tool_name text NOT NULL,
    description text,
    model_name text NOT NULL,
    temperature numeric(3,2) DEFAULT 0.7,
    max_tokens integer DEFAULT 1500,
    system_prompt text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE ai_tools; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_tools IS 'Blueprint generation now uses 8000 max_tokens (safe for gpt-4o which has 16384 limit). With token_multiplier=1.25, actual request will be 10000 tokens.';


--
-- Name: COLUMN ai_tools.tool_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_tools.tool_key IS 'Unique key used in code: getAIToolConfig(tool_key)';


--
-- Name: COLUMN ai_tools.model_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_tools.model_name IS 'References ai_model_pricing.model_name';


--
-- Name: COLUMN ai_tools.temperature; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_tools.temperature IS 'Temperature setting (0 for non-chat models like Whisper/TTS)';


--
-- Name: COLUMN ai_tools.max_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_tools.max_tokens IS 'Max tokens (0 for non-chat models that dont use token limits)';


--
-- Name: COLUMN ai_tools.system_prompt; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_tools.system_prompt IS 'System prompt (NULL for non-chat models like Whisper/TTS)';


--
-- Name: intensive_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intensive_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intensive_id uuid NOT NULL,
    user_id uuid NOT NULL,
    phase text NOT NULL,
    vision_clarity integer,
    vibrational_harmony integer,
    vibrational_constraints_clarity integer,
    vision_iteration_ease integer,
    has_audio_tracks text,
    audio_iteration_ease integer,
    has_vision_board text,
    vision_board_management integer,
    journey_capturing integer,
    roadmap_clarity integer,
    transformation_tracking integer,
    previous_attempts text,
    biggest_shift text,
    stats_snapshot jsonb DEFAULT '{}'::jsonb,
    testimonial_video_url text,
    testimonial_transcript text,
    testimonial_transcript_json jsonb,
    testimonial_duration_seconds integer,
    calibration_recording_url text,
    calibration_transcript text,
    calibration_transcript_json jsonb,
    calibration_duration_seconds integer,
    calibration_segments jsonb,
    calibration_soundbites jsonb,
    metrics_comparison jsonb,
    produced_video_url text,
    produced_video_thumbnail_url text,
    produced_video_duration_seconds integer,
    produced_at timestamp with time zone,
    sharing_preference text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT intensive_responses_audio_iteration_ease_check CHECK (((audio_iteration_ease >= 0) AND (audio_iteration_ease <= 10))),
    CONSTRAINT intensive_responses_has_audio_tracks_check CHECK ((has_audio_tracks = ANY (ARRAY['no'::text, 'yes'::text]))),
    CONSTRAINT intensive_responses_has_vision_board_check CHECK ((has_vision_board = ANY (ARRAY['no'::text, 'yes_physical'::text, 'yes_digital'::text, 'yes_both'::text]))),
    CONSTRAINT intensive_responses_journey_capturing_check CHECK (((journey_capturing >= 0) AND (journey_capturing <= 10))),
    CONSTRAINT intensive_responses_phase_check CHECK ((phase = ANY (ARRAY['pre_intensive'::text, 'post_intensive'::text, 'calibration_session'::text]))),
    CONSTRAINT intensive_responses_roadmap_clarity_check CHECK (((roadmap_clarity >= 0) AND (roadmap_clarity <= 10))),
    CONSTRAINT intensive_responses_sharing_preference_check CHECK ((sharing_preference = ANY (ARRAY['named'::text, 'anonymous'::text, 'none'::text]))),
    CONSTRAINT intensive_responses_transformation_tracking_check CHECK (((transformation_tracking >= 0) AND (transformation_tracking <= 10))),
    CONSTRAINT intensive_responses_vibrational_constraints_clarity_check CHECK (((vibrational_constraints_clarity >= 0) AND (vibrational_constraints_clarity <= 10))),
    CONSTRAINT intensive_responses_vibrational_harmony_check CHECK (((vibrational_harmony >= 0) AND (vibrational_harmony <= 10))),
    CONSTRAINT intensive_responses_vision_board_management_check CHECK (((vision_board_management >= 0) AND (vision_board_management <= 10))),
    CONSTRAINT intensive_responses_vision_clarity_check CHECK (((vision_clarity >= 0) AND (vision_clarity <= 10))),
    CONSTRAINT intensive_responses_vision_iteration_ease_check CHECK (((vision_iteration_ease >= 0) AND (vision_iteration_ease <= 10)))
);


--
-- Name: TABLE intensive_responses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.intensive_responses IS 'Unified table for Activation Intensive data: baseline intake, post-intensive unlock survey, and calibration call recordings/transcripts/soundbites';


--
-- Name: COLUMN intensive_responses.phase; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_responses.phase IS 'pre_intensive = initial intake, post_intensive = unlock survey, calibration_session = call data';


--
-- Name: COLUMN intensive_responses.calibration_segments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_responses.calibration_segments IS 'AI-extracted sections from calibration call mapped to testimonial script (hooks, struggles, victories, etc.) with timestamps';


--
-- Name: COLUMN intensive_responses.calibration_soundbites; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_responses.calibration_soundbites IS 'Best quotes with timestamps for video production and website testimonials. Filter by approved=true for public display.';


--
-- Name: COLUMN intensive_responses.metrics_comparison; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_responses.metrics_comparison IS 'Before/after metrics comparison for video overlays and testimonial cards';


--
-- Name: COLUMN intensive_responses.produced_video_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.intensive_responses.produced_video_url IS 'Final edited testimonial video from video production team';


--
-- Name: user_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_accounts (
    id uuid NOT NULL,
    email text NOT NULL,
    first_name text,
    last_name text,
    full_name text GENERATED ALWAYS AS (
CASE
    WHEN ((first_name IS NOT NULL) AND (last_name IS NOT NULL)) THEN ((first_name || ' '::text) || last_name)
    WHEN (first_name IS NOT NULL) THEN first_name
    WHEN (last_name IS NOT NULL) THEN last_name
    ELSE NULL::text
END) STORED,
    profile_picture_url text,
    phone text,
    sms_opt_in boolean DEFAULT false,
    sms_opt_in_date timestamp with time zone,
    sms_opt_in_ip text,
    role public.user_role DEFAULT 'member'::public.user_role NOT NULL,
    household_id uuid,
    is_household_admin boolean DEFAULT false,
    allow_shared_tokens boolean DEFAULT true,
    membership_tier_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_login_at timestamp with time zone,
    date_of_birth date
);


--
-- Name: TABLE user_accounts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_accounts IS 'Core user account data - identity, contact, role, membership';


--
-- Name: COLUMN user_accounts.sms_opt_in; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_accounts.sms_opt_in IS 'User has opted in to receive SMS messages';


--
-- Name: COLUMN user_accounts.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_accounts.role IS 'User role: member, coach, admin, super_admin';


--
-- Name: COLUMN user_accounts.date_of_birth; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_accounts.date_of_birth IS 'User date of birth - account-level demographic data';


--
-- Name: approved_testimonials; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.approved_testimonials AS
 SELECT ir.id AS response_id,
    ir.user_id,
    ir.intensive_id,
    ua.full_name,
    ua.first_name,
    ua.profile_picture_url,
    (s.value ->> 'id'::text) AS soundbite_id,
    (s.value ->> 'text'::text) AS quote,
    (s.value ->> 'type'::text) AS quote_type,
    (s.value -> 'metrics'::text) AS metrics,
    ((s.value ->> 'start'::text))::integer AS video_start,
    ((s.value ->> 'end'::text))::integer AS video_end,
    ((s.value ->> 'featured'::text))::boolean AS featured,
    ir.calibration_recording_url,
    ir.produced_video_url,
    ir.produced_video_thumbnail_url,
    ir.produced_video_duration_seconds,
    ir.metrics_comparison,
    ir.created_at
   FROM ((public.intensive_responses ir
     CROSS JOIN LATERAL jsonb_array_elements(ir.calibration_soundbites) s(value))
     JOIN public.user_accounts ua ON ((ir.user_id = ua.id)))
  WHERE ((ir.phase = 'calibration_session'::text) AND (((s.value ->> 'approved'::text))::boolean = true) AND (ir.sharing_preference = 'named'::text));


--
-- Name: VIEW approved_testimonials; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.approved_testimonials IS 'Pre-filtered view of approved soundbites for website testimonial sliders';


--
-- Name: assessment_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assessment_id uuid NOT NULL,
    category public.assessment_category NOT NULL,
    insight_type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    confidence_score numeric(3,2),
    supporting_responses jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT assessment_insights_confidence_score_check CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)))
);


--
-- Name: TABLE assessment_insights; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.assessment_insights IS 'VIVA-generated insights based on assessment responses';


--
-- Name: assessment_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assessment_id uuid NOT NULL,
    question_id text NOT NULL,
    question_text text NOT NULL,
    category public.assessment_category NOT NULL,
    response_value integer NOT NULL,
    response_text text NOT NULL,
    response_emoji text,
    green_line text NOT NULL,
    answered_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT assessment_responses_green_line_check CHECK ((green_line = ANY (ARRAY['above'::text, 'neutral'::text, 'below'::text])))
);


--
-- Name: TABLE assessment_responses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.assessment_responses IS 'Individual question responses for each assessment';


--
-- Name: COLUMN assessment_responses.response_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_responses.response_value IS 'Numerical value of the response (0 for custom responses, 2, 4, 6, 8, or 10 for regular responses)';


--
-- Name: COLUMN assessment_responses.green_line; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_responses.green_line IS 'Green Line classification of this specific response (above/neutral/below)';


--
-- Name: assessment_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    profile_version_id uuid,
    status public.assessment_status DEFAULT 'not_started'::public.assessment_status NOT NULL,
    total_score integer DEFAULT 0,
    max_possible_score integer DEFAULT 840,
    overall_percentage integer DEFAULT 0,
    category_scores jsonb DEFAULT '{}'::jsonb,
    green_line_status jsonb DEFAULT '{}'::jsonb,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assessment_version integer DEFAULT 1,
    notes text,
    is_active boolean DEFAULT false NOT NULL,
    is_draft boolean DEFAULT false NOT NULL,
    CONSTRAINT valid_scores CHECK (((total_score >= 0) AND (total_score <= max_possible_score)))
);


--
-- Name: TABLE assessment_results; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.assessment_results IS 'Stores vibrational assessment results across all 12 life categories';


--
-- Name: COLUMN assessment_results.category_scores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results.category_scores IS 'JSONB object with scores for each category (0-70 points each)';


--
-- Name: COLUMN assessment_results.green_line_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results.green_line_status IS 'JSONB object with Green Line status for each category (above/transition/below)';


--
-- Name: COLUMN assessment_results.assessment_version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results.assessment_version IS 'Version of assessment questions used (for tracking changes over time)';


--
-- Name: audio_background_tracks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_background_tracks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    category text NOT NULL,
    file_url text NOT NULL,
    duration_seconds integer,
    description text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    frequency_hz integer,
    brainwave_hz numeric(5,2)
);


--
-- Name: TABLE audio_background_tracks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audio_background_tracks IS 'Available background audio tracks for mixing with voice recordings';


--
-- Name: COLUMN audio_background_tracks.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_background_tracks.category IS 'Category for organizing tracks: nature, ambient, music, etc.';


--
-- Name: COLUMN audio_background_tracks.file_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_background_tracks.file_url IS 'Full URL to the audio file in S3';


--
-- Name: audio_generation_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_generation_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vision_id uuid,
    audio_set_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    variant_ids text[] NOT NULL,
    voice_id text NOT NULL,
    sections_requested jsonb NOT NULL,
    total_tracks_expected integer NOT NULL,
    tracks_completed integer DEFAULT 0 NOT NULL,
    tracks_failed integer DEFAULT 0 NOT NULL,
    tracks_pending integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    content_type text DEFAULT 'life_vision'::text,
    content_id uuid,
    CONSTRAINT audio_generation_batches_content_type_check CHECK ((content_type = ANY (ARRAY['life_vision'::text, 'focus_story'::text, 'story'::text, 'affirmation'::text, 'visualization'::text, 'journal'::text, 'custom'::text]))),
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'partial_success'::text, 'failed'::text]))),
    CONSTRAINT valid_track_counts CHECK (((tracks_completed >= 0) AND (tracks_failed >= 0) AND (tracks_pending >= 0) AND (((tracks_completed + tracks_failed) + tracks_pending) <= total_tracks_expected)))
);


--
-- Name: TABLE audio_generation_batches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audio_generation_batches IS 'Tracks audio generation requests for full observability and retry logic';


--
-- Name: COLUMN audio_generation_batches.audio_set_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_generation_batches.audio_set_ids IS 'Array of audio_sets.id created in this batch';


--
-- Name: COLUMN audio_generation_batches.variant_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_generation_batches.variant_ids IS 'Audio variants requested (standard, sleep, meditation, energy)';


--
-- Name: COLUMN audio_generation_batches.sections_requested; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_generation_batches.sections_requested IS 'Array of {sectionKey, text} pairs that were requested for generation';


--
-- Name: COLUMN audio_generation_batches.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_generation_batches.status IS 'pending: created, not started | processing: in progress | completed: all succeeded | partial_success: some failed | failed: all failed';


--
-- Name: COLUMN audio_generation_batches.content_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_generation_batches.content_type IS 'Type of content being generated';


--
-- Name: COLUMN audio_generation_batches.content_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_generation_batches.content_id IS 'Generic reference to source content';


--
-- Name: audio_mix_ratios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_mix_ratios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    voice_volume integer NOT NULL,
    bg_volume integer NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    icon text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audio_mix_ratios_bg_volume_check CHECK (((bg_volume >= 0) AND (bg_volume <= 100))),
    CONSTRAINT audio_mix_ratios_voice_volume_check CHECK (((voice_volume >= 0) AND (voice_volume <= 100))),
    CONSTRAINT mix_ratios_total_100 CHECK (((voice_volume + bg_volume) = 100))
);


--
-- Name: TABLE audio_mix_ratios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audio_mix_ratios IS 'Preset mix ratios for voice/background volume levels';


--
-- Name: COLUMN audio_mix_ratios.voice_volume; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_mix_ratios.voice_volume IS 'Voice volume percentage (0-100)';


--
-- Name: COLUMN audio_mix_ratios.bg_volume; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_mix_ratios.bg_volume IS 'Background volume percentage (0-100)';


--
-- Name: COLUMN audio_mix_ratios.icon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_mix_ratios.icon IS 'Optional icon identifier for UI display';


--
-- Name: audio_recommended_combos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_recommended_combos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    background_track_id uuid NOT NULL,
    mix_ratio_id uuid NOT NULL,
    binaural_track_id uuid,
    binaural_volume integer DEFAULT 0,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audio_recommended_combos_binaural_volume_check CHECK (((binaural_volume >= 0) AND (binaural_volume <= 30)))
);


--
-- Name: TABLE audio_recommended_combos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audio_recommended_combos IS 'Curated preset combinations of background tracks, mix ratios, and optional binaural enhancements';


--
-- Name: COLUMN audio_recommended_combos.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_recommended_combos.name IS 'Display name for the combo (e.g., "Deep Sleep Journey", "Focus Session")';


--
-- Name: COLUMN audio_recommended_combos.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_recommended_combos.description IS 'Optional description explaining why this combo works well';


--
-- Name: COLUMN audio_recommended_combos.background_track_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_recommended_combos.background_track_id IS 'Reference to the background track';


--
-- Name: COLUMN audio_recommended_combos.mix_ratio_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_recommended_combos.mix_ratio_id IS 'Reference to the mix ratio';


--
-- Name: COLUMN audio_recommended_combos.binaural_track_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_recommended_combos.binaural_track_id IS 'Optional reference to a binaural/solfeggio track';


--
-- Name: COLUMN audio_recommended_combos.binaural_volume; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_recommended_combos.binaural_volume IS 'Volume percentage for binaural track (0-30)';


--
-- Name: audio_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vision_id uuid,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    variant text,
    voice_id text NOT NULL,
    is_active boolean DEFAULT true,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    content_type text DEFAULT 'life_vision'::text,
    content_id uuid,
    CONSTRAINT audio_sets_content_type_check CHECK ((content_type = ANY (ARRAY['life_vision'::text, 'focus_story'::text, 'story'::text, 'affirmation'::text, 'visualization'::text, 'journal'::text, 'custom'::text])))
);


--
-- Name: TABLE audio_sets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audio_sets IS 'Audio version sets for life visions - allows multiple audio variants per vision';


--
-- Name: COLUMN audio_sets.variant; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_sets.variant IS 'Type of audio variant (standard, sleep, energy, meditation, etc.)';


--
-- Name: COLUMN audio_sets.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_sets.metadata IS 'Additional metadata like background music, tempo, fade effects, etc.';


--
-- Name: COLUMN audio_sets.content_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_sets.content_type IS 'Type of content: life_vision, focus_story, affirmation, visualization, journal, custom';


--
-- Name: COLUMN audio_sets.content_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_sets.content_id IS 'Generic reference to source content (vision_focus.id, affirmation.id, etc.)';


--
-- Name: audio_tracks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_tracks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vision_id uuid,
    section_key text NOT NULL,
    content_hash text NOT NULL,
    text_content text NOT NULL,
    voice_id text NOT NULL,
    s3_bucket text NOT NULL,
    s3_key text NOT NULL,
    audio_url text NOT NULL,
    duration_seconds integer,
    status public.audio_generation_status DEFAULT 'pending'::public.audio_generation_status NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    audio_set_id uuid NOT NULL,
    mix_status text DEFAULT 'not_required'::text,
    mixed_audio_url text,
    mixed_s3_key text,
    play_count integer DEFAULT 0 NOT NULL,
    content_type text DEFAULT 'life_vision'::text,
    CONSTRAINT audio_tracks_content_type_check CHECK ((content_type = ANY (ARRAY['life_vision'::text, 'focus_story'::text, 'story'::text, 'affirmation'::text, 'visualization'::text, 'journal'::text, 'custom'::text]))),
    CONSTRAINT audio_tracks_mix_status_check CHECK ((mix_status = ANY (ARRAY['not_required'::text, 'pending'::text, 'mixing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: TABLE audio_tracks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audio_tracks IS 'AI-narrated audio tracks for life visions (per section)';


--
-- Name: COLUMN audio_tracks.section_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_tracks.section_key IS 'Section identity (2 meta + 12 categories)';


--
-- Name: COLUMN audio_tracks.content_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_tracks.content_hash IS 'SHA-256 of normalized text content for regeneration control';


--
-- Name: COLUMN audio_tracks.audio_set_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_tracks.audio_set_id IS 'References the audio_set this track belongs to';


--
-- Name: COLUMN audio_tracks.mix_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_tracks.mix_status IS 'Status of background mixing: not_required, pending, mixing, completed, failed';


--
-- Name: COLUMN audio_tracks.play_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_tracks.play_count IS 'Number of times this track was played to 80%+ completion';


--
-- Name: COLUMN audio_tracks.content_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audio_tracks.content_type IS 'Type of content this track belongs to';


--
-- Name: audio_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_variants (
    id text NOT NULL,
    name text NOT NULL,
    voice_volume integer DEFAULT 50 NOT NULL,
    bg_volume integer DEFAULT 50 NOT NULL,
    background_track text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audio_variants_check CHECK (((voice_volume + bg_volume) = 100))
);


--
-- Name: audio_voice_clones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_voice_clones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    elevenlabs_voice_id text NOT NULL,
    voice_name text NOT NULL,
    sample_audio_url text,
    sample_duration_seconds integer,
    provider text DEFAULT 'elevenlabs'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_used_at timestamp with time zone
);


--
-- Name: TABLE audio_voice_clones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audio_voice_clones IS 'Stores user voice clones from ElevenLabs for personalized TTS generation';


--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    event_name text NOT NULL,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    channel text NOT NULL,
    template_id uuid NOT NULL,
    delay_minutes integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'paused'::text NOT NULL,
    total_sent integer DEFAULT 0 NOT NULL,
    last_sent_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT automation_rules_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'sms'::text]))),
    CONSTRAINT automation_rules_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'archived'::text])))
);


--
-- Name: TABLE automation_rules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.automation_rules IS 'Single-fire automation rules: one event triggers one template send';


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid,
    user_id uuid,
    event_type text NOT NULL,
    title text,
    description text,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 45 NOT NULL,
    timezone text DEFAULT 'America/New_York'::text,
    meeting_type text DEFAULT 'video'::text NOT NULL,
    location text,
    video_session_id uuid,
    contact_name text,
    contact_email text,
    contact_phone text,
    status text DEFAULT 'confirmed'::text NOT NULL,
    cancelled_at timestamp with time zone,
    cancelled_by uuid,
    cancellation_reason text,
    staff_notes text,
    client_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bookings_meeting_type_check CHECK ((meeting_type = ANY (ARRAY['video'::text, 'phone'::text, 'in_person'::text]))),
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text])))
);


--
-- Name: TABLE bookings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.bookings IS '1:1 appointment bookings from clients/users. Auto-creates calendar_event.';


--
-- Name: COLUMN bookings.event_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bookings.event_type IS 'Type of booking: intensive_calibration, coaching_1on1, sales_call, etc.';


--
-- Name: COLUMN bookings.meeting_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bookings.meeting_type IS 'How the meeting happens: video, phone, or in_person';


--
-- Name: COLUMN bookings.video_session_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bookings.video_session_id IS 'Links to Daily.co video session if meeting_type is video';


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid,
    user_id uuid,
    title text NOT NULL,
    description text,
    location text,
    event_source text DEFAULT 'manual'::text NOT NULL,
    event_category text DEFAULT 'personal'::text NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    all_day boolean DEFAULT false NOT NULL,
    timezone text DEFAULT 'America/New_York'::text,
    is_recurring boolean DEFAULT false,
    recurrence_rule text,
    recurrence_parent_id uuid,
    blocks_availability boolean DEFAULT true NOT NULL,
    booking_id uuid,
    video_session_id uuid,
    is_private boolean DEFAULT false,
    color text,
    status text DEFAULT 'confirmed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT calendar_events_category_check CHECK ((event_category = ANY (ARRAY['client_call'::text, 'internal'::text, 'speaking'::text, 'travel'::text, 'conference'::text, 'personal'::text, 'blocked'::text, 'focus'::text, 'other'::text]))),
    CONSTRAINT calendar_events_source_check CHECK ((event_source = ANY (ARRAY['booking'::text, 'manual'::text, 'travel'::text, 'external_sync'::text, 'system'::text]))),
    CONSTRAINT calendar_events_status_check CHECK ((status = ANY (ARRAY['tentative'::text, 'confirmed'::text, 'cancelled'::text])))
);


--
-- Name: TABLE calendar_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.calendar_events IS 'All calendar events - client calls (from bookings), personal, travel, speaking, blocked time. Blocks availability when blocks_availability=true.';


--
-- Name: COLUMN calendar_events.event_source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calendar_events.event_source IS 'Where event came from: booking (auto-created), manual, travel, external_sync';


--
-- Name: COLUMN calendar_events.event_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calendar_events.event_category IS 'Category for display: client_call, speaking, travel, personal, blocked, focus';


--
-- Name: COLUMN calendar_events.blocks_availability; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.calendar_events.blocks_availability IS 'If true, this event blocks booking availability for this staff member';


--
-- Name: cart_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visitor_id uuid,
    session_id uuid,
    user_id uuid,
    email text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    promo_code text,
    referral_source text,
    campaign_name text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    status text DEFAULT 'active'::text NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cart_sessions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'checkout_started'::text, 'completed'::text, 'abandoned'::text, 'expired'::text])))
);


--
-- Name: TABLE cart_sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.cart_sessions IS 'Cart-based checkout sessions. UUID used directly in checkout URLs and abandoned cart recovery emails.';


--
-- Name: conversation_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    mode text DEFAULT 'master'::text,
    preview_message text,
    message_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_message_at timestamp with time zone,
    category text,
    vision_id uuid,
    cached_system_prompt text
);


--
-- Name: TABLE conversation_sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.conversation_sessions IS 'Groups messages into conversations with metadata';


--
-- Name: COLUMN conversation_sessions.mode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation_sessions.mode IS 'Type of conversation: master, refinement, vision_build, etc.';


--
-- Name: COLUMN conversation_sessions.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation_sessions.category IS 'The vision category this conversation is about';


--
-- Name: COLUMN conversation_sessions.vision_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation_sessions.vision_id IS 'The vision this conversation is refining';


--
-- Name: COLUMN conversation_sessions.cached_system_prompt; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation_sessions.cached_system_prompt IS 'Cached system prompt built once at session start. Contains profile, assessment, vision context. Prevents wasteful rebuilding on every message.';


--
-- Name: coupon_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    code text NOT NULL,
    batch_id text,
    max_redemptions integer,
    redemption_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coupon_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    coupon_code_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid,
    subscription_id uuid,
    discount_amount integer NOT NULL,
    original_amount integer NOT NULL,
    product_key text,
    redeemed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    discount_type text DEFAULT 'percent'::text NOT NULL,
    discount_value integer NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    min_purchase_amount integer,
    max_discount_amount integer,
    eligible_products text[],
    eligible_tiers text[],
    max_redemptions integer,
    max_redemptions_per_user integer DEFAULT 1 NOT NULL,
    valid_from timestamp with time zone,
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    campaign_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['percent'::text, 'fixed'::text]))),
    CONSTRAINT coupons_discount_value_positive CHECK ((discount_value > 0)),
    CONSTRAINT coupons_percent_max CHECK (((discount_type <> 'percent'::text) OR (discount_value <= 100)))
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    visitor_id uuid,
    stripe_customer_id text,
    lead_id uuid,
    first_utm_source text,
    first_utm_medium text,
    first_utm_campaign text,
    first_utm_content text,
    first_utm_term text,
    first_gclid text,
    first_fbclid text,
    first_landing_page text,
    first_referrer text,
    first_url_params jsonb DEFAULT '{}'::jsonb,
    first_seen_at timestamp with time zone,
    email_captured_at timestamp with time zone,
    first_purchase_at timestamp with time zone,
    last_purchase_at timestamp with time zone,
    last_active_at timestamp with time zone,
    status text DEFAULT 'customer'::text NOT NULL,
    total_orders integer DEFAULT 0 NOT NULL,
    total_spent integer DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customers_status_check CHECK ((status = ANY (ARRAY['visitor'::text, 'lead'::text, 'customer'::text, 'active_subscriber'::text, 'churned'::text])))
);


--
-- Name: TABLE customers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.customers IS 'Single Source of Truth for the customer journey. 1:1 with auth.users. Attribution waterfalled from visitors on account creation.';


--
-- Name: daily_papers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_papers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    entry_date date NOT NULL,
    gratitude text DEFAULT ''::text NOT NULL,
    task_one text DEFAULT ''::text NOT NULL,
    task_two text DEFAULT ''::text NOT NULL,
    task_three text DEFAULT ''::text NOT NULL,
    fun_plan text DEFAULT ''::text NOT NULL,
    attachment_url text,
    attachment_key text,
    attachment_content_type text,
    attachment_size bigint,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    guest_email text,
    from_email text NOT NULL,
    to_email text NOT NULL,
    cc_emails text[],
    bcc_emails text[],
    subject text NOT NULL,
    body_text text,
    body_html text,
    direction text NOT NULL,
    status text DEFAULT 'sent'::text,
    ses_message_id text,
    imap_message_id text,
    imap_uid integer,
    is_reply boolean DEFAULT false,
    reply_to_message_id uuid,
    thread_id text,
    has_attachments boolean DEFAULT false,
    attachment_urls text[],
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    opened_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT email_messages_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
    CONSTRAINT email_messages_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'delivered'::text, 'failed'::text, 'bounced'::text, 'opened'::text, 'received'::text])))
);


--
-- Name: TABLE email_messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.email_messages IS 'Stores all email communications (outbound via SES, inbound via IMAP from Google Workspace)';


--
-- Name: COLUMN email_messages.guest_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_messages.guest_email IS 'Email address for non-registered users (for guest support tickets)';


--
-- Name: COLUMN email_messages.ses_message_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_messages.ses_message_id IS 'AWS SES Message ID for tracking';


--
-- Name: COLUMN email_messages.imap_message_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_messages.imap_message_id IS 'IMAP Message-ID header for deduplication';


--
-- Name: COLUMN email_messages.imap_uid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_messages.imap_uid IS 'IMAP UID for tracking';


--
-- Name: COLUMN email_messages.is_reply; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_messages.is_reply IS 'Whether this email is a reply to a support ticket';


--
-- Name: COLUMN email_messages.sent_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_messages.sent_at IS 'Original sent date from email headers';


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    category public.template_category DEFAULT 'other'::public.template_category NOT NULL,
    status public.template_status DEFAULT 'draft'::public.template_status NOT NULL,
    subject text NOT NULL,
    html_body text NOT NULL,
    text_body text,
    variables jsonb DEFAULT '[]'::jsonb,
    triggers jsonb DEFAULT '[]'::jsonb,
    last_sent_at timestamp with time zone,
    total_sent integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE email_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.email_templates IS 'Database-driven email templates with variable support';


--
-- Name: COLUMN email_templates.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_templates.slug IS 'Unique identifier used in code to reference template';


--
-- Name: COLUMN email_templates.variables; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_templates.variables IS 'JSON array of variable names like ["userName", "link"]';


--
-- Name: emotional_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emotional_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    current_valence text NOT NULL,
    trending_direction text NOT NULL,
    avg_intensity numeric,
    dominant_essence_words text[] DEFAULT ARRAY[]::text[],
    primary_essence text,
    last_event_at timestamp with time zone,
    event_count_7d integer DEFAULT 0,
    event_count_30d integer DEFAULT 0,
    last_scene_id uuid,
    last_vision_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT emotional_snapshots_current_valence_check CHECK ((current_valence = ANY (ARRAY['below_green_line'::text, 'near_green_line'::text, 'above_green_line'::text]))),
    CONSTRAINT emotional_snapshots_trending_direction_check CHECK ((trending_direction = ANY (ARRAY['up'::text, 'down'::text, 'stable'::text])))
);


--
-- Name: frequency_flip; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frequency_flip (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    input_text text NOT NULL,
    clarity_seed text NOT NULL,
    essence text,
    sensory_anchor text,
    embodiment_line text,
    surrender_line text,
    category text,
    vision_id uuid,
    scene_context text,
    mode text DEFAULT 'flip'::text NOT NULL,
    unchanged boolean DEFAULT false,
    voice_notes jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE frequency_flip; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.frequency_flip IS 'Stores flipped clarity seeds from frequency_flip microprompt';


--
-- Name: COLUMN frequency_flip.input_text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.frequency_flip.input_text IS 'Original contrast/lack language from user';


--
-- Name: COLUMN frequency_flip.clarity_seed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.frequency_flip.clarity_seed IS 'Flipped present-tense, first-person, positive ideal-state phrase';


--
-- Name: COLUMN frequency_flip.essence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.frequency_flip.essence IS 'One word or short phrase capturing the essence (e.g., Freedom, Ease, Joy)';


--
-- Name: COLUMN frequency_flip.sensory_anchor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.frequency_flip.sensory_anchor IS 'Optional single concrete detail in user voice';


--
-- Name: COLUMN frequency_flip.embodiment_line; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.frequency_flip.embodiment_line IS 'Optional "I live it now" line in user voice';


--
-- Name: COLUMN frequency_flip.surrender_line; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.frequency_flip.surrender_line IS 'Optional grounded thank-you/allowing line';


--
-- Name: COLUMN frequency_flip.mode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.frequency_flip.mode IS 'Mode used: flip, flip+enrich, or batch';


--
-- Name: COLUMN frequency_flip.unchanged; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.frequency_flip.unchanged IS 'True if input was already aligned (no flip needed)';


--
-- Name: generated_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    image_url text NOT NULL,
    s3_key text NOT NULL,
    file_name text NOT NULL,
    file_size integer,
    mime_type text DEFAULT 'image/png'::text,
    prompt text NOT NULL,
    revised_prompt text,
    style_used text,
    size text DEFAULT '1024x1024'::text,
    quality text DEFAULT 'standard'::text,
    context text DEFAULT 'vision_board'::text,
    generated_at timestamp with time zone DEFAULT now(),
    used_at timestamp with time zone,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
    is_used boolean DEFAULT false,
    is_expired boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: household_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.household_invitations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    household_id uuid NOT NULL,
    invited_email text NOT NULL,
    invited_by uuid NOT NULL,
    invitation_token text NOT NULL,
    status text DEFAULT 'pending'::text,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT household_invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'canceled'::text])))
);


--
-- Name: TABLE household_invitations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.household_invitations IS 'Pending invitations to join a household';


--
-- Name: household_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.household_members (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    household_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text,
    allow_shared_tokens boolean DEFAULT true,
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    status text DEFAULT 'active'::text,
    joined_at timestamp with time zone DEFAULT now(),
    removed_at timestamp with time zone,
    CONSTRAINT household_members_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text]))),
    CONSTRAINT household_members_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'removed'::text])))
);


--
-- Name: TABLE household_members; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.household_members IS 'Tracks household membership with simplified RLS policies to avoid circular references';


--
-- Name: households; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.households (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text DEFAULT 'My Household'::text NOT NULL,
    admin_user_id uuid NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    subscription_status text DEFAULT 'active'::text,
    plan_type text DEFAULT 'household'::text,
    max_members integer DEFAULT 6,
    shared_tokens_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT households_plan_type_check CHECK ((plan_type = ANY (ARRAY['solo'::text, 'household'::text]))),
    CONSTRAINT households_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['active'::text, 'canceled'::text, 'past_due'::text, 'trialing'::text, 'incomplete'::text])))
);


--
-- Name: TABLE households; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.households IS 'Household subscription units - either solo (1 user) or household (multiple users)';


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    title text,
    content text NOT NULL,
    categories text[],
    image_urls text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    audio_recordings jsonb DEFAULT '[]'::jsonb NOT NULL,
    thumbnail_urls jsonb DEFAULT '[]'::jsonb
);


--
-- Name: COLUMN journal_entries.audio_recordings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.journal_entries.audio_recordings IS 'Array of audio/video recordings with metadata: [{ url, transcript, type, category, created_at }]';


--
-- Name: COLUMN journal_entries.thumbnail_urls; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.journal_entries.thumbnail_urls IS 'Array of thumbnail URLs for videos in the entry';


--
-- Name: journey_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journey_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visitor_id uuid,
    session_id uuid,
    user_id uuid,
    lead_id uuid,
    cart_session_id uuid,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT journey_events_event_type_check CHECK ((event_type = ANY (ARRAY['email_captured'::text, 'cart_created'::text, 'checkout_started'::text, 'purchase_completed'::text])))
);


--
-- Name: TABLE journey_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.journey_events IS 'Key milestones in the customer journey funnel.';


--
-- Name: lead_tracking_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_tracking_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    lead_id uuid,
    user_id uuid,
    event_type text NOT NULL,
    event_data jsonb,
    page_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'new'::text,
    first_name text,
    last_name text,
    email text NOT NULL,
    phone text,
    company text,
    message text,
    source text,
    metadata jsonb,
    campaign_id uuid,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    referrer text,
    landing_page text,
    session_id uuid,
    video_engagement jsonb,
    pages_visited text[],
    time_on_site integer,
    assigned_to uuid,
    converted_to_user_id uuid,
    conversion_value numeric(10,2),
    notes text,
    sms_opt_in boolean DEFAULT false,
    sms_consent_date timestamp with time zone,
    sms_opt_out_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    visitor_id uuid,
    CONSTRAINT leads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'converted'::text, 'lost'::text]))),
    CONSTRAINT leads_type_check CHECK ((type = ANY (ARRAY['contact'::text, 'demo'::text, 'intensive_intake'::text])))
);


--
-- Name: marketing_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketing_campaigns (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'draft'::text,
    campaign_type text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    objective text,
    target_audience text,
    start_date date,
    end_date date,
    budget numeric(10,2),
    cost_per_lead_target numeric(10,2),
    notes text,
    creative_urls text[],
    landing_page_url text,
    tracking_url text,
    total_clicks integer DEFAULT 0,
    total_leads integer DEFAULT 0,
    total_conversions integer DEFAULT 0,
    total_spent numeric(10,2) DEFAULT 0,
    calculated_cpl numeric(10,2),
    calculated_roi numeric(10,4),
    revenue_generated numeric(10,2) DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT marketing_campaigns_campaign_type_check CHECK ((campaign_type = ANY (ARRAY['paid_ad'::text, 'email'::text, 'social_organic'::text, 'video'::text, 'partnership'::text, 'other'::text]))),
    CONSTRAINT marketing_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'archived'::text])))
);


--
-- Name: media_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_metadata (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    bucket text NOT NULL,
    storage_path text NOT NULL,
    public_url text NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    file_size bigint NOT NULL,
    mime_type text,
    folder text,
    category text,
    tags text[],
    title text,
    description text,
    alt_text text,
    view_count integer DEFAULT 0,
    last_accessed timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT media_metadata_file_type_check CHECK ((file_type = ANY (ARRAY['image'::text, 'audio'::text, 'video'::text]))),
    CONSTRAINT valid_user_or_site_content CHECK (((user_id IS NOT NULL) OR (bucket = ANY (ARRAY['site-assets'::text, 'immersion-tracks'::text, 'tutorial-videos'::text, 'default-images'::text]))))
);


--
-- Name: message_send_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_send_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_type text NOT NULL,
    template_slug text,
    template_id uuid,
    recipient_email text,
    recipient_phone text,
    recipient_name text,
    recipient_user_id uuid,
    related_entity_type text,
    related_entity_id uuid,
    subject text,
    status text NOT NULL,
    external_message_id text,
    error_message text,
    sent_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT message_send_log_message_type_check CHECK ((message_type = ANY (ARRAY['email'::text, 'sms'::text])))
);


--
-- Name: TABLE message_send_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.message_send_log IS 'Audit log of all sent messages';


--
-- Name: messaging_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messaging_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    channel text NOT NULL,
    template_id uuid NOT NULL,
    audience_filter jsonb DEFAULT '{}'::jsonb NOT NULL,
    audience_count integer DEFAULT 0 NOT NULL,
    scheduled_for timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messaging_campaigns_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'sms'::text]))),
    CONSTRAINT messaging_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'cancelled'::text])))
);


--
-- Name: TABLE messaging_campaigns; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.messaging_campaigns IS 'One-time or scheduled bulk email/SMS sends with audience filtering';


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    price_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    is_subscription boolean DEFAULT false NOT NULL,
    subscription_id uuid,
    intensive_purchase_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    stripe_payment_intent_id text,
    stripe_checkout_session_id text,
    payment_plan text DEFAULT 'full'::text,
    installments_total integer DEFAULT 1,
    installments_paid integer DEFAULT 0,
    next_installment_date timestamp without time zone,
    completion_status text DEFAULT 'pending'::text,
    activation_deadline timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    refunded_at timestamp without time zone,
    promo_code text,
    referral_source text,
    campaign_name text,
    CONSTRAINT order_items_valid_completion_status CHECK (((completion_status IS NULL) OR (completion_status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'refunded'::text])))),
    CONSTRAINT order_items_valid_payment_plan CHECK (((payment_plan IS NULL) OR (payment_plan = ANY (ARRAY['full'::text, '2pay'::text, '3pay'::text]))))
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_checkout_session_id text,
    stripe_payment_intent_id text,
    total_amount integer NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    promo_code text,
    referral_source text,
    campaign_name text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id uuid,
    cart_session_id uuid,
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'canceled'::text, 'refunded'::text, 'failed'::text])))
);


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    visitor_id uuid NOT NULL,
    page_path text NOT NULL,
    page_title text,
    view_order integer DEFAULT 0 NOT NULL,
    time_on_page_seconds integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE page_views; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.page_views IS 'Every page viewed, per session.';


--
-- Name: payment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subscription_id uuid,
    stripe_payment_intent_id text,
    stripe_invoice_id text,
    amount integer NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    status text NOT NULL,
    description text,
    metadata jsonb,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE payment_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payment_history IS 'Records all payment transactions';


--
-- Name: product_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    stripe_price_id text,
    currency text DEFAULT 'usd'::text NOT NULL,
    unit_amount integer NOT NULL,
    interval_unit text,
    interval_count integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_prices_interval_check CHECK (((interval_unit IS NULL) OR (interval_unit = ANY (ARRAY['day'::text, 'week'::text, 'month'::text, 'year'::text]))))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    product_type text DEFAULT 'other'::text NOT NULL,
    is_subscription boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_product_type_check CHECK ((product_type = ANY (ARRAY['membership'::text, 'intensive'::text, 'storage'::text, 'tokens'::text, 'coaching'::text, 'addon'::text, 'other'::text])))
);


--
-- Name: refinements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refinements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vision_id uuid,
    category character varying(50) NOT NULL,
    operation_type character varying(50) NOT NULL,
    input_text text,
    output_text text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    viva_notes text,
    migrated_to_v3 boolean DEFAULT false
);


--
-- Name: TABLE refinements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.refinements IS 'LEGACY: Old vibe-assistant operations. V3 data moved to life_vision_category_state. Cleaned 2025-11-11 (removed 16 deprecated columns)';


--
-- Name: COLUMN refinements.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.refinements.category IS 'Life category being refined: health, money, family, etc.';


--
-- Name: COLUMN refinements.operation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.refinements.operation_type IS 'Type of operation: refine_vision, generate_guidance, analyze_alignment';


--
-- Name: COLUMN refinements.viva_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.refinements.viva_notes IS 'VIVA Notes: AI explanation of refinement reasoning and approach';


--
-- Name: COLUMN refinements.migrated_to_v3; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.refinements.migrated_to_v3 IS 'TRUE if this row was migrated to life_vision_category_state';


--
-- Name: scenes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scenes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    text text NOT NULL,
    essence_word text,
    emotional_valence text NOT NULL,
    created_from text NOT NULL,
    related_vision_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scenes_created_from_check CHECK ((created_from = ANY (ARRAY['ai_suggested'::text, 'user_written'::text, 'hybrid'::text]))),
    CONSTRAINT scenes_emotional_valence_check CHECK ((emotional_valence = ANY (ARRAY['below_green_line'::text, 'near_green_line'::text, 'above_green_line'::text])))
);


--
-- Name: scheduled_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_type text NOT NULL,
    email_template_id uuid,
    sms_template_id uuid,
    recipient_email text,
    recipient_phone text,
    recipient_name text,
    recipient_user_id uuid,
    related_entity_type text,
    related_entity_id uuid,
    subject text,
    body text NOT NULL,
    text_body text,
    scheduled_for timestamp with time zone NOT NULL,
    status public.scheduled_message_status DEFAULT 'pending'::public.scheduled_message_status NOT NULL,
    sent_at timestamp with time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT scheduled_messages_message_type_check CHECK ((message_type = ANY (ARRAY['email'::text, 'sms'::text])))
);


--
-- Name: TABLE scheduled_messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.scheduled_messages IS 'Queue for scheduled email and SMS messages';


--
-- Name: COLUMN scheduled_messages.scheduled_for; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scheduled_messages.scheduled_for IS 'When this message should be sent';


--
-- Name: sequence_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sequence_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sequence_id uuid NOT NULL,
    user_id uuid,
    email text,
    phone text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    current_step_order integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    next_step_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancel_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sequence_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text, 'paused'::text])))
);


--
-- Name: TABLE sequence_enrollments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sequence_enrollments IS 'Tracks each user/lead progress through a drip sequence';


--
-- Name: sequence_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sequence_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sequence_id uuid NOT NULL,
    step_order integer NOT NULL,
    channel text NOT NULL,
    template_id uuid NOT NULL,
    delay_minutes integer DEFAULT 0 NOT NULL,
    delay_from text DEFAULT 'previous_step'::text NOT NULL,
    subject_override text,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    total_sent integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sequence_steps_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'sms'::text]))),
    CONSTRAINT sequence_steps_delay_from_check CHECK ((delay_from = ANY (ARRAY['enrollment'::text, 'previous_step'::text]))),
    CONSTRAINT sequence_steps_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text])))
);


--
-- Name: TABLE sequence_steps; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sequence_steps IS 'Ordered steps within a drip sequence, each linking to a template';


--
-- Name: sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    trigger_event text NOT NULL,
    trigger_conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    exit_events jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'paused'::text NOT NULL,
    total_enrolled integer DEFAULT 0 NOT NULL,
    total_completed integer DEFAULT 0 NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sequences_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'archived'::text])))
);


--
-- Name: TABLE sequences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sequences IS 'Multi-step drip sequence containers with trigger and exit events';


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visitor_id uuid NOT NULL,
    landing_page text,
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    gclid text,
    fbclid text,
    msclkid text,
    ttclid text,
    li_fat_id text,
    gbraid text,
    wbraid text,
    url_params jsonb DEFAULT '{}'::jsonb,
    device_type text,
    browser text,
    os text,
    pageview_count integer DEFAULT 0 NOT NULL,
    converted boolean DEFAULT false NOT NULL,
    conversion_type text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    last_activity_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sessions IS 'Individual visit sessions with per-session attribution data.';


--
-- Name: sms_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    lead_id uuid,
    ticket_id uuid,
    user_id uuid,
    direction text NOT NULL,
    from_number text NOT NULL,
    to_number text NOT NULL,
    body text NOT NULL,
    media_urls text[],
    status text DEFAULT 'queued'::text,
    error_message text,
    twilio_sid text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sms_messages_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
    CONSTRAINT sms_messages_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'sent'::text, 'delivered'::text, 'failed'::text, 'received'::text])))
);


--
-- Name: sms_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    category public.template_category DEFAULT 'other'::public.template_category NOT NULL,
    status public.template_status DEFAULT 'draft'::public.template_status NOT NULL,
    body text NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb,
    triggers jsonb DEFAULT '[]'::jsonb,
    last_sent_at timestamp with time zone,
    total_sent integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE sms_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sms_templates IS 'Database-driven SMS templates with variable support';


--
-- Name: staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    display_name text NOT NULL,
    email text,
    phone text,
    avatar_url text,
    bio text,
    event_types text[] DEFAULT '{}'::text[] NOT NULL,
    default_buffer_minutes integer DEFAULT 15 NOT NULL,
    timezone text DEFAULT 'America/New_York'::text NOT NULL,
    hourly_rate numeric(10,2),
    department text,
    manager_id uuid,
    internal_notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    availability jsonb DEFAULT '{"friday": {"end": "17:00", "start": "09:00", "enabled": true}, "monday": {"end": "17:00", "start": "09:00", "enabled": true}, "sunday": {"end": "14:00", "start": "10:00", "enabled": false}, "tuesday": {"end": "17:00", "start": "09:00", "enabled": true}, "saturday": {"end": "14:00", "start": "10:00", "enabled": false}, "thursday": {"end": "17:00", "start": "09:00", "enabled": true}, "wednesday": {"end": "17:00", "start": "09:00", "enabled": true}}'::jsonb NOT NULL
);


--
-- Name: TABLE staff; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.staff IS 'Team members (coaches, admins, contractors) - used for scheduling, CRM, support, and more';


--
-- Name: stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    title text,
    content text,
    word_count integer,
    source text DEFAULT 'ai_generated'::text NOT NULL,
    audio_set_id uuid,
    user_audio_url text,
    user_audio_duration_seconds integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    error_message text,
    generation_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    display_order integer DEFAULT 0,
    CONSTRAINT stories_entity_type_check CHECK ((entity_type = ANY (ARRAY['life_vision'::text, 'vision_board_item'::text, 'goal'::text, 'schedule_block'::text, 'journal_entry'::text, 'custom'::text]))),
    CONSTRAINT stories_source_check CHECK ((source = ANY (ARRAY['ai_generated'::text, 'user_written'::text, 'ai_assisted'::text]))),
    CONSTRAINT stories_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'generating'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: TABLE stories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.stories IS 'Polymorphic stories attached to entities. Entity provides context (name, description, categories).';


--
-- Name: COLUMN stories.entity_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stories.entity_type IS 'Type of entity: life_vision, vision_board_item, goal, schedule_block, journal_entry, custom';


--
-- Name: COLUMN stories.entity_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stories.entity_id IS 'UUID of the entity (vision_board_items.id, vision_versions.id, etc.)';


--
-- Name: COLUMN stories.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stories.title IS 'Optional title - can override or supplement the entity name';


--
-- Name: COLUMN stories.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stories.source IS 'How content was created: ai_generated, user_written, ai_assisted';


--
-- Name: COLUMN stories.audio_set_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stories.audio_set_id IS 'Reference to AI-generated audio via audio_sets (with background mixing)';


--
-- Name: COLUMN stories.user_audio_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stories.user_audio_url IS 'URL to user-recorded audio file';


--
-- Name: COLUMN stories.user_audio_duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stories.user_audio_duration_seconds IS 'Duration of user-recorded audio in seconds';


--
-- Name: COLUMN stories.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stories.metadata IS 'Additional data: prompts used, generation settings, highlights extracted, etc.';


--
-- Name: COLUMN stories.generation_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stories.generation_count IS 'Number of times story has been regenerated';


--
-- Name: support_ticket_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_ticket_replies (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid,
    is_staff boolean DEFAULT false,
    message text NOT NULL,
    attachments text[],
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    ticket_number text NOT NULL,
    user_id uuid,
    guest_email text,
    subject text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text,
    priority text DEFAULT 'normal'::text,
    category text,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    closed_at timestamp with time zone,
    CONSTRAINT support_tickets_category_check CHECK ((category = ANY (ARRAY['technical'::text, 'billing'::text, 'account'::text, 'feature'::text, 'other'::text]))),
    CONSTRAINT support_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'waiting_reply'::text, 'resolved'::text, 'closed'::text])))
);


--
-- Name: token_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action_type public.token_action_type NOT NULL,
    tokens_used integer NOT NULL,
    tokens_remaining integer NOT NULL,
    estimated_cost_usd numeric(10,6),
    openai_model text,
    prompt_tokens integer,
    completion_tokens integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    amount_paid_cents integer,
    currency text DEFAULT 'USD'::text,
    stripe_payment_intent_id text,
    stripe_session_id text,
    subscription_id uuid,
    token_pack_id text,
    notes text,
    created_by uuid,
    expires_at timestamp with time zone
);


--
-- Name: TABLE token_transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.token_transactions IS 'Tracks all AI token usage with real OpenAI costs for precise COGS measurement';


--
-- Name: COLUMN token_transactions.tokens_used; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_transactions.tokens_used IS 'Actual tokens used (positive) or granted (negative for grants)';


--
-- Name: COLUMN token_transactions.estimated_cost_usd; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_transactions.estimated_cost_usd IS 'Real OpenAI API cost in USD for analytics';


--
-- Name: COLUMN token_transactions.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_transactions.metadata IS 'Flexible JSONB for action-specific context';


--
-- Name: COLUMN token_transactions.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_transactions.expires_at IS 'Expiration date for grants (NULL = never expires for purchases)';


--
-- Name: token_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action_type text NOT NULL,
    model_used text NOT NULL,
    tokens_used integer DEFAULT 0 NOT NULL,
    input_tokens integer DEFAULT 0,
    output_tokens integer DEFAULT 0,
    success boolean DEFAULT true NOT NULL,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    calculated_cost_cents numeric(12,4),
    audio_seconds numeric(10,2),
    audio_duration_formatted text,
    openai_request_id text,
    openai_created bigint,
    system_fingerprint text,
    actual_cost_cents numeric(12,4),
    reconciled_at timestamp with time zone,
    reconciliation_status text DEFAULT 'pending'::text,
    CONSTRAINT token_usage_action_type_check CHECK ((action_type = ANY (ARRAY['assessment_scoring'::text, 'vision_generation'::text, 'vision_refinement'::text, 'blueprint_generation'::text, 'chat_conversation'::text, 'audio_generation'::text, 'image_generation'::text, 'transcription'::text, 'admin_grant'::text, 'admin_deduct'::text, 'subscription_grant'::text, 'trial_grant'::text, 'token_pack_purchase'::text, 'life_vision_category_summary'::text, 'life_vision_master_assembly'::text, 'prompt_suggestions'::text, 'frequency_flip'::text, 'vibrational_analysis'::text, 'viva_scene_generation'::text, 'north_star_reflection'::text, 'voice_profile_analysis'::text, 'vision_board_ideas'::text]))),
    CONSTRAINT token_usage_reconciliation_consistency_check CHECK ((((reconciled_at IS NULL) AND (actual_cost_cents IS NULL)) OR ((reconciled_at IS NOT NULL) AND (actual_cost_cents IS NOT NULL)))),
    CONSTRAINT token_usage_reconciliation_status_check CHECK ((reconciliation_status = ANY (ARRAY['pending'::text, 'matched'::text, 'discrepancy'::text, 'not_applicable'::text])))
);


--
-- Name: TABLE token_usage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.token_usage IS 'Tracks AI token usage and costs for each user action';


--
-- Name: COLUMN token_usage.calculated_cost_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_usage.calculated_cost_cents IS 'Calculated cost in cents (supports 4 decimal places for sub-cent precision)';


--
-- Name: COLUMN token_usage.audio_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_usage.audio_seconds IS 'Duration in seconds for audio transcriptions (Whisper)';


--
-- Name: COLUMN token_usage.audio_duration_formatted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_usage.audio_duration_formatted IS 'Human-readable duration (e.g., "2m 30s")';


--
-- Name: COLUMN token_usage.openai_request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_usage.openai_request_id IS 'OpenAI API request ID (e.g., chatcmpl-123). Used to match against OpenAI billing reports.';


--
-- Name: COLUMN token_usage.openai_created; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_usage.openai_created IS 'Unix timestamp from OpenAI response. Helps with date-based reconciliation.';


--
-- Name: COLUMN token_usage.system_fingerprint; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_usage.system_fingerprint IS 'OpenAI system fingerprint (e.g., fp_44709d6fcb). Identifies exact model version used.';


--
-- Name: COLUMN token_usage.actual_cost_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_usage.actual_cost_cents IS 'Actual reconciled cost from OpenAI in cents (supports 4 decimal places)';


--
-- Name: COLUMN token_usage.reconciled_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_usage.reconciled_at IS 'Timestamp when this record was reconciled against OpenAI billing.';


--
-- Name: COLUMN token_usage.reconciliation_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_usage.reconciliation_status IS 'Status of cost reconciliation: pending (not yet reconciled), matched (within tolerance), discrepancy (significant difference), not_applicable (non-OpenAI action)';


--
-- Name: CONSTRAINT token_usage_action_type_check ON token_usage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT token_usage_action_type_check ON public.token_usage IS 'Ensures action_type matches one of the supported AI action types';


--
-- Name: token_usage_with_costs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.token_usage_with_costs AS
 SELECT id,
    user_id,
    action_type,
    model_used,
    tokens_used,
    input_tokens,
    output_tokens,
    audio_seconds,
    audio_duration_formatted,
    ((calculated_cost_cents)::numeric / 100.0) AS accurate_cost_usd,
    openai_request_id,
    openai_created,
    system_fingerprint,
    ((actual_cost_cents)::numeric / 100.0) AS actual_cost_usd,
    reconciled_at,
    reconciliation_status,
        CASE
            WHEN ((actual_cost_cents IS NOT NULL) AND (calculated_cost_cents IS NOT NULL)) THEN ((actual_cost_cents - calculated_cost_cents) / 100.0)
            ELSE NULL::numeric
        END AS reconciliation_difference_usd,
        CASE
            WHEN ((actual_cost_cents IS NOT NULL) AND (calculated_cost_cents > (0)::numeric)) THEN round((((actual_cost_cents)::numeric / (calculated_cost_cents)::numeric) * (100)::numeric), 2)
            ELSE NULL::numeric
        END AS reconciliation_accuracy_percentage,
        CASE
            WHEN ((audio_seconds IS NOT NULL) AND (audio_seconds > (0)::numeric)) THEN 'audio'::text
            WHEN ((input_tokens > 0) OR (output_tokens > 0)) THEN 'text'::text
            ELSE 'other'::text
        END AS usage_type,
    success,
    error_message,
    metadata,
    created_at
   FROM public.token_usage
  WHERE (success = true);


--
-- Name: VIEW token_usage_with_costs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.token_usage_with_costs IS 'Shows token usage with accurate cost analysis and OpenAI reconciliation data. Only includes successful operations.';


--
-- Name: user_activity_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity_metrics (
    user_id uuid NOT NULL,
    profile_completion_percent integer DEFAULT 0,
    vision_count integer DEFAULT 0,
    vision_refinement_count integer DEFAULT 0,
    audio_generated_count integer DEFAULT 0,
    journal_entry_count integer DEFAULT 0,
    vision_board_image_count integer DEFAULT 0,
    last_login_at timestamp with time zone,
    total_logins integer DEFAULT 0,
    days_since_last_login integer,
    s3_file_count integer DEFAULT 0,
    total_storage_mb numeric(10,2) DEFAULT 0,
    tokens_used integer DEFAULT 0,
    tokens_remaining integer DEFAULT 0,
    engagement_status text,
    health_status text,
    custom_tags text[],
    admin_notes text,
    last_calculated_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    badge_type text NOT NULL,
    earned_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE user_badges; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_badges IS 'Stores earned badges/achievements for users';


--
-- Name: COLUMN user_badges.badge_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_badges.badge_type IS 'Badge identifier (e.g., gym_rookie, vibe_anchor)';


--
-- Name: COLUMN user_badges.earned_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_badges.earned_at IS 'When the badge was earned';


--
-- Name: COLUMN user_badges.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_badges.metadata IS 'Additional data about how badge was earned';


--
-- Name: user_community_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_community_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_posts integer DEFAULT 0 NOT NULL,
    total_comments integer DEFAULT 0 NOT NULL,
    hearts_given integer DEFAULT 0 NOT NULL,
    hearts_received integer DEFAULT 0 NOT NULL,
    streak_days integer DEFAULT 0 NOT NULL,
    last_post_date date,
    longest_streak integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE user_community_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_community_stats IS 'Aggregated community statistics per user';


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gender text,
    ethnicity text,
    relationship_status text,
    relationship_length text,
    has_children boolean DEFAULT false,
    units text DEFAULT 'US'::text,
    height numeric(5,2),
    weight numeric(6,2),
    exercise_frequency text,
    living_situation text,
    time_at_location text,
    city text,
    state text,
    postal_code text,
    country text DEFAULT 'United States'::text,
    employment_type text,
    occupation text,
    company text,
    time_in_role text,
    currency text DEFAULT 'USD'::text,
    household_income text,
    savings_retirement text,
    assets_equity text,
    consumer_debt text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    partner_name text,
    version_notes text,
    progress_photos text[],
    clarity_love text,
    clarity_family text,
    clarity_work text,
    clarity_money text,
    clarity_home text,
    clarity_health text,
    clarity_fun text,
    clarity_travel text,
    clarity_social text,
    clarity_stuff text,
    clarity_giving text,
    clarity_spirituality text,
    hobbies text[] DEFAULT '{}'::text[],
    leisure_time_weekly text,
    travel_frequency public.travel_frequency,
    passport boolean DEFAULT false NOT NULL,
    countries_visited integer DEFAULT 0 NOT NULL,
    close_friends_count text,
    social_preference public.social_preference,
    lifestyle_category public.lifestyle_category,
    primary_vehicle text,
    spiritual_practice text,
    meditation_frequency text,
    personal_growth_focus boolean DEFAULT false NOT NULL,
    volunteer_status text,
    charitable_giving text,
    legacy_mindset boolean DEFAULT false NOT NULL,
    story_recordings jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_draft boolean DEFAULT false,
    is_active boolean DEFAULT false,
    parent_version_id uuid,
    education text,
    education_description text,
    contrast_fun text,
    contrast_health text,
    contrast_travel text,
    contrast_love text,
    contrast_family text,
    contrast_social text,
    contrast_home text,
    contrast_work text,
    contrast_money text,
    contrast_stuff text,
    contrast_giving text,
    contrast_spirituality text,
    vehicles jsonb DEFAULT '[]'::jsonb,
    items jsonb DEFAULT '[]'::jsonb,
    has_vehicle boolean DEFAULT false,
    trips jsonb DEFAULT '[]'::jsonb,
    children jsonb DEFAULT '[]'::jsonb,
    parent_id uuid,
    CONSTRAINT user_profiles_assets_equity_check CHECK ((assets_equity = ANY (ARRAY['<10,000'::text, '10,000-24,999'::text, '25,000-49,999'::text, '50,000-99,999'::text, '100,000-249,999'::text, '250,000-499,999'::text, '500,000-999,999'::text, '1,000,000+'::text, 'Prefer not to say'::text]))),
    CONSTRAINT user_profiles_consumer_debt_check CHECK ((consumer_debt = ANY (ARRAY['None'::text, 'Under 10,000'::text, '10,000-24,999'::text, '25,000-49,999'::text, '50,000-99,999'::text, '100,000-249,999'::text, '250,000-499,999'::text, '500,000-999,999'::text, '1,000,000+'::text, 'Prefer not to say'::text]))),
    CONSTRAINT user_profiles_countries_visited_check CHECK ((countries_visited >= 0)),
    CONSTRAINT user_profiles_currency_check CHECK ((currency = ANY (ARRAY['USD'::text, 'EUR'::text, 'GBP'::text, 'Other'::text]))),
    CONSTRAINT user_profiles_education_check CHECK ((education = ANY (ARRAY['High School'::text, 'Some College'::text, 'Associate Degree'::text, 'Bachelor''s Degree'::text, 'Master''s Degree'::text, 'Doctorate'::text, 'Other'::text, 'Prefer not to say'::text]))),
    CONSTRAINT user_profiles_employment_type_check CHECK ((employment_type = ANY (ARRAY['Employee'::text, 'Business Owner'::text, 'Contractor/Freelancer'::text, 'Prefer not to say'::text]))),
    CONSTRAINT user_profiles_ethnicity_check CHECK ((ethnicity = ANY (ARRAY['Asian'::text, 'Black'::text, 'Hispanic'::text, 'Middle Eastern'::text, 'Multi-ethnic'::text, 'Native American'::text, 'Pacific Islander'::text, 'White'::text, 'Other'::text, 'Prefer not to say'::text]))),
    CONSTRAINT user_profiles_exercise_frequency_check CHECK ((exercise_frequency = ANY (ARRAY['None'::text, '1-2x'::text, '3-4x'::text, '5+'::text]))),
    CONSTRAINT user_profiles_gender_check CHECK ((gender = ANY (ARRAY['Male'::text, 'Female'::text, 'Prefer not to say'::text]))),
    CONSTRAINT user_profiles_household_income_check CHECK ((household_income = ANY (ARRAY['<10,000'::text, '10,000-24,999'::text, '25,000-49,999'::text, '50,000-99,999'::text, '100,000-249,999'::text, '250,000-499,999'::text, '500,000-999,999'::text, '1,000,000+'::text, 'Prefer not to say'::text]))),
    CONSTRAINT user_profiles_living_situation_check CHECK ((living_situation = ANY (ARRAY['Own'::text, 'Rent'::text, 'With family/friends'::text, 'Other'::text, 'Prefer not to say'::text]))),
    CONSTRAINT user_profiles_relationship_length_check CHECK ((relationship_length = ANY (ARRAY['1-6 months'::text, '6-12 months'::text, '12-18 months'::text, '18-24 months'::text, '2-3 years'::text, '3-5 years'::text, '5-10 years'::text, '10+ years'::text]))),
    CONSTRAINT user_profiles_relationship_status_check CHECK ((relationship_status = ANY (ARRAY['Single'::text, 'In a Relationship'::text, 'Married'::text]))),
    CONSTRAINT user_profiles_savings_retirement_check CHECK ((savings_retirement = ANY (ARRAY['<10,000'::text, '10,000-24,999'::text, '25,000-49,999'::text, '50,000-99,999'::text, '100,000-249,999'::text, '250,000-499,999'::text, '500,000-999,999'::text, '1,000,000+'::text, 'Prefer not to say'::text]))),
    CONSTRAINT user_profiles_time_at_location_check CHECK ((time_at_location = ANY (ARRAY['<3 months'::text, '3-6 months'::text, '6-12 months'::text, '1-2 years'::text, '2-3 years'::text, '3-5 years'::text, '5-10 years'::text, '10+ years'::text]))),
    CONSTRAINT user_profiles_time_in_role_check CHECK ((time_in_role = ANY (ARRAY['<3 months'::text, '3-6 months'::text, '6-12 months'::text, '1-2 years'::text, '2-3 years'::text, '3-5 years'::text, '5-10 years'::text, '10+ years'::text]))),
    CONSTRAINT user_profiles_units_check CHECK ((units = ANY (ARRAY['US'::text, 'Metric'::text])))
);


--
-- Name: TABLE user_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_profiles IS 'Versioned user profiles allowing multiple profiles per user (active + draft)';


--
-- Name: COLUMN user_profiles.version_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.version_notes IS 'Optional notes about this version';


--
-- Name: COLUMN user_profiles.progress_photos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.progress_photos IS 'Array of URLs to progress photos (optional)';


--
-- Name: COLUMN user_profiles.clarity_love; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_love IS 'What''s going well in Love?';


--
-- Name: COLUMN user_profiles.clarity_family; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_family IS 'What''s going well in Family?';


--
-- Name: COLUMN user_profiles.clarity_work; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_work IS 'What''s going well in Work?';


--
-- Name: COLUMN user_profiles.clarity_money; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_money IS 'What''s going well in Money?';


--
-- Name: COLUMN user_profiles.clarity_home; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_home IS 'What''s going well in Home?';


--
-- Name: COLUMN user_profiles.clarity_health; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_health IS 'What''s going well in Health?';


--
-- Name: COLUMN user_profiles.clarity_fun; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_fun IS 'What''s going well in Fun?';


--
-- Name: COLUMN user_profiles.clarity_travel; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_travel IS 'What''s going well in Travel?';


--
-- Name: COLUMN user_profiles.clarity_social; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_social IS 'What''s going well in Social?';


--
-- Name: COLUMN user_profiles.clarity_stuff; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_stuff IS 'What''s going well in Stuff?';


--
-- Name: COLUMN user_profiles.clarity_giving; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_giving IS 'What''s going well in Giving?';


--
-- Name: COLUMN user_profiles.clarity_spirituality; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.clarity_spirituality IS 'What''s going well in Spirituality?';


--
-- Name: COLUMN user_profiles.hobbies; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.hobbies IS 'Array of current hobbies (free text)';


--
-- Name: COLUMN user_profiles.leisure_time_weekly; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.leisure_time_weekly IS 'Hours per week: 0-5, 6-15, 16-25, 25+';


--
-- Name: COLUMN user_profiles.travel_frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.travel_frequency IS 'Travel cadence: never, yearly, quarterly, monthly';


--
-- Name: COLUMN user_profiles.passport; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.passport IS 'Has a valid passport';


--
-- Name: COLUMN user_profiles.countries_visited; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.countries_visited IS 'Total countries visited (current count)';


--
-- Name: COLUMN user_profiles.close_friends_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.close_friends_count IS '0, 1-3, 4-8, 9+';


--
-- Name: COLUMN user_profiles.social_preference; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.social_preference IS 'introvert, ambivert, extrovert';


--
-- Name: COLUMN user_profiles.lifestyle_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.lifestyle_category IS 'minimalist, moderate, comfortable, luxury';


--
-- Name: COLUMN user_profiles.primary_vehicle; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.primary_vehicle IS 'Primary vehicle type (free text)';


--
-- Name: COLUMN user_profiles.spiritual_practice; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.spiritual_practice IS 'none, religious, spiritual, secular';


--
-- Name: COLUMN user_profiles.meditation_frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.meditation_frequency IS 'never, rarely, weekly, daily';


--
-- Name: COLUMN user_profiles.personal_growth_focus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.personal_growth_focus IS 'Actively focused on personal growth (current state)';


--
-- Name: COLUMN user_profiles.volunteer_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.volunteer_status IS 'none, occasional, regular, frequent';


--
-- Name: COLUMN user_profiles.charitable_giving; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.charitable_giving IS 'Annual amount: none, <500, 500-2000, 2000+';


--
-- Name: COLUMN user_profiles.legacy_mindset; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.legacy_mindset IS 'Thinks about legacy in day-to-day decisions (current state)';


--
-- Name: COLUMN user_profiles.story_recordings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.story_recordings IS 'Array of story recordings with metadata: [{ url, transcript, type, category, created_at }]';


--
-- Name: COLUMN user_profiles.is_draft; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.is_draft IS 'True if this is a work-in-progress draft version';


--
-- Name: COLUMN user_profiles.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.is_active IS 'True if this is the current active version (only one per user)';


--
-- Name: COLUMN user_profiles.parent_version_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.parent_version_id IS 'Reference to the version this was created from';


--
-- Name: COLUMN user_profiles.contrast_fun; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_fun IS 'What''s not going well in Fun?';


--
-- Name: COLUMN user_profiles.contrast_health; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_health IS 'What''s not going well in Health?';


--
-- Name: COLUMN user_profiles.contrast_travel; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_travel IS 'What''s not going well in Travel?';


--
-- Name: COLUMN user_profiles.contrast_love; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_love IS 'What''s not going well in Love?';


--
-- Name: COLUMN user_profiles.contrast_family; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_family IS 'What''s not going well in Family?';


--
-- Name: COLUMN user_profiles.contrast_social; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_social IS 'What''s not going well in Social?';


--
-- Name: COLUMN user_profiles.contrast_home; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_home IS 'What''s not going well in Home?';


--
-- Name: COLUMN user_profiles.contrast_work; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_work IS 'What''s not going well in Work?';


--
-- Name: COLUMN user_profiles.contrast_money; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_money IS 'What''s not going well in Money?';


--
-- Name: COLUMN user_profiles.contrast_stuff; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_stuff IS 'What''s not going well in Stuff?';


--
-- Name: COLUMN user_profiles.contrast_giving; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_giving IS 'What''s not going well in Giving?';


--
-- Name: COLUMN user_profiles.contrast_spirituality; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.contrast_spirituality IS 'What''s not going well in Spirituality?';


--
-- Name: COLUMN user_profiles.vehicles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.vehicles IS 'Array of vehicle objects: [{name, year_acquired, ownership_status}]';


--
-- Name: COLUMN user_profiles.items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.items IS 'Array of toy/recreational item objects: [{name, year_acquired, ownership_status}]';


--
-- Name: COLUMN user_profiles.has_vehicle; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.has_vehicle IS 'Whether user has a vehicle (triggers vehicle table display)';


--
-- Name: COLUMN user_profiles.trips; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.trips IS 'Array of trip objects: [{destination, year, duration}]';


--
-- Name: COLUMN user_profiles.children; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.children IS 'Array of child objects: [{first_name, birthday}]';


--
-- Name: COLUMN user_profiles.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.parent_id IS 'References the profile version this was created from (for drafts and clones)';


--
-- Name: user_storage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_storage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    quota_gb integer NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    subscription_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE user_storage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_storage IS 'Tracks storage quota grants. Current quota = SUM(quota_gb). Usage always calculated from S3.';


--
-- Name: COLUMN user_storage.quota_gb; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_storage.quota_gb IS 'Storage quota granted (25GB, 100GB, etc.)';


--
-- Name: vibe_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vibe_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    hearts_count integer DEFAULT 0 NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_comment_id uuid,
    CONSTRAINT vibe_comments_content_not_empty CHECK ((content <> ''::text))
);


--
-- Name: TABLE vibe_comments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vibe_comments IS 'Comments on Vibe Tribe posts';


--
-- Name: COLUMN vibe_comments.parent_comment_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vibe_comments.parent_comment_id IS 'Reference to parent comment for threaded replies. NULL means top-level comment on post.';


--
-- Name: vibe_hearts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vibe_hearts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid,
    comment_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vibe_hearts_one_target CHECK ((((post_id IS NOT NULL) AND (comment_id IS NULL)) OR ((post_id IS NULL) AND (comment_id IS NOT NULL))))
);


--
-- Name: TABLE vibe_hearts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vibe_hearts IS 'Hearts (likes) on posts and comments';


--
-- Name: vibe_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vibe_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content text,
    media_urls jsonb DEFAULT '[]'::jsonb,
    media_type public.vibe_media_type DEFAULT 'none'::public.vibe_media_type NOT NULL,
    vibe_tag public.vibe_tag NOT NULL,
    hearts_count integer DEFAULT 0 NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    life_categories text[] DEFAULT '{}'::text[],
    CONSTRAINT vibe_posts_has_content CHECK ((((content IS NOT NULL) AND (content <> ''::text)) OR (jsonb_array_length(media_urls) > 0)))
);


--
-- Name: TABLE vibe_posts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vibe_posts IS 'Community posts in the Vibe Tribe feed';


--
-- Name: COLUMN vibe_posts.life_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vibe_posts.life_categories IS 'Optional life vision categories (health, wealth, relationships, etc.)';


--
-- Name: vibrational_event_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vibrational_event_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_key text NOT NULL,
    label text NOT NULL,
    description text,
    enabled boolean DEFAULT true NOT NULL,
    default_category text,
    field_map jsonb DEFAULT '{}'::jsonb NOT NULL,
    analyzer_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vibrational_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vibrational_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    source_type text NOT NULL,
    source_id uuid,
    raw_text text,
    emotional_valence text NOT NULL,
    dominant_emotions text[] DEFAULT ARRAY[]::text[],
    intensity integer,
    essence_word text,
    is_contrast boolean DEFAULT false NOT NULL,
    summary_in_their_voice text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vibrational_events_emotional_valence_check CHECK ((emotional_valence = ANY (ARRAY['below_green_line'::text, 'near_green_line'::text, 'above_green_line'::text]))),
    CONSTRAINT vibrational_events_intensity_check CHECK (((intensity >= 1) AND (intensity <= 10)))
);


--
-- Name: vibrational_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vibrational_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_a text NOT NULL,
    category_b text NOT NULL,
    strength numeric NOT NULL,
    shared_themes text[] DEFAULT '{}'::text[],
    connection_type text,
    notes text,
    evidence_count integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vibrational_links_strength_check CHECK (((strength >= (0)::numeric) AND (strength <= (1)::numeric)))
);


--
-- Name: video_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_mapping (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    original_s3_key text NOT NULL,
    original_url text NOT NULL,
    processed_s3_key text,
    processed_url text,
    folder text NOT NULL,
    entry_type text NOT NULL,
    entry_id uuid,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: video_session_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_session_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid,
    sender_name text NOT NULL,
    message text NOT NULL,
    message_type text DEFAULT 'chat'::text,
    sent_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE video_session_messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.video_session_messages IS 'Chat messages during video sessions - YouTube-live style feed';


--
-- Name: video_session_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_session_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid,
    email text,
    name text,
    invited_at timestamp with time zone DEFAULT now(),
    joined_at timestamp with time zone,
    left_at timestamp with time zone,
    duration_seconds integer,
    camera_on_percent numeric(5,2),
    mic_on_percent numeric(5,2),
    is_host boolean DEFAULT false,
    attended boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    phone text,
    rsvp_status text DEFAULT 'invited'::text,
    rsvp_at timestamp with time zone,
    reminder_sent_at timestamp with time zone,
    notes text,
    CONSTRAINT email_or_user CHECK (((user_id IS NOT NULL) OR (email IS NOT NULL))),
    CONSTRAINT video_participants_rsvp_check CHECK ((rsvp_status = ANY (ARRAY['invited'::text, 'registered'::text, 'declined'::text, 'maybe'::text])))
);


--
-- Name: TABLE video_session_participants; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.video_session_participants IS 'Participants in video sessions';


--
-- Name: COLUMN video_session_participants.phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.video_session_participants.phone IS 'Phone number for SMS reminders';


--
-- Name: COLUMN video_session_participants.rsvp_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.video_session_participants.rsvp_status IS 'RSVP: invited (default), registered (confirmed attending), declined, maybe';


--
-- Name: video_session_recordings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_session_recordings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    daily_recording_id text,
    daily_download_url text,
    s3_bucket text,
    s3_key text,
    s3_url text,
    file_size_bytes bigint,
    duration_seconds integer,
    format text DEFAULT 'mp4'::text,
    transcript_text text,
    transcript_s3_key text,
    status public.video_recording_status DEFAULT 'processing'::public.video_recording_status NOT NULL,
    error_message text,
    is_public boolean DEFAULT false,
    resource_library_id uuid,
    recorded_at timestamp with time zone,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE video_session_recordings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.video_session_recordings IS 'Recordings of video sessions';


--
-- Name: video_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    daily_room_name text NOT NULL,
    daily_room_url text NOT NULL,
    title text NOT NULL,
    description text,
    session_type public.video_session_type DEFAULT 'one_on_one'::public.video_session_type NOT NULL,
    status public.video_session_status DEFAULT 'scheduled'::public.video_session_status NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    scheduled_duration_minutes integer DEFAULT 60 NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    actual_duration_seconds integer,
    host_user_id uuid NOT NULL,
    recording_status public.video_recording_status DEFAULT 'none'::public.video_recording_status NOT NULL,
    daily_recording_id text,
    recording_s3_key text,
    recording_url text,
    recording_duration_seconds integer,
    enable_recording boolean DEFAULT true,
    enable_transcription boolean DEFAULT true,
    enable_waiting_room boolean DEFAULT true,
    max_participants integer DEFAULT 2,
    host_notes text,
    session_summary text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    staff_id uuid,
    event_type text,
    booking_id uuid,
    is_group_session boolean DEFAULT false,
    rsvp_enabled boolean DEFAULT false,
    rsvp_deadline timestamp with time zone,
    highlighted_message_id uuid
);


--
-- Name: TABLE video_sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.video_sessions IS 'Video coaching sessions using Daily.co';


--
-- Name: COLUMN video_sessions.daily_room_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.video_sessions.daily_room_name IS 'Unique room name from Daily.co API';


--
-- Name: COLUMN video_sessions.daily_room_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.video_sessions.daily_room_url IS 'Full URL to join the Daily.co room';


--
-- Name: COLUMN video_sessions.session_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.video_sessions.session_summary IS 'Can be VIVA-generated after the call';


--
-- Name: COLUMN video_sessions.is_group_session; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.video_sessions.is_group_session IS 'True for group sessions where multiple people can join';


--
-- Name: COLUMN video_sessions.rsvp_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.video_sessions.rsvp_enabled IS 'True if RSVP tracking is enabled';


--
-- Name: COLUMN video_sessions.highlighted_message_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.video_sessions.highlighted_message_id IS 'Currently highlighted/pinned chat message displayed to all participants';


--
-- Name: vision_board_ideas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vision_board_ideas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vision_version_id uuid NOT NULL,
    category text NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    model_used text NOT NULL,
    tokens_used integer,
    suggestions jsonb DEFAULT '[]'::jsonb NOT NULL,
    items_created integer DEFAULT 0,
    created_item_ids uuid[] DEFAULT '{}'::uuid[],
    status text DEFAULT 'active'::text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE vision_board_ideas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vision_board_ideas IS 'Stores VIVA-generated vision board item suggestions';


--
-- Name: COLUMN vision_board_ideas.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_board_ideas.category IS 'Category key (fun, travel, etc.) or "all" for full generation';


--
-- Name: COLUMN vision_board_ideas.suggestions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_board_ideas.suggestions IS 'Array of {name, description} objects';


--
-- Name: COLUMN vision_board_ideas.items_created; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_board_ideas.items_created IS 'Count of items user actually created from these suggestions';


--
-- Name: COLUMN vision_board_ideas.created_item_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_board_ideas.created_item_ids IS 'Array of vision_board_items.id that came from these suggestions';


--
-- Name: vision_board_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vision_board_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    image_url text,
    status text DEFAULT 'active'::text,
    categories text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    actualized_at timestamp with time zone,
    actualized_image_url text,
    actualization_story text
);


--
-- Name: COLUMN vision_board_items.actualized_image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_board_items.actualized_image_url IS 'Evidence image showing the vision has been actualized. Displayed when status is actualized.';


--
-- Name: COLUMN vision_board_items.actualization_story; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_board_items.actualization_story IS 'Story describing how the vision was actualized. Only used when status is actualized.';


--
-- Name: vision_focus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vision_focus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vision_id uuid NOT NULL,
    suggested_highlights jsonb DEFAULT '[]'::jsonb NOT NULL,
    selected_highlights jsonb DEFAULT '[]'::jsonb NOT NULL,
    story_content text,
    story_word_count integer,
    audio_set_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    error_message text,
    generation_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vision_focus_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'suggesting'::text, 'generating_story'::text, 'generating_audio'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: TABLE vision_focus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vision_focus IS 'Focus stories - 5-7 minute day-in-the-life audio narratives from life visions';


--
-- Name: COLUMN vision_focus.suggested_highlights; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_focus.suggested_highlights IS 'VIVA-extracted highlights from vision: [{category, text, essence, timeOfDay}]';


--
-- Name: COLUMN vision_focus.selected_highlights; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_focus.selected_highlights IS 'User-confirmed highlights for story generation';


--
-- Name: COLUMN vision_focus.story_content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_focus.story_content IS 'Generated day-in-the-life narrative text';


--
-- Name: COLUMN vision_focus.story_word_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_focus.story_word_count IS 'Word count of story (target: 750-1000 for 5-7 min audio)';


--
-- Name: COLUMN vision_focus.audio_set_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_focus.audio_set_id IS 'Reference to audio_sets where content_type=focus_story';


--
-- Name: COLUMN vision_focus.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_focus.status IS 'draft: initial | suggesting: extracting highlights | generating_story: VIVA writing | generating_audio: TTS | completed | failed';


--
-- Name: COLUMN vision_focus.generation_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_focus.generation_count IS 'Number of times story/audio has been regenerated';


--
-- Name: vision_generation_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vision_generation_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    categories_requested text[] DEFAULT ARRAY['fun'::text, 'health'::text, 'travel'::text, 'love'::text, 'family'::text, 'social'::text, 'home'::text, 'work'::text, 'money'::text, 'stuff'::text, 'giving'::text, 'spirituality'::text] NOT NULL,
    categories_completed text[] DEFAULT '{}'::text[] NOT NULL,
    categories_failed text[] DEFAULT '{}'::text[] NOT NULL,
    current_category text,
    status text DEFAULT 'pending'::text NOT NULL,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    vision_id uuid,
    perspective text DEFAULT 'singular'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'partial_success'::text, 'failed'::text, 'retrying'::text])))
);


--
-- Name: TABLE vision_generation_batches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vision_generation_batches IS 'Persistent queue for Life Vision category generation. Allows background processing independent of page state.';


--
-- Name: vision_new_category_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vision_new_category_state (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category character varying(50) NOT NULL,
    transcript text,
    ideal_state text,
    blueprint_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ideal_state_prompts jsonb DEFAULT '[]'::jsonb,
    master_vision_raw text,
    clarity_keys jsonb DEFAULT '[]'::jsonb,
    contrast_flips jsonb DEFAULT '[]'::jsonb,
    category_vision_text text,
    CONSTRAINT vision_new_category_state_category_check CHECK (((category)::text = ANY ((ARRAY['fun'::character varying, 'health'::character varying, 'travel'::character varying, 'love'::character varying, 'family'::character varying, 'social'::character varying, 'home'::character varying, 'work'::character varying, 'money'::character varying, 'stuff'::character varying, 'giving'::character varying, 'spirituality'::character varying, '_master'::character varying])::text[])))
);


--
-- Name: TABLE vision_new_category_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vision_new_category_state IS 'Stores per-category vision creation state including clarity, imagination, blueprint, scenes, and generated vision text.';


--
-- Name: COLUMN vision_new_category_state.transcript; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_new_category_state.transcript IS 'Step 1: User audio/text transcript';


--
-- Name: COLUMN vision_new_category_state.ideal_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_new_category_state.ideal_state IS 'Step 2: User imagination/ideal state answers';


--
-- Name: COLUMN vision_new_category_state.blueprint_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_new_category_state.blueprint_data IS 'Step 3: Being/Doing/Receiving loops as JSONB';


--
-- Name: COLUMN vision_new_category_state.ideal_state_prompts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_new_category_state.ideal_state_prompts IS 'Step 2: AI-generated imagination prompts. Array of {title, prompt, focus} objects';


--
-- Name: COLUMN vision_new_category_state.master_vision_raw; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_new_category_state.master_vision_raw IS 'Raw AI output from master vision assembly (full markdown+JSON) - stored once per user';


--
-- Name: COLUMN vision_new_category_state.clarity_keys; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_new_category_state.clarity_keys IS 'Array of clarity keys from profile for this category';


--
-- Name: COLUMN vision_new_category_state.contrast_flips; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_new_category_state.contrast_flips IS 'Array of contrast flips from profile for this category';


--
-- Name: COLUMN vision_new_category_state.category_vision_text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_new_category_state.category_vision_text IS 'Generated vision text for this category (from queue system)';


--
-- Name: vision_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vision_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vision_id uuid NOT NULL,
    categories_completed text[] DEFAULT '{}'::text[] NOT NULL,
    current_category text,
    total_categories integer DEFAULT 12 NOT NULL,
    last_activity timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


--
-- Name: vision_refinements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vision_refinements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vision_id uuid NOT NULL,
    category text NOT NULL,
    input_text text NOT NULL,
    output_text text NOT NULL,
    refinement_inputs jsonb DEFAULT '{}'::jsonb,
    weave_settings jsonb DEFAULT '{}'::jsonb,
    applied boolean DEFAULT false,
    applied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_category CHECK ((category = ANY (ARRAY['forward'::text, 'fun'::text, 'travel'::text, 'home'::text, 'family'::text, 'love'::text, 'health'::text, 'money'::text, 'work'::text, 'social'::text, 'stuff'::text, 'giving'::text, 'spirituality'::text, 'conclusion'::text])))
);


--
-- Name: TABLE vision_refinements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vision_refinements IS 'Stores history of VIVA Refine operations with inputs and outputs';


--
-- Name: vision_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vision_versions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    forward text,
    fun text,
    travel text,
    home text,
    family text,
    love text,
    health text,
    money text,
    work text,
    social text,
    stuff text,
    giving text,
    spirituality text,
    conclusion text,
    has_audio boolean DEFAULT false,
    audio_url text,
    audio_duration text,
    voice_type text,
    background_music text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_audio_generated_at timestamp with time zone,
    is_draft boolean DEFAULT false,
    is_active boolean DEFAULT false,
    activation_message text,
    richness_metadata jsonb,
    perspective text DEFAULT 'singular'::text,
    refined_categories jsonb DEFAULT '[]'::jsonb,
    parent_id uuid,
    household_id uuid,
    CONSTRAINT vision_versions_perspective_check CHECK ((perspective = ANY (ARRAY['singular'::text, 'plural'::text])))
);


--
-- Name: TABLE vision_versions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vision_versions IS 'Life visions. Personal visions have household_id = NULL. Household visions have household_id set and are accessible to all active household members.';


--
-- Name: COLUMN vision_versions.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.user_id IS 'Creator/owner of the vision. Always set. For household visions, this is the person who created it.';


--
-- Name: COLUMN vision_versions.forward; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.forward IS 'Forward / Introduction - Vibrational warmup section';


--
-- Name: COLUMN vision_versions.fun; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.fun IS 'Fun / Recreation category content';


--
-- Name: COLUMN vision_versions.travel; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.travel IS 'Travel / Adventure category content';


--
-- Name: COLUMN vision_versions.home; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.home IS 'Home / Environment category content';


--
-- Name: COLUMN vision_versions.family; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.family IS 'Family / Parenting category content';


--
-- Name: COLUMN vision_versions.love; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.love IS 'Love / Romance / Partnership category content';


--
-- Name: COLUMN vision_versions.health; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.health IS 'Health / Vitality category content';


--
-- Name: COLUMN vision_versions.money; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.money IS 'Money / Wealth category content';


--
-- Name: COLUMN vision_versions.work; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.work IS 'Work / Business / Career category content';


--
-- Name: COLUMN vision_versions.social; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.social IS 'Social / Friends category content';


--
-- Name: COLUMN vision_versions.stuff; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.stuff IS 'Stuff / Possessions / Lifestyle category content';


--
-- Name: COLUMN vision_versions.giving; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.giving IS 'Giving / Legacy category content';


--
-- Name: COLUMN vision_versions.spirituality; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.spirituality IS 'Spirituality / Growth category content';


--
-- Name: COLUMN vision_versions.conclusion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.conclusion IS 'Conclusion - Unifying final section';


--
-- Name: COLUMN vision_versions.is_draft; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.is_draft IS 'True if this is a work-in-progress draft version';


--
-- Name: COLUMN vision_versions.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.is_active IS 'True if this is the current active version (only one per user)';


--
-- Name: COLUMN vision_versions.activation_message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.activation_message IS 'Step 6: Celebration message with next steps guidance';


--
-- Name: COLUMN vision_versions.richness_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.richness_metadata IS 'Per-category richness data as JSONB: {"fun": {"inputChars": 500, "ideas": 5, "density": "medium"}, ...}';


--
-- Name: COLUMN vision_versions.perspective; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.perspective IS 'Whether the vision uses singular (I/my) or plural (we/our) perspective';


--
-- Name: COLUMN vision_versions.refined_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.refined_categories IS 'Array of category keys that have been refined in this draft. Format: ["health", "fun", "work"]. Only populated for draft visions.';


--
-- Name: COLUMN vision_versions.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.parent_id IS 'ID of the vision this was cloned from. Used to find existing drafts when refining an active vision.';


--
-- Name: COLUMN vision_versions.household_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vision_versions.household_id IS 'NULL = personal vision. Set = household vision (all household members can access).';


--
-- Name: visitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fingerprint text NOT NULL,
    first_landing_page text,
    first_referrer text,
    first_utm_source text,
    first_utm_medium text,
    first_utm_campaign text,
    first_utm_content text,
    first_utm_term text,
    first_gclid text,
    first_fbclid text,
    first_msclkid text,
    first_ttclid text,
    first_url_params jsonb DEFAULT '{}'::jsonb,
    last_utm_source text,
    last_utm_medium text,
    last_utm_campaign text,
    session_count integer DEFAULT 0 NOT NULL,
    total_pageviews integer DEFAULT 0 NOT NULL,
    user_id uuid,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE visitors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.visitors IS 'Anonymous cookie-based visitor tracking. Linked to auth.users after account creation (waterfall).';


--
-- Name: viva_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viva_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    session_id text NOT NULL,
    cycle_number integer NOT NULL,
    viva_prompt text NOT NULL,
    user_response text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: voice_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_profiles (
    user_id uuid NOT NULL,
    word_flow text NOT NULL,
    emotional_range text NOT NULL,
    detail_level text NOT NULL,
    energy_tempo text NOT NULL,
    woo_level smallint NOT NULL,
    humor_personality text NOT NULL,
    speech_rhythm text NOT NULL,
    style_label text,
    forbidden_styles text[],
    sample_phrases text[],
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    emotional_intensity_preference text,
    narrative_preference text,
    depth_preference text,
    last_refined_at timestamp with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    is_active boolean DEFAULT true,
    forbidden_words text[],
    CONSTRAINT voice_profiles_woo_level_check CHECK (((woo_level >= 1) AND (woo_level <= 3)))
);


--
-- Name: COLUMN voice_profiles.forbidden_words; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.voice_profiles.forbidden_words IS 'Array of words that should be avoided in AI-generated content for this user';


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2026_02_22; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_02_22 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_02_24; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_02_24 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_02_25; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_02_25 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_02_26; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_02_26 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_02_27; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_02_27 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_02_28; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_02_28 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: messages_2026_02_22; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_02_22 FOR VALUES FROM ('2026-02-22 00:00:00') TO ('2026-02-23 00:00:00');


--
-- Name: messages_2026_02_24; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_02_24 FOR VALUES FROM ('2026-02-24 00:00:00') TO ('2026-02-25 00:00:00');


--
-- Name: messages_2026_02_25; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_02_25 FOR VALUES FROM ('2026-02-25 00:00:00') TO ('2026-02-26 00:00:00');


--
-- Name: messages_2026_02_26; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_02_26 FOR VALUES FROM ('2026-02-26 00:00:00') TO ('2026-02-27 00:00:00');


--
-- Name: messages_2026_02_27; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_02_27 FOR VALUES FROM ('2026-02-27 00:00:00') TO ('2026-02-28 00:00:00');


--
-- Name: messages_2026_02_28; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_02_28 FOR VALUES FROM ('2026-02-28 00:00:00') TO ('2026-03-01 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: abundance_events abundance_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abundance_events
    ADD CONSTRAINT abundance_events_pkey PRIMARY KEY (id);


--
-- Name: ai_action_token_overrides ai_action_token_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_action_token_overrides
    ADD CONSTRAINT ai_action_token_overrides_pkey PRIMARY KEY (action_type);


--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_model_pricing ai_model_pricing_model_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_model_pricing
    ADD CONSTRAINT ai_model_pricing_model_name_key UNIQUE (model_name);


--
-- Name: ai_model_pricing ai_model_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_model_pricing
    ADD CONSTRAINT ai_model_pricing_pkey PRIMARY KEY (id);


--
-- Name: ai_tools ai_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tools
    ADD CONSTRAINT ai_tools_pkey PRIMARY KEY (id);


--
-- Name: ai_tools ai_tools_tool_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tools
    ADD CONSTRAINT ai_tools_tool_key_key UNIQUE (tool_key);


--
-- Name: assessment_insights assessment_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_insights
    ADD CONSTRAINT assessment_insights_pkey PRIMARY KEY (id);


--
-- Name: assessment_responses assessment_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_responses
    ADD CONSTRAINT assessment_responses_pkey PRIMARY KEY (id);


--
-- Name: assessment_results assessment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_pkey PRIMARY KEY (id);


--
-- Name: audio_background_tracks audio_background_tracks_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_background_tracks
    ADD CONSTRAINT audio_background_tracks_name_unique UNIQUE (name);


--
-- Name: audio_background_tracks audio_background_tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_background_tracks
    ADD CONSTRAINT audio_background_tracks_pkey PRIMARY KEY (id);


--
-- Name: audio_generation_batches audio_generation_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_generation_batches
    ADD CONSTRAINT audio_generation_batches_pkey PRIMARY KEY (id);


--
-- Name: audio_mix_ratios audio_mix_ratios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_mix_ratios
    ADD CONSTRAINT audio_mix_ratios_pkey PRIMARY KEY (id);


--
-- Name: audio_recommended_combos audio_recommended_combos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_recommended_combos
    ADD CONSTRAINT audio_recommended_combos_pkey PRIMARY KEY (id);


--
-- Name: audio_sets audio_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_sets
    ADD CONSTRAINT audio_sets_pkey PRIMARY KEY (id);


--
-- Name: audio_tracks audio_tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_tracks
    ADD CONSTRAINT audio_tracks_pkey PRIMARY KEY (id);


--
-- Name: audio_tracks audio_tracks_vision_audio_set_section_content_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_tracks
    ADD CONSTRAINT audio_tracks_vision_audio_set_section_content_unique UNIQUE (vision_id, audio_set_id, section_key, content_hash);


--
-- Name: audio_variants audio_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_variants
    ADD CONSTRAINT audio_variants_pkey PRIMARY KEY (id);


--
-- Name: audio_voice_clones audio_voice_clones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_voice_clones
    ADD CONSTRAINT audio_voice_clones_pkey PRIMARY KEY (id);


--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: cart_sessions cart_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_sessions
    ADD CONSTRAINT cart_sessions_pkey PRIMARY KEY (id);


--
-- Name: conversation_sessions conversation_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_sessions
    ADD CONSTRAINT conversation_sessions_pkey PRIMARY KEY (id);


--
-- Name: coupon_codes coupon_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes
    ADD CONSTRAINT coupon_codes_code_key UNIQUE (code);


--
-- Name: coupon_codes coupon_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes
    ADD CONSTRAINT coupon_codes_pkey PRIMARY KEY (id);


--
-- Name: coupon_redemptions coupon_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: customer_subscriptions customer_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_subscriptions
    ADD CONSTRAINT customer_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: customer_subscriptions customer_subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_subscriptions
    ADD CONSTRAINT customer_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_key UNIQUE (user_id);


--
-- Name: daily_papers daily_papers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_papers
    ADD CONSTRAINT daily_papers_pkey PRIMARY KEY (id);


--
-- Name: daily_papers daily_papers_user_entry_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_papers
    ADD CONSTRAINT daily_papers_user_entry_unique UNIQUE (user_id, entry_date);


--
-- Name: email_messages email_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_slug_key UNIQUE (slug);


--
-- Name: emotional_snapshots emotional_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emotional_snapshots
    ADD CONSTRAINT emotional_snapshots_pkey PRIMARY KEY (id);


--
-- Name: emotional_snapshots emotional_snapshots_user_id_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emotional_snapshots
    ADD CONSTRAINT emotional_snapshots_user_id_category_key UNIQUE (user_id, category);


--
-- Name: frequency_flip frequency_flip_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequency_flip
    ADD CONSTRAINT frequency_flip_pkey PRIMARY KEY (id);


--
-- Name: generated_images generated_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_pkey PRIMARY KEY (id);


--
-- Name: household_invitations household_invitations_household_id_invited_email_status_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_invitations
    ADD CONSTRAINT household_invitations_household_id_invited_email_status_key UNIQUE (household_id, invited_email, status);


--
-- Name: household_invitations household_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_invitations
    ADD CONSTRAINT household_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- Name: household_invitations household_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_invitations
    ADD CONSTRAINT household_invitations_pkey PRIMARY KEY (id);


--
-- Name: household_members household_members_household_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_household_id_user_id_key UNIQUE (household_id, user_id);


--
-- Name: household_members household_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_pkey PRIMARY KEY (id);


--
-- Name: household_members household_members_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_user_id_key UNIQUE (user_id);


--
-- Name: households households_admin_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_admin_user_id_key UNIQUE (admin_user_id);


--
-- Name: households households_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_pkey PRIMARY KEY (id);


--
-- Name: intensive_checklist intensive_checklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intensive_checklist
    ADD CONSTRAINT intensive_checklist_pkey PRIMARY KEY (id);


--
-- Name: intensive_responses intensive_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intensive_responses
    ADD CONSTRAINT intensive_responses_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journey_events journey_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_events
    ADD CONSTRAINT journey_events_pkey PRIMARY KEY (id);


--
-- Name: lead_tracking_events lead_tracking_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tracking_events
    ADD CONSTRAINT lead_tracking_events_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: marketing_campaigns marketing_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_campaigns
    ADD CONSTRAINT marketing_campaigns_pkey PRIMARY KEY (id);


--
-- Name: marketing_campaigns marketing_campaigns_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_campaigns
    ADD CONSTRAINT marketing_campaigns_slug_key UNIQUE (slug);


--
-- Name: media_metadata media_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_metadata
    ADD CONSTRAINT media_metadata_pkey PRIMARY KEY (id);


--
-- Name: media_metadata media_metadata_storage_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_metadata
    ADD CONSTRAINT media_metadata_storage_path_key UNIQUE (storage_path);


--
-- Name: membership_tiers membership_tiers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_tiers
    ADD CONSTRAINT membership_tiers_name_key UNIQUE (name);


--
-- Name: membership_tiers membership_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_tiers
    ADD CONSTRAINT membership_tiers_pkey PRIMARY KEY (id);


--
-- Name: membership_tiers membership_tiers_stripe_price_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_tiers
    ADD CONSTRAINT membership_tiers_stripe_price_id_key UNIQUE (stripe_price_id);


--
-- Name: membership_tiers membership_tiers_stripe_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_tiers
    ADD CONSTRAINT membership_tiers_stripe_product_id_key UNIQUE (stripe_product_id);


--
-- Name: message_send_log message_send_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_send_log
    ADD CONSTRAINT message_send_log_pkey PRIMARY KEY (id);


--
-- Name: messaging_campaigns messaging_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messaging_campaigns
    ADD CONSTRAINT messaging_campaigns_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: orders orders_stripe_checkout_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_stripe_checkout_session_id_key UNIQUE (stripe_checkout_session_id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: payment_history payment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_pkey PRIMARY KEY (id);


--
-- Name: payment_history payment_history_stripe_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


--
-- Name: product_prices product_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_pkey PRIMARY KEY (id);


--
-- Name: product_prices product_prices_stripe_price_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_stripe_price_id_key UNIQUE (stripe_price_id);


--
-- Name: products products_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_key_key UNIQUE (key);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: scenes scenes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenes
    ADD CONSTRAINT scenes_pkey PRIMARY KEY (id);


--
-- Name: scheduled_messages scheduled_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages
    ADD CONSTRAINT scheduled_messages_pkey PRIMARY KEY (id);


--
-- Name: sequence_enrollments sequence_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_enrollments
    ADD CONSTRAINT sequence_enrollments_pkey PRIMARY KEY (id);


--
-- Name: sequence_steps sequence_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_steps
    ADD CONSTRAINT sequence_steps_pkey PRIMARY KEY (id);


--
-- Name: sequence_steps sequence_steps_sequence_id_step_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_steps
    ADD CONSTRAINT sequence_steps_sequence_id_step_order_key UNIQUE (sequence_id, step_order);


--
-- Name: sequences sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequences
    ADD CONSTRAINT sequences_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sms_messages sms_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_pkey PRIMARY KEY (id);


--
-- Name: sms_templates sms_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_templates
    ADD CONSTRAINT sms_templates_pkey PRIMARY KEY (id);


--
-- Name: sms_templates sms_templates_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_templates
    ADD CONSTRAINT sms_templates_slug_key UNIQUE (slug);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: support_ticket_replies support_ticket_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_replies
    ADD CONSTRAINT support_ticket_replies_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ticket_number_key UNIQUE (ticket_number);


--
-- Name: token_transactions token_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_transactions
    ADD CONSTRAINT token_transactions_pkey PRIMARY KEY (id);


--
-- Name: token_usage token_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_usage
    ADD CONSTRAINT token_usage_pkey PRIMARY KEY (id);


--
-- Name: assessment_responses unique_assessment_question; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_responses
    ADD CONSTRAINT unique_assessment_question UNIQUE (assessment_id, question_id);


--
-- Name: vision_focus unique_focus_per_vision; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_focus
    ADD CONSTRAINT unique_focus_per_vision UNIQUE (vision_id);


--
-- Name: intensive_responses unique_phase_per_intensive; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intensive_responses
    ADD CONSTRAINT unique_phase_per_intensive UNIQUE (intensive_id, phase);


--
-- Name: user_badges unique_user_badge; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT unique_user_badge UNIQUE (user_id, badge_type);


--
-- Name: user_accounts user_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_accounts
    ADD CONSTRAINT user_accounts_pkey PRIMARY KEY (id);


--
-- Name: user_activity_metrics user_activity_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_metrics
    ADD CONSTRAINT user_activity_metrics_pkey PRIMARY KEY (user_id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_community_stats user_community_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_community_stats
    ADD CONSTRAINT user_community_stats_pkey PRIMARY KEY (id);


--
-- Name: user_community_stats user_community_stats_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_community_stats
    ADD CONSTRAINT user_community_stats_user_id_key UNIQUE (user_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_storage user_storage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_storage
    ADD CONSTRAINT user_storage_pkey PRIMARY KEY (id);


--
-- Name: refinements vibe_assistant_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refinements
    ADD CONSTRAINT vibe_assistant_logs_pkey PRIMARY KEY (id);


--
-- Name: vibe_comments vibe_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_comments
    ADD CONSTRAINT vibe_comments_pkey PRIMARY KEY (id);


--
-- Name: vibe_hearts vibe_hearts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_hearts
    ADD CONSTRAINT vibe_hearts_pkey PRIMARY KEY (id);


--
-- Name: vibe_hearts vibe_hearts_unique_comment; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_hearts
    ADD CONSTRAINT vibe_hearts_unique_comment UNIQUE (user_id, comment_id);


--
-- Name: vibe_hearts vibe_hearts_unique_post; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_hearts
    ADD CONSTRAINT vibe_hearts_unique_post UNIQUE (user_id, post_id);


--
-- Name: vibe_posts vibe_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_posts
    ADD CONSTRAINT vibe_posts_pkey PRIMARY KEY (id);


--
-- Name: vibrational_event_sources vibrational_event_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibrational_event_sources
    ADD CONSTRAINT vibrational_event_sources_pkey PRIMARY KEY (id);


--
-- Name: vibrational_event_sources vibrational_event_sources_source_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibrational_event_sources
    ADD CONSTRAINT vibrational_event_sources_source_key_key UNIQUE (source_key);


--
-- Name: vibrational_events vibrational_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibrational_events
    ADD CONSTRAINT vibrational_events_pkey PRIMARY KEY (id);


--
-- Name: vibrational_links vibrational_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibrational_links
    ADD CONSTRAINT vibrational_links_pkey PRIMARY KEY (id);


--
-- Name: vibrational_links vibrational_links_user_id_category_a_category_b_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibrational_links
    ADD CONSTRAINT vibrational_links_user_id_category_a_category_b_key UNIQUE (user_id, category_a, category_b);


--
-- Name: video_mapping video_mapping_original_s3_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_mapping
    ADD CONSTRAINT video_mapping_original_s3_key_key UNIQUE (original_s3_key);


--
-- Name: video_mapping video_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_mapping
    ADD CONSTRAINT video_mapping_pkey PRIMARY KEY (id);


--
-- Name: video_session_messages video_session_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_messages
    ADD CONSTRAINT video_session_messages_pkey PRIMARY KEY (id);


--
-- Name: video_session_participants video_session_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_participants
    ADD CONSTRAINT video_session_participants_pkey PRIMARY KEY (id);


--
-- Name: video_session_participants video_session_participants_session_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_participants
    ADD CONSTRAINT video_session_participants_session_id_user_id_key UNIQUE (session_id, user_id);


--
-- Name: video_session_recordings video_session_recordings_daily_recording_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_recordings
    ADD CONSTRAINT video_session_recordings_daily_recording_id_key UNIQUE (daily_recording_id);


--
-- Name: video_session_recordings video_session_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_recordings
    ADD CONSTRAINT video_session_recordings_pkey PRIMARY KEY (id);


--
-- Name: video_sessions video_sessions_daily_room_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sessions
    ADD CONSTRAINT video_sessions_daily_room_name_key UNIQUE (daily_room_name);


--
-- Name: video_sessions video_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sessions
    ADD CONSTRAINT video_sessions_pkey PRIMARY KEY (id);


--
-- Name: vision_board_ideas vision_board_ideas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_board_ideas
    ADD CONSTRAINT vision_board_ideas_pkey PRIMARY KEY (id);


--
-- Name: vision_board_items vision_board_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_board_items
    ADD CONSTRAINT vision_board_items_pkey PRIMARY KEY (id);


--
-- Name: vision_focus vision_focus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_focus
    ADD CONSTRAINT vision_focus_pkey PRIMARY KEY (id);


--
-- Name: vision_generation_batches vision_generation_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_generation_batches
    ADD CONSTRAINT vision_generation_batches_pkey PRIMARY KEY (id);


--
-- Name: vision_new_category_state vision_new_category_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_new_category_state
    ADD CONSTRAINT vision_new_category_state_pkey PRIMARY KEY (id);


--
-- Name: vision_new_category_state vision_new_category_state_user_id_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_new_category_state
    ADD CONSTRAINT vision_new_category_state_user_id_category_key UNIQUE (user_id, category);


--
-- Name: vision_progress vision_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_progress
    ADD CONSTRAINT vision_progress_pkey PRIMARY KEY (id);


--
-- Name: vision_progress vision_progress_vision_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_progress
    ADD CONSTRAINT vision_progress_vision_id_key UNIQUE (vision_id);


--
-- Name: vision_refinements vision_refinements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_refinements
    ADD CONSTRAINT vision_refinements_pkey PRIMARY KEY (id);


--
-- Name: vision_versions vision_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_versions
    ADD CONSTRAINT vision_versions_pkey PRIMARY KEY (id);


--
-- Name: visitors visitors_fingerprint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitors
    ADD CONSTRAINT visitors_fingerprint_key UNIQUE (fingerprint);


--
-- Name: visitors visitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitors
    ADD CONSTRAINT visitors_pkey PRIMARY KEY (id);


--
-- Name: viva_conversations viva_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_conversations
    ADD CONSTRAINT viva_conversations_pkey PRIMARY KEY (id);


--
-- Name: voice_profiles voice_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_profiles
    ADD CONSTRAINT voice_profiles_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_02_22 messages_2026_02_22_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_02_22
    ADD CONSTRAINT messages_2026_02_22_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_02_24 messages_2026_02_24_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_02_24
    ADD CONSTRAINT messages_2026_02_24_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_02_25 messages_2026_02_25_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_02_25
    ADD CONSTRAINT messages_2026_02_25_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_02_26 messages_2026_02_26_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_02_26
    ADD CONSTRAINT messages_2026_02_26_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_02_27 messages_2026_02_27_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_02_27
    ADD CONSTRAINT messages_2026_02_27_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_02_28 messages_2026_02_28_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_02_28
    ADD CONSTRAINT messages_2026_02_28_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_abundance_events_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_abundance_events_user_date ON public.abundance_events USING btree (user_id, date DESC);


--
-- Name: idx_activity_engagement_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_engagement_status ON public.user_activity_metrics USING btree (engagement_status);


--
-- Name: idx_activity_health_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_health_status ON public.user_activity_metrics USING btree (health_status);


--
-- Name: idx_activity_last_login; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_last_login ON public.user_activity_metrics USING btree (last_login_at DESC);


--
-- Name: idx_activity_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_tags ON public.user_activity_metrics USING gin (custom_tags);


--
-- Name: idx_activity_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_user_id ON public.user_activity_metrics USING btree (user_id);


--
-- Name: idx_ai_conversations_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_conversation_id ON public.ai_conversations USING btree (conversation_id);


--
-- Name: idx_ai_conversations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_created_at ON public.ai_conversations USING btree (created_at DESC);


--
-- Name: idx_ai_conversations_user_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_user_conversation ON public.ai_conversations USING btree (user_id, conversation_id, created_at);


--
-- Name: idx_ai_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations USING btree (user_id);


--
-- Name: idx_ai_tools_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_tools_active ON public.ai_tools USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_ai_tools_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_tools_key ON public.ai_tools USING btree (tool_key);


--
-- Name: idx_ai_tools_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_tools_model ON public.ai_tools USING btree (model_name);


--
-- Name: idx_assessment_insights_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_insights_assessment_id ON public.assessment_insights USING btree (assessment_id);


--
-- Name: idx_assessment_insights_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_insights_category ON public.assessment_insights USING btree (category);


--
-- Name: idx_assessment_responses_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_responses_assessment_id ON public.assessment_responses USING btree (assessment_id);


--
-- Name: idx_assessment_responses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_responses_category ON public.assessment_responses USING btree (category);


--
-- Name: idx_assessment_responses_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_responses_question_id ON public.assessment_responses USING btree (question_id);


--
-- Name: idx_assessment_results_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_results_created_at ON public.assessment_results USING btree (created_at DESC);


--
-- Name: idx_assessment_results_profile_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_results_profile_version ON public.assessment_results USING btree (profile_version_id);


--
-- Name: idx_assessment_results_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_results_status ON public.assessment_results USING btree (status);


--
-- Name: idx_assessment_results_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_results_user_id ON public.assessment_results USING btree (user_id);


--
-- Name: idx_assessment_results_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_results_user_status ON public.assessment_results USING btree (user_id, status);


--
-- Name: idx_audio_background_tracks_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_background_tracks_active ON public.audio_background_tracks USING btree (is_active);


--
-- Name: idx_audio_background_tracks_brainwave; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_background_tracks_brainwave ON public.audio_background_tracks USING btree (brainwave_hz) WHERE (brainwave_hz IS NOT NULL);


--
-- Name: idx_audio_background_tracks_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_background_tracks_category ON public.audio_background_tracks USING btree (category);


--
-- Name: idx_audio_background_tracks_frequency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_background_tracks_frequency ON public.audio_background_tracks USING btree (frequency_hz) WHERE (frequency_hz IS NOT NULL);


--
-- Name: idx_audio_background_tracks_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_background_tracks_sort ON public.audio_background_tracks USING btree (sort_order);


--
-- Name: idx_audio_batches_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_batches_created_at ON public.audio_generation_batches USING btree (created_at DESC);


--
-- Name: idx_audio_batches_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_batches_status ON public.audio_generation_batches USING btree (status, created_at DESC);


--
-- Name: idx_audio_batches_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_batches_user_status ON public.audio_generation_batches USING btree (user_id, status, created_at DESC);


--
-- Name: idx_audio_batches_user_vision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_batches_user_vision ON public.audio_generation_batches USING btree (user_id, vision_id);


--
-- Name: idx_audio_mix_ratios_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_mix_ratios_active ON public.audio_mix_ratios USING btree (is_active);


--
-- Name: idx_audio_mix_ratios_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_mix_ratios_sort ON public.audio_mix_ratios USING btree (sort_order);


--
-- Name: idx_audio_recommended_combos_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_recommended_combos_active ON public.audio_recommended_combos USING btree (is_active);


--
-- Name: idx_audio_recommended_combos_binaural; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_recommended_combos_binaural ON public.audio_recommended_combos USING btree (binaural_track_id) WHERE (binaural_track_id IS NOT NULL);


--
-- Name: idx_audio_recommended_combos_ratio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_recommended_combos_ratio ON public.audio_recommended_combos USING btree (mix_ratio_id);


--
-- Name: idx_audio_recommended_combos_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_recommended_combos_sort ON public.audio_recommended_combos USING btree (sort_order);


--
-- Name: idx_audio_recommended_combos_track; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_recommended_combos_track ON public.audio_recommended_combos USING btree (background_track_id);


--
-- Name: idx_audio_sets_content; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_sets_content ON public.audio_sets USING btree (content_type, content_id) WHERE (content_id IS NOT NULL);


--
-- Name: idx_audio_sets_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_sets_is_active ON public.audio_sets USING btree (is_active);


--
-- Name: idx_audio_sets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_sets_user_id ON public.audio_sets USING btree (user_id);


--
-- Name: idx_audio_sets_variant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_sets_variant ON public.audio_sets USING btree (variant);


--
-- Name: idx_audio_sets_vision_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_sets_vision_id ON public.audio_sets USING btree (vision_id);


--
-- Name: idx_audio_tracks_audio_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_tracks_audio_set_id ON public.audio_tracks USING btree (audio_set_id);


--
-- Name: idx_audio_tracks_content; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_tracks_content ON public.audio_tracks USING btree (content_type);


--
-- Name: idx_audio_tracks_play_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_tracks_play_count ON public.audio_tracks USING btree (user_id, play_count);


--
-- Name: idx_audio_tracks_section_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_tracks_section_key ON public.audio_tracks USING btree (section_key);


--
-- Name: idx_audio_tracks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_tracks_status ON public.audio_tracks USING btree (status);


--
-- Name: idx_audio_tracks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_tracks_user_id ON public.audio_tracks USING btree (user_id);


--
-- Name: idx_audio_tracks_vision_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_tracks_vision_id ON public.audio_tracks USING btree (vision_id);


--
-- Name: idx_audio_tracks_vision_id_audio_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_tracks_vision_id_audio_set_id ON public.audio_tracks USING btree (vision_id, audio_set_id);


--
-- Name: idx_audio_variants_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_variants_id ON public.audio_variants USING btree (id);


--
-- Name: idx_audio_voice_clones_elevenlabs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_voice_clones_elevenlabs_id ON public.audio_voice_clones USING btree (elevenlabs_voice_id);


--
-- Name: idx_audio_voice_clones_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_audio_voice_clones_user_active ON public.audio_voice_clones USING btree (user_id) WHERE (is_active = true);


--
-- Name: idx_audio_voice_clones_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_voice_clones_user_id ON public.audio_voice_clones USING btree (user_id);


--
-- Name: idx_automation_rules_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_rules_event ON public.automation_rules USING btree (event_name, status);


--
-- Name: idx_automation_rules_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_automation_rules_status ON public.automation_rules USING btree (status);


--
-- Name: idx_bookings_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_event_type ON public.bookings USING btree (event_type);


--
-- Name: idx_bookings_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_scheduled_at ON public.bookings USING btree (scheduled_at);


--
-- Name: idx_bookings_staff_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_staff_id ON public.bookings USING btree (staff_id);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);


--
-- Name: idx_calendar_events_blocks; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_blocks ON public.calendar_events USING btree (staff_id, scheduled_at, end_at) WHERE ((blocks_availability = true) AND (status <> 'cancelled'::text));


--
-- Name: idx_calendar_events_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_booking_id ON public.calendar_events USING btree (booking_id);


--
-- Name: idx_calendar_events_end_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_end_at ON public.calendar_events USING btree (end_at);


--
-- Name: idx_calendar_events_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_scheduled_at ON public.calendar_events USING btree (scheduled_at);


--
-- Name: idx_calendar_events_staff_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_staff_id ON public.calendar_events USING btree (staff_id);


--
-- Name: idx_campaigns_campaign_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_campaign_type ON public.marketing_campaigns USING btree (campaign_type);


--
-- Name: idx_campaigns_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_created_by ON public.marketing_campaigns USING btree (created_by);


--
-- Name: idx_campaigns_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_dates ON public.marketing_campaigns USING btree (start_date, end_date);


--
-- Name: idx_campaigns_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_slug ON public.marketing_campaigns USING btree (slug);


--
-- Name: idx_campaigns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_status ON public.marketing_campaigns USING btree (status);


--
-- Name: idx_cart_sessions_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_sessions_email ON public.cart_sessions USING btree (email);


--
-- Name: idx_cart_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_sessions_status ON public.cart_sessions USING btree (status);


--
-- Name: idx_cart_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_sessions_user_id ON public.cart_sessions USING btree (user_id);


--
-- Name: idx_cart_sessions_visitor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_sessions_visitor_id ON public.cart_sessions USING btree (visitor_id);


--
-- Name: idx_conversation_sessions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_sessions_category ON public.conversation_sessions USING btree (category);


--
-- Name: idx_conversation_sessions_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_sessions_updated_at ON public.conversation_sessions USING btree (updated_at DESC);


--
-- Name: idx_conversation_sessions_user_category_vision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_sessions_user_category_vision ON public.conversation_sessions USING btree (user_id, category, vision_id);


--
-- Name: idx_conversation_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_sessions_user_id ON public.conversation_sessions USING btree (user_id);


--
-- Name: idx_conversation_sessions_user_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_sessions_user_updated ON public.conversation_sessions USING btree (user_id, updated_at DESC);


--
-- Name: idx_conversation_sessions_vision_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_sessions_vision_id ON public.conversation_sessions USING btree (vision_id);


--
-- Name: idx_coupon_codes_batch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_codes_batch_id ON public.coupon_codes USING btree (batch_id) WHERE (batch_id IS NOT NULL);


--
-- Name: idx_coupon_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_codes_code ON public.coupon_codes USING btree (code);


--
-- Name: idx_coupon_codes_coupon_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_codes_coupon_id ON public.coupon_codes USING btree (coupon_id);


--
-- Name: idx_coupon_redemptions_code_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_redemptions_code_id ON public.coupon_redemptions USING btree (coupon_code_id);


--
-- Name: idx_coupon_redemptions_coupon_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_redemptions_coupon_id ON public.coupon_redemptions USING btree (coupon_id);


--
-- Name: idx_coupon_redemptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_redemptions_user_id ON public.coupon_redemptions USING btree (user_id);


--
-- Name: idx_coupons_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupons_active ON public.coupons USING btree (is_active);


--
-- Name: idx_coupons_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupons_campaign_id ON public.coupons USING btree (campaign_id);


--
-- Name: idx_customer_subscriptions_promo_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_subscriptions_promo_code ON public.customer_subscriptions USING btree (promo_code) WHERE (promo_code IS NOT NULL);


--
-- Name: idx_customer_subscriptions_referral_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_subscriptions_referral_source ON public.customer_subscriptions USING btree (referral_source) WHERE (referral_source IS NOT NULL);


--
-- Name: idx_customer_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_subscriptions_status ON public.customer_subscriptions USING btree (status);


--
-- Name: idx_customer_subscriptions_stripe_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_subscriptions_stripe_customer ON public.customer_subscriptions USING btree (stripe_customer_id);


--
-- Name: idx_customer_subscriptions_stripe_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_subscriptions_stripe_subscription ON public.customer_subscriptions USING btree (stripe_subscription_id);


--
-- Name: idx_customer_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_subscriptions_user_id ON public.customer_subscriptions USING btree (user_id);


--
-- Name: idx_customers_first_utm_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_first_utm_source ON public.customers USING btree (first_utm_source);


--
-- Name: idx_customers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_status ON public.customers USING btree (status);


--
-- Name: idx_customers_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_stripe_customer_id ON public.customers USING btree (stripe_customer_id);


--
-- Name: idx_customers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_user_id ON public.customers USING btree (user_id);


--
-- Name: idx_customers_visitor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_visitor_id ON public.customers USING btree (visitor_id);


--
-- Name: idx_daily_papers_user_entry_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_papers_user_entry_date ON public.daily_papers USING btree (user_id, entry_date DESC);


--
-- Name: idx_email_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_created_at ON public.email_messages USING btree (created_at DESC);


--
-- Name: idx_email_direction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_direction ON public.email_messages USING btree (direction);


--
-- Name: idx_email_imap_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_imap_id ON public.email_messages USING btree (imap_message_id);


--
-- Name: idx_email_messages_from_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_from_email ON public.email_messages USING btree (from_email);


--
-- Name: idx_email_messages_guest_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_guest_email ON public.email_messages USING btree (guest_email);


--
-- Name: idx_email_messages_imap_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_imap_message_id ON public.email_messages USING btree (imap_message_id);


--
-- Name: idx_email_messages_imap_message_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_email_messages_imap_message_id_unique ON public.email_messages USING btree (imap_message_id) WHERE (imap_message_id IS NOT NULL);


--
-- Name: idx_email_messages_imap_uid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_imap_uid ON public.email_messages USING btree (imap_uid);


--
-- Name: idx_email_messages_is_reply; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_is_reply ON public.email_messages USING btree (is_reply);


--
-- Name: idx_email_messages_ses_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_ses_message_id ON public.email_messages USING btree (ses_message_id);


--
-- Name: idx_email_messages_ses_message_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_email_messages_ses_message_id_unique ON public.email_messages USING btree (ses_message_id) WHERE (ses_message_id IS NOT NULL);


--
-- Name: idx_email_messages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_status ON public.email_messages USING btree (status);


--
-- Name: idx_email_messages_to_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_to_email ON public.email_messages USING btree (to_email);


--
-- Name: idx_email_ses_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_ses_id ON public.email_messages USING btree (ses_message_id);


--
-- Name: idx_email_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_category ON public.email_templates USING btree (category);


--
-- Name: idx_email_templates_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_slug ON public.email_templates USING btree (slug);


--
-- Name: idx_email_templates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_status ON public.email_templates USING btree (status);


--
-- Name: idx_email_thread_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_thread_id ON public.email_messages USING btree (thread_id);


--
-- Name: idx_email_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_user_id ON public.email_messages USING btree (user_id);


--
-- Name: idx_emotional_snapshots_user_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emotional_snapshots_user_category ON public.emotional_snapshots USING btree (user_id, category);


--
-- Name: idx_frequency_flip_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequency_flip_category ON public.frequency_flip USING btree (category);


--
-- Name: idx_frequency_flip_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequency_flip_created_at ON public.frequency_flip USING btree (created_at DESC);


--
-- Name: idx_frequency_flip_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequency_flip_user_id ON public.frequency_flip USING btree (user_id);


--
-- Name: idx_frequency_flip_vision_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequency_flip_vision_id ON public.frequency_flip USING btree (vision_id);


--
-- Name: idx_household_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_household_invitations_email ON public.household_invitations USING btree (invited_email);


--
-- Name: idx_household_invitations_household_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_household_invitations_household_id ON public.household_invitations USING btree (household_id);


--
-- Name: idx_household_invitations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_household_invitations_status ON public.household_invitations USING btree (status);


--
-- Name: idx_household_invitations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_household_invitations_token ON public.household_invitations USING btree (invitation_token);


--
-- Name: idx_household_members_household_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_household_members_household_id ON public.household_members USING btree (household_id);


--
-- Name: idx_household_members_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_household_members_status ON public.household_members USING btree (status);


--
-- Name: idx_household_members_user_household; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_household_members_user_household ON public.household_members USING btree (user_id, household_id) WHERE (status = 'active'::text);


--
-- Name: idx_household_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_household_members_user_id ON public.household_members USING btree (user_id);


--
-- Name: idx_households_admin_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_households_admin_user_id ON public.households USING btree (admin_user_id);


--
-- Name: idx_households_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_households_stripe_customer_id ON public.households USING btree (stripe_customer_id);


--
-- Name: idx_households_subscription_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_households_subscription_status ON public.households USING btree (subscription_status);


--
-- Name: idx_intensive_checklist_intensive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intensive_checklist_intensive ON public.intensive_checklist USING btree (intensive_id);


--
-- Name: idx_intensive_checklist_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intensive_checklist_user ON public.intensive_checklist USING btree (user_id);


--
-- Name: idx_intensive_checklist_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intensive_checklist_user_status ON public.intensive_checklist USING btree (user_id, status);


--
-- Name: idx_intensive_responses_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intensive_responses_created_at ON public.intensive_responses USING btree (created_at);


--
-- Name: idx_intensive_responses_intensive_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intensive_responses_intensive_id ON public.intensive_responses USING btree (intensive_id);


--
-- Name: idx_intensive_responses_phase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intensive_responses_phase ON public.intensive_responses USING btree (phase);


--
-- Name: idx_intensive_responses_soundbites; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intensive_responses_soundbites ON public.intensive_responses USING gin (calibration_soundbites jsonb_path_ops);


--
-- Name: idx_intensive_responses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intensive_responses_user_id ON public.intensive_responses USING btree (user_id);


--
-- Name: idx_journey_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journey_events_created_at ON public.journey_events USING btree (created_at);


--
-- Name: idx_journey_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journey_events_event_type ON public.journey_events USING btree (event_type);


--
-- Name: idx_journey_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journey_events_user_id ON public.journey_events USING btree (user_id);


--
-- Name: idx_journey_events_visitor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journey_events_visitor_id ON public.journey_events USING btree (visitor_id);


--
-- Name: idx_leads_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_campaign_id ON public.leads USING btree (campaign_id);


--
-- Name: idx_leads_converted_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_converted_user ON public.leads USING btree (converted_to_user_id);


--
-- Name: idx_leads_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);


--
-- Name: idx_leads_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_phone ON public.leads USING btree (phone);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- Name: idx_leads_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_type ON public.leads USING btree (type);


--
-- Name: idx_leads_utm_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_utm_campaign ON public.leads USING btree (utm_campaign);


--
-- Name: idx_media_metadata_bucket; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_metadata_bucket ON public.media_metadata USING btree (bucket);


--
-- Name: idx_media_metadata_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_metadata_category ON public.media_metadata USING btree (category);


--
-- Name: idx_media_metadata_file_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_metadata_file_type ON public.media_metadata USING btree (file_type);


--
-- Name: idx_media_metadata_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_metadata_folder ON public.media_metadata USING btree (folder);


--
-- Name: idx_media_metadata_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_metadata_tags ON public.media_metadata USING gin (tags);


--
-- Name: idx_media_metadata_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_metadata_user_id ON public.media_metadata USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_membership_tiers_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_membership_tiers_active ON public.membership_tiers USING btree (is_active);


--
-- Name: idx_membership_tiers_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_membership_tiers_type ON public.membership_tiers USING btree (tier_type);


--
-- Name: idx_message_send_log_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_send_log_entity ON public.message_send_log USING btree (related_entity_type, related_entity_id);


--
-- Name: idx_message_send_log_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_send_log_recipient ON public.message_send_log USING btree (recipient_user_id);


--
-- Name: idx_message_send_log_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_send_log_sent ON public.message_send_log USING btree (sent_at);


--
-- Name: idx_message_send_log_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_send_log_template ON public.message_send_log USING btree (template_slug);


--
-- Name: idx_message_send_log_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_send_log_type ON public.message_send_log USING btree (message_type);


--
-- Name: idx_messaging_campaigns_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messaging_campaigns_scheduled ON public.messaging_campaigns USING btree (scheduled_for) WHERE (status = 'scheduled'::text);


--
-- Name: idx_messaging_campaigns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messaging_campaigns_status ON public.messaging_campaigns USING btree (status);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- Name: idx_order_items_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_started_at ON public.order_items USING btree (started_at);


--
-- Name: idx_order_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_status ON public.order_items USING btree (completion_status);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_page_views_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_session_id ON public.page_views USING btree (session_id);


--
-- Name: idx_page_views_visitor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_visitor_id ON public.page_views USING btree (visitor_id);


--
-- Name: idx_payment_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_created_at ON public.payment_history USING btree (created_at DESC);


--
-- Name: idx_payment_history_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_subscription_id ON public.payment_history USING btree (subscription_id);


--
-- Name: idx_payment_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_user_id ON public.payment_history USING btree (user_id);


--
-- Name: idx_product_prices_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_prices_active ON public.product_prices USING btree (is_active);


--
-- Name: idx_product_prices_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_prices_product_id ON public.product_prices USING btree (product_id);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active);


--
-- Name: idx_products_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_type ON public.products USING btree (product_type);


--
-- Name: idx_refinements_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refinements_category ON public.refinements USING btree (category);


--
-- Name: idx_refinements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refinements_created_at ON public.refinements USING btree (created_at);


--
-- Name: idx_refinements_operation_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refinements_operation_type ON public.refinements USING btree (operation_type);


--
-- Name: idx_refinements_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refinements_user_id ON public.refinements USING btree (user_id);


--
-- Name: idx_refinements_vision_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refinements_vision_id ON public.refinements USING btree (vision_id);


--
-- Name: idx_scenes_category_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scenes_category_created_at ON public.scenes USING btree (category, created_at DESC);


--
-- Name: idx_scenes_user_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scenes_user_category ON public.scenes USING btree (user_id, category);


--
-- Name: idx_scheduled_messages_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_messages_entity ON public.scheduled_messages USING btree (related_entity_type, related_entity_id);


--
-- Name: idx_scheduled_messages_scheduled_for; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_messages_scheduled_for ON public.scheduled_messages USING btree (scheduled_for);


--
-- Name: idx_scheduled_messages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_messages_status ON public.scheduled_messages USING btree (status);


--
-- Name: idx_sequence_enrollments_next; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sequence_enrollments_next ON public.sequence_enrollments USING btree (status, next_step_at) WHERE (status = 'active'::text);


--
-- Name: idx_sequence_enrollments_sequence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sequence_enrollments_sequence ON public.sequence_enrollments USING btree (sequence_id, status);


--
-- Name: idx_sequence_enrollments_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sequence_enrollments_unique ON public.sequence_enrollments USING btree (sequence_id, email) WHERE (status = 'active'::text);


--
-- Name: idx_sequence_enrollments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sequence_enrollments_user ON public.sequence_enrollments USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_sequence_steps_sequence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sequence_steps_sequence ON public.sequence_steps USING btree (sequence_id, step_order);


--
-- Name: idx_sequences_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sequences_status ON public.sequences USING btree (status);


--
-- Name: idx_sequences_trigger; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sequences_trigger ON public.sequences USING btree (trigger_event, status);


--
-- Name: idx_sessions_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_started_at ON public.sessions USING btree (started_at);


--
-- Name: idx_sessions_utm_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_utm_source ON public.sessions USING btree (utm_source);


--
-- Name: idx_sessions_visitor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_visitor_id ON public.sessions USING btree (visitor_id);


--
-- Name: idx_sms_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_created_at ON public.sms_messages USING btree (created_at DESC);


--
-- Name: idx_sms_from_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_from_number ON public.sms_messages USING btree (from_number);


--
-- Name: idx_sms_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_lead_id ON public.sms_messages USING btree (lead_id);


--
-- Name: idx_sms_messages_twilio_sid_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sms_messages_twilio_sid_unique ON public.sms_messages USING btree (twilio_sid) WHERE (twilio_sid IS NOT NULL);


--
-- Name: idx_sms_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_templates_category ON public.sms_templates USING btree (category);


--
-- Name: idx_sms_templates_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_templates_slug ON public.sms_templates USING btree (slug);


--
-- Name: idx_sms_templates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_templates_status ON public.sms_templates USING btree (status);


--
-- Name: idx_sms_ticket_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_ticket_id ON public.sms_messages USING btree (ticket_id);


--
-- Name: idx_sms_to_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_to_number ON public.sms_messages USING btree (to_number);


--
-- Name: idx_sms_twilio_sid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_twilio_sid ON public.sms_messages USING btree (twilio_sid);


--
-- Name: idx_sms_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_user_id ON public.sms_messages USING btree (user_id);


--
-- Name: idx_staff_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_department ON public.staff USING btree (department) WHERE (department IS NOT NULL);


--
-- Name: idx_staff_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_is_active ON public.staff USING btree (is_active);


--
-- Name: idx_staff_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_user_id ON public.staff USING btree (user_id);


--
-- Name: idx_stories_audio_set; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_audio_set ON public.stories USING btree (audio_set_id) WHERE (audio_set_id IS NOT NULL);


--
-- Name: idx_stories_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_entity ON public.stories USING btree (entity_type, entity_id);


--
-- Name: idx_stories_entity_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_entity_created ON public.stories USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: idx_stories_entity_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_entity_order ON public.stories USING btree (entity_type, entity_id, display_order);


--
-- Name: idx_stories_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_status ON public.stories USING btree (status) WHERE (status <> 'completed'::text);


--
-- Name: idx_stories_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_user ON public.stories USING btree (user_id);


--
-- Name: idx_stories_user_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stories_user_entity_type ON public.stories USING btree (user_id, entity_type);


--
-- Name: idx_ticket_replies_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_replies_created_at ON public.support_ticket_replies USING btree (created_at);


--
-- Name: idx_ticket_replies_ticket_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_replies_ticket_id ON public.support_ticket_replies USING btree (ticket_id);


--
-- Name: idx_ticket_replies_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_replies_user_id ON public.support_ticket_replies USING btree (user_id);


--
-- Name: idx_tickets_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_assigned_to ON public.support_tickets USING btree (assigned_to);


--
-- Name: idx_tickets_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_created_at ON public.support_tickets USING btree (created_at DESC);


--
-- Name: idx_tickets_guest_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_guest_email ON public.support_tickets USING btree (guest_email);


--
-- Name: idx_tickets_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_priority ON public.support_tickets USING btree (priority);


--
-- Name: idx_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_tickets_ticket_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_ticket_number ON public.support_tickets USING btree (ticket_number);


--
-- Name: idx_tickets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_user_id ON public.support_tickets USING btree (user_id);


--
-- Name: idx_token_transactions_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_transactions_action_type ON public.token_transactions USING btree (action_type);


--
-- Name: idx_token_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_transactions_created_at ON public.token_transactions USING btree (created_at DESC);


--
-- Name: idx_token_transactions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_transactions_expires_at ON public.token_transactions USING btree (user_id, expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_token_transactions_stripe_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_transactions_stripe_payment ON public.token_transactions USING btree (stripe_payment_intent_id) WHERE (stripe_payment_intent_id IS NOT NULL);


--
-- Name: idx_token_transactions_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_transactions_subscription ON public.token_transactions USING btree (subscription_id) WHERE (subscription_id IS NOT NULL);


--
-- Name: idx_token_transactions_user_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_transactions_user_action ON public.token_transactions USING btree (user_id, action_type);


--
-- Name: idx_token_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_transactions_user_id ON public.token_transactions USING btree (user_id);


--
-- Name: idx_token_usage_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_action_type ON public.token_usage USING btree (action_type);


--
-- Name: idx_token_usage_calculated_cost; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_calculated_cost ON public.token_usage USING btree (calculated_cost_cents) WHERE (calculated_cost_cents IS NOT NULL);


--
-- Name: idx_token_usage_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_created_at ON public.token_usage USING btree (created_at DESC);


--
-- Name: idx_token_usage_created_at_reconciliation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_created_at_reconciliation ON public.token_usage USING btree (created_at) WHERE (openai_request_id IS NOT NULL);


--
-- Name: idx_token_usage_discrepancies; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_discrepancies ON public.token_usage USING btree (reconciliation_status, created_at) WHERE (reconciliation_status = 'discrepancy'::text);


--
-- Name: idx_token_usage_model_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_model_used ON public.token_usage USING btree (model_used);


--
-- Name: idx_token_usage_openai_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_openai_request_id ON public.token_usage USING btree (openai_request_id) WHERE (openai_request_id IS NOT NULL);


--
-- Name: idx_token_usage_reconciliation_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_reconciliation_status ON public.token_usage USING btree (reconciliation_status) WHERE (reconciliation_status = 'pending'::text);


--
-- Name: idx_token_usage_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_user_created ON public.token_usage USING btree (user_id, created_at DESC);


--
-- Name: idx_token_usage_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_usage_user_id ON public.token_usage USING btree (user_id);


--
-- Name: idx_tracking_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tracking_events_created_at ON public.lead_tracking_events USING btree (created_at DESC);


--
-- Name: idx_tracking_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tracking_events_event_type ON public.lead_tracking_events USING btree (event_type);


--
-- Name: idx_tracking_events_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tracking_events_lead_id ON public.lead_tracking_events USING btree (lead_id);


--
-- Name: idx_tracking_events_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tracking_events_session_id ON public.lead_tracking_events USING btree (session_id);


--
-- Name: idx_user_accounts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_accounts_email ON public.user_accounts USING btree (email);


--
-- Name: idx_user_accounts_household; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_accounts_household ON public.user_accounts USING btree (household_id);


--
-- Name: idx_user_accounts_household_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_accounts_household_admin ON public.user_accounts USING btree (is_household_admin) WHERE (is_household_admin = true);


--
-- Name: idx_user_accounts_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_accounts_phone ON public.user_accounts USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: idx_user_accounts_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_accounts_role ON public.user_accounts USING btree (role);


--
-- Name: idx_user_accounts_sms_opt_in; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_accounts_sms_opt_in ON public.user_accounts USING btree (sms_opt_in) WHERE (sms_opt_in = true);


--
-- Name: idx_user_badges_badge_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_badges_badge_type ON public.user_badges USING btree (badge_type);


--
-- Name: idx_user_badges_earned_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_badges_earned_at ON public.user_badges USING btree (earned_at DESC);


--
-- Name: idx_user_badges_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_badges_user_id ON public.user_badges USING btree (user_id);


--
-- Name: idx_user_community_stats_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_community_stats_user_id ON public.user_community_stats USING btree (user_id);


--
-- Name: idx_user_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_created_at ON public.user_profiles USING btree (created_at);


--
-- Name: idx_user_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_is_active ON public.user_profiles USING btree (user_id, is_active);


--
-- Name: idx_user_profiles_is_draft; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_is_draft ON public.user_profiles USING btree (user_id, is_draft);


--
-- Name: idx_user_profiles_one_active_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_profiles_one_active_per_user ON public.user_profiles USING btree (user_id) WHERE ((is_active = true) AND (is_draft = false));


--
-- Name: idx_user_profiles_one_draft_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_profiles_one_draft_per_user ON public.user_profiles USING btree (user_id) WHERE (is_draft = true);


--
-- Name: idx_user_profiles_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_parent_id ON public.user_profiles USING btree (parent_id);


--
-- Name: idx_user_profiles_parent_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_parent_version ON public.user_profiles USING btree (parent_version_id);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_user_storage_recent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_storage_recent ON public.user_storage USING btree (user_id, granted_at DESC);


--
-- Name: idx_user_storage_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_storage_user_id ON public.user_storage USING btree (user_id);


--
-- Name: idx_vibe_comments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_comments_created_at ON public.vibe_comments USING btree (created_at DESC);


--
-- Name: idx_vibe_comments_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_comments_not_deleted ON public.vibe_comments USING btree (is_deleted) WHERE (is_deleted = false);


--
-- Name: idx_vibe_comments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_comments_parent_id ON public.vibe_comments USING btree (parent_comment_id);


--
-- Name: idx_vibe_comments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_comments_post_id ON public.vibe_comments USING btree (post_id);


--
-- Name: idx_vibe_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_comments_user_id ON public.vibe_comments USING btree (user_id);


--
-- Name: idx_vibe_hearts_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_hearts_comment_id ON public.vibe_hearts USING btree (comment_id) WHERE (comment_id IS NOT NULL);


--
-- Name: idx_vibe_hearts_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_hearts_post_id ON public.vibe_hearts USING btree (post_id) WHERE (post_id IS NOT NULL);


--
-- Name: idx_vibe_hearts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_hearts_user_id ON public.vibe_hearts USING btree (user_id);


--
-- Name: idx_vibe_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_posts_created_at ON public.vibe_posts USING btree (created_at DESC);


--
-- Name: idx_vibe_posts_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_posts_not_deleted ON public.vibe_posts USING btree (is_deleted) WHERE (is_deleted = false);


--
-- Name: idx_vibe_posts_tag_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_posts_tag_created ON public.vibe_posts USING btree (vibe_tag, created_at DESC) WHERE (is_deleted = false);


--
-- Name: idx_vibe_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_posts_user_id ON public.vibe_posts USING btree (user_id);


--
-- Name: idx_vibe_posts_vibe_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibe_posts_vibe_tag ON public.vibe_posts USING btree (vibe_tag);


--
-- Name: idx_vibrational_event_sources_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibrational_event_sources_enabled ON public.vibrational_event_sources USING btree (enabled);


--
-- Name: idx_vibrational_event_sources_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibrational_event_sources_key ON public.vibrational_event_sources USING btree (source_key);


--
-- Name: idx_vibrational_events_category_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibrational_events_category_created_at ON public.vibrational_events USING btree (category, created_at DESC);


--
-- Name: idx_vibrational_events_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibrational_events_source ON public.vibrational_events USING btree (source_type, source_id);


--
-- Name: idx_vibrational_events_user_category_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibrational_events_user_category_created_at ON public.vibrational_events USING btree (user_id, category, created_at DESC);


--
-- Name: idx_vibrational_links_category_a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibrational_links_category_a ON public.vibrational_links USING btree (user_id, category_a);


--
-- Name: idx_vibrational_links_strength; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibrational_links_strength ON public.vibrational_links USING btree (user_id, strength DESC);


--
-- Name: idx_vibrational_links_themes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibrational_links_themes ON public.vibrational_links USING gin (shared_themes);


--
-- Name: idx_vibrational_links_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vibrational_links_user ON public.vibrational_links USING btree (user_id);


--
-- Name: idx_video_messages_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_messages_sent ON public.video_session_messages USING btree (sent_at);


--
-- Name: idx_video_messages_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_messages_session ON public.video_session_messages USING btree (session_id);


--
-- Name: idx_video_participants_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_participants_email ON public.video_session_participants USING btree (email);


--
-- Name: idx_video_participants_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_participants_phone ON public.video_session_participants USING btree (phone);


--
-- Name: idx_video_participants_rsvp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_participants_rsvp ON public.video_session_participants USING btree (session_id, rsvp_status);


--
-- Name: idx_video_participants_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_participants_session ON public.video_session_participants USING btree (session_id);


--
-- Name: idx_video_participants_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_participants_user ON public.video_session_participants USING btree (user_id);


--
-- Name: idx_video_recordings_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_recordings_session ON public.video_session_recordings USING btree (session_id);


--
-- Name: idx_video_recordings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_recordings_status ON public.video_session_recordings USING btree (status);


--
-- Name: idx_video_sessions_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sessions_booking_id ON public.video_sessions USING btree (booking_id);


--
-- Name: idx_video_sessions_daily_room; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sessions_daily_room ON public.video_sessions USING btree (daily_room_name);


--
-- Name: idx_video_sessions_highlighted_msg; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sessions_highlighted_msg ON public.video_sessions USING btree (highlighted_message_id) WHERE (highlighted_message_id IS NOT NULL);


--
-- Name: idx_video_sessions_host; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sessions_host ON public.video_sessions USING btree (host_user_id);


--
-- Name: idx_video_sessions_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sessions_scheduled ON public.video_sessions USING btree (scheduled_at);


--
-- Name: idx_video_sessions_staff_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sessions_staff_id ON public.video_sessions USING btree (staff_id);


--
-- Name: idx_video_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_sessions_status ON public.video_sessions USING btree (status);


--
-- Name: idx_vision_batches_processing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_batches_processing ON public.vision_generation_batches USING btree (status, updated_at) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text, 'retrying'::text]));


--
-- Name: idx_vision_batches_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_batches_status_created ON public.vision_generation_batches USING btree (status, created_at DESC);


--
-- Name: idx_vision_batches_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_vision_batches_user_active ON public.vision_generation_batches USING btree (user_id) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text, 'retrying'::text]));


--
-- Name: idx_vision_batches_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_batches_user_status ON public.vision_generation_batches USING btree (user_id, status);


--
-- Name: idx_vision_board_ideas_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_board_ideas_category ON public.vision_board_ideas USING btree (category);


--
-- Name: idx_vision_board_ideas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_board_ideas_status ON public.vision_board_ideas USING btree (status) WHERE (status = 'active'::text);


--
-- Name: idx_vision_board_ideas_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_board_ideas_user ON public.vision_board_ideas USING btree (user_id);


--
-- Name: idx_vision_board_ideas_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_board_ideas_user_active ON public.vision_board_ideas USING btree (user_id, status) WHERE (status = 'active'::text);


--
-- Name: idx_vision_board_ideas_vision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_board_ideas_vision ON public.vision_board_ideas USING btree (vision_version_id);


--
-- Name: idx_vision_focus_audio_set; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_focus_audio_set ON public.vision_focus USING btree (audio_set_id) WHERE (audio_set_id IS NOT NULL);


--
-- Name: idx_vision_focus_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_focus_status ON public.vision_focus USING btree (status);


--
-- Name: idx_vision_focus_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_focus_user ON public.vision_focus USING btree (user_id);


--
-- Name: idx_vision_focus_vision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_focus_vision ON public.vision_focus USING btree (vision_id);


--
-- Name: idx_vision_new_category_state_blueprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_new_category_state_blueprint ON public.vision_new_category_state USING gin (blueprint_data);


--
-- Name: idx_vision_new_category_state_clarity_keys; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_new_category_state_clarity_keys ON public.vision_new_category_state USING gin (clarity_keys);


--
-- Name: idx_vision_new_category_state_contrast_flips; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_new_category_state_contrast_flips ON public.vision_new_category_state USING gin (contrast_flips);


--
-- Name: idx_vision_new_category_state_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_new_category_state_created ON public.vision_new_category_state USING btree (created_at DESC);


--
-- Name: idx_vision_new_category_state_prompts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_new_category_state_prompts ON public.vision_new_category_state USING gin (ideal_state_prompts);


--
-- Name: idx_vision_new_category_state_user_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_new_category_state_user_category ON public.vision_new_category_state USING btree (user_id, category);


--
-- Name: idx_vision_progress_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_progress_user_id ON public.vision_progress USING btree (user_id);


--
-- Name: idx_vision_progress_vision_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_progress_vision_id ON public.vision_progress USING btree (vision_id);


--
-- Name: idx_vision_refinements_applied; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_refinements_applied ON public.vision_refinements USING btree (applied) WHERE (applied = false);


--
-- Name: idx_vision_refinements_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_refinements_category ON public.vision_refinements USING btree (category);


--
-- Name: idx_vision_refinements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_refinements_created_at ON public.vision_refinements USING btree (created_at DESC);


--
-- Name: idx_vision_refinements_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_refinements_user_id ON public.vision_refinements USING btree (user_id);


--
-- Name: idx_vision_refinements_user_vision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_refinements_user_vision ON public.vision_refinements USING btree (user_id, vision_id);


--
-- Name: idx_vision_refinements_vision_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_refinements_vision_id ON public.vision_refinements USING btree (vision_id);


--
-- Name: idx_vision_versions_household_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_versions_household_id ON public.vision_versions USING btree (household_id);


--
-- Name: idx_vision_versions_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_versions_is_active ON public.vision_versions USING btree (user_id, is_active);


--
-- Name: idx_vision_versions_is_draft; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_versions_is_draft ON public.vision_versions USING btree (user_id, is_draft);


--
-- Name: idx_vision_versions_parent_draft_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_versions_parent_draft_lookup ON public.vision_versions USING btree (parent_id, is_draft) WHERE (is_draft = true);


--
-- Name: idx_vision_versions_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_versions_parent_id ON public.vision_versions USING btree (parent_id);


--
-- Name: idx_vision_versions_perspective; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_versions_perspective ON public.vision_versions USING btree (perspective);


--
-- Name: idx_vision_versions_refined_categories; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_versions_refined_categories ON public.vision_versions USING gin (refined_categories);


--
-- Name: idx_vision_versions_richness_metadata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_versions_richness_metadata ON public.vision_versions USING gin (richness_metadata);


--
-- Name: idx_visitors_fingerprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitors_fingerprint ON public.visitors USING btree (fingerprint);


--
-- Name: idx_visitors_first_seen_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitors_first_seen_at ON public.visitors USING btree (first_seen_at);


--
-- Name: idx_visitors_first_utm_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitors_first_utm_source ON public.visitors USING btree (first_utm_source);


--
-- Name: idx_visitors_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitors_user_id ON public.visitors USING btree (user_id);


--
-- Name: idx_viva_conversations_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viva_conversations_session ON public.viva_conversations USING btree (session_id);


--
-- Name: idx_viva_conversations_user_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viva_conversations_user_category ON public.viva_conversations USING btree (user_id, category);


--
-- Name: idx_voice_profiles_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_voice_profiles_user_active ON public.voice_profiles USING btree (user_id) WHERE is_active;


--
-- Name: idx_voice_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_voice_profiles_user_id ON public.voice_profiles USING btree (user_id);


--
-- Name: unique_active_assessment_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_active_assessment_per_user ON public.assessment_results USING btree (user_id) WHERE is_active;


--
-- Name: unique_active_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_active_subscription ON public.customer_subscriptions USING btree (user_id) WHERE ((status = 'active'::public.subscription_status) OR (status = 'trialing'::public.subscription_status));


--
-- Name: unique_draft_assessment_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_draft_assessment_per_user ON public.assessment_results USING btree (user_id) WHERE is_draft;


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_02_22_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_02_22_inserted_at_topic_idx ON realtime.messages_2026_02_22 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_02_24_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_02_24_inserted_at_topic_idx ON realtime.messages_2026_02_24 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_02_25_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_02_25_inserted_at_topic_idx ON realtime.messages_2026_02_25 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_02_26_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_02_26_inserted_at_topic_idx ON realtime.messages_2026_02_26 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_02_27_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_02_27_inserted_at_topic_idx ON realtime.messages_2026_02_27 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_02_28_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_02_28_inserted_at_topic_idx ON realtime.messages_2026_02_28 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2026_02_22_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_02_22_inserted_at_topic_idx;


--
-- Name: messages_2026_02_22_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_02_22_pkey;


--
-- Name: messages_2026_02_24_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_02_24_inserted_at_topic_idx;


--
-- Name: messages_2026_02_24_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_02_24_pkey;


--
-- Name: messages_2026_02_25_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_02_25_inserted_at_topic_idx;


--
-- Name: messages_2026_02_25_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_02_25_pkey;


--
-- Name: messages_2026_02_26_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_02_26_inserted_at_topic_idx;


--
-- Name: messages_2026_02_26_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_02_26_pkey;


--
-- Name: messages_2026_02_27_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_02_27_inserted_at_topic_idx;


--
-- Name: messages_2026_02_27_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_02_27_pkey;


--
-- Name: messages_2026_02_28_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_02_28_inserted_at_topic_idx;


--
-- Name: messages_2026_02_28_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_02_28_pkey;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: users trigger_sync_account_email; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER trigger_sync_account_email AFTER UPDATE OF email ON auth.users FOR EACH ROW WHEN (((old.email)::text IS DISTINCT FROM (new.email)::text)) EXECUTE FUNCTION public.sync_user_accounts_email();


--
-- Name: ai_conversations ai_conversations_update_session; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ai_conversations_update_session AFTER INSERT ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_conversation_session();


--
-- Name: ai_model_pricing ai_model_pricing_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ai_model_pricing_updated_at BEFORE UPDATE ON public.ai_model_pricing FOR EACH ROW EXECUTE FUNCTION public.update_ai_model_pricing_updated_at();


--
-- Name: bookings booking_create_calendar_event; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER booking_create_calendar_event AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.create_calendar_event_for_booking();


--
-- Name: bookings booking_update_calendar_event; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER booking_update_calendar_event AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_calendar_event_for_booking();


--
-- Name: households households_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER households_updated_at BEFORE UPDATE ON public.households FOR EACH ROW EXECUTE FUNCTION public.update_households_updated_at();


--
-- Name: vision_versions on_vision_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_vision_created AFTER INSERT ON public.vision_versions FOR EACH ROW EXECUTE FUNCTION public.initialize_vision_progress();


--
-- Name: user_profiles set_draft_parent_id_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_draft_parent_id_trigger BEFORE INSERT ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.set_draft_parent_id();


--
-- Name: emotional_snapshots set_updated_at_on_emotional_snapshots; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_on_emotional_snapshots BEFORE UPDATE ON public.emotional_snapshots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: scenes set_updated_at_on_scenes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_on_scenes BEFORE UPDATE ON public.scenes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vibrational_event_sources set_updated_at_on_vibrational_event_sources; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_on_vibrational_event_sources BEFORE UPDATE ON public.vibrational_event_sources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: user_community_stats set_user_community_stats_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_user_community_stats_updated_at BEFORE UPDATE ON public.user_community_stats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vibe_posts set_vibe_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_vibe_posts_updated_at BEFORE UPDATE ON public.vibe_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: staff staff_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_schedules_updated_at();


--
-- Name: daily_papers trg_daily_papers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_daily_papers_updated_at BEFORE UPDATE ON public.daily_papers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: voice_profiles trg_voice_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_voice_profiles_updated_at BEFORE UPDATE ON public.voice_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: audio_sets trigger_audio_sets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audio_sets_updated_at BEFORE UPDATE ON public.audio_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audio_tracks trigger_audio_tracks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audio_tracks_updated_at BEFORE UPDATE ON public.audio_tracks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: intensive_responses trigger_intensive_responses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_intensive_responses_updated_at BEFORE UPDATE ON public.intensive_responses FOR EACH ROW EXECUTE FUNCTION public.update_intensive_responses_updated_at();


--
-- Name: support_tickets trigger_set_ticket_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_ticket_number BEFORE INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_ticket_number();


--
-- Name: stories trigger_stories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.update_stories_updated_at();


--
-- Name: vision_versions trigger_track_category_refinement; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_track_category_refinement BEFORE UPDATE ON public.vision_versions FOR EACH ROW EXECUTE FUNCTION public.track_category_refinement();


--
-- Name: leads trigger_update_campaign_metrics; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_campaign_metrics AFTER INSERT OR DELETE OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_campaign_metrics();


--
-- Name: marketing_campaigns trigger_update_campaigns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_campaigns_updated_at BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vibe_hearts trigger_update_comment_hearts_count_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_comment_hearts_count_delete AFTER DELETE ON public.vibe_hearts FOR EACH ROW WHEN ((old.comment_id IS NOT NULL)) EXECUTE FUNCTION public.update_comment_hearts_count();


--
-- Name: vibe_hearts trigger_update_comment_hearts_count_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_comment_hearts_count_insert AFTER INSERT ON public.vibe_hearts FOR EACH ROW WHEN ((new.comment_id IS NOT NULL)) EXECUTE FUNCTION public.update_comment_hearts_count();


--
-- Name: coupons trigger_update_coupons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads trigger_update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: membership_tiers trigger_update_membership_tiers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_membership_tiers_updated_at BEFORE UPDATE ON public.membership_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders trigger_update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vibe_comments trigger_update_post_comments_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_post_comments_count AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON public.vibe_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();


--
-- Name: vibe_hearts trigger_update_post_hearts_count_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_post_hearts_count_delete AFTER DELETE ON public.vibe_hearts FOR EACH ROW WHEN ((old.post_id IS NOT NULL)) EXECUTE FUNCTION public.update_post_hearts_count();


--
-- Name: vibe_hearts trigger_update_post_hearts_count_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_post_hearts_count_insert AFTER INSERT ON public.vibe_hearts FOR EACH ROW WHEN ((new.post_id IS NOT NULL)) EXECUTE FUNCTION public.update_post_hearts_count();


--
-- Name: product_prices trigger_update_product_prices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_product_prices_updated_at BEFORE UPDATE ON public.product_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products trigger_update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_tickets trigger_update_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_accounts trigger_update_user_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_user_accounts_updated_at BEFORE UPDATE ON public.user_accounts FOR EACH ROW EXECUTE FUNCTION public.update_user_accounts_updated_at();


--
-- Name: vibe_posts trigger_update_user_post_stats; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_user_post_stats AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON public.vibe_posts FOR EACH ROW EXECUTE FUNCTION public.update_user_post_stats();


--
-- Name: user_profiles trigger_update_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_user_profiles_updated_at();


--
-- Name: refinements trigger_update_vision_refinement_tracking; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_vision_refinement_tracking AFTER INSERT ON public.refinements FOR EACH ROW WHEN ((((new.operation_type)::text = 'refine_vision'::text) AND (new.vision_id IS NOT NULL))) EXECUTE FUNCTION public.update_vision_refinement_tracking();


--
-- Name: vision_focus trigger_vision_focus_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_vision_focus_updated_at BEFORE UPDATE ON public.vision_focus FOR EACH ROW EXECUTE FUNCTION public.update_vision_focus_updated_at();


--
-- Name: ai_tools update_ai_tools_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_tools_updated_at BEFORE UPDATE ON public.ai_tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assessment_insights update_assessment_insights_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assessment_insights_updated_at BEFORE UPDATE ON public.assessment_insights FOR EACH ROW EXECUTE FUNCTION public.update_assessment_updated_at();


--
-- Name: assessment_responses update_assessment_responses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assessment_responses_updated_at BEFORE UPDATE ON public.assessment_responses FOR EACH ROW EXECUTE FUNCTION public.update_assessment_updated_at();


--
-- Name: assessment_results update_assessment_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assessment_results_updated_at BEFORE UPDATE ON public.assessment_results FOR EACH ROW EXECUTE FUNCTION public.update_assessment_updated_at();


--
-- Name: audio_generation_batches update_audio_generation_batches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_audio_generation_batches_updated_at BEFORE UPDATE ON public.audio_generation_batches FOR EACH ROW EXECUTE FUNCTION public.update_audio_generation_batches_updated_at();


--
-- Name: automation_rules update_automation_rules_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_automation_rules_timestamp BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calendar_events update_calendar_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customer_subscriptions update_customer_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_customer_subscriptions_updated_at BEFORE UPDATE ON public.customer_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_assessment_updated_at();


--
-- Name: email_templates update_email_templates_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_templates_timestamp BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();


--
-- Name: generated_images update_generated_images_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON public.generated_images FOR EACH ROW EXECUTE FUNCTION public.update_generated_images_updated_at();


--
-- Name: media_metadata update_media_metadata_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_media_metadata_updated_at BEFORE UPDATE ON public.media_metadata FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: membership_tiers update_membership_tiers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_membership_tiers_updated_at BEFORE UPDATE ON public.membership_tiers FOR EACH ROW EXECUTE FUNCTION public.update_assessment_updated_at();


--
-- Name: messaging_campaigns update_messaging_campaigns_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_messaging_campaigns_timestamp BEFORE UPDATE ON public.messaging_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();


--
-- Name: scheduled_messages update_scheduled_messages_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduled_messages_timestamp BEFORE UPDATE ON public.scheduled_messages FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();


--
-- Name: assessment_responses update_scores_on_response_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scores_on_response_change AFTER INSERT OR DELETE OR UPDATE ON public.assessment_responses FOR EACH ROW EXECUTE FUNCTION public.update_assessment_scores();


--
-- Name: sequence_enrollments update_sequence_enrollments_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sequence_enrollments_timestamp BEFORE UPDATE ON public.sequence_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();


--
-- Name: sequence_steps update_sequence_steps_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sequence_steps_timestamp BEFORE UPDATE ON public.sequence_steps FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();


--
-- Name: sequences update_sequences_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sequences_timestamp BEFORE UPDATE ON public.sequences FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();


--
-- Name: sms_templates update_sms_templates_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sms_templates_timestamp BEFORE UPDATE ON public.sms_templates FOR EACH ROW EXECUTE FUNCTION public.update_messaging_timestamp();


--
-- Name: vibrational_links update_vibrational_links_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vibrational_links_updated_at BEFORE UPDATE ON public.vibrational_links FOR EACH ROW EXECUTE FUNCTION public.update_vibrational_links_updated_at();


--
-- Name: video_session_participants update_video_participants_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_video_participants_timestamp BEFORE UPDATE ON public.video_session_participants FOR EACH ROW EXECUTE FUNCTION public.update_video_session_timestamp();


--
-- Name: video_session_recordings update_video_recordings_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_video_recordings_timestamp BEFORE UPDATE ON public.video_session_recordings FOR EACH ROW EXECUTE FUNCTION public.update_video_session_timestamp();


--
-- Name: video_sessions update_video_sessions_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_video_sessions_timestamp BEFORE UPDATE ON public.video_sessions FOR EACH ROW EXECUTE FUNCTION public.update_video_session_timestamp();


--
-- Name: vision_board_ideas update_vision_board_ideas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vision_board_ideas_updated_at BEFORE UPDATE ON public.vision_board_ideas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vision_generation_batches update_vision_generation_batches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vision_generation_batches_updated_at BEFORE UPDATE ON public.vision_generation_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vision_new_category_state update_vision_new_category_state_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vision_new_category_state_updated_at BEFORE UPDATE ON public.vision_new_category_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vision_refinements update_vision_refinements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vision_refinements_updated_at BEFORE UPDATE ON public.vision_refinements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vision_versions update_vision_versions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vision_versions_updated_at BEFORE UPDATE ON public.vision_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: abundance_events abundance_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abundance_events
    ADD CONSTRAINT abundance_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_tools ai_tools_model_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tools
    ADD CONSTRAINT ai_tools_model_name_fkey FOREIGN KEY (model_name) REFERENCES public.ai_model_pricing(model_name);


--
-- Name: assessment_insights assessment_insights_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_insights
    ADD CONSTRAINT assessment_insights_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessment_results(id) ON DELETE CASCADE;


--
-- Name: assessment_responses assessment_responses_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_responses
    ADD CONSTRAINT assessment_responses_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessment_results(id) ON DELETE CASCADE;


--
-- Name: assessment_results assessment_results_profile_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_profile_version_id_fkey FOREIGN KEY (profile_version_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;


--
-- Name: assessment_results assessment_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audio_generation_batches audio_generation_batches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_generation_batches
    ADD CONSTRAINT audio_generation_batches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audio_generation_batches audio_generation_batches_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_generation_batches
    ADD CONSTRAINT audio_generation_batches_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE CASCADE;


--
-- Name: audio_recommended_combos audio_recommended_combos_background_track_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_recommended_combos
    ADD CONSTRAINT audio_recommended_combos_background_track_id_fkey FOREIGN KEY (background_track_id) REFERENCES public.audio_background_tracks(id) ON DELETE CASCADE;


--
-- Name: audio_recommended_combos audio_recommended_combos_binaural_track_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_recommended_combos
    ADD CONSTRAINT audio_recommended_combos_binaural_track_id_fkey FOREIGN KEY (binaural_track_id) REFERENCES public.audio_background_tracks(id) ON DELETE SET NULL;


--
-- Name: audio_recommended_combos audio_recommended_combos_mix_ratio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_recommended_combos
    ADD CONSTRAINT audio_recommended_combos_mix_ratio_id_fkey FOREIGN KEY (mix_ratio_id) REFERENCES public.audio_mix_ratios(id) ON DELETE CASCADE;


--
-- Name: audio_sets audio_sets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_sets
    ADD CONSTRAINT audio_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audio_sets audio_sets_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_sets
    ADD CONSTRAINT audio_sets_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE CASCADE;


--
-- Name: audio_tracks audio_tracks_audio_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_tracks
    ADD CONSTRAINT audio_tracks_audio_set_id_fkey FOREIGN KEY (audio_set_id) REFERENCES public.audio_sets(id) ON DELETE CASCADE;


--
-- Name: audio_tracks audio_tracks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_tracks
    ADD CONSTRAINT audio_tracks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audio_tracks audio_tracks_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_tracks
    ADD CONSTRAINT audio_tracks_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE CASCADE;


--
-- Name: audio_voice_clones audio_voice_clones_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_voice_clones
    ADD CONSTRAINT audio_voice_clones_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: automation_rules automation_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES public.video_sessions(id) ON DELETE SET NULL;


--
-- Name: calendar_events calendar_events_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: calendar_events calendar_events_recurrence_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_recurrence_parent_id_fkey FOREIGN KEY (recurrence_parent_id) REFERENCES public.calendar_events(id) ON DELETE CASCADE;


--
-- Name: calendar_events calendar_events_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;


--
-- Name: calendar_events calendar_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: calendar_events calendar_events_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES public.video_sessions(id) ON DELETE SET NULL;


--
-- Name: cart_sessions cart_sessions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_sessions
    ADD CONSTRAINT cart_sessions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: cart_sessions cart_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_sessions
    ADD CONSTRAINT cart_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: cart_sessions cart_sessions_visitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_sessions
    ADD CONSTRAINT cart_sessions_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors(id) ON DELETE SET NULL;


--
-- Name: conversation_sessions conversation_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_sessions
    ADD CONSTRAINT conversation_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: conversation_sessions conversation_sessions_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_sessions
    ADD CONSTRAINT conversation_sessions_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE CASCADE;


--
-- Name: coupon_codes coupon_codes_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes
    ADD CONSTRAINT coupon_codes_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;


--
-- Name: coupon_redemptions coupon_redemptions_coupon_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_coupon_code_id_fkey FOREIGN KEY (coupon_code_id) REFERENCES public.coupon_codes(id) ON DELETE CASCADE;


--
-- Name: coupon_redemptions coupon_redemptions_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;


--
-- Name: coupon_redemptions coupon_redemptions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: coupon_redemptions coupon_redemptions_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.customer_subscriptions(id) ON DELETE SET NULL;


--
-- Name: coupon_redemptions coupon_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: coupons coupons_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;


--
-- Name: customer_subscriptions customer_subscriptions_membership_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_subscriptions
    ADD CONSTRAINT customer_subscriptions_membership_tier_id_fkey FOREIGN KEY (membership_tier_id) REFERENCES public.membership_tiers(id);


--
-- Name: customer_subscriptions customer_subscriptions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_subscriptions
    ADD CONSTRAINT customer_subscriptions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: customer_subscriptions customer_subscriptions_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_subscriptions
    ADD CONSTRAINT customer_subscriptions_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE SET NULL;


--
-- Name: customer_subscriptions customer_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_subscriptions
    ADD CONSTRAINT customer_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: customers customers_visitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors(id) ON DELETE SET NULL;


--
-- Name: daily_papers daily_papers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_papers
    ADD CONSTRAINT daily_papers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: email_messages email_messages_reply_to_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES public.email_messages(id) ON DELETE SET NULL;


--
-- Name: email_messages email_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: email_templates email_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: emotional_snapshots emotional_snapshots_last_scene_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emotional_snapshots
    ADD CONSTRAINT emotional_snapshots_last_scene_id_fkey FOREIGN KEY (last_scene_id) REFERENCES public.scenes(id) ON DELETE SET NULL;


--
-- Name: emotional_snapshots emotional_snapshots_last_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emotional_snapshots
    ADD CONSTRAINT emotional_snapshots_last_vision_id_fkey FOREIGN KEY (last_vision_id) REFERENCES public.vision_versions(id) ON DELETE SET NULL;


--
-- Name: emotional_snapshots emotional_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emotional_snapshots
    ADD CONSTRAINT emotional_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: frequency_flip frequency_flip_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequency_flip
    ADD CONSTRAINT frequency_flip_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: frequency_flip frequency_flip_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequency_flip
    ADD CONSTRAINT frequency_flip_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE SET NULL;


--
-- Name: generated_images generated_images_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: household_invitations household_invitations_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_invitations
    ADD CONSTRAINT household_invitations_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


--
-- Name: household_invitations household_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_invitations
    ADD CONSTRAINT household_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: household_members household_members_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


--
-- Name: household_members household_members_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: household_members household_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: households households_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: intensive_checklist intensive_checklist_intensive_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intensive_checklist
    ADD CONSTRAINT intensive_checklist_intensive_id_fkey FOREIGN KEY (intensive_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: intensive_checklist intensive_checklist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intensive_checklist
    ADD CONSTRAINT intensive_checklist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: intensive_responses intensive_responses_intensive_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intensive_responses
    ADD CONSTRAINT intensive_responses_intensive_id_fkey FOREIGN KEY (intensive_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: intensive_responses intensive_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intensive_responses
    ADD CONSTRAINT intensive_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: journey_events journey_events_cart_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_events
    ADD CONSTRAINT journey_events_cart_session_id_fkey FOREIGN KEY (cart_session_id) REFERENCES public.cart_sessions(id) ON DELETE SET NULL;


--
-- Name: journey_events journey_events_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_events
    ADD CONSTRAINT journey_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: journey_events journey_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_events
    ADD CONSTRAINT journey_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: journey_events journey_events_visitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_events
    ADD CONSTRAINT journey_events_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors(id) ON DELETE SET NULL;


--
-- Name: lead_tracking_events lead_tracking_events_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tracking_events
    ADD CONSTRAINT lead_tracking_events_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: lead_tracking_events lead_tracking_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tracking_events
    ADD CONSTRAINT lead_tracking_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: leads leads_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;


--
-- Name: leads leads_converted_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_converted_to_user_id_fkey FOREIGN KEY (converted_to_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: leads leads_visitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors(id) ON DELETE SET NULL;


--
-- Name: marketing_campaigns marketing_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_campaigns
    ADD CONSTRAINT marketing_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: media_metadata media_metadata_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_metadata
    ADD CONSTRAINT media_metadata_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: membership_tiers membership_tiers_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_tiers
    ADD CONSTRAINT membership_tiers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: messaging_campaigns messaging_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messaging_campaigns
    ADD CONSTRAINT messaging_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_price_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_price_id_fkey FOREIGN KEY (price_id) REFERENCES public.product_prices(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: order_items order_items_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.customer_subscriptions(id) ON DELETE SET NULL;


--
-- Name: orders orders_cart_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_cart_session_id_fkey FOREIGN KEY (cart_session_id) REFERENCES public.cart_sessions(id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: page_views page_views_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: page_views page_views_visitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors(id) ON DELETE CASCADE;


--
-- Name: payment_history payment_history_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.customer_subscriptions(id) ON DELETE SET NULL;


--
-- Name: payment_history payment_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: product_prices product_prices_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: scenes scenes_related_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenes
    ADD CONSTRAINT scenes_related_vision_id_fkey FOREIGN KEY (related_vision_id) REFERENCES public.vision_versions(id) ON DELETE SET NULL;


--
-- Name: scenes scenes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenes
    ADD CONSTRAINT scenes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: scheduled_messages scheduled_messages_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages
    ADD CONSTRAINT scheduled_messages_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: scheduled_messages scheduled_messages_email_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages
    ADD CONSTRAINT scheduled_messages_email_template_id_fkey FOREIGN KEY (email_template_id) REFERENCES public.email_templates(id) ON DELETE SET NULL;


--
-- Name: scheduled_messages scheduled_messages_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages
    ADD CONSTRAINT scheduled_messages_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: scheduled_messages scheduled_messages_sms_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages
    ADD CONSTRAINT scheduled_messages_sms_template_id_fkey FOREIGN KEY (sms_template_id) REFERENCES public.sms_templates(id) ON DELETE SET NULL;


--
-- Name: sequence_enrollments sequence_enrollments_sequence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_enrollments
    ADD CONSTRAINT sequence_enrollments_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.sequences(id) ON DELETE CASCADE;


--
-- Name: sequence_enrollments sequence_enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_enrollments
    ADD CONSTRAINT sequence_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sequence_steps sequence_steps_sequence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequence_steps
    ADD CONSTRAINT sequence_steps_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.sequences(id) ON DELETE CASCADE;


--
-- Name: sequences sequences_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequences
    ADD CONSTRAINT sequences_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_visitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors(id) ON DELETE CASCADE;


--
-- Name: sms_messages sms_messages_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: sms_messages sms_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: sms_messages sms_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sms_templates sms_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_templates
    ADD CONSTRAINT sms_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: staff staff_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.staff(id) ON DELETE SET NULL;


--
-- Name: staff staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_accounts(id) ON DELETE SET NULL;


--
-- Name: stories stories_audio_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_audio_set_id_fkey FOREIGN KEY (audio_set_id) REFERENCES public.audio_sets(id) ON DELETE SET NULL;


--
-- Name: stories stories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_ticket_replies support_ticket_replies_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_replies
    ADD CONSTRAINT support_ticket_replies_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: support_ticket_replies support_ticket_replies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_replies
    ADD CONSTRAINT support_ticket_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: token_transactions token_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_transactions
    ADD CONSTRAINT token_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: token_transactions token_transactions_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_transactions
    ADD CONSTRAINT token_transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.customer_subscriptions(id);


--
-- Name: token_transactions token_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_transactions
    ADD CONSTRAINT token_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: token_usage token_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_usage
    ADD CONSTRAINT token_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_accounts user_accounts_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_accounts
    ADD CONSTRAINT user_accounts_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE SET NULL;


--
-- Name: user_accounts user_accounts_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_accounts
    ADD CONSTRAINT user_accounts_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_accounts user_accounts_membership_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_accounts
    ADD CONSTRAINT user_accounts_membership_tier_id_fkey FOREIGN KEY (membership_tier_id) REFERENCES public.membership_tiers(id);


--
-- Name: user_activity_metrics user_activity_metrics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_metrics
    ADD CONSTRAINT user_activity_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_community_stats user_community_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_community_stats
    ADD CONSTRAINT user_community_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;


--
-- Name: user_profiles user_profiles_parent_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_parent_version_id_fkey FOREIGN KEY (parent_version_id) REFERENCES public.user_profiles(id);


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_storage user_storage_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_storage
    ADD CONSTRAINT user_storage_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.customer_subscriptions(id) ON DELETE SET NULL;


--
-- Name: user_storage user_storage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_storage
    ADD CONSTRAINT user_storage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refinements vibe_assistant_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refinements
    ADD CONSTRAINT vibe_assistant_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refinements vibe_assistant_logs_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refinements
    ADD CONSTRAINT vibe_assistant_logs_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE SET NULL;


--
-- Name: vibe_comments vibe_comments_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_comments
    ADD CONSTRAINT vibe_comments_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: vibe_comments vibe_comments_parent_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_comments
    ADD CONSTRAINT vibe_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.vibe_comments(id) ON DELETE CASCADE;


--
-- Name: vibe_comments vibe_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_comments
    ADD CONSTRAINT vibe_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.vibe_posts(id) ON DELETE CASCADE;


--
-- Name: vibe_comments vibe_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_comments
    ADD CONSTRAINT vibe_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vibe_comments vibe_comments_user_id_user_accounts_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_comments
    ADD CONSTRAINT vibe_comments_user_id_user_accounts_fkey FOREIGN KEY (user_id) REFERENCES public.user_accounts(id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT vibe_comments_user_id_user_accounts_fkey ON vibe_comments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT vibe_comments_user_id_user_accounts_fkey ON public.vibe_comments IS 'FK to user_accounts for PostgREST joins - enables fetching user profile with comments';


--
-- Name: vibe_hearts vibe_hearts_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_hearts
    ADD CONSTRAINT vibe_hearts_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.vibe_comments(id) ON DELETE CASCADE;


--
-- Name: vibe_hearts vibe_hearts_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_hearts
    ADD CONSTRAINT vibe_hearts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.vibe_posts(id) ON DELETE CASCADE;


--
-- Name: vibe_hearts vibe_hearts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_hearts
    ADD CONSTRAINT vibe_hearts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vibe_hearts vibe_hearts_user_id_user_accounts_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_hearts
    ADD CONSTRAINT vibe_hearts_user_id_user_accounts_fkey FOREIGN KEY (user_id) REFERENCES public.user_accounts(id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT vibe_hearts_user_id_user_accounts_fkey ON vibe_hearts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT vibe_hearts_user_id_user_accounts_fkey ON public.vibe_hearts IS 'FK to user_accounts for PostgREST joins - enables fetching user profile with hearts';


--
-- Name: vibe_posts vibe_posts_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_posts
    ADD CONSTRAINT vibe_posts_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: vibe_posts vibe_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_posts
    ADD CONSTRAINT vibe_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vibe_posts vibe_posts_user_id_user_accounts_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibe_posts
    ADD CONSTRAINT vibe_posts_user_id_user_accounts_fkey FOREIGN KEY (user_id) REFERENCES public.user_accounts(id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT vibe_posts_user_id_user_accounts_fkey ON vibe_posts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT vibe_posts_user_id_user_accounts_fkey ON public.vibe_posts IS 'FK to user_accounts for PostgREST joins - enables fetching user profile with posts';


--
-- Name: vibrational_events vibrational_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibrational_events
    ADD CONSTRAINT vibrational_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vibrational_links vibrational_links_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vibrational_links
    ADD CONSTRAINT vibrational_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_session_messages video_session_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_messages
    ADD CONSTRAINT video_session_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.video_sessions(id) ON DELETE CASCADE;


--
-- Name: video_session_messages video_session_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_messages
    ADD CONSTRAINT video_session_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: video_session_participants video_session_participants_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_participants
    ADD CONSTRAINT video_session_participants_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.video_sessions(id) ON DELETE CASCADE;


--
-- Name: video_session_participants video_session_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_participants
    ADD CONSTRAINT video_session_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_session_recordings video_session_recordings_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_session_recordings
    ADD CONSTRAINT video_session_recordings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.video_sessions(id) ON DELETE CASCADE;


--
-- Name: video_sessions video_sessions_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sessions
    ADD CONSTRAINT video_sessions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: video_sessions video_sessions_highlighted_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sessions
    ADD CONSTRAINT video_sessions_highlighted_message_id_fkey FOREIGN KEY (highlighted_message_id) REFERENCES public.video_session_messages(id) ON DELETE SET NULL;


--
-- Name: video_sessions video_sessions_host_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sessions
    ADD CONSTRAINT video_sessions_host_user_id_fkey FOREIGN KEY (host_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_sessions video_sessions_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_sessions
    ADD CONSTRAINT video_sessions_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;


--
-- Name: vision_board_ideas vision_board_ideas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_board_ideas
    ADD CONSTRAINT vision_board_ideas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vision_board_ideas vision_board_ideas_vision_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_board_ideas
    ADD CONSTRAINT vision_board_ideas_vision_version_id_fkey FOREIGN KEY (vision_version_id) REFERENCES public.vision_versions(id) ON DELETE CASCADE;


--
-- Name: vision_board_items vision_board_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_board_items
    ADD CONSTRAINT vision_board_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vision_focus vision_focus_audio_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_focus
    ADD CONSTRAINT vision_focus_audio_set_id_fkey FOREIGN KEY (audio_set_id) REFERENCES public.audio_sets(id) ON DELETE SET NULL;


--
-- Name: vision_focus vision_focus_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_focus
    ADD CONSTRAINT vision_focus_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vision_focus vision_focus_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_focus
    ADD CONSTRAINT vision_focus_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE CASCADE;


--
-- Name: vision_generation_batches vision_generation_batches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_generation_batches
    ADD CONSTRAINT vision_generation_batches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vision_generation_batches vision_generation_batches_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_generation_batches
    ADD CONSTRAINT vision_generation_batches_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE SET NULL;


--
-- Name: vision_new_category_state vision_new_category_state_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_new_category_state
    ADD CONSTRAINT vision_new_category_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vision_progress vision_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_progress
    ADD CONSTRAINT vision_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vision_progress vision_progress_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_progress
    ADD CONSTRAINT vision_progress_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE CASCADE;


--
-- Name: vision_refinements vision_refinements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_refinements
    ADD CONSTRAINT vision_refinements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vision_refinements vision_refinements_vision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_refinements
    ADD CONSTRAINT vision_refinements_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES public.vision_versions(id) ON DELETE CASCADE;


--
-- Name: vision_versions vision_versions_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_versions
    ADD CONSTRAINT vision_versions_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


--
-- Name: vision_versions vision_versions_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_versions
    ADD CONSTRAINT vision_versions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.vision_versions(id) ON DELETE SET NULL;


--
-- Name: vision_versions vision_versions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_versions
    ADD CONSTRAINT vision_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: visitors visitors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitors
    ADD CONSTRAINT visitors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: viva_conversations viva_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viva_conversations
    ADD CONSTRAINT viva_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: voice_profiles voice_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_profiles
    ADD CONSTRAINT voice_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_codes Active coupon codes are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active coupon codes are viewable by everyone" ON public.coupon_codes FOR SELECT USING ((is_active = true));


--
-- Name: coupons Active coupons are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active coupons are viewable by everyone" ON public.coupons FOR SELECT USING ((is_active = true));


--
-- Name: membership_tiers Active membership tiers are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active membership tiers are viewable by everyone" ON public.membership_tiers FOR SELECT USING ((is_active = true));


--
-- Name: product_prices Active product prices are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active product prices are viewable by everyone" ON public.product_prices FOR SELECT USING ((is_active = true));


--
-- Name: products Active products are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active products are viewable by everyone" ON public.products FOR SELECT USING ((is_active = true));


--
-- Name: households Admin can delete their household; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete their household" ON public.households FOR DELETE USING ((admin_user_id = auth.uid()));


--
-- Name: household_invitations Admin can manage invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage invitations" ON public.household_invitations USING ((household_id IN ( SELECT households.id
   FROM public.households
  WHERE (households.admin_user_id = auth.uid()))));


--
-- Name: households Admin can update their household; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update their household" ON public.households FOR UPDATE USING ((admin_user_id = auth.uid()));


--
-- Name: household_members Admins can add members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can add members" ON public.household_members FOR INSERT WITH CHECK ((household_id IN ( SELECT households.id
   FROM public.households
  WHERE (households.admin_user_id = auth.uid()))));


--
-- Name: vibe_comments Admins can delete any comment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any comment" ON public.vibe_comments FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: vibe_posts Admins can delete any post; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any post" ON public.vibe_posts FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: media_metadata Admins can insert site content metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert site content metadata" ON public.media_metadata FOR INSERT TO authenticated WITH CHECK (((user_id IS NULL) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: email_messages Admins can manage all emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all emails" ON public.email_messages USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::text[])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));


--
-- Name: user_activity_metrics Admins can manage all metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all metrics" ON public.user_activity_metrics USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::text[])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));


--
-- Name: support_ticket_replies Admins can manage all replies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all replies" ON public.support_ticket_replies USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::text[])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));


--
-- Name: support_tickets Admins can manage all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::text[])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));


--
-- Name: ai_tools Admins can manage all tools; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all tools" ON public.ai_tools TO authenticated USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((((users.raw_user_meta_data ->> 'is_admin'::text))::boolean = true) OR ((users.email)::text = ANY (ARRAY['buckinghambliss@gmail.com'::text, 'admin@vibrationfit.com'::text]))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((((users.raw_user_meta_data ->> 'is_admin'::text))::boolean = true) OR ((users.email)::text = ANY (ARRAY['buckinghambliss@gmail.com'::text, 'admin@vibrationfit.com'::text])))))));


--
-- Name: POLICY "Admins can manage all tools" ON ai_tools; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can manage all tools" ON public.ai_tools IS 'Only admin users (via auth metadata or email whitelist) can insert/update/delete tools';


--
-- Name: marketing_campaigns Admins can manage campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage campaigns" ON public.marketing_campaigns USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::text[])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));


--
-- Name: email_templates Admins can manage email templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage email templates" ON public.email_templates USING (public.is_admin());


--
-- Name: leads Admins can manage leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage leads" ON public.leads USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::text[])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));


--
-- Name: scheduled_messages Admins can manage scheduled messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage scheduled messages" ON public.scheduled_messages USING (public.is_admin());


--
-- Name: sms_messages Admins can manage sms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage sms" ON public.sms_messages USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::text[])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));


--
-- Name: sms_templates Admins can manage sms templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage sms templates" ON public.sms_templates USING (public.is_admin());


--
-- Name: staff Admins can manage staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage staff" ON public.staff TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: lead_tracking_events Admins can manage tracking events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage tracking events" ON public.lead_tracking_events USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY ((ARRAY['buckinghambliss@gmail.com'::character varying, 'admin@vibrationfit.com'::character varying])::text[])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));


--
-- Name: vibrational_event_sources Admins can manage vibrational sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage vibrational sources" ON public.vibrational_event_sources USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY (ARRAY[('buckinghambliss@gmail.com'::character varying)::text, ('admin@vibrationfit.com'::character varying)::text])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY (ARRAY[('buckinghambliss@gmail.com'::character varying)::text, ('admin@vibrationfit.com'::character varying)::text])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));


--
-- Name: household_members Admins can remove members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can remove members" ON public.household_members FOR DELETE USING ((household_id IN ( SELECT households.id
   FROM public.households
  WHERE (households.admin_user_id = auth.uid()))));


--
-- Name: user_accounts Admins can update accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update accounts" ON public.user_accounts FOR UPDATE USING (public.is_admin_account());


--
-- Name: intensive_responses Admins can update all intensive responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all intensive responses" ON public.intensive_responses FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: vibe_comments Admins can update any comment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any comment" ON public.vibe_comments FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: household_members Admins can update members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update members" ON public.household_members FOR UPDATE USING ((household_id IN ( SELECT households.id
   FROM public.households
  WHERE (households.admin_user_id = auth.uid()))));


--
-- Name: media_metadata Admins can update site content metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update site content metadata" ON public.media_metadata FOR UPDATE TO authenticated USING (((user_id IS NULL) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: user_accounts Admins can view all accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all accounts" ON public.user_accounts FOR SELECT USING (public.is_admin_account());


--
-- Name: intensive_responses Admins can view all intensive responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all intensive responses" ON public.intensive_responses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: message_send_log Admins can view message log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view message log" ON public.message_send_log FOR SELECT USING (public.is_admin());


--
-- Name: audio_background_tracks Allow authenticated users to read active background tracks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to read active background tracks" ON public.audio_background_tracks FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: audio_recommended_combos Allow authenticated users to read active combos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to read active combos" ON public.audio_recommended_combos FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: audio_mix_ratios Allow authenticated users to read active mix ratios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to read active mix ratios" ON public.audio_mix_ratios FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: audio_background_tracks Allow service role to manage background tracks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage background tracks" ON public.audio_background_tracks TO service_role USING (true) WITH CHECK (true);


--
-- Name: audio_mix_ratios Allow service role to manage mix ratios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage mix ratios" ON public.audio_mix_ratios TO service_role USING (true) WITH CHECK (true);


--
-- Name: audio_recommended_combos Allow service role to manage recommended combos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage recommended combos" ON public.audio_recommended_combos TO service_role USING (true) WITH CHECK (true);


--
-- Name: email_templates Anyone can read active email templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read active email templates" ON public.email_templates FOR SELECT USING (((status = 'active'::public.template_status) OR public.is_admin()));


--
-- Name: sms_templates Anyone can read active sms templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read active sms templates" ON public.sms_templates FOR SELECT USING (((status = 'active'::public.template_status) OR public.is_admin()));


--
-- Name: audio_variants Anyone can read audio variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read audio variants" ON public.audio_variants FOR SELECT USING (true);


--
-- Name: cart_sessions Anyone can read cart sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read cart sessions" ON public.cart_sessions FOR SELECT USING (true);


--
-- Name: ai_model_pricing Anyone can read model pricing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read model pricing" ON public.ai_model_pricing FOR SELECT USING (true);


--
-- Name: membership_tiers Anyone can view active membership tiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active membership tiers" ON public.membership_tiers FOR SELECT USING ((is_active = true));


--
-- Name: staff Anyone can view active staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active staff" ON public.staff FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: user_community_stats Anyone can view community stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view community stats" ON public.user_community_stats FOR SELECT TO authenticated USING (true);


--
-- Name: vibe_hearts Anyone can view hearts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view hearts" ON public.vibe_hearts FOR SELECT TO authenticated USING (true);


--
-- Name: vibe_comments Anyone can view non-deleted comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view non-deleted comments" ON public.vibe_comments FOR SELECT USING ((is_deleted = false));


--
-- Name: vibe_posts Anyone can view non-deleted posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view non-deleted posts" ON public.vibe_posts FOR SELECT USING ((is_deleted = false));


--
-- Name: media_metadata Anyone can view site content metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view site content metadata" ON public.media_metadata FOR SELECT USING ((user_id IS NULL));


--
-- Name: message_send_log Authenticated can insert message log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can insert message log" ON public.message_send_log FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: email_templates Authenticated can manage email templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can manage email templates" ON public.email_templates USING ((auth.uid() IS NOT NULL));


--
-- Name: scheduled_messages Authenticated can manage scheduled messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can manage scheduled messages" ON public.scheduled_messages USING ((auth.uid() IS NOT NULL));


--
-- Name: sms_templates Authenticated can manage sms templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can manage sms templates" ON public.sms_templates USING ((auth.uid() IS NOT NULL));


--
-- Name: email_templates Authenticated can read email templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read email templates" ON public.email_templates FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: sms_templates Authenticated can read sms templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read sms templates" ON public.sms_templates FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: message_send_log Authenticated can view message log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can view message log" ON public.message_send_log FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: vibe_hearts Authenticated users can add hearts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can add hearts" ON public.vibe_hearts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: vibe_comments Authenticated users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create comments" ON public.vibe_comments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: vibe_posts Authenticated users can create posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create posts" ON public.vibe_posts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: audio_variants Authenticated users can manage audio variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage audio variants" ON public.audio_variants USING (true) WITH CHECK (true);


--
-- Name: ai_tools Authenticated users can modify ai_tools; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can modify ai_tools" ON public.ai_tools TO authenticated USING (true) WITH CHECK (true);


--
-- Name: ai_tools Authenticated users can view ai_tools; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view ai_tools" ON public.ai_tools FOR SELECT TO authenticated USING (true);


--
-- Name: user_accounts Authenticated users can view basic profile info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view basic profile info" ON public.user_accounts FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY "Authenticated users can view basic profile info" ON user_accounts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Authenticated users can view basic profile info" ON public.user_accounts IS 'Allows authenticated users to view user accounts for community features like Vibe Tribe';


--
-- Name: household_invitations Invitees can view their invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Invitees can view their invitations" ON public.household_invitations FOR SELECT USING ((invited_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text));


--
-- Name: ai_model_pricing Only admins can modify model pricing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can modify model pricing" ON public.ai_model_pricing USING (true) WITH CHECK (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.raw_user_meta_data ->> 'is_admin'::text))::boolean = true))))));


--
-- Name: membership_tiers Only service role can modify membership tiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only service role can modify membership tiers" ON public.membership_tiers USING ((auth.role() = 'service_role'::text));


--
-- Name: user_badges Service role can delete badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can delete badges" ON public.user_badges FOR DELETE TO service_role USING (true);


--
-- Name: user_badges Service role can insert badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert badges" ON public.user_badges FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: token_transactions Service role can insert token transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert token transactions" ON public.token_transactions FOR INSERT WITH CHECK (true);


--
-- Name: refinements Service role can manage all refinements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage all refinements" ON public.refinements USING ((auth.role() = 'service_role'::text));


--
-- Name: coupon_codes Service role can manage coupon codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage coupon codes" ON public.coupon_codes USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: coupon_redemptions Service role can manage coupon redemptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage coupon redemptions" ON public.coupon_redemptions USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: coupons Service role can manage coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage coupons" ON public.coupons USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: order_items Service role can manage order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage order items" ON public.order_items USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: orders Service role can manage orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage orders" ON public.orders USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: product_prices Service role can manage product prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage product prices" ON public.product_prices USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: products Service role can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage products" ON public.products USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: audio_generation_batches Service role can update audio generation batches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can update audio generation batches" ON public.audio_generation_batches FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: user_badges Service role can update badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can update badges" ON public.user_badges FOR UPDATE TO service_role USING (true) WITH CHECK (true);


--
-- Name: automation_rules Service role full access on automation_rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on automation_rules" ON public.automation_rules USING (true) WITH CHECK (true);


--
-- Name: cart_sessions Service role full access on cart_sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on cart_sessions" ON public.cart_sessions USING ((auth.role() = 'service_role'::text));


--
-- Name: customers Service role full access on customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on customers" ON public.customers USING ((auth.role() = 'service_role'::text));


--
-- Name: journey_events Service role full access on journey_events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on journey_events" ON public.journey_events USING ((auth.role() = 'service_role'::text));


--
-- Name: messaging_campaigns Service role full access on messaging_campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on messaging_campaigns" ON public.messaging_campaigns USING (true) WITH CHECK (true);


--
-- Name: page_views Service role full access on page_views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on page_views" ON public.page_views USING ((auth.role() = 'service_role'::text));


--
-- Name: sequence_enrollments Service role full access on sequence_enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on sequence_enrollments" ON public.sequence_enrollments USING (true) WITH CHECK (true);


--
-- Name: sequence_steps Service role full access on sequence_steps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on sequence_steps" ON public.sequence_steps USING (true) WITH CHECK (true);


--
-- Name: sequences Service role full access on sequences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on sequences" ON public.sequences USING (true) WITH CHECK (true);


--
-- Name: sessions Service role full access on sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on sessions" ON public.sessions USING ((auth.role() = 'service_role'::text));


--
-- Name: visitors Service role full access on visitors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on visitors" ON public.visitors USING ((auth.role() = 'service_role'::text));


--
-- Name: audio_generation_batches Service role has full access to audio generation batches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to audio generation batches" ON public.audio_generation_batches USING ((auth.role() = 'service_role'::text));


--
-- Name: user_storage Service role has full access to user_storage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to user_storage" ON public.user_storage USING ((auth.role() = 'service_role'::text));


--
-- Name: user_community_stats Stats are managed by system; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Stats are managed by system" ON public.user_community_stats FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_community_stats Stats are updated by system; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Stats are updated by system" ON public.user_community_stats FOR UPDATE TO authenticated USING (true);


--
-- Name: user_accounts Super admins can manage all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all" ON public.user_accounts USING (public.is_super_admin_account());


--
-- Name: assessment_insights System can create assessment insights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create assessment insights" ON public.assessment_insights FOR INSERT WITH CHECK (true);


--
-- Name: payment_history System can create payment records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create payment records" ON public.payment_history FOR INSERT WITH CHECK (true);


--
-- Name: customer_subscriptions System can create subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create subscriptions" ON public.customer_subscriptions FOR INSERT WITH CHECK (true);


--
-- Name: token_usage System can insert token usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert token usage" ON public.token_usage FOR INSERT WITH CHECK (true);


--
-- Name: customer_subscriptions System can update subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can update subscriptions" ON public.customer_subscriptions FOR UPDATE USING (true);


--
-- Name: vibe_posts Users and admins can update posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users and admins can update posts" ON public.vibe_posts FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))))) WITH CHECK (true);


--
-- Name: POLICY "Users and admins can update posts" ON vibe_posts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Users and admins can update posts" ON public.vibe_posts IS 'Owners can update their posts, admins can update any post. Soft deletes are allowed.';


--
-- Name: households Users can create households; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create households" ON public.households FOR INSERT WITH CHECK ((admin_user_id = auth.uid()));


--
-- Name: audio_generation_batches Users can create own audio generation batches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own audio generation batches" ON public.audio_generation_batches FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vision_focus Users can create own focus; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own focus" ON public.vision_focus FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: journal_entries Users can create own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own journal entries" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: stories Users can create own stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own stories" ON public.stories FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vision_board_items Users can create own vision board items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own vision board items" ON public.vision_board_items FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: assessment_responses Users can create their own assessment responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own assessment responses" ON public.assessment_responses FOR INSERT WITH CHECK ((assessment_id IN ( SELECT assessment_results.id
   FROM public.assessment_results
  WHERE (assessment_results.user_id = auth.uid()))));


--
-- Name: assessment_results Users can create their own assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own assessments" ON public.assessment_results FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_images Users can create their own generated images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own generated images" ON public.generated_images FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: audio_voice_clones Users can create their own voice clones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own voice clones" ON public.audio_voice_clones FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_tickets Users can create tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: audio_generation_batches Users can delete own audio generation batches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own audio generation batches" ON public.audio_generation_batches FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: POLICY "Users can delete own audio generation batches" ON audio_generation_batches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Users can delete own audio generation batches" ON public.audio_generation_batches IS 'Allows users to delete their own audio generation batch records';


--
-- Name: vision_new_category_state Users can delete own category state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own category state" ON public.vision_new_category_state FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vision_focus Users can delete own focus; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own focus" ON public.vision_focus FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: journal_entries Users can delete own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own journal entries" ON public.journal_entries FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: media_metadata Users can delete own media metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own media metadata" ON public.media_metadata FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can delete own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: stories Users can delete own stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vision_board_items Users can delete own vision board items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own vision board items" ON public.vision_board_items FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: vision_versions Users can delete own visions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own visions" ON public.vision_versions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: assessment_responses Users can delete their own assessment responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own assessment responses" ON public.assessment_responses FOR DELETE USING ((assessment_id IN ( SELECT assessment_results.id
   FROM public.assessment_results
  WHERE (assessment_results.user_id = auth.uid()))));


--
-- Name: assessment_results Users can delete their own assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own assessments" ON public.assessment_results FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: audio_sets Users can delete their own audio sets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own audio sets" ON public.audio_sets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: audio_tracks Users can delete their own audio tracks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own audio tracks" ON public.audio_tracks FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vibe_comments Users can delete their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own comments" ON public.vibe_comments FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: conversation_sessions Users can delete their own conversation sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversation sessions" ON public.conversation_sessions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: frequency_flip Users can delete their own frequency flip seeds; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own frequency flip seeds" ON public.frequency_flip FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can delete their own generated images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own generated images" ON public.generated_images FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vibe_posts Users can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own posts" ON public.vibe_posts FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: vision_progress Users can delete their own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own progress" ON public.vision_progress FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: refinements Users can delete their own refinements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own refinements" ON public.refinements FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vision_refinements Users can delete their own refinements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own refinements" ON public.vision_refinements FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vision_board_ideas Users can delete their own vision board ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own vision board ideas" ON public.vision_board_ideas FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: audio_voice_clones Users can delete their own voice clones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own voice clones" ON public.audio_voice_clones FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: scenes Users can delete their scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their scenes" ON public.scenes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: media_metadata Users can insert media metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert media metadata" ON public.media_metadata FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: vision_new_category_state Users can insert own category state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own category state" ON public.vision_new_category_state FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can insert own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own conversations" ON public.ai_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: intensive_responses Users can insert own intensive responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own intensive responses" ON public.intensive_responses FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vision_versions Users can insert own visions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own visions" ON public.vision_versions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: abundance_events Users can insert their abundance events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their abundance events" ON public.abundance_events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: audio_sets Users can insert their own audio sets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own audio sets" ON public.audio_sets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: audio_tracks Users can insert their own audio tracks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own audio tracks" ON public.audio_tracks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversation_sessions Users can insert their own conversation sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own conversation sessions" ON public.conversation_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can insert their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own conversations" ON public.ai_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: viva_conversations Users can insert their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own conversations" ON public.viva_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: frequency_flip Users can insert their own frequency flip seeds; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own frequency flip seeds" ON public.frequency_flip FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vision_progress Users can insert their own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own progress" ON public.vision_progress FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: refinements Users can insert their own refinements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own refinements" ON public.refinements FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vision_refinements Users can insert their own refinements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own refinements" ON public.vision_refinements FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vibrational_links Users can insert their own vibrational links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own vibrational links" ON public.vibrational_links FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vision_board_ideas Users can insert their own vision board ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own vision board ideas" ON public.vision_board_ideas FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: scenes Users can insert their scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their scenes" ON public.scenes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vibrational_events Users can insert their vibrational events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their vibrational events" ON public.vibrational_events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: daily_papers Users can manage their daily papers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their daily papers" ON public.daily_papers USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: voice_profiles Users can manage their voice profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their voice profile" ON public.voice_profiles USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: customers Users can read own customer record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own customer record" ON public.customers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vibe_hearts Users can remove their own hearts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove their own hearts" ON public.vibe_hearts FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: support_ticket_replies Users can reply to own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can reply to own tickets" ON public.support_ticket_replies FOR INSERT WITH CHECK ((ticket_id IN ( SELECT support_tickets.id
   FROM public.support_tickets
  WHERE (support_tickets.user_id = auth.uid()))));


--
-- Name: audio_sets Users can select their own audio sets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select their own audio sets" ON public.audio_sets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audio_tracks Users can select their own audio tracks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select their own audio tracks" ON public.audio_tracks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_accounts Users can update own account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own account" ON public.user_accounts FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: audio_generation_batches Users can update own audio generation batches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own audio generation batches" ON public.audio_generation_batches FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vision_new_category_state Users can update own category state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own category state" ON public.vision_new_category_state FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: vision_focus Users can update own focus; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own focus" ON public.vision_focus FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: intensive_checklist Users can update own intensive checklist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own intensive checklist" ON public.intensive_checklist FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: POLICY "Users can update own intensive checklist" ON intensive_checklist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Users can update own intensive checklist" ON public.intensive_checklist IS 'Allows users to update their own intensive checklist records (status, started_at, completed_at, step completions)';


--
-- Name: intensive_responses Users can update own intensive responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own intensive responses" ON public.intensive_responses FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: journal_entries Users can update own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own journal entries" ON public.journal_entries FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: media_metadata Users can update own media metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own media metadata" ON public.media_metadata FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: stories Users can update own stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own stories" ON public.stories FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vision_board_items Users can update own vision board items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own vision board items" ON public.vision_board_items FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: vision_versions Users can update own visions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own visions" ON public.vision_versions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: abundance_events Users can update their abundance events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their abundance events" ON public.abundance_events FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: emotional_snapshots Users can update their emotional snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their emotional snapshots" ON public.emotional_snapshots FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: assessment_responses Users can update their own assessment responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own assessment responses" ON public.assessment_responses FOR UPDATE USING ((assessment_id IN ( SELECT assessment_results.id
   FROM public.assessment_results
  WHERE (assessment_results.user_id = auth.uid()))));


--
-- Name: assessment_results Users can update their own assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own assessments" ON public.assessment_results FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: audio_sets Users can update their own audio sets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own audio sets" ON public.audio_sets FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: audio_tracks Users can update their own audio tracks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own audio tracks" ON public.audio_tracks FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: vibe_comments Users can update their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own comments" ON public.vibe_comments FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversation_sessions Users can update their own conversation sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversation sessions" ON public.conversation_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: viva_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.viva_conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: frequency_flip Users can update their own frequency flip seeds; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own frequency flip seeds" ON public.frequency_flip FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can update their own generated images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own generated images" ON public.generated_images FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vision_progress Users can update their own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own progress" ON public.vision_progress FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: refinements Users can update their own refinements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own refinements" ON public.refinements FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: vision_refinements Users can update their own refinements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own refinements" ON public.vision_refinements FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: vibrational_links Users can update their own vibrational links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own vibrational links" ON public.vibrational_links FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vision_board_ideas Users can update their own vision board ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own vision board ideas" ON public.vision_board_ideas FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: audio_voice_clones Users can update their own voice clones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own voice clones" ON public.audio_voice_clones FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: scenes Users can update their scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their scenes" ON public.scenes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: emotional_snapshots Users can upsert their emotional snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upsert their emotional snapshots" ON public.emotional_snapshots FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vibrational_event_sources Users can view enabled vibrational sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view enabled vibrational sources" ON public.vibrational_event_sources FOR SELECT USING (((enabled = true) OR (EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = ANY (ARRAY[('buckinghambliss@gmail.com'::character varying)::text, ('admin@vibrationfit.com'::character varying)::text])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text)))))));


--
-- Name: household_members Users can view household members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view household members" ON public.household_members FOR SELECT USING (((user_id = auth.uid()) OR (household_id IN ( SELECT h.id
   FROM public.households h
  WHERE (h.admin_user_id = auth.uid())))));


--
-- Name: user_badges Users can view other users badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view other users badges" ON public.user_badges FOR SELECT TO authenticated USING (true);


--
-- Name: user_accounts Users can view own account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own account" ON public.user_accounts FOR SELECT USING ((id = auth.uid()));


--
-- Name: audio_generation_batches Users can view own audio generation batches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own audio generation batches" ON public.audio_generation_batches FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_badges Users can view own badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: vision_new_category_state Users can view own category state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own category state" ON public.vision_new_category_state FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can view own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own conversations" ON public.ai_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: email_messages Users can view own emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own emails" ON public.email_messages FOR SELECT USING (((auth.uid() = user_id) OR (guest_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


--
-- Name: vision_focus Users can view own focus; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own focus" ON public.vision_focus FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: intensive_checklist Users can view own intensive checklist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own intensive checklist" ON public.intensive_checklist FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: intensive_responses Users can view own intensive responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own intensive responses" ON public.intensive_responses FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: journal_entries Users can view own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own journal entries" ON public.journal_entries FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: media_metadata Users can view own media metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own media metadata" ON public.media_metadata FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_activity_metrics Users can view own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own metrics" ON public.user_activity_metrics FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: order_items Users can view own order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.user_id = auth.uid())))));


--
-- Name: orders Users can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: coupon_redemptions Users can view own redemptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own redemptions" ON public.coupon_redemptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_storage Users can view own storage grants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own storage grants" ON public.user_storage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: stories Users can view own stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own stories" ON public.stories FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (((auth.uid() = user_id) OR (guest_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


--
-- Name: token_transactions Users can view own token transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own token transactions" ON public.token_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vision_board_items Users can view own vision board items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own vision board items" ON public.vision_board_items FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: vision_versions Users can view own visions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own visions" ON public.vision_versions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_ticket_replies Users can view replies to own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view replies to own tickets" ON public.support_ticket_replies FOR SELECT USING ((ticket_id IN ( SELECT support_tickets.id
   FROM public.support_tickets
  WHERE (support_tickets.user_id = auth.uid()))));


--
-- Name: abundance_events Users can view their abundance events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their abundance events" ON public.abundance_events FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: emotional_snapshots Users can view their emotional snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their emotional snapshots" ON public.emotional_snapshots FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: households Users can view their household; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their household" ON public.households FOR SELECT USING (((admin_user_id = auth.uid()) OR (id IN ( SELECT household_members.household_id
   FROM public.household_members
  WHERE ((household_members.user_id = auth.uid()) AND (household_members.status = 'active'::text))))));


--
-- Name: assessment_insights Users can view their own assessment insights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own assessment insights" ON public.assessment_insights FOR SELECT USING ((assessment_id IN ( SELECT assessment_results.id
   FROM public.assessment_results
  WHERE (assessment_results.user_id = auth.uid()))));


--
-- Name: assessment_responses Users can view their own assessment responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own assessment responses" ON public.assessment_responses FOR SELECT USING ((assessment_id IN ( SELECT assessment_results.id
   FROM public.assessment_results
  WHERE (assessment_results.user_id = auth.uid()))));


--
-- Name: assessment_results Users can view their own assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own assessments" ON public.assessment_results FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: conversation_sessions Users can view their own conversation sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversation sessions" ON public.conversation_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: viva_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.viva_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: frequency_flip Users can view their own frequency flip seeds; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own frequency flip seeds" ON public.frequency_flip FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can view their own generated images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own generated images" ON public.generated_images FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: payment_history Users can view their own payment history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own payment history" ON public.payment_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vision_progress Users can view their own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own progress" ON public.vision_progress FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: refinements Users can view their own refinements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own refinements" ON public.refinements FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vision_refinements Users can view their own refinements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own refinements" ON public.vision_refinements FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: customer_subscriptions Users can view their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscriptions" ON public.customer_subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: token_usage Users can view their own token usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own token usage" ON public.token_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vibrational_links Users can view their own vibrational links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own vibrational links" ON public.vibrational_links FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vision_board_ideas Users can view their own vision board ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own vision board ideas" ON public.vision_board_ideas FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audio_voice_clones Users can view their own voice clones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own voice clones" ON public.audio_voice_clones FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scenes Users can view their scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their scenes" ON public.scenes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vibrational_events Users can view their vibrational events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their vibrational events" ON public.vibrational_events FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: abundance_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.abundance_events ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_action_token_overrides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_action_token_overrides ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_model_pricing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_model_pricing ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_tools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

--
-- Name: assessment_insights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assessment_insights ENABLE ROW LEVEL SECURITY;

--
-- Name: assessment_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: assessment_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

--
-- Name: audio_background_tracks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audio_background_tracks ENABLE ROW LEVEL SECURITY;

--
-- Name: audio_generation_batches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audio_generation_batches ENABLE ROW LEVEL SECURITY;

--
-- Name: audio_mix_ratios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audio_mix_ratios ENABLE ROW LEVEL SECURITY;

--
-- Name: audio_recommended_combos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audio_recommended_combos ENABLE ROW LEVEL SECURITY;

--
-- Name: audio_sets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audio_sets ENABLE ROW LEVEL SECURITY;

--
-- Name: audio_tracks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;

--
-- Name: audio_variants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audio_variants ENABLE ROW LEVEL SECURITY;

--
-- Name: audio_voice_clones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audio_voice_clones ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings bookings_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_admin_all ON public.bookings USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: bookings bookings_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_admin_select ON public.bookings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: bookings bookings_staff_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_staff_select ON public.bookings FOR SELECT USING ((staff_id IN ( SELECT staff.id
   FROM public.staff
  WHERE (staff.user_id = auth.uid()))));


--
-- Name: bookings bookings_staff_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_staff_update ON public.bookings FOR UPDATE USING ((staff_id IN ( SELECT staff.id
   FROM public.staff
  WHERE (staff.user_id = auth.uid()))));


--
-- Name: bookings bookings_user_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_user_insert ON public.bookings FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: bookings bookings_user_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_user_select ON public.bookings FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: bookings bookings_user_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_user_update ON public.bookings FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: calendar_events calendar_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_admin_delete ON public.calendar_events FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: calendar_events calendar_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_admin_insert ON public.calendar_events FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: calendar_events calendar_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_admin_select ON public.calendar_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: calendar_events calendar_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_admin_update ON public.calendar_events FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: calendar_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_events calendar_staff_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_staff_all ON public.calendar_events USING ((staff_id IN ( SELECT staff.id
   FROM public.staff
  WHERE (staff.user_id = auth.uid()))));


--
-- Name: calendar_events calendar_staff_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_staff_select ON public.calendar_events FOR SELECT USING (((staff_id IN ( SELECT staff.id
   FROM public.staff
  WHERE (staff.user_id = auth.uid()))) OR (user_id = auth.uid())));


--
-- Name: cart_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_redemptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_papers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_papers ENABLE ROW LEVEL SECURITY;

--
-- Name: email_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: emotional_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emotional_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: frequency_flip; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.frequency_flip ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

--
-- Name: vision_versions household_admins_can_delete_household_visions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY household_admins_can_delete_household_visions ON public.vision_versions FOR DELETE TO authenticated USING (((household_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.household_members
  WHERE ((household_members.household_id = vision_versions.household_id) AND (household_members.user_id = auth.uid()) AND (household_members.status = 'active'::text) AND (household_members.role = 'admin'::text))))));


--
-- Name: household_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: household_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

--
-- Name: vision_versions household_members_can_insert_household_visions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY household_members_can_insert_household_visions ON public.vision_versions FOR INSERT TO authenticated WITH CHECK (((household_id IS NOT NULL) AND (user_id = auth.uid()) AND public.is_active_household_member(household_id, auth.uid())));


--
-- Name: vision_versions household_members_can_update_household_visions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY household_members_can_update_household_visions ON public.vision_versions FOR UPDATE TO authenticated USING (((household_id IS NOT NULL) AND public.is_active_household_member(household_id, auth.uid()))) WITH CHECK (((household_id IS NOT NULL) AND public.is_active_household_member(household_id, auth.uid())));


--
-- Name: vision_versions household_members_can_view_household_visions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY household_members_can_view_household_visions ON public.vision_versions FOR SELECT TO authenticated USING (((household_id IS NOT NULL) AND public.is_active_household_member(household_id, auth.uid())));


--
-- Name: households; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

--
-- Name: intensive_checklist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intensive_checklist ENABLE ROW LEVEL SECURITY;

--
-- Name: intensive_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intensive_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: journey_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_tracking_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_tracking_events ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: marketing_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: media_metadata; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_metadata ENABLE ROW LEVEL SECURITY;

--
-- Name: membership_tiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: message_send_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.message_send_log ENABLE ROW LEVEL SECURITY;

--
-- Name: messaging_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messaging_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_action_token_overrides overrides_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY overrides_modify ON public.ai_action_token_overrides TO authenticated USING (true) WITH CHECK (true);


--
-- Name: ai_action_token_overrides overrides_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY overrides_select ON public.ai_action_token_overrides FOR SELECT TO authenticated USING (true);


--
-- Name: page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

--
-- Name: product_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: refinements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refinements ENABLE ROW LEVEL SECURITY;

--
-- Name: scenes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduled_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: sequence_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: sequence_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: sequences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sms_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: sms_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: staff; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

--
-- Name: stories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

--
-- Name: support_ticket_replies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: token_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: token_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: user_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_activity_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_activity_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: user_community_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_community_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_storage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_storage ENABLE ROW LEVEL SECURITY;

--
-- Name: vibe_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vibe_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: vibe_hearts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vibe_hearts ENABLE ROW LEVEL SECURITY;

--
-- Name: vibe_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vibe_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: vibrational_event_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vibrational_event_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: vibrational_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vibrational_events ENABLE ROW LEVEL SECURITY;

--
-- Name: vibrational_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vibrational_links ENABLE ROW LEVEL SECURITY;

--
-- Name: video_mapping; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_mapping ENABLE ROW LEVEL SECURITY;

--
-- Name: video_session_messages video_messages_alignment_gym_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_messages_alignment_gym_insert ON public.video_session_messages FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_messages.session_id) AND (vs.session_type = 'alignment_gym'::public.video_session_type)))) AND ((user_id = auth.uid()) OR (user_id IS NULL))));


--
-- Name: video_session_messages video_messages_alignment_gym_view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_messages_alignment_gym_view ON public.video_session_messages FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_messages.session_id) AND (vs.session_type = 'alignment_gym'::public.video_session_type)))) AND (auth.uid() IS NOT NULL)));


--
-- Name: video_session_messages video_messages_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_messages_delete ON public.video_session_messages FOR DELETE USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_messages.session_id) AND (vs.host_user_id = auth.uid()))))));


--
-- Name: video_session_messages video_messages_own_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_messages_own_update ON public.video_session_messages FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: video_session_messages video_messages_participant_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_messages_participant_insert ON public.video_session_messages FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM public.video_session_participants vsp
  WHERE ((vsp.session_id = video_session_messages.session_id) AND (vsp.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_messages.session_id) AND (vs.host_user_id = auth.uid()))))) AND ((user_id = auth.uid()) OR (user_id IS NULL))));


--
-- Name: video_session_messages video_messages_participant_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_messages_participant_select ON public.video_session_messages FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.video_session_participants vsp
  WHERE ((vsp.session_id = video_session_messages.session_id) AND (vsp.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_messages.session_id) AND (vs.host_user_id = auth.uid()))))));


--
-- Name: video_session_participants video_participants_alignment_gym_join; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_participants_alignment_gym_join ON public.video_session_participants FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_participants.session_id) AND (vs.session_type = 'alignment_gym'::public.video_session_type)))) AND (user_id = auth.uid())));


--
-- Name: video_session_participants video_participants_alignment_gym_view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_participants_alignment_gym_view ON public.video_session_participants FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_participants.session_id) AND (vs.session_type = 'alignment_gym'::public.video_session_type)))) AND (auth.uid() IS NOT NULL)));


--
-- Name: video_session_participants video_participants_host_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_participants_host_manage ON public.video_session_participants USING ((EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_participants.session_id) AND (vs.host_user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_participants.session_id) AND (vs.host_user_id = auth.uid())))));


--
-- Name: video_session_participants video_participants_view_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_participants_view_own ON public.video_session_participants FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: video_session_recordings video_recordings_host_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_recordings_host_manage ON public.video_session_recordings USING ((EXISTS ( SELECT 1
   FROM public.video_sessions vs
  WHERE ((vs.id = video_session_recordings.session_id) AND (vs.host_user_id = auth.uid())))));


--
-- Name: video_session_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_session_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: video_session_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_session_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: video_session_recordings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_session_recordings ENABLE ROW LEVEL SECURITY;

--
-- Name: video_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: video_sessions video_sessions_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_sessions_admin_all ON public.video_sessions USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: video_sessions video_sessions_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_sessions_admin_select ON public.video_sessions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_accounts
  WHERE ((user_accounts.id = auth.uid()) AND (user_accounts.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: video_sessions video_sessions_alignment_gym_view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_sessions_alignment_gym_view ON public.video_sessions FOR SELECT USING (((session_type = 'alignment_gym'::public.video_session_type) AND (auth.uid() IS NOT NULL)));


--
-- Name: video_sessions video_sessions_host_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_sessions_host_all ON public.video_sessions USING ((host_user_id = auth.uid())) WITH CHECK ((host_user_id = auth.uid()));


--
-- Name: video_sessions video_sessions_participant_view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_sessions_participant_view ON public.video_sessions FOR SELECT USING ((id IN ( SELECT public.get_user_session_ids(auth.uid()) AS get_user_session_ids)));


--
-- Name: vision_board_ideas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vision_board_ideas ENABLE ROW LEVEL SECURITY;

--
-- Name: vision_board_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vision_board_items ENABLE ROW LEVEL SECURITY;

--
-- Name: vision_focus; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vision_focus ENABLE ROW LEVEL SECURITY;

--
-- Name: vision_new_category_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vision_new_category_state ENABLE ROW LEVEL SECURITY;

--
-- Name: vision_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vision_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: vision_refinements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vision_refinements ENABLE ROW LEVEL SECURITY;

--
-- Name: vision_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vision_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: visitors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

--
-- Name: viva_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viva_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: voice_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Admins can delete default images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can delete default images" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'default-images'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: objects Admins can delete immersion tracks; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can delete immersion tracks" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'immersion-tracks'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: objects Admins can delete site assets; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can delete site assets" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'site-assets'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: objects Admins can delete tutorial videos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can delete tutorial videos" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'tutorial-videos'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: objects Admins can update site assets; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can update site assets" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'site-assets'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: objects Admins can upload default images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can upload default images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'default-images'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: objects Admins can upload immersion tracks; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can upload immersion tracks" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'immersion-tracks'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: objects Admins can upload site assets; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can upload site assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'site-assets'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: objects Admins can upload tutorial videos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Admins can upload tutorial videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'tutorial-videos'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@vibrationfit.com'::text))));


--
-- Name: objects Anyone can view default images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Anyone can view default images" ON storage.objects FOR SELECT USING ((bucket_id = 'default-images'::text));


--
-- Name: objects Anyone can view immersion tracks; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Anyone can view immersion tracks" ON storage.objects FOR SELECT USING ((bucket_id = 'immersion-tracks'::text));


--
-- Name: objects Anyone can view site assets; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Anyone can view site assets" ON storage.objects FOR SELECT USING ((bucket_id = 'site-assets'::text));


--
-- Name: objects Anyone can view tutorial videos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Anyone can view tutorial videos" ON storage.objects FOR SELECT USING ((bucket_id = 'tutorial-videos'::text));


--
-- Name: objects Users can delete own audio; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own audio" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'user-audio'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can delete own images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'user-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can delete own videos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own videos" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'user-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can delete their own files; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'user-uploads'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can update own images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'user-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can update their own files; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'user-uploads'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can upload own audio; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload own audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'user-audio'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can upload own images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload own images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'user-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can upload own videos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload own videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'user-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can upload their own files; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload their own files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'user-uploads'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can view own audio; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can view own audio" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'user-audio'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can view own images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can view own images" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'user-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can view own videos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can view own videos" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'user-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can view their own files; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'user-uploads'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict BgaVFla6tm6gePB7AxVNpXvXw0Qv3zCfZCkxQerxHHfVmiZWjCTyIJd4dbsib73

