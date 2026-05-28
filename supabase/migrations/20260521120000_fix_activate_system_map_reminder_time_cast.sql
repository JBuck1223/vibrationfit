-- Cast reminder_time from JSON text to time (fixes activate_system_map type error)
CREATE OR REPLACE FUNCTION public.activate_system_map(
  p_title text,
  p_timezone text,
  p_map_weekly_reminder_email boolean,
  p_map_weekly_reminder_sms boolean,
  p_map_weekly_reminder_time time,
  p_commitments jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_map_id uuid;
  v_next_version int;
  c jsonb;
  v_cadence jsonb;
  v_reminder_days int[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_commitments IS NULL OR jsonb_array_length(p_commitments) = 0 THEN
    RAISE EXCEPTION 'At least one commitment is required';
  END IF;

  UPDATE public.user_maps
  SET is_active = false
  WHERE user_id = v_user_id AND is_active = true;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM public.user_maps
  WHERE user_id = v_user_id AND is_draft = false;

  INSERT INTO public.user_maps (
    user_id,
    title,
    is_draft,
    is_active,
    version_number,
    timezone,
    map_weekly_reminder_email,
    map_weekly_reminder_sms,
    map_weekly_reminder_time
  ) VALUES (
    v_user_id,
    COALESCE(NULLIF(trim(p_title), ''), 'My MAP'),
    false,
    true,
    v_next_version,
    COALESCE(NULLIF(trim(p_timezone), ''), 'America/New_York'),
    COALESCE(p_map_weekly_reminder_email, true),
    COALESCE(p_map_weekly_reminder_sms, true),
    p_map_weekly_reminder_time
  )
  RETURNING id INTO v_map_id;

  PERFORM set_config('app.map_activation_id', v_map_id::text, true);
  PERFORM set_config('app.change_source', 'system_activate', true);

  UPDATE public.commitments
  SET status = 'archived'
  WHERE user_id = v_user_id
    AND status = 'active'
    AND category IN ('activations', 'creations', 'connections', 'sessions');

  FOR c IN SELECT * FROM jsonb_array_elements(p_commitments)
  LOOP
    v_cadence := c->'cadence';
    IF c ? 'reminder_days' AND jsonb_typeof(c->'reminder_days') = 'array' THEN
      SELECT COALESCE(array_agg(elem::int), NULL)
      INTO v_reminder_days
      FROM jsonb_array_elements_text(c->'reminder_days') AS elem;
    ELSE
      v_reminder_days := NULL;
    END IF;

    INSERT INTO public.commitments (
      user_id,
      category,
      type,
      title,
      description,
      cadence,
      activity_type,
      status,
      notify_sms,
      notify_email,
      reminder_time,
      reminder_days
    ) VALUES (
      v_user_id,
      c->>'category',
      COALESCE(c->>'type', 'recurring'),
      c->>'title',
      NULLIF(c->>'description', ''),
      v_cadence,
      NULLIF(c->>'activity_type', ''),
      'active',
      COALESCE((c->>'notify_sms')::boolean, false),
      COALESCE((c->>'notify_email')::boolean, false),
      NULLIF(c->>'reminder_time', '')::time,
      v_reminder_days
    );
  END LOOP;

  RETURN jsonb_build_object(
    'map_activation_id', v_map_id,
    'version_number', v_next_version
  );
END;
$$;
