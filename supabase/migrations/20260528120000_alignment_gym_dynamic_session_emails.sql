-- ============================================================================
-- ALIGNMENT GYM: DYNAMIC SESSION EMAILS
--
-- Replace hardcoded "Tuesday at 12 pm ET" copy with template variables that
-- resolve to the actual video_sessions.scheduled_at row at queue time.
--
-- Steps:
--   1. Rewrite alignment-gym-monday-reminder template to use
--      {{sessionDate}} / {{sessionTime}} / {{sessionDayName}} / {{joinLink}}
--   2. Add notification_configs row 'alignment_gym_day_before_email'
--      pointing at that template + Alignment Gym Audience segment
--   3. Update launch + recap templates to use the same variables
--   4. Deactivate the standalone Monday recurring_emails row (superseded by
--      per-session day-before email scheduled at session-creation time)
--   5. Backfill scheduled_messages day-before email jobs for every future
--      alignment_gym video_session (idempotent)
-- ============================================================================


-- ── 1. alignment-gym-monday-reminder template (dynamic copy) ───────────────

INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables, triggers)
VALUES (
  'alignment-gym-monday-reminder',
  'Alignment Gym: Day-Before Reminder',
  'Day-before reminder email for an upcoming Alignment Gym session. Sent automatically the day before each session at 9 AM ET, scoped to the Alignment Gym Audience segment.',
  'marketing',
  'active',

  -- SUBJECT
  E'Alignment Gym is tomorrow at {{sessionTime}}',

  -- HTML BODY (personal style — no branded cards)
  E'<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;background-color:#ffffff;color:#333333;">\n<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;"><tr><td align="center" style="padding:40px 20px;">\n<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;text-align:left;">\n<tr><td style="font-size:16px;line-height:1.6;color:#333333;">\n\n<p style="margin:0 0 10px;">Hey Vibe Tribe,</p>\n<p style="margin:0 0 10px;">Quick reminder:</p>\n<p style="margin:0 0 10px;">Alignment Gym is tomorrow at {{sessionTime}}.</p>\n<p style="margin:0 0 6px;">This is your weekly live space to:</p>\n<ul style="margin:0 0 10px;padding-left:24px;">\n  <li style="margin-bottom:2px;">Get coached in real time (no more guessing)</li>\n  <li style="margin-bottom:2px;">Plug into the energy of the Vibe Tribe</li>\n  <li style="margin-bottom:2px;">Shift into alignment and move your vision forward now</li>\n</ul>\n<p style="margin:0 0 6px;"><strong>When &amp; where</strong></p>\n<ul style="margin:0 0 10px;padding-left:24px;">\n  <li style="margin-bottom:2px;">Every {{sessionDayName}} at {{sessionTime}}</li>\n  <li style="margin-bottom:2px;">Join live here: <a href="{{joinLink}}" style="color:#1a73e8;text-decoration:none;">{{joinLink}}</a></li>\n</ul>\n<p style="margin:0 0 10px;">Add this as a recurring {{sessionDayName}} appointment on your calendar and mark it &ldquo;Busy.&rdquo; Give your future self that one protected hour each week.</p>\n<p style="margin:0 0 2px;">See you live tomorrow at {{sessionTime}},</p>\n<p style="margin:0;">Jordan &amp; Vanessa</p>\n\n</td></tr>\n</table></td></tr></table>\n</body></html>',

  -- TEXT BODY
  E'Hey Vibe Tribe,\n\nQuick reminder:\n\nAlignment Gym is tomorrow at {{sessionTime}}.\n\nThis is your weekly live space to:\n\n- Get coached in real time (no more guessing)\n- Plug into the energy of the Vibe Tribe\n- Shift into alignment and move your vision forward now\n\nWhen & where\n\n- Every {{sessionDayName}} at {{sessionTime}}\n- Join live here: {{joinLink}}\n\nAdd this as a recurring {{sessionDayName}} appointment on your calendar and mark it "Busy." Give your future self that one protected hour each week.\n\nSee you live tomorrow at {{sessionTime}},\nJordan & Vanessa',

  '["sessionDate", "sessionTime", "sessionDayName", "joinLink"]'::jsonb,
  '["Per-session day-before reminder via scheduled_messages notification job"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  status = EXCLUDED.status, subject = EXCLUDED.subject, html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body, variables = EXCLUDED.variables,
  triggers = EXCLUDED.triggers, updated_at = NOW();


-- ── 2. notification_configs row: alignment_gym_day_before_email ────────────

INSERT INTO notification_configs (slug, name, description, category, email_enabled, sms_enabled, admin_sms_enabled, email_template_slug, variables, segment_id)
VALUES (
  'alignment_gym_day_before_email',
  'Alignment Gym: Day-Before Email',
  'Day-before reminder email queued at session creation time and fired the day before each Alignment Gym session at 9 AM ET. Audience: Alignment Gym Audience segment.',
  'alignment_gym',
  true,
  false,
  false,
  'alignment-gym-monday-reminder',
  '["sessionDate", "sessionTime", "sessionDayName", "joinLink"]'::jsonb,
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  email_enabled = EXCLUDED.email_enabled, sms_enabled = EXCLUDED.sms_enabled,
  admin_sms_enabled = EXCLUDED.admin_sms_enabled,
  email_template_slug = EXCLUDED.email_template_slug,
  variables = EXCLUDED.variables, segment_id = EXCLUDED.segment_id,
  updated_at = NOW();


-- ── 3a. Update alignment-gym-launch template to use dynamic variables ──────

UPDATE email_templates
SET
  subject = E'Alignment Gym starts {{sessionDayName}}!',
  html_body = E'<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;background-color:#ffffff;color:#333333;">\n<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;"><tr><td align="center" style="padding:40px 20px;">\n<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;text-align:left;">\n<tr><td style="font-size:16px;line-height:1.6;color:#333333;">\n\n<p style="margin:0 0 10px;">Hi {{firstName}},</p>\n<p style="margin:0 0 10px;">This {{sessionDate}}, we''re opening something brand new inside Vibration Fit:</p>\n<p style="margin:0 0 10px;font-size:18px;"><strong>The Alignment Gym.</strong></p>\n<p style="margin:0 0 6px;">This is our weekly live space to:</p>\n<ul style="margin:0 0 10px;padding-left:24px;">\n  <li style="margin-bottom:2px;">Strengthen and clarify your vision</li>\n  <li style="margin-bottom:2px;">Practice getting into vibrational harmony on purpose</li>\n  <li style="margin-bottom:2px;">Get coaching and community support so your vision becomes real, not just &ldquo;someday&rdquo;</li>\n</ul>\n<p style="margin:0 0 6px;"><strong>When &amp; where</strong></p>\n<p style="margin:0;">Every {{sessionDayName}} at {{sessionTime}}</p>\n<p style="margin:0;">First session: {{sessionDate}}</p>\n<p style="margin:0 0 10px;">Join here:<br><a href="https://vibrationfit.com/alignment-gym" style="color:#1a73e8;text-decoration:none;">https://vibrationfit.com/alignment-gym</a></p>\n<p style="margin:0 0 10px;">Put this on your calendar as a recurring {{sessionDayName}} appointment and mark it &ldquo;Busy.&rdquo; Treat it like a non&#8209;negotiable date with your future self.</p>\n<p style="margin:0 0 10px;">If you can''t attend live, you can listen to the replay afterward and it will still count toward your Alignment Gym attendance.</p>\n<p style="margin:0 0 6px;"><strong>Who the Alignment Gym is for</strong></p>\n<p style="margin:0 0 10px;">The Alignment Gym is a graduate unlock for members who have completed the Intensive, because we''ll be using those tools live.</p>\n<p style="margin:0 0 6px;"><strong>If you''ve already finished the Intensive:</strong></p>\n<ul style="margin:0 0 10px;padding-left:24px;">\n  <li style="margin-bottom:2px;">Add the Alignment Gym to your calendar</li>\n  <li style="margin-bottom:2px;">Plan to be there live this {{sessionDayName}} at {{sessionTime}}</li>\n  <li style="margin-bottom:2px;">Bring your questions, challenges, and wins</li>\n</ul>\n<p style="margin:0 0 6px;"><strong>If you haven''t finished the Intensive yet:</strong></p>\n<p style="margin:0 0 10px;">You still have time.</p>\n<p style="margin:0 0 10px;">Log in here:<br><a href="https://vibrationfit.com/auth/login" style="color:#1a73e8;text-decoration:none;">https://vibrationfit.com/auth/login</a></p>\n<p style="margin:0 0 10px;">When you complete the Intensive, you''ll unlock access to the Alignment Gym group coaching sessions.</p>\n<p style="margin:0 0 10px;">Think of the Intensive as your foundation and the Alignment Gym as your weekly practice. The more solid your foundation, the more powerfully you can use this space.</p>\n<p style="margin:0 0 6px;"><strong>Why this matters</strong></p>\n<p style="margin:0 0 10px;">Most people consume spiritual content and still feel stuck.</p>\n<p style="margin:0;">The Intensive gives you the foundation.</p>\n<p style="margin:0 0 10px;">The Alignment Gym gives you the reps.</p>\n<p style="margin:0 0 6px;">If you want this next season of your life to actually look different, start by:</p>\n<ol style="margin:0 0 10px;padding-left:24px;">\n  <li style="margin-bottom:2px;">Finishing your Intensive, and</li>\n  <li style="margin-bottom:2px;">Showing up live on {{sessionDayName}} at {{sessionTime}}.</li>\n</ol>\n<p style="margin:0 0 2px;">Can''t wait to see you in the Alignment Gym,</p>\n<p style="margin:0;">Jordan &amp; Vanessa</p>\n\n</td></tr>\n</table></td></tr></table>\n</body></html>',
  text_body = E'Hi {{firstName}},\n\nThis {{sessionDate}}, we''re opening something brand new inside Vibration Fit:\n\nThe Alignment Gym.\n\nThis is our weekly live space to:\n\n- Strengthen and clarify your vision\n- Practice getting into vibrational harmony on purpose\n- Get coaching and community support so your vision becomes real, not just "someday"\n\nWhen & where\n\nEvery {{sessionDayName}} at {{sessionTime}}\nFirst session: {{sessionDate}}\nJoin here:\nhttps://vibrationfit.com/alignment-gym\n\nPut this on your calendar as a recurring {{sessionDayName}} appointment and mark it "Busy." Treat it like a non-negotiable date with your future self.\n\nIf you can''t attend live, you can listen to the replay afterward and it will still count toward your Alignment Gym attendance.\n\nWho the Alignment Gym is for\n\nThe Alignment Gym is a graduate unlock for members who have completed the Intensive, because we''ll be using those tools live.\n\nIf you''ve already finished the Intensive:\n\n- Add the Alignment Gym to your calendar\n- Plan to be there live this {{sessionDayName}} at {{sessionTime}}\n- Bring your questions, challenges, and wins\n\nIf you haven''t finished the Intensive yet:\n\nYou still have time.\n\nLog in here:\nhttps://vibrationfit.com/auth/login\n\nWhen you complete the Intensive, you''ll unlock access to the Alignment Gym group coaching sessions.\n\nThink of the Intensive as your foundation and the Alignment Gym as your weekly practice. The more solid your foundation, the more powerfully you can use this space.\n\nWhy this matters\n\nMost people consume spiritual content and still feel stuck.\n\nThe Intensive gives you the foundation.\nThe Alignment Gym gives you the reps.\n\nIf you want this next season of your life to actually look different, start by:\n\n1. Finishing your Intensive, and\n2. Showing up live on {{sessionDayName}} at {{sessionTime}}.\n\nCan''t wait to see you in the Alignment Gym,\nJordan & Vanessa',
  variables = '["firstName", "sessionDate", "sessionTime", "sessionDayName"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'alignment-gym-launch';


-- ── 3b. Update alignment-gym-recap-1 template to use dynamic variables ─────

UPDATE email_templates
SET
  html_body = REPLACE(
    html_body,
    '<p style="margin:0 0 10px;font-size:18px;"><strong>Tuesday, April 7th at 12pm ET</strong></p>',
    '<p style="margin:0 0 10px;font-size:18px;"><strong>{{sessionDate}} at {{sessionTime}}</strong></p>'
  ),
  text_body = REPLACE(
    text_body,
    'Tuesday, April 7th at 12pm ET',
    '{{sessionDate}} at {{sessionTime}}'
  ),
  variables = '["sessionDate", "sessionTime", "sessionDayName"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'alignment-gym-recap-1';


-- ── 4. Deactivate the standalone Monday recurring_emails row ───────────────
-- The day-before reminder is now scheduled per-session at session creation
-- (mirroring the 1-hour SMS pattern). The fixed-cadence Monday row is no
-- longer needed and would double-send if left active.

UPDATE recurring_emails
SET is_active = false,
    updated_at = NOW()
WHERE notification_config_slug = 'alignment_gym_monday_reminder';


-- ── 5. Backfill day-before email jobs for future alignment_gym sessions ────
-- Idempotent: skips any session that already has a job for this slug.

INSERT INTO scheduled_messages (
  message_type,
  notification_config_slug,
  notification_variables,
  related_entity_type,
  related_entity_id,
  scheduled_for,
  status,
  body
)
SELECT
  'email',
  'alignment_gym_day_before_email',
  jsonb_build_object(
    'sessionDate',
      trim(to_char((vs.scheduled_at AT TIME ZONE 'America/New_York'), 'FMDay'))
      || ', '
      || trim(to_char((vs.scheduled_at AT TIME ZONE 'America/New_York'), 'FMMonth FMDD')),
    'sessionTime',
      CASE
        WHEN EXTRACT(MINUTE FROM (vs.scheduled_at AT TIME ZONE 'America/New_York')) = 0
        THEN to_char((vs.scheduled_at AT TIME ZONE 'America/New_York'), 'FMHH12 am')
        ELSE to_char((vs.scheduled_at AT TIME ZONE 'America/New_York'), 'FMHH12:MI am')
      END || ' ET',
    'sessionDayName',
      trim(to_char((vs.scheduled_at AT TIME ZONE 'America/New_York'), 'FMDay')),
    'joinLink',
      'https://vibrationfit.com/alignment-gym'
  ),
  'video_session',
  vs.id,
  ((((vs.scheduled_at AT TIME ZONE 'America/New_York')::date - INTERVAL '1 day')
    + INTERVAL '9 hours') AT TIME ZONE 'America/New_York'),
  'pending',
  'notification-job'
FROM video_sessions vs
WHERE vs.session_type = 'alignment_gym'
  AND vs.scheduled_at > NOW()
  AND COALESCE(vs.test_mode, false) = false
  AND ((((vs.scheduled_at AT TIME ZONE 'America/New_York')::date - INTERVAL '1 day')
    + INTERVAL '9 hours') AT TIME ZONE 'America/New_York') > NOW()
  AND NOT EXISTS (
    SELECT 1 FROM scheduled_messages sm
    WHERE sm.notification_config_slug = 'alignment_gym_day_before_email'
      AND sm.related_entity_id = vs.id
  );
