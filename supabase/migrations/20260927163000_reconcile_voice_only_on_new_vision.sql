-- A new vision version does not inherit audio mixes.
-- Those sets stay on the version they were created for.
-- Unchanged voice-only tracks are copied onto one new voice set for this version.
-- Rewritten categories are left empty so generation can fill that same set.

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
  v_voice_id TEXT;
  v_new_set_id UUID;
  v_track RECORD;
  v_tracks_copied INTEGER := 0;
  v_sets_skipped INTEGER := 0;
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

  SELECT count(*)
  INTO v_sets_skipped
  FROM audio_sets
  WHERE vision_id = p_parent_vision_id
    AND content_type = 'life_vision'
    AND COALESCE(variant, 'standard') <> 'standard';

  SELECT s.voice_id
  INTO v_voice_id
  FROM audio_sets s
  WHERE s.vision_id = p_parent_vision_id
    AND s.content_type = 'life_vision'
    AND COALESCE(s.variant, 'standard') = 'standard'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_voice_id IS NULL THEN
    RETURN jsonb_build_object(
      'sets_copied', 0,
      'sets_skipped', v_sets_skipped,
      'tracks_copied', 0,
      'refined_categories', v_refined
    );
  END IF;

  v_new_set_id := NULL;

  FOR v_track IN
    SELECT DISTINCT ON (t.section_key)
      t.section_key, t.content_hash, t.text_content, t.voice_id,
      t.s3_bucket, t.s3_key, t.audio_url, t.duration_seconds, t.content_type
    FROM audio_tracks t
    JOIN audio_sets s ON s.id = t.audio_set_id
    WHERE s.vision_id = p_parent_vision_id
      AND s.content_type = 'life_vision'
      AND COALESCE(s.variant, 'standard') = 'standard'
      AND t.status = 'completed'
      AND t.audio_url IS NOT NULL
      AND btrim(t.audio_url) <> ''
      AND t.section_key = ANY(v_written)
      AND t.section_key <> 'full'
      AND NOT (v_refined ? t.section_key)
    ORDER BY t.section_key, s.created_at DESC, t.created_at DESC
  LOOP
    IF v_new_set_id IS NULL THEN
      v_new_set_id := gen_random_uuid();
      INSERT INTO audio_sets (
        id, vision_id, user_id, household_id, name, description,
        variant, voice_id, is_active, metadata,
        content_type,
        created_at, updated_at
      ) VALUES (
        v_new_set_id, p_new_vision_id, v_new_vision.user_id, v_new_vision.household_id,
        'standard Version', 'Voice only narration',
        'standard', v_voice_id, true, '{}'::jsonb,
        'life_vision',
        NOW(), NOW()
      );
    END IF;

    INSERT INTO audio_tracks (
      user_id, vision_id, audio_set_id, section_key,
      content_hash, text_content, voice_id,
      s3_bucket, s3_key, audio_url,
      duration_seconds, status, mix_status,
      play_count, content_type,
      created_at, updated_at
    ) VALUES (
      v_new_vision.user_id, p_new_vision_id, v_new_set_id, v_track.section_key,
      v_track.content_hash, v_track.text_content, v_track.voice_id,
      v_track.s3_bucket, v_track.s3_key, v_track.audio_url,
      v_track.duration_seconds, 'completed', 'not_required',
      0, COALESCE(v_track.content_type, 'life_vision'),
      NOW(), NOW()
    );

    v_tracks_copied := v_tracks_copied + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'sets_copied', CASE WHEN v_new_set_id IS NULL THEN 0 ELSE 1 END,
    'sets_skipped', v_sets_skipped,
    'tracks_copied', v_tracks_copied,
    'voice_set_id', v_new_set_id,
    'refined_categories', v_refined
  );
END;
$$;

COMMENT ON FUNCTION public.carry_over_audio_to_new_vision(UUID, UUID) IS
  'Creates one new voice-only set on the new vision and copies unchanged voice tracks into it. Audio mixes stay on the version they were created for.';
