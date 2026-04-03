-- Seed the 7 remaining weekly Alignment Gym sessions (sessions #2-#8).
-- Session #1 (March 31) already exists. Weekly on Tuesdays at 12 PM ET (16:00 UTC).
DO $$
DECLARE
  v_host_id uuid := '2a0fc1a7-5b8a-46a4-97e4-d5c5ddefdf1a';
  v_dates timestamptz[] := ARRAY[
    '2026-04-07T16:00:00+00:00',
    '2026-04-14T16:00:00+00:00',
    '2026-04-21T16:00:00+00:00',
    '2026-04-28T16:00:00+00:00',
    '2026-05-05T16:00:00+00:00',
    '2026-05-12T16:00:00+00:00',
    '2026-05-19T16:00:00+00:00'
  ];
  v_dt timestamptz;
  v_session_id uuid;
BEGIN
  FOREACH v_dt IN ARRAY v_dates
  LOOP
    INSERT INTO video_sessions (
      title, description, session_type, status,
      scheduled_at, scheduled_duration_minutes,
      host_user_id, enable_recording, enable_waiting_room,
      max_participants, is_group_session
    ) VALUES (
      'The Alignment Gym',
      'Weekly live group coaching session',
      'alignment_gym', 'scheduled',
      v_dt, 60,
      v_host_id, true, false,
      0, true
    )
    RETURNING id INTO v_session_id;

    INSERT INTO video_session_participants (session_id, user_id, name, is_host)
    VALUES (v_session_id, v_host_id, 'Jordan Buckingham', true);
  END LOOP;
END $$;
