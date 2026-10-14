-- Admin SMS when someone finishes a free activation
-- (I've Entered This Reality). In-app signup alert stays separate.

INSERT INTO sms_templates (slug, name, description, category, status, body, variables, triggers, owner_type)
SELECT
  'notif-free-activation-complete-admin',
  'Free Activation Complete (Admin)',
  'Admin SMS when someone finishes the free activation.',
  'notifications'::template_category,
  'active'::template_status,
  'Free Activation complete: {{name}} ({{email}}) — {{category}}',
  '["name", "email", "category"]'::jsonb,
  '["Sent to admins when a free activation is completed"]'::jsonb,
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates
  WHERE slug = 'notif-free-activation-complete-admin'
    AND owner_type = 'system'
    AND owner_id IS NULL
);

UPDATE sms_templates
SET
  name = 'Free Activation Complete (Admin)',
  description = 'Admin SMS when someone finishes the free activation.',
  category = 'notifications',
  status = 'active',
  body = 'Free Activation complete: {{name}} ({{email}}) — {{category}}',
  variables = '["name", "email", "category"]'::jsonb,
  triggers = '["Sent to admins when a free activation is completed"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'notif-free-activation-complete-admin'
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
  'free_activation_complete',
  'Free Activation Complete',
  'Admin SMS when someone finishes the free activation.',
  'activation',
  false,
  false,
  true,
  'notif-free-activation-complete-admin',
  '["name", "email", "category"]'::jsonb
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
