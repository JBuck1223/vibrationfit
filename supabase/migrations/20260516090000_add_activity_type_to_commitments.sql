-- Add activity_type to commitments for auto-verification mapping
-- Maps to ACTIVITY_DEFINITIONS.type (e.g. 'journal_entry', 'vision_audio', 'alignment_gym')
ALTER TABLE public.commitments ADD COLUMN IF NOT EXISTS activity_type text;

-- Fast lookup for auto-verify: find active commitments by user + activity type
CREATE INDEX IF NOT EXISTS idx_commitments_activity
  ON public.commitments(user_id, activity_type)
  WHERE status = 'active';
