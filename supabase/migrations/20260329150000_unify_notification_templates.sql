-- Unify notification templates: move inline content from notification_configs
-- into email_templates / sms_templates and reference by slug.

-- 1. Add slug reference columns to notification_configs
ALTER TABLE notification_configs
  ADD COLUMN IF NOT EXISTS email_template_slug text,
  ADD COLUMN IF NOT EXISTS sms_template_slug text,
  ADD COLUMN IF NOT EXISTS admin_sms_template_slug text;

-- 2. Insert email templates from notification_configs inline content
--    (only for rows that have email content)

-- calibration_call_requested (email)
INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables)
SELECT
  'notif-calibration-call-requested',
  'Calibration Call Requested',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.email_subject,
  nc.email_body,
  nc.email_text_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'calibration_call_requested' AND nc.email_subject IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- alignment_gym_created (email)
INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables)
SELECT
  'notif-alignment-gym-created',
  'Alignment Gym Session Created',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.email_subject,
  nc.email_body,
  nc.email_text_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'alignment_gym_created' AND nc.email_subject IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- host_joined_session (email)
INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables)
SELECT
  'notif-host-joined-session',
  'Host Joined Session',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.email_subject,
  nc.email_body,
  nc.email_text_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'host_joined_session' AND nc.email_subject IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- alignment_gym_going_live (email)
INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables)
SELECT
  'notif-alignment-gym-going-live',
  'Alignment Gym Going Live',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.email_subject,
  nc.email_body,
  nc.email_text_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'alignment_gym_going_live' AND nc.email_subject IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- alignment_gym_reminder_1hr (email)
INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables)
SELECT
  'notif-alignment-gym-reminder-1hr',
  'Alignment Gym 1-Hour Reminder',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.email_subject,
  nc.email_body,
  nc.email_text_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'alignment_gym_reminder_1hr' AND nc.email_subject IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert SMS templates from notification_configs inline content
--    (user-facing SMS, not admin SMS)

-- calibration_call_requested (sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-calibration-call-requested',
  'Calibration Call Requested SMS',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'calibration_call_requested' AND nc.sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- alignment_gym_created (sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-alignment-gym-created',
  'Alignment Gym Created SMS',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'alignment_gym_created' AND nc.sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- host_joined_session (sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-host-joined-session',
  'Host Joined Session SMS',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'host_joined_session' AND nc.sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- alignment_gym_going_live (sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-alignment-gym-going-live',
  'Alignment Gym Going Live SMS',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'alignment_gym_going_live' AND nc.sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- alignment_gym_reminder_15min (sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-alignment-gym-reminder-15min',
  'Alignment Gym 15-Minute Reminder SMS',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'alignment_gym_reminder_15min' AND nc.sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert admin SMS templates (these go into sms_templates with an -admin suffix)

-- support_ticket_created (admin sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-support-ticket-created-admin',
  'Support Ticket Created (Admin)',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.admin_sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'support_ticket_created' AND nc.admin_sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- intensive_completed (admin sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-intensive-completed-admin',
  'Intensive Completed (Admin)',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.admin_sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'intensive_completed' AND nc.admin_sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- calibration_call_requested (admin sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-calibration-call-requested-admin',
  'Calibration Call Requested (Admin)',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.admin_sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'calibration_call_requested' AND nc.admin_sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- calibration_call_booked (admin sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-calibration-call-booked-admin',
  'Calibration Call Booked (Admin)',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.admin_sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'calibration_call_booked' AND nc.admin_sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- alignment_gym_created (admin sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-alignment-gym-created-admin',
  'Alignment Gym Created (Admin)',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.admin_sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'alignment_gym_created' AND nc.admin_sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- purchase_completed (admin sms)
INSERT INTO sms_templates (slug, name, description, category, status, body, variables)
SELECT
  'notif-purchase-completed-admin',
  'Purchase Completed (Admin)',
  nc.description,
  'notifications'::template_category,
  'active'::template_status,
  nc.admin_sms_body,
  nc.variables
FROM notification_configs nc WHERE nc.slug = 'purchase_completed' AND nc.admin_sms_body IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- 5. Update notification_configs to set the slug references

UPDATE notification_configs SET email_template_slug = 'notif-calibration-call-requested' WHERE slug = 'calibration_call_requested' AND email_subject IS NOT NULL;
UPDATE notification_configs SET email_template_slug = 'notif-alignment-gym-created' WHERE slug = 'alignment_gym_created' AND email_subject IS NOT NULL;
UPDATE notification_configs SET email_template_slug = 'notif-host-joined-session' WHERE slug = 'host_joined_session' AND email_subject IS NOT NULL;
UPDATE notification_configs SET email_template_slug = 'notif-alignment-gym-going-live' WHERE slug = 'alignment_gym_going_live' AND email_subject IS NOT NULL;
UPDATE notification_configs SET email_template_slug = 'notif-alignment-gym-reminder-1hr' WHERE slug = 'alignment_gym_reminder_1hr' AND email_subject IS NOT NULL;

UPDATE notification_configs SET sms_template_slug = 'notif-calibration-call-requested' WHERE slug = 'calibration_call_requested' AND sms_body IS NOT NULL;
UPDATE notification_configs SET sms_template_slug = 'notif-alignment-gym-created' WHERE slug = 'alignment_gym_created' AND sms_body IS NOT NULL;
UPDATE notification_configs SET sms_template_slug = 'notif-host-joined-session' WHERE slug = 'host_joined_session' AND sms_body IS NOT NULL;
UPDATE notification_configs SET sms_template_slug = 'notif-alignment-gym-going-live' WHERE slug = 'alignment_gym_going_live' AND sms_body IS NOT NULL;
UPDATE notification_configs SET sms_template_slug = 'notif-alignment-gym-reminder-15min' WHERE slug = 'alignment_gym_reminder_15min' AND sms_body IS NOT NULL;

UPDATE notification_configs SET admin_sms_template_slug = 'notif-support-ticket-created-admin' WHERE slug = 'support_ticket_created' AND admin_sms_body IS NOT NULL;
UPDATE notification_configs SET admin_sms_template_slug = 'notif-intensive-completed-admin' WHERE slug = 'intensive_completed' AND admin_sms_body IS NOT NULL;
UPDATE notification_configs SET admin_sms_template_slug = 'notif-calibration-call-requested-admin' WHERE slug = 'calibration_call_requested' AND admin_sms_body IS NOT NULL;
UPDATE notification_configs SET admin_sms_template_slug = 'notif-calibration-call-booked-admin' WHERE slug = 'calibration_call_booked' AND admin_sms_body IS NOT NULL;
UPDATE notification_configs SET admin_sms_template_slug = 'notif-alignment-gym-created-admin' WHERE slug = 'alignment_gym_created' AND admin_sms_body IS NOT NULL;
UPDATE notification_configs SET admin_sms_template_slug = 'notif-purchase-completed-admin' WHERE slug = 'purchase_completed' AND admin_sms_body IS NOT NULL;

-- 6. Drop the inline template columns from notification_configs
ALTER TABLE notification_configs
  DROP COLUMN IF EXISTS email_subject,
  DROP COLUMN IF EXISTS email_body,
  DROP COLUMN IF EXISTS email_text_body,
  DROP COLUMN IF EXISTS sms_body,
  DROP COLUMN IF EXISTS admin_sms_body;
