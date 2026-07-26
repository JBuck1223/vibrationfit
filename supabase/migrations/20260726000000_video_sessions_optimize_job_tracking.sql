-- Track MediaConvert optimization jobs on video_sessions so the recording
-- sync cron can (a) never resubmit a job that is already in flight and
-- (b) auto-finalize the URL swap when the job completes.
--
-- Context: the 5-minute recording-sync cron and optimizeRecording() fought
-- over recording_status ('uploaded' vs 'processing'), resubmitting the same
-- MediaConvert job every cycle - 142 duplicate jobs / ~$172 on Jul 23-24.

ALTER TABLE public.video_sessions
  ADD COLUMN IF NOT EXISTS optimize_job_id text,
  ADD COLUMN IF NOT EXISTS optimize_submitted_at timestamptz;

COMMENT ON COLUMN public.video_sessions.optimize_job_id IS
  'MediaConvert job id for the recording optimization. Present = job submitted; never resubmit while set.';
COMMENT ON COLUMN public.video_sessions.optimize_submitted_at IS
  'When the MediaConvert optimization job was submitted.';
