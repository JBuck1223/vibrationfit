-- Admin alert when someone starts a free activation.
-- In-app row is written by the app; this seeds the toggleable admin SMS.

INSERT INTO sms_templates (slug, name, description, category, status, body, variables, triggers, owner_type)
SELECT
  'notif-free-activation-signup-admin',
  'Free Activation Signup (Admin)',
  'Admin SMS when someone signs up for the free activation offer.',
  'notifications'::template_category,
  'active'::template_status,
  'Free Activation signup: {{name}} ({{email}})',
  '["name", "email"]'::jsonb,
  '["Sent to admins when a new free activation is started"]'::jsonb,
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates
  WHERE slug = 'notif-free-activation-signup-admin'
    AND owner_type = 'system'
    AND owner_id IS NULL
);

UPDATE sms_templates
SET
  name = 'Free Activation Signup (Admin)',
  description = 'Admin SMS when someone signs up for the free activation offer.',
  category = 'notifications',
  status = 'active',
  body = 'Free Activation signup: {{name}} ({{email}})',
  variables = '["name", "email"]'::jsonb,
  triggers = '["Sent to admins when a new free activation is started"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'notif-free-activation-signup-admin'
  AND owner_type = 'system'
  AND owner_id IS NULL;

INSERT INTO notification_configs (
  slug,
  name,
  description,
  category,
  email_enabled,
  sms_enabled,
  admin_sms_enabled,
  admin_sms_template_slug,
  variables
)
VALUES (
  'free_activation_signup',
  'Free Activation Signup',
  'Admin SMS when someone signs up for the free activation offer.',
  'activation',
  false,
  false,
  true,
  'notif-free-activation-signup-admin',
  '["name", "email"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  email_enabled = EXCLUDED.email_enabled,
  sms_enabled = EXCLUDED.sms_enabled,
  admin_sms_enabled = EXCLUDED.admin_sms_enabled,
  admin_sms_template_slug = EXCLUDED.admin_sms_template_slug,
  variables = EXCLUDED.variables,
  updated_at = NOW();
