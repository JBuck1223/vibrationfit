-- Reconcile vision version numbering with the client/studio numbering.
--
-- The studio context and area-bar selectors number versions per document
-- group (personal per user, household per household) EXCLUDING drafts.
-- calculate_vision_version_number counted drafts too, so the DB-reported
-- "V{n}" could diverge from the UI (e.g. V3 in the selector, V4 on the
-- detail page) whenever a draft existed earlier in the timeline.
--
-- Fix: exclude drafts from the count. A committed vision's number is the
-- count of non-draft visions in its group created at or before it. A draft
-- being numbered gets (prior non-drafts + 1), which matches the client's
-- "will become V{n} when committed" display.

DROP FUNCTION IF EXISTS public.calculate_vision_version_number(uuid, uuid);

CREATE FUNCTION public.calculate_vision_version_number(p_vision_id uuid, p_user_id uuid)
RETURNS integer
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

  -- Separate numbering based on personal vs household; drafts never count
  IF vision_household_id IS NULL THEN
    -- PERSONAL VISION: count only this user's non-draft personal visions
    SELECT COUNT(*) INTO version_num
    FROM vision_versions
    WHERE user_id = p_user_id
      AND household_id IS NULL
      AND is_draft = false
      AND created_at <= vision_created_at
      AND id != p_vision_id;
  ELSE
    -- HOUSEHOLD VISION: count only this household's non-draft visions
    SELECT COUNT(*) INTO version_num
    FROM vision_versions
    WHERE household_id = vision_household_id
      AND is_draft = false
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

COMMENT ON FUNCTION public.calculate_vision_version_number(p_vision_id uuid, p_user_id uuid) IS
  'Calculates version number with separate sequences per document group (personal per user, household per household), excluding drafts so DB numbering matches the studio UI.';
