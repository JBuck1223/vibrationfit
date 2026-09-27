-- Carry audio onto a new vision version only when the result stays coherent.
-- Voice-only and personal recordings keep unchanged sections; rewritten
-- categories are left off so generation can fill them.
-- Mixes come forward only when they still cover the whole vision, or when
-- the member explicitly chose specific categories and those were not rewritten.

CREATE OR REPLACE FUNCTION public.carry_over_audio_to_new_vision(
  p_new_vision_id UUID,
  p_parent_vision_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_vision RECORD;
  v_refined JSONB;
  v_written TEXT[];
  v_set RECORD;
  v_track RECORD;
  v_new_set_id UUID;
  v_scope JSONB;
  v_metadata JSONB;
  v_is_voice BOOLEAN;
  v_eligible BOOLEAN;
  v_copy_full BOOLEAN;
  v_tracks_copied INTEGER := 0;
  v_sets_copied INTEGER := 0;
  v_sets_skipped INTEGER := 0;
  v_set_track_count INTEGER;
BEGIN
  SELECT *
  INTO v_new_vision
  FROM vision_versions
  WHERE id = p_new_vision_id;

  IF v_new_vision.id IS NULL THEN
    RAISE EXCEPTION 'New vision not found: %', p_new_vision_id;
  END IF;

  v_refined := COALESCE(v_new_vision.refined_categories, '[]'::jsonb);
  v_written := ARRAY[]::text[];

  IF NULLIF(btrim(v_new_vision.forward), '') IS NOT NULL THEN v_written := v_written || 'forward'; END IF;
  IF NULLIF(btrim(v_new_vision.fun), '') IS NOT NULL THEN v_written := v_written || 'fun'; END IF;
  IF NULLIF(btrim(v_new_vision.health), '') IS NOT NULL THEN v_written := v_written || 'health'; END IF;
  IF NULLIF(btrim(v_new_vision.travel), '') IS NOT NULL THEN v_written := v_written || 'travel'; END IF;
  IF NULLIF(btrim(v_new_vision.love), '') IS NOT NULL THEN v_written := v_written || 'love'; END IF;
  IF NULLIF(btrim(v_new_vision.family), '') IS NOT NULL THEN v_written := v_written || 'family'; END IF;
  IF NULLIF(btrim(v_new_vision.social), '') IS NOT NULL THEN v_written := v_written || 'social'; END IF;
  IF NULLIF(btrim(v_new_vision.home), '') IS NOT NULL THEN v_written := v_written || 'home'; END IF;
  IF NULLIF(btrim(v_new_vision.work), '') IS NOT NULL THEN v_written := v_written || 'work'; END IF;
  IF NULLIF(btrim(v_new_vision.money), '') IS NOT NULL THEN v_written := v_written || 'money'; END IF;
  IF NULLIF(btrim(v_new_vision.stuff), '') IS NOT NULL THEN v_written := v_written || 'stuff'; END IF;
  IF NULLIF(btrim(v_new_vision.giving), '') IS NOT NULL THEN v_written := v_written || 'giving'; END IF;
  IF NULLIF(btrim(v_new_vision.spirituality), '') IS NOT NULL THEN v_written := v_written || 'spirituality'; END IF;
  IF NULLIF(btrim(v_new_vision.conclusion), '') IS NOT NULL THEN v_written := v_written || 'conclusion'; END IF;

  FOR v_set IN
    SELECT *
    FROM audio_sets
    WHERE vision_id = p_parent_vision_id
      AND content_type = 'life_vision'
    ORDER BY created_at ASC
  LOOP
    v_is_voice := COALESCE(v_set.variant, 'standard') IN ('standard', 'personal');
    v_scope := NULL;

    IF v_set.metadata IS NOT NULL
       AND jsonb_typeof(v_set.metadata->'selected_sections') = 'array'
       AND jsonb_array_length(v_set.metadata->'selected_sections') > 0 THEN
      v_scope := v_set.metadata->'selected_sections';
    ELSIF v_set.variant LIKE 'custom-%' THEN
      SELECT b.metadata->'selected_sections'
      INTO v_scope
      FROM audio_generation_batches b
      WHERE b.id::text LIKE (substring(v_set.variant FROM 8) || '%')
        AND COALESCE(b.metadata->>'mix_all_sections', 'true') = 'false'
        AND jsonb_typeof(b.metadata->'selected_sections') = 'array'
        AND jsonb_array_length(b.metadata->'selected_sections') > 0
      ORDER BY b.created_at DESC
      LIMIT 1;
    END IF;

    IF v_scope IS NOT NULL THEN
      SELECT COALESCE(bool_and(
        s.key = ANY(v_written)
        AND NOT (v_refined ? s.key)
        AND EXISTS (
          SELECT 1 FROM audio_tracks t
          WHERE t.audio_set_id = v_set.id
            AND t.section_key = s.key
            AND t.status = 'completed'
            AND t.audio_url IS NOT NULL
            AND btrim(t.audio_url) <> ''
        )
      ), false)
      INTO v_eligible
      FROM jsonb_array_elements_text(v_scope) AS s(key);
      v_copy_full := v_eligible;
    ELSIF v_is_voice THEN
      SELECT EXISTS (
        SELECT 1 FROM unnest(v_written) AS k
        WHERE NOT (v_refined ? k)
          AND EXISTS (
            SELECT 1 FROM audio_tracks t
            WHERE t.audio_set_id = v_set.id
              AND t.section_key = k
              AND t.status = 'completed'
              AND t.audio_url IS NOT NULL
              AND btrim(t.audio_url) <> ''
          )
      )
      INTO v_eligible;
      -- The combined file is only still accurate when every written section came along.
      SELECT v_eligible AND NOT EXISTS (
        SELECT 1 FROM unnest(v_written) AS k
        WHERE v_refined ? k
           OR NOT EXISTS (
             SELECT 1 FROM audio_tracks t
             WHERE t.audio_set_id = v_set.id
               AND t.section_key = k
               AND t.status = 'completed'
               AND t.audio_url IS NOT NULL
               AND btrim(t.audio_url) <> ''
           )
      )
      INTO v_copy_full;
    ELSE
      -- A mix comes forward only as a complete version of this vision.
      SELECT NOT EXISTS (
        SELECT 1 FROM unnest(v_written) AS k
        WHERE v_refined ? k
           OR NOT EXISTS (
             SELECT 1 FROM audio_tracks t
             WHERE t.audio_set_id = v_set.id
               AND t.section_key = k
               AND t.status = 'completed'
               AND t.audio_url IS NOT NULL
               AND btrim(t.audio_url) <> ''
           )
      )
      INTO v_eligible;
      v_copy_full := v_eligible;
    END IF;

    IF NOT v_eligible THEN
      v_sets_skipped := v_sets_skipped + 1;
      CONTINUE;
    END IF;

    v_new_set_id := gen_random_uuid();
    v_metadata := COALESCE(v_set.metadata, '{}'::jsonb);
    IF v_scope IS NOT NULL THEN
      v_metadata := v_metadata || jsonb_build_object('selected_sections', v_scope);
    END IF;

    INSERT INTO audio_sets (
      id, vision_id, user_id, household_id, name, description,
      variant, voice_id, is_active, metadata,
      content_type, content_id,
      created_at, updated_at
    ) VALUES (
      v_new_set_id, p_new_vision_id, v_new_vision.user_id, v_new_vision.household_id,
      v_set.name, v_set.description,
      v_set.variant, v_set.voice_id, v_set.is_active, v_metadata,
      v_set.content_type, v_set.content_id,
      NOW(), NOW()
    );

    v_set_track_count := 0;

    FOR v_track IN
      SELECT *
      FROM audio_tracks
      WHERE audio_set_id = v_set.id
        AND status = 'completed'
        AND audio_url IS NOT NULL
        AND btrim(audio_url) <> ''
      ORDER BY created_at ASC
    LOOP
      IF v_track.section_key = 'full' THEN
        IF NOT v_copy_full THEN
          CONTINUE;
        END IF;
      ELSIF v_scope IS NOT NULL THEN
        IF NOT (v_scope ? v_track.section_key) THEN
          CONTINUE;
        END IF;
      ELSIF NOT (v_track.section_key = ANY(v_written)) OR (v_refined ? v_track.section_key) THEN
        CONTINUE;
      END IF;

      INSERT INTO audio_tracks (
        user_id, vision_id, audio_set_id, section_key,
        content_hash, text_content, voice_id,
        s3_bucket, s3_key, audio_url,
        duration_seconds, status, mix_status,
        mixed_audio_url, mixed_s3_key,
        play_count, content_type,
        created_at, updated_at
      ) VALUES (
        v_new_vision.user_id, p_new_vision_id, v_new_set_id, v_track.section_key,
        v_track.content_hash, v_track.text_content, v_track.voice_id,
        v_track.s3_bucket, v_track.s3_key, v_track.audio_url,
        v_track.duration_seconds, 'completed', v_track.mix_status,
        CASE WHEN v_copy_full OR v_scope IS NOT NULL THEN v_track.mixed_audio_url ELSE NULL END,
        CASE WHEN v_copy_full OR v_scope IS NOT NULL THEN v_track.mixed_s3_key ELSE NULL END,
        0, v_track.content_type,
        NOW(), NOW()
      );

      v_set_track_count := v_set_track_count + 1;
      v_tracks_copied := v_tracks_copied + 1;
    END LOOP;

    IF v_set_track_count > 0 THEN
      v_sets_copied := v_sets_copied + 1;
    ELSE
      DELETE FROM audio_sets WHERE id = v_new_set_id;
      v_sets_skipped := v_sets_skipped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'sets_copied', v_sets_copied,
    'sets_skipped', v_sets_skipped,
    'tracks_copied', v_tracks_copied,
    'refined_categories', v_refined
  );
END;
$$;

COMMENT ON FUNCTION public.carry_over_audio_to_new_vision(UUID, UUID) IS
  'Copies audio onto a new vision version. Voice-only and personal recordings keep unchanged sections. Mixes are copied only when they still cover every written category, or when the member explicitly selected categories and those were not rewritten.';
