-- Carry over audio sets and tracks from a parent vision to a new vision version.
-- Unchanged sections (not in refined_categories) are copied; changed sections are skipped.
-- Personal recordings are preserved proactively; VIVA tracks become available for content_hash reuse.

CREATE OR REPLACE FUNCTION public.carry_over_audio_to_new_vision(
  p_new_vision_id UUID,
  p_parent_vision_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refined JSONB;
  v_new_vision RECORD;
  v_set RECORD;
  v_track RECORD;
  v_new_set_id UUID;
  v_tracks_copied INTEGER := 0;
  v_tracks_skipped INTEGER := 0;
  v_sets_copied INTEGER := 0;
  v_sets_skipped INTEGER := 0;
  v_set_track_count INTEGER;
BEGIN
  SELECT id, user_id, refined_categories
  INTO v_new_vision
  FROM vision_versions
  WHERE id = p_new_vision_id;

  IF v_new_vision.id IS NULL THEN
    RAISE EXCEPTION 'New vision not found: %', p_new_vision_id;
  END IF;

  v_refined := COALESCE(v_new_vision.refined_categories, '[]'::jsonb);

  FOR v_set IN
    SELECT *
    FROM audio_sets
    WHERE vision_id = p_parent_vision_id
    ORDER BY created_at ASC
  LOOP
    v_set_track_count := 0;
    v_new_set_id := gen_random_uuid();

    -- Create the audio set first (FK requires it before inserting tracks)
    INSERT INTO audio_sets (
      id, vision_id, user_id, name, description,
      variant, voice_id, is_active, metadata,
      content_type, content_id,
      created_at, updated_at
    ) VALUES (
      v_new_set_id, p_new_vision_id, v_new_vision.user_id, v_set.name, v_set.description,
      v_set.variant, v_set.voice_id, v_set.is_active, v_set.metadata,
      v_set.content_type, v_set.content_id,
      NOW(), NOW()
    );

    FOR v_track IN
      SELECT *
      FROM audio_tracks
      WHERE audio_set_id = v_set.id
        AND status = 'completed'
      ORDER BY created_at ASC
    LOOP
      IF v_track.section_key = 'full' THEN
        v_tracks_skipped := v_tracks_skipped + 1;
        CONTINUE;
      END IF;

      IF v_refined ? v_track.section_key THEN
        v_tracks_skipped := v_tracks_skipped + 1;
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
        v_track.mixed_audio_url, v_track.mixed_s3_key,
        0, v_track.content_type,
        NOW(), NOW()
      );

      v_set_track_count := v_set_track_count + 1;
      v_tracks_copied := v_tracks_copied + 1;
    END LOOP;

    IF v_set_track_count > 0 THEN
      v_sets_copied := v_sets_copied + 1;
    ELSE
      -- No tracks were eligible; remove the empty set
      DELETE FROM audio_sets WHERE id = v_new_set_id;
      v_sets_skipped := v_sets_skipped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'sets_copied', v_sets_copied,
    'sets_skipped', v_sets_skipped,
    'tracks_copied', v_tracks_copied,
    'tracks_skipped', v_tracks_skipped,
    'refined_categories', v_refined
  );
END;
$$;

COMMENT ON FUNCTION public.carry_over_audio_to_new_vision(UUID, UUID) IS
  'Copies audio sets and their unchanged tracks from a parent vision to a new vision version. Sections in refined_categories are skipped. Full concatenated tracks are always skipped.';
