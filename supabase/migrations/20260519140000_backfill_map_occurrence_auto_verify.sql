-- Backfill pending MAP commitment occurrences when platform evidence exists for occurred_on.

UPDATE public.commitment_occurrences co
SET
  status = 'yes',
  verified_at = timezone('utc', now()),
  updated_at = timezone('utc', now())
FROM public.commitments c
WHERE co.commitment_id = c.id
  AND co.status = 'pending'
  AND c.status = 'active'
  AND (
    (
      c.activity_type = 'daily_paper'
      AND EXISTS (
        SELECT 1
        FROM public.daily_papers dp
        WHERE dp.user_id = co.user_id
          AND dp.entry_date = co.occurred_on
      )
    )
    OR (
      c.activity_type = 'journal_entry'
      AND EXISTS (
        SELECT 1
        FROM public.journal_entries je
        WHERE je.user_id = co.user_id
          AND je.date = co.occurred_on
      )
    )
    OR (
      c.activity_type = 'journal_review'
      AND (
        EXISTS (
          SELECT 1
          FROM public.area_activations aa
          WHERE aa.user_id = co.user_id
            AND aa.area = 'journal_review'
            AND aa.activation_date = co.occurred_on
        )
        OR EXISTS (
          SELECT 1
          FROM public.journal_entries je
          WHERE je.user_id = co.user_id
            AND (
              je.date = co.occurred_on
              OR (je.updated_at AT TIME ZONE 'UTC')::date = co.occurred_on
            )
        )
      )
    )
    OR (
      c.activity_type IN (
        'vision_audio',
        'morning_vision',
        'night_immersion',
        'realtime_activation'
      )
      AND (
        EXISTS (
          SELECT 1
          FROM public.area_activations aa
          WHERE aa.user_id = co.user_id
            AND aa.area = 'vision_audio'
            AND aa.activation_date = co.occurred_on
        )
        OR EXISTS (
          SELECT 1
          FROM public.audio_tracks at
          WHERE at.user_id = co.user_id
            AND at.play_count > 0
            AND COALESCE(at.content_type, 'life_vision') = 'life_vision'
            AND (at.updated_at AT TIME ZONE 'UTC')::date = co.occurred_on
        )
      )
    )
    OR (
      c.activity_type = 'story_audio'
      AND (
        EXISTS (
          SELECT 1
          FROM public.area_activations aa
          WHERE aa.user_id = co.user_id
            AND aa.area = 'story_audio'
            AND aa.activation_date = co.occurred_on
        )
        OR EXISTS (
          SELECT 1
          FROM public.audio_tracks at
          WHERE at.user_id = co.user_id
            AND at.play_count > 0
            AND at.content_type IN ('focus_story', 'affirmation', 'visualization')
            AND (at.updated_at AT TIME ZONE 'UTC')::date = co.occurred_on
        )
      )
    )
    OR (
      c.activity_type = 'music_listen'
      AND EXISTS (
        SELECT 1
        FROM public.area_activations aa
        WHERE aa.user_id = co.user_id
          AND aa.area = 'music_listen'
          AND aa.activation_date = co.occurred_on
      )
    )
    OR (
      c.activity_type = 'vision_read'
      AND (
        EXISTS (
          SELECT 1
          FROM public.area_activations aa
          WHERE aa.user_id = co.user_id
            AND aa.area = 'life_vision'
            AND aa.activation_date = co.occurred_on
        )
        OR EXISTS (
          SELECT 1
          FROM public.vision_versions vv
          WHERE vv.user_id = co.user_id
            AND (vv.updated_at AT TIME ZONE 'UTC')::date = co.occurred_on
        )
      )
    )
    OR (
      c.activity_type = 'vision_board_view'
      AND EXISTS (
        SELECT 1
        FROM public.area_activations aa
        WHERE aa.user_id = co.user_id
          AND aa.area = 'vision_board'
          AND aa.activation_date = co.occurred_on
      )
    )
    OR (
      c.activity_type = 'vision_board_update'
      AND (
        EXISTS (
          SELECT 1
          FROM public.vision_board_item_status_events e
          WHERE e.user_id = co.user_id
            AND (e.changed_at AT TIME ZONE 'UTC')::date = co.occurred_on
            AND e.from_status IS DISTINCT FROM e.to_status
        )
        OR EXISTS (
          SELECT 1
          FROM public.vision_board_items vbi
          WHERE vbi.user_id = co.user_id
            AND (vbi.updated_at AT TIME ZONE 'UTC')::date = co.occurred_on
            AND vbi.updated_at > vbi.created_at + interval '1 minute'
        )
      )
    )
    OR (
      c.activity_type = 'abundance_tracker'
      AND EXISTS (
        SELECT 1
        FROM public.abundance_events ae
        WHERE ae.user_id = co.user_id
          AND ae.date = co.occurred_on
      )
    )
    OR (
      c.activity_type = 'vibe_tribe_post'
      AND EXISTS (
        SELECT 1
        FROM public.vibe_posts vp
        WHERE vp.user_id = co.user_id
          AND vp.is_deleted = false
          AND (vp.created_at AT TIME ZONE 'UTC')::date = co.occurred_on
      )
    )
    OR (
      c.activity_type = 'vibe_tribe_engage'
      AND (
        EXISTS (
          SELECT 1
          FROM public.vibe_hearts vh
          WHERE vh.user_id = co.user_id
            AND (vh.created_at AT TIME ZONE 'UTC')::date = co.occurred_on
        )
        OR EXISTS (
          SELECT 1
          FROM public.vibe_comments vc
          WHERE vc.user_id = co.user_id
            AND vc.is_deleted = false
            AND (vc.created_at AT TIME ZONE 'UTC')::date = co.occurred_on
        )
      )
    )
    OR (
      c.activity_type = 'alignment_gym'
      AND EXISTS (
        SELECT 1
        FROM public.video_session_participants vsp
        INNER JOIN public.video_sessions vs ON vs.id = vsp.session_id
        WHERE vsp.user_id = co.user_id
          AND vsp.attended = true
          AND vsp.joined_at IS NOT NULL
          AND (
            vs.session_type = 'alignment_gym'
            OR vs.title ILIKE '%alignment gym%'
          )
          AND (
            (vsp.joined_at AT TIME ZONE 'UTC')::date = co.occurred_on
            OR date_trunc(
              'week',
              (vsp.joined_at AT TIME ZONE 'UTC')::date::timestamp
            ) = date_trunc(
              'week',
              co.occurred_on::timestamp
            )
          )
      )
    )
  );
