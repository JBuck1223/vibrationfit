-- MAP plan history: append-only commitment_change_events for date-based time travel

CREATE TABLE IF NOT EXISTS public.commitment_change_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  commitment_id uuid REFERENCES public.commitments(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created', 'updated', 'archived', 'deleted', 'resumed')),
  state jsonb NOT NULL,
  changed_at timestamptz DEFAULT now() NOT NULL,
  source text NOT NULL DEFAULT 'auto' CHECK (source IN (
    'system_activate', 'custom_create', 'custom_update', 'custom_archive', 'custom_delete', 'auto'
  )),
  map_activation_id uuid REFERENCES public.user_maps(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_commitment_change_events_user_changed
  ON public.commitment_change_events (user_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_commitment_change_events_commitment_changed
  ON public.commitment_change_events (commitment_id, changed_at DESC);

ALTER TABLE public.commitment_change_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commitment change events"
  ON public.commitment_change_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitment change events"
  ON public.commitment_change_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.commitment_change_events IS
  'Append-only log of commitment changes for historical MAP plan snapshots.';

-- Build full commitment state JSON for event replay
CREATE OR REPLACE FUNCTION public.commitment_row_to_state(r public.commitments)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'id', r.id,
    'user_id', r.user_id,
    'vision_target_id', r.vision_target_id,
    'category', r.category,
    'parent_commitment_id', r.parent_commitment_id,
    'type', r.type,
    'title', r.title,
    'description', r.description,
    'cadence', r.cadence,
    'start_date', r.start_date,
    'end_date', r.end_date,
    'status', r.status,
    'activity_type', r.activity_type,
    'notify_sms', COALESCE(r.notify_sms, false),
    'notify_email', COALESCE(r.notify_email, false),
    'reminder_time', r.reminder_time,
    'reminder_days', r.reminder_days,
    'imported_from_map_item_id', r.imported_from_map_item_id,
    'created_at', r.created_at,
    'updated_at', r.updated_at
  );
$$;

CREATE OR REPLACE FUNCTION public.infer_commitment_change_source(
  p_row public.commitments,
  p_op text,
  p_old_status text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_is_system boolean;
BEGIN
  v_is_system := p_row.activity_type IS NOT NULL
    AND p_row.category IN ('activations', 'creations', 'connections', 'sessions');

  IF p_op = 'INSERT' THEN
    IF v_is_system THEN
      RETURN 'auto';
    END IF;
    RETURN 'custom_create';
  END IF;

  IF p_op = 'UPDATE' THEN
    IF p_row.status = 'archived' AND p_old_status = 'active' THEN
      IF v_is_system THEN
        RETURN 'auto';
      END IF;
      RETURN 'custom_archive';
    END IF;
    IF p_row.status = 'active' AND p_old_status IN ('archived', 'paused', 'completed') THEN
      RETURN 'custom_update';
    END IF;
    IF v_is_system THEN
      RETURN 'auto';
    END IF;
    RETURN 'custom_update';
  END IF;

  IF p_op = 'DELETE' THEN
    IF v_is_system THEN
      RETURN 'auto';
    END IF;
    RETURN 'custom_delete';
  END IF;

  RETURN 'auto';
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_commitment_event_type(
  p_op text,
  p_old_status text,
  p_new_status text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_op = 'INSERT' THEN
    RETURN 'created';
  END IF;

  IF p_op = 'DELETE' THEN
    RETURN 'deleted';
  END IF;

  IF p_old_status IS DISTINCT FROM p_new_status THEN
    IF p_new_status = 'archived' THEN
      RETURN 'archived';
    END IF;
    IF p_new_status = 'active' AND p_old_status IN ('archived', 'paused', 'completed') THEN
      RETURN 'resumed';
    END IF;
  END IF;

  RETURN 'updated';
END;
$$;

CREATE OR REPLACE FUNCTION public.log_commitment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.commitments;
  v_event_type text;
  v_source text;
  v_map_activation_id uuid;
  v_changed_at timestamptz;
  v_config text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_row := OLD;
    v_event_type := 'deleted';
    v_changed_at := now();
  ELSE
    v_row := NEW;
    v_event_type := public.resolve_commitment_event_type(
      TG_OP,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      NEW.status
    );
    v_changed_at := CASE
      WHEN TG_OP = 'INSERT' THEN COALESCE(NEW.created_at, now())
      ELSE now()
    END;
  END IF;

  v_config := nullif(current_setting('app.change_source', true), '');
  IF v_config IS NOT NULL AND v_config <> '' THEN
    v_source := v_config;
  ELSE
    v_source := public.infer_commitment_change_source(
      v_row,
      TG_OP,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
    );
  END IF;

  v_config := nullif(current_setting('app.map_activation_id', true), '');
  IF v_config IS NOT NULL AND v_config <> '' THEN
    v_map_activation_id := v_config::uuid;
  ELSE
    v_map_activation_id := NULL;
  END IF;

  INSERT INTO public.commitment_change_events (
    commitment_id,
    user_id,
    event_type,
    state,
    changed_at,
    source,
    map_activation_id
  ) VALUES (
    v_row.id,
    v_row.user_id,
    v_event_type,
    public.commitment_row_to_state(v_row),
    v_changed_at,
    v_source,
    v_map_activation_id
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_commitment_change ON public.commitments;

CREATE TRIGGER trg_log_commitment_change
  AFTER INSERT OR UPDATE OR DELETE ON public.commitments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_commitment_change();

-- Single-transaction system MAP activate (set_config + archive + insert)
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
      NULLIF(c->>'reminder_time', ''),
      v_reminder_days
    );
  END LOOP;

  RETURN jsonb_build_object(
    'map_activation_id', v_map_id,
    'version_number', v_next_version
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_system_map TO authenticated;
