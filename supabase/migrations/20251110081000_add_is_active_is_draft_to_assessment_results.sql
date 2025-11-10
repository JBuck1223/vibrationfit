-- ============================================================================
-- Add is_active and is_draft flags to assessment_results
-- ============================================================================

ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill draft flag for any assessments currently in progress
UPDATE assessment_results
SET is_draft = TRUE
WHERE status = 'in_progress';

-- Backfill active flag for the most recently completed assessment per user
WITH ranked_completed AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY COALESCE(completed_at, updated_at, created_at) DESC
    ) AS row_num
  FROM assessment_results
  WHERE status = 'completed'
)
UPDATE assessment_results ar
SET is_active = TRUE
FROM ranked_completed rc
WHERE ar.id = rc.id
  AND rc.row_num = 1;

-- Ensure only one active assessment per user (most recent completed)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_assessment_per_user
  ON assessment_results(user_id)
  WHERE is_active;

-- Ensure only one draft assessment per user (in-progress assessment)
CREATE UNIQUE INDEX IF NOT EXISTS unique_draft_assessment_per_user
  ON assessment_results(user_id)
  WHERE is_draft;

