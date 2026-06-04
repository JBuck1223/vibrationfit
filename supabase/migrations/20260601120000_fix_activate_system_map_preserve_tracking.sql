-- Fix activate_system_map to REUSE existing commitments by activity_type
-- instead of archiving + recreating them. This preserves commitment_occurrences
-- (tracking history) across MAP updates.

CREATE OR REPLACE FUNCTION public.activate_system_map(
  p_title text,
  p_timezone text,
  p_map_weekly_reminder_email boolean,
  p_map_weekly_reminder_sms boolean,
  p_map_weekly_reminder_time time without time zone,
  p_commitments jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_map_id uuid;
  v_next_version int;
  c jsonb;
  v_cadence jsonb;
  v_reminder_days int[];
  v_activity_type text;
  v_existing_id uuid;
  v_incoming_activity_types text[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_commitments IS NULL OR jsonb_array_length(p_commitments) = 0 THEN
    RAISE EXCEPTION 'At least one commitment is required';
  END IF;

  -- Deactivate current active MAP
  UPDATE public.user_maps
  SET is_active = false
  WHERE user_id = v_user_id AND is_active = true;

  -- Create new MAP version
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM public.user_maps
  WHERE user_id = v_user_id AND is_draft = false;

  INSERT INTO public.user_maps (
    user_id, title, is_draft, is_active, version_number, timezone,
    map_weekly_reminder_email, map_weekly_reminder_sms, map_weekly_reminder_time
  ) VALUES (
    v_user_id,
    COALESCE(NULLIF(trim(p_title), ''), 'My MAP'),
    false, true, v_next_version,
    COALESCE(NULLIF(trim(p_timezone), ''), 'America/New_York'),
    COALESCE(p_map_weekly_reminder_email, true),
    COALESCE(p_map_weekly_reminder_sms, true),
    p_map_weekly_reminder_time
  )
  RETURNING id INTO v_map_id;

  PERFORM set_config('app.map_activation_id', v_map_id::text, true);
  PERFORM set_config('app.change_source', 'system_activate', true);

  -- Collect all incoming activity_types so we know which ones to keep
  SELECT array_agg(DISTINCT elem->>'activity_type')
  INTO v_incoming_activity_types
  FROM jsonb_array_elements(p_commitments) AS elem
  WHERE elem->>'activity_type' IS NOT NULL AND elem->>'activity_type' != '';

  IF v_incoming_activity_types IS NULL THEN
    v_incoming_activity_types := ARRAY[]::text[];
  END IF;

  -- Archive only system commitments whose activity_type is NOT in the incoming set
  UPDATE public.commitments
  SET status = 'archived'
  WHERE user_id = v_user_id
    AND status = 'active'
    AND activity_type IS NOT NULL
    AND activity_type != ''
    AND category IN ('activations', 'creations', 'connections', 'sessions')
    AND activity_type NOT IN (SELECT unnest(v_incoming_activity_types));

  -- Upsert each incoming commitment: update existing or insert new
  FOR c IN SELECT * FROM jsonb_array_elements(p_commitments)
  LOOP
    v_cadence := c->'cadence';
    v_activity_type := NULLIF(c->>'activity_type', '');

    IF c ? 'reminder_days' AND jsonb_typeof(c->'reminder_days') = 'array' THEN
      SELECT COALESCE(array_agg(elem::int), NULL)
      INTO v_reminder_days
      FROM jsonb_array_elements_text(c->'reminder_days') AS elem;
    ELSE
      v_reminder_days := NULL;
    END IF;

    -- Try to find an existing active commitment with the same activity_type
    v_existing_id := NULL;
    IF v_activity_type IS NOT NULL THEN
      SELECT id INTO v_existing_id
      FROM public.commitments
      WHERE user_id = v_user_id
        AND activity_type = v_activity_type
        AND status = 'active'
        AND category IN ('activations', 'creations', 'connections', 'sessions')
      LIMIT 1;
    END IF;

    IF v_existing_id IS NOT NULL THEN
      -- Update existing commitment in-place (preserves ID → preserves occurrences)
      UPDATE public.commitments
      SET
        category    = c->>'category',
        type        = COALESCE(c->>'type', 'recurring'),
        title       = c->>'title',
        description = NULLIF(c->>'description', ''),
        cadence     = v_cadence,
        notify_sms  = COALESCE((c->>'notify_sms')::boolean, false),
        notify_email = COALESCE((c->>'notify_email')::boolean, false),
        reminder_time = NULLIF(c->>'reminder_time', '')::time,
        reminder_days = v_reminder_days,
        updated_at  = now()
      WHERE id = v_existing_id;
    ELSE
      -- Insert new commitment
      INSERT INTO public.commitments (
        user_id, category, type, title, description, cadence,
        activity_type, status,
        notify_sms, notify_email, reminder_time, reminder_days
      ) VALUES (
        v_user_id,
        c->>'category',
        COALESCE(c->>'type', 'recurring'),
        c->>'title',
        NULLIF(c->>'description', ''),
        v_cadence,
        v_activity_type,
        'active',
        COALESCE((c->>'notify_sms')::boolean, false),
        COALESCE((c->>'notify_email')::boolean, false),
        NULLIF(c->>'reminder_time', '')::time,
        v_reminder_days
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'map_activation_id', v_map_id,
    'version_number', v_next_version
  );
END;
$function$;
