-- Session + SMS Notifications migration
-- 1. Add SMS channel support to messaging_campaigns
-- 2. Seed alignment_gym_going_live notification config

-- 1. Channel support for messaging_campaigns
ALTER TABLE messaging_campaigns
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS sms_body text;

DO $$ BEGIN
  ALTER TABLE messaging_campaigns
    ADD CONSTRAINT messaging_campaigns_channel_check
    CHECK (channel IN ('email', 'sms', 'both'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Seed alignment_gym_going_live notification config
INSERT INTO notification_configs (slug, name, description, category, email_enabled, sms_enabled, admin_sms_enabled, email_subject, email_body, email_text_body, sms_body, admin_sms_body, variables) VALUES
(
  'alignment_gym_going_live',
  'Alignment Gym Going Live',
  'Sent to all members when the host joins an Alignment Gym session.',
  'alignment_gym',
  true, true, false,
  '{{hostName}} is LIVE -- {{sessionTitle}}',
  '<div style="background:#000;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#1F1F1F;border:2px solid #39FF14;border-radius:16px;padding:40px;"><div style="text-align:center;margin:0 0 24px;"><span style="display:inline-block;padding:8px 24px;background:rgba(57,255,20,0.1);border-radius:50px;border:2px solid #39FF14;color:#39FF14;font-weight:700;font-size:14px;letter-spacing:1px;">LIVE NOW</span></div><h1 style="color:#E5E5E5;font-size:22px;margin:0 0 8px;text-align:center;">{{hostName}} is LIVE</h1><p style="color:#999;font-size:14px;margin:0 0 32px;text-align:center;">{{sessionTitle}} is happening right now</p><div style="text-align:center;margin:0 0 32px;"><a href="{{joinLink}}" style="display:inline-block;padding:18px 48px;background:#39FF14;color:#000;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px;">Join Now</a></div><div style="text-align:center;padding:24px 0 0;border-top:1px solid #333;"><p style="color:#555;font-size:12px;margin:0;">Vibration Fit &middot; Above the Green Line</p></div></div></div>',
  '{{hostName}} is LIVE! {{sessionTitle}} is happening right now. Join: {{joinLink}}',
  'VibrationFit: {{hostName}} is LIVE! Join Alignment Gym now: {{joinLink}}',
  NULL,
  '["hostName", "sessionTitle", "joinLink"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed alignment_gym_reminder_1hr (1 hour before session)
INSERT INTO notification_configs (slug, name, description, category, email_enabled, sms_enabled, admin_sms_enabled, email_subject, email_body, email_text_body, sms_body, admin_sms_body, variables) VALUES
(
  'alignment_gym_reminder_1hr',
  'Alignment Gym 1-Hour Reminder',
  'Scheduled email sent 1 hour before an Alignment Gym session starts.',
  'alignment_gym',
  true, false, false,
  'Alignment Gym starts in 1 hour - {{sessionTitle}}',
  '<div style="background:#000;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#1F1F1F;border:2px solid #39FF14;border-radius:16px;padding:40px;"><div style="text-align:center;margin:0 0 24px;"><span style="display:inline-block;padding:8px 24px;background:rgba(57,255,20,0.1);border-radius:50px;border:2px solid #39FF14;color:#39FF14;font-weight:700;font-size:14px;letter-spacing:1px;">STARTING SOON</span></div><h1 style="color:#E5E5E5;font-size:22px;margin:0 0 8px;text-align:center;">{{sessionTitle}}</h1><p style="color:#999;font-size:14px;margin:0 0 32px;text-align:center;">Starts in 1 hour with {{hostName}}</p><p style="color:#E5E5E5;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi {{firstName}},</p><p style="color:#E5E5E5;font-size:16px;line-height:1.6;margin:0 0 24px;">The Alignment Gym session "<strong style="color:white;">{{sessionTitle}}</strong>" with {{hostName}} starts in 1 hour.</p><div style="text-align:center;margin:0 0 32px;"><a href="{{joinLink}}" style="display:inline-block;padding:18px 48px;background:#39FF14;color:#000;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px;">View Session</a></div><div style="text-align:center;padding:24px 0 0;border-top:1px solid #333;"><p style="color:#555;font-size:12px;margin:0;">Vibration Fit &middot; Above the Green Line</p></div></div></div>',
  'Hi {{firstName}}, The Alignment Gym session "{{sessionTitle}}" with {{hostName}} starts in 1 hour. Join: {{joinLink}}',
  NULL,
  NULL,
  '["firstName", "sessionTitle", "hostName", "joinLink"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 4. Seed alignment_gym_reminder_15min (15 minutes before session)
INSERT INTO notification_configs (slug, name, description, category, email_enabled, sms_enabled, admin_sms_enabled, email_subject, email_body, email_text_body, sms_body, admin_sms_body, variables) VALUES
(
  'alignment_gym_reminder_15min',
  'Alignment Gym 15-Minute Reminder',
  'Scheduled SMS sent 15 minutes before an Alignment Gym session starts.',
  'alignment_gym',
  false, true, false,
  NULL,
  NULL,
  NULL,
  'VibrationFit: Alignment Gym with {{hostName}} starts in 15 min! Join: {{joinLink}}',
  NULL,
  '["firstName", "sessionTitle", "hostName", "joinLink"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
