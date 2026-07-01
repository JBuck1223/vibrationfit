-- ============================================================================
-- UPDATE EMAIL & SMS TEMPLATES: 56 days / 8 weeks → 28 days / 4 weeks
-- Subscription billing now starts Day 28 instead of Day 56.
-- ============================================================================

-- SMS: Initial outreach
UPDATE sms_templates
SET body = REPLACE(body, '8 weeks of membership', '4 weeks of membership'),
    updated_at = NOW()
WHERE slug = 'launch-friends-family-sms-initial';

-- SMS: Yes reply
UPDATE sms_templates
SET body = REPLACE(body, '8 weeks of membership', '4 weeks of membership'),
    updated_at = NOW()
WHERE slug = 'launch-friends-family-sms-yes';

-- SMS: Pre-renewal heads-up (description + triggers)
UPDATE sms_templates
SET description = REPLACE(description, 'Day 56', 'Day 28'),
    triggers = '["Scheduled: 3-5 days before Day 28 renewal"]'::jsonb,
    updated_at = NOW()
WHERE slug = 'launch-pre-renewal-headsup-sms';

-- Email: Orientation (intensive-orientation)
-- Update text_body
UPDATE email_templates
SET text_body = REPLACE(REPLACE(REPLACE(text_body,
    '8 weeks of Vision Pro',
    '4 weeks of Vision Pro'),
    'Day 56:',
    'Day 28:'),
    'before Day 56',
    'before Day 28'),
    updated_at = NOW()
WHERE slug = 'intensive-orientation';

-- Email: Orientation html_body
UPDATE email_templates
SET html_body = REPLACE(REPLACE(REPLACE(html_body,
    '8 weeks of Vision Pro',
    '4 weeks of Vision Pro'),
    'Day 56:',
    'Day 28:'),
    'before Day 56',
    'before Day 28'),
    updated_at = NOW()
WHERE slug = 'intensive-orientation';

-- Email: Launch founding tester (launch-founding-tester)
UPDATE email_templates
SET text_body = REPLACE(text_body, '8 weeks of VibrationFit membership', '4 weeks of VibrationFit membership'),
    html_body = REPLACE(html_body, '8 weeks of VibrationFit membership', '4 weeks of VibrationFit membership'),
    updated_at = NOW()
WHERE slug = 'launch-founding-tester';

-- Email: Pre-renewal heads-up (launch-pre-renewal-headsup)
UPDATE email_templates
SET text_body = REPLACE(text_body, '8 weeks of Vision Pro membership', '4 weeks of Vision Pro membership'),
    html_body = REPLACE(html_body, '8 weeks of Vision Pro membership', '4 weeks of Vision Pro membership'),
    updated_at = NOW()
WHERE slug = 'launch-pre-renewal-headsup';

-- Email: Launch offer CRM email (launch-offer-crm)
UPDATE email_templates
SET text_body = REPLACE(REPLACE(text_body, '8 weeks', '4 weeks'), 'Day 56', 'Day 28'),
    html_body = REPLACE(REPLACE(html_body, '8 weeks', '4 weeks'), 'Day 56', 'Day 28'),
    updated_at = NOW()
WHERE slug = 'launch-offer-crm';

-- Email: Premium intensive welcome
UPDATE email_templates
SET text_body = REPLACE(text_body, '8 weeks', '4 weeks'),
    html_body = REPLACE(html_body, '8 weeks', '4 weeks'),
    updated_at = NOW()
WHERE slug = 'premium-intensive-welcome';
