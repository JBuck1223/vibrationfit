-- ============================================================================
-- ALIGNMENT GYM: 1-HOUR SMS REMINDER (PER-SESSION)
--
-- Replaces the 1-hour email + 15-min SMS with a single 1-hour SMS.
-- Scheduled dynamically from session.scheduled_at in application code.
--
-- 1a. Seed SMS template with {{sessionTime}} variable
-- 1b. Seed SMS-only notification config linked to Alignment Gym Audience
-- 1c. Disable the old 1hr email and 15min SMS configs
-- ============================================================================

-- ── 1a. SMS template ──────────────────────────────────────────────────────────

INSERT INTO sms_templates (slug, name, description, category, status, body, variables, triggers)
VALUES (
  'alignment-gym-reminder-1hr-sms',
  'Alignment Gym: 1-Hour SMS Reminder',
  'SMS sent 1 hour before each Alignment Gym session. Scheduled per-session from video_sessions.scheduled_at.',
  'reminders',
  'active',
  E'Hey Vibe Tribe, it''s Jordan & Vanessa from Vibration Fit. Quick reminder: Alignment Gym is today at {{sessionTime}}.\nJoin the live session here at lunch:\nhttps://vibrationfit.com/alignment-gym',
  '["sessionTime"]'::jsonb,
  '["Per-session reminder via scheduleAlignmentGymReminders"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  status = EXCLUDED.status, body = EXCLUDED.body, variables = EXCLUDED.variables,
  triggers = EXCLUDED.triggers, updated_at = NOW();


-- ── 1b. Notification config (SMS-only) ───────────────────────────────────────

INSERT INTO notification_configs (slug, name, description, category, email_enabled, sms_enabled, admin_sms_enabled, sms_template_slug, variables, segment_id)
VALUES (
  'alignment_gym_reminder_1hr_sms',
  'Alignment Gym 1-Hour SMS Reminder',
  'SMS sent 1 hour before each Alignment Gym session to the Alignment Gym Audience segment. No email.',
  'alignment_gym',
  false,                                      -- email OFF
  true,                                       -- SMS ON
  false,                                      -- admin SMS OFF
  'alignment-gym-reminder-1hr-sms',
  '["sessionTime"]'::jsonb,
  'a0000000-0000-0000-0000-000000000001'      -- Alignment Gym Audience segment
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
  email_enabled = EXCLUDED.email_enabled, sms_enabled = EXCLUDED.sms_enabled,
  admin_sms_enabled = EXCLUDED.admin_sms_enabled,
  sms_template_slug = EXCLUDED.sms_template_slug,
  variables = EXCLUDED.variables, segment_id = EXCLUDED.segment_id,
  updated_at = NOW();


-- ── 1c. Disable old per-session configs (keep rows for audit trail) ──────────

UPDATE notification_configs
SET email_enabled = false, sms_enabled = false, admin_sms_enabled = false,
    description = '[DISABLED] Replaced by alignment_gym_reminder_1hr_sms. ' || COALESCE(description, ''),
    updated_at = NOW()
WHERE slug IN ('alignment_gym_reminder_1hr', 'alignment_gym_reminder_15min');
