-- Highlight only the {{email}} in green in the 72-Hour Activation Intensive access template
-- Template ID: 5906850e-6555-4b92-9ef4-34af2a26f230 (intensive-welcome-access)
UPDATE public.email_templates
SET
  html_body = REPLACE(
    html_body,
    'Your account is set up with <strong style="color:#fff;">{{email}}</strong>',
    'Your account is set up with <strong style="color:#39FF14;">{{email}}</strong>'
  ),
  updated_at = NOW()
WHERE id = '5906850e-6555-4b92-9ef4-34af2a26f230'
  AND html_body LIKE '%Your account is set up with <strong style="color:#fff;">{{email}}</strong>%';
