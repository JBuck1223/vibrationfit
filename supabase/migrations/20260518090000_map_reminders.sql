-- MAP Reminders: weekly digest toggles on user_accounts + per-commitment reminder fields

-- Weekly MAP digest preferences (default ON for both channels)
ALTER TABLE public.user_accounts
  ADD COLUMN IF NOT EXISTS map_weekly_reminder_email boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS map_weekly_reminder_sms   boolean DEFAULT true NOT NULL;

-- Per-commitment reminder controls
ALTER TABLE public.commitments
  ADD COLUMN IF NOT EXISTS notify_sms     boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_email   boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_time  time      WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS reminder_days  integer[];

COMMENT ON COLUMN public.commitments.notify_sms     IS 'Send per-activity SMS reminders';
COMMENT ON COLUMN public.commitments.notify_email   IS 'Send per-activity email reminders';
COMMENT ON COLUMN public.commitments.reminder_time  IS 'Local time for reminders (user timezone from user_accounts)';
COMMENT ON COLUMN public.commitments.reminder_days  IS '0=Sunday through 6=Saturday';

CREATE INDEX IF NOT EXISTS idx_commitments_reminders
  ON public.commitments (user_id)
  WHERE status = 'active' AND (notify_sms = true OR notify_email = true);
