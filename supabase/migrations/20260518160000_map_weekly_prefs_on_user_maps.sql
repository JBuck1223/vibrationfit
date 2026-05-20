-- Weekly MAP digest preferences belong on the MAP (user_maps), not user_accounts.

ALTER TABLE public.user_maps
  ADD COLUMN IF NOT EXISTS map_weekly_reminder_email boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS map_weekly_reminder_sms boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS map_weekly_reminder_time time WITHOUT TIME ZONE DEFAULT '07:00:00';

COMMENT ON COLUMN public.user_maps.map_weekly_reminder_email IS 'Weekly MAP digest email for this MAP version';
COMMENT ON COLUMN public.user_maps.map_weekly_reminder_sms IS 'Weekly MAP digest SMS for this MAP version';
COMMENT ON COLUMN public.user_maps.map_weekly_reminder_time IS 'Local Monday send time for weekly digest; use user_maps.timezone';

-- Backfill from user_accounts when those columns exist (older installs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_accounts' AND column_name = 'map_weekly_reminder_email'
  ) THEN
    UPDATE public.user_maps um
    SET
      map_weekly_reminder_email = COALESCE(ua.map_weekly_reminder_email, true),
      map_weekly_reminder_sms = COALESCE(ua.map_weekly_reminder_sms, true)
    FROM public.user_accounts ua
    WHERE um.user_id = ua.id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_accounts' AND column_name = 'map_weekly_reminder_time'
  ) THEN
    UPDATE public.user_maps um
    SET map_weekly_reminder_time = COALESCE(ua.map_weekly_reminder_time, '07:00:00'::time)
    FROM public.user_accounts ua
    WHERE um.user_id = ua.id;
  END IF;
END $$;

ALTER TABLE public.user_accounts
  DROP COLUMN IF EXISTS map_weekly_reminder_email,
  DROP COLUMN IF EXISTS map_weekly_reminder_sms,
  DROP COLUMN IF EXISTS map_weekly_reminder_time;
