-- ============================================================================
-- RECURRING EMAILS SYSTEM + MONDAY ALIGNMENT GYM REMINDER
--
-- 1a. Create recurring_emails table for scheduling weekly/recurring blasts
-- 1b. Seed the Alignment Gym Monday Reminder email template
-- 1c. Seed the notification config linking template to segment
-- 1d. Seed the first recurring email row (Monday 9 AM ET)
-- ============================================================================

-- ── 1a. recurring_emails table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recurring_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  notification_config_slug text NOT NULL,
  notification_variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  send_hour integer NOT NULL CHECK (send_hour BETWEEN 0 AND 23),
  send_minute integer NOT NULL DEFAULT 0 CHECK (send_minute BETWEEN 0 AND 59),
  timezone text NOT NULL DEFAULT 'America/New_York',
  is_active boolean NOT NULL DEFAULT true,
  last_queued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE recurring_emails IS 'Recurring email schedules. Each row fires a notification_config at a fixed day/time each week.';
COMMENT ON COLUMN recurring_emails.day_of_week IS '0=Sunday, 1=Monday … 6=Saturday (matches JS getDay())';
COMMENT ON COLUMN recurring_emails.send_hour IS 'Hour to send in the row timezone (0-23)';
COMMENT ON COLUMN recurring_emails.send_minute IS 'Minute to send in the row timezone (0-59)';
COMMENT ON COLUMN recurring_emails.last_queued_at IS 'Idempotency: set after queueing to prevent duplicate sends in the same period';

ALTER TABLE recurring_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recurring_emails"
  ON recurring_emails FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access on recurring_emails"
  ON recurring_emails FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER set_recurring_emails_updated_at
  BEFORE UPDATE ON recurring_emails
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 1b. Email template ──────────────────────────────────────────────────────

INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables, triggers)
VALUES (
  'alignment-gym-monday-reminder',
  'Alignment Gym: Monday Reminder',
  'Weekly Monday reminder for the Tuesday Alignment Gym session. Sent automatically to Alignment Gym Audience segment.',
  'marketing',
  'active',

  -- SUBJECT
  E'Alignment Gym is tomorrow at 12 pm ET',

  -- HTML BODY (personal style — no branded cards)
  E'<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;background-color:#ffffff;color:#333333;">\n<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;"><tr><td align="center" style="padding:40px 20px;">\n<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;text-align:left;">\n<tr><td style="font-size:16px;line-height:1.6;color:#333333;">\n\n<p style="margin:0 0 10px;">Hey Vibe Tribe,</p>\n<p style="margin:0 0 10px;">Quick reminder:</p>\n<p style="margin:0 0 10px;">Alignment Gym is tomorrow at 12 pm ET.</p>\n<p style="margin:0 0 6px;">This is your weekly live space to:</p>\n<ul style="margin:0 0 10px;padding-left:24px;">\n  <li style="margin-bottom:2px;">Get coached in real time (no more guessing)</li>\n  <li style="margin-bottom:2px;">Plug into the energy of the Vibe Tribe</li>\n  <li style="margin-bottom:2px;">Shift into alignment and move your vision forward now</li>\n</ul>\n<p style="margin:0 0 6px;"><strong>When &amp; where</strong></p>\n<ul style="margin:0 0 10px;padding-left:24px;">\n  <li style="margin-bottom:2px;">Every Tuesday at 12 pm ET</li>\n  <li style="margin-bottom:2px;">Join live here: <a href="https://vibrationfit.com/alignment-gym" style="color:#1a73e8;text-decoration:none;">https://vibrationfit.com/alignment-gym</a></li>\n</ul>\n<p style="margin:0 0 10px;">Add this as a recurring Tuesday lunch appointment on your calendar and mark it &ldquo;Busy.&rdquo; Give your future self that one protected hour each week.</p>\n<p style="margin:0 0 2px;">See you live tomorrow at 12 pm ET,</p>\n<p style="margin:0;">Jordan &amp; Vanessa</p>\n\n</td></tr>\n</table></td></tr></table>\n</body></html>',

  -- TEXT BODY
  E'Hey Vibe Tribe,\n\nQuick reminder:\n\nAlignment Gym is tomorrow at 12 pm ET.\n\nThis is your weekly live space to:\n\n- Get coached in real time (no more guessing)\n- Plug into the energy of the Vibe Tribe\n- Shift into alignment and move your vision forward now\n\nWhen & where\n\n- Every Tuesday at 12 pm ET\n- Join live here: https://vibrationfit.com/alignment-gym\n\nAdd this as a recurring Tuesday lunch appointment on your calendar and mark it "Busy." Give your future self that one protected hour each week.\n\nSee you live tomorrow at 12 pm ET,\nJordan & Vanessa',

  '[]'::jsonb,
  '["Recurring Monday reminder via recurring_emails system"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  status = EXCLUDED.status, subject = EXCLUDED.subject, html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body, variables = EXCLUDED.variables,
  triggers = EXCLUDED.triggers, updated_at = NOW();


-- ── 1c. Notification config ─────────────────────────────────────────────────

INSERT INTO notification_configs (slug, name, description, category, email_enabled, sms_enabled, admin_sms_enabled, email_template_slug, variables, segment_id)
VALUES (
  'alignment_gym_monday_reminder',
  'Alignment Gym Monday Reminder',
  'Weekly Monday 9 AM ET reminder for the Tuesday Alignment Gym session. Sent to Alignment Gym Audience segment.',
  'alignment_gym',
  true,
  false,
  false,
  'alignment-gym-monday-reminder',
  '[]'::jsonb,
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  email_enabled = EXCLUDED.email_enabled, sms_enabled = EXCLUDED.sms_enabled,
  admin_sms_enabled = EXCLUDED.admin_sms_enabled,
  email_template_slug = EXCLUDED.email_template_slug,
  variables = EXCLUDED.variables, segment_id = EXCLUDED.segment_id,
  updated_at = NOW();


-- ── 1d. First recurring email: Monday 9 AM ET ──────────────────────────────

INSERT INTO recurring_emails (name, description, notification_config_slug, notification_variables, day_of_week, send_hour, send_minute, timezone, is_active)
VALUES (
  'Alignment Gym Monday Reminder',
  'Sends every Monday at 9 AM ET to remind the Alignment Gym Audience about Tuesday''s session.',
  'alignment_gym_monday_reminder',
  '{}'::jsonb,
  1,    -- Monday
  9,    -- 9 AM
  0,    -- :00
  'America/New_York',
  true
);
