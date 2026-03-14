-- Notification Configs: database-driven notification settings
-- Allows admins to toggle channels on/off and edit templates per notification type

CREATE TABLE IF NOT EXISTS notification_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',

  -- Channel toggles
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT true,
  admin_sms_enabled boolean NOT NULL DEFAULT true,

  -- Email template ({{variable}} placeholders)
  email_subject text,
  email_body text,
  email_text_body text,

  -- SMS template
  sms_body text,

  -- Admin SMS template
  admin_sms_body text,

  -- Available variable names for this notification
  variables jsonb NOT NULL DEFAULT '[]',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: admin-only
ALTER TABLE notification_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification_configs"
  ON notification_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role = 'admin'
    )
  );

-- Allow service_role full access (for API routes using admin client)
CREATE POLICY "Service role full access on notification_configs"
  ON notification_configs FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE TRIGGER set_notification_configs_updated_at
  BEFORE UPDATE ON notification_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Seed all current notification types ──

INSERT INTO notification_configs (slug, name, description, category, email_enabled, sms_enabled, admin_sms_enabled, email_subject, email_body, email_text_body, sms_body, admin_sms_body, variables) VALUES

-- Support Ticket Created
(
  'support_ticket_created',
  'Support Ticket Created',
  'Sent when a user submits a new support ticket. Admin gets an SMS alert.',
  'support',
  false, false, true,
  NULL, NULL, NULL,
  NULL,
  'New Support Ticket [{{priority}}]: "{{subject}}" from {{email}}',
  '["subject", "email", "priority", "ticketId"]'::jsonb
),

-- Intensive Completed
(
  'intensive_completed',
  'Intensive Completed',
  'Sent when a user completes the Activation Intensive.',
  'intensive',
  false, false, true,
  NULL, NULL, NULL,
  NULL,
  'Intensive Completed: {{userName}} ({{email}})',
  '["userName", "email", "userId"]'::jsonb
),

-- Calibration Call Requested (user self-books, pending)
(
  'calibration_call_requested',
  'Calibration Call Requested',
  'Sent when a user self-books a calibration call. Confirmation goes to user, alert goes to admins.',
  'calibration_call',
  true, true, true,
  'Calibration Call Requested - {{scheduledDate}}',
  '<div style="background:#000;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#1F1F1F;border:2px solid #39FF14;border-radius:16px;padding:40px;"><h1 style="color:#39FF14;font-size:24px;margin:0 0 8px;text-align:center;">Calibration Call Requested</h1><p style="color:#999;font-size:14px;margin:0 0 32px;text-align:center;">Your request has been received</p><p style="color:#E5E5E5;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi {{firstName}},</p><p style="color:#E5E5E5;font-size:16px;line-height:1.6;margin:0 0 24px;">Your calibration call request has been submitted. A coach will be assigned and you will receive a confirmation with your join link.</p><div style="background:rgba(57,255,20,0.05);border:1px solid #333;border-radius:12px;padding:20px;margin:0 0 24px;"><p style="color:#E5E5E5;margin:0 0 8px;font-size:15px;"><strong style="color:#39FF14;">Date:</strong> {{scheduledDate}}</p><p style="color:#E5E5E5;margin:0 0 8px;font-size:15px;"><strong style="color:#39FF14;">Time:</strong> {{scheduledTime}}</p><p style="color:#E5E5E5;margin:0;font-size:15px;"><strong style="color:#39FF14;">Duration:</strong> {{duration}} minutes</p></div><p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 24px;">We will send you another email with your video link once your coach is confirmed.</p><div style="text-align:center;padding:24px 0 0;border-top:1px solid #333;"><p style="color:#555;font-size:12px;margin:0;">Vibration Fit &middot; Above the Green Line</p></div></div></div>',
  'Hi {{firstName}}, Your calibration call request has been submitted. Date: {{scheduledDate}}, Time: {{scheduledTime}}, Duration: {{duration}} minutes. A coach will be assigned and you will receive a confirmation with your join link. - Vibration Fit',
  'VibrationFit: Your calibration call is requested for {{scheduledDate}} at {{scheduledTime}}. We''ll confirm your coach and send a join link soon.',
  'New Calibration Call Request: {{userName}} ({{email}}) for {{scheduledDate}} at {{scheduledTime}} - Status: Pending',
  '["firstName", "userName", "email", "scheduledDate", "scheduledTime", "duration", "phone"]'::jsonb
),

-- Calibration Call Booked (admin books or confirms)
(
  'calibration_call_booked',
  'Calibration Call Booked',
  'Admin SMS when a calibration call is booked or confirmed by an admin.',
  'calibration_call',
  false, false, true,
  NULL, NULL, NULL,
  NULL,
  'Calibration Call Booked: {{userName}} on {{scheduledDate}} at {{scheduledTime}} ET with {{coach}}',
  '["userName", "email", "scheduledDate", "scheduledTime", "coach"]'::jsonb
),

-- Alignment Gym Session Created
(
  'alignment_gym_created',
  'Alignment Gym Session Created',
  'Sent to all graduates when a new Alignment Gym session is scheduled. Includes email, SMS, and scheduled reminders.',
  'alignment_gym',
  true, true, true,
  'Alignment Gym: {{sessionTitle}} - {{scheduledDate}}',
  '<div style="background:#000;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#1F1F1F;border:2px solid #39FF14;border-radius:16px;padding:40px;"><div style="text-align:center;margin:0 0 24px;"><span style="display:inline-block;padding:8px 24px;background:rgba(57,255,20,0.1);border-radius:50px;border:2px solid #39FF14;color:#39FF14;font-weight:700;font-size:14px;letter-spacing:1px;">ALIGNMENT GYM</span></div><h1 style="color:#E5E5E5;font-size:22px;margin:0 0 8px;text-align:center;">{{sessionTitle}}</h1><p style="color:#999;font-size:14px;margin:0 0 32px;text-align:center;">A new session has been scheduled</p><div style="background:rgba(57,255,20,0.05);border:1px solid #333;border-radius:12px;padding:20px;margin:0 0 24px;"><p style="color:#E5E5E5;margin:0 0 8px;font-size:15px;"><strong style="color:#39FF14;">Date:</strong> {{scheduledDate}}</p><p style="color:#E5E5E5;margin:0 0 8px;font-size:15px;"><strong style="color:#39FF14;">Time:</strong> {{scheduledTime}}</p><p style="color:#E5E5E5;margin:0 0 8px;font-size:15px;"><strong style="color:#39FF14;">Duration:</strong> {{duration}} minutes</p><p style="color:#E5E5E5;margin:0;font-size:15px;"><strong style="color:#39FF14;">Host:</strong> {{hostName}}</p></div><div style="text-align:center;margin:0 0 32px;"><a href="{{joinLink}}" style="display:inline-block;padding:18px 48px;background:#39FF14;color:#000;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px;">View Session</a></div><div style="text-align:center;padding:24px 0 0;border-top:1px solid #333;"><p style="color:#555;font-size:12px;margin:0;">Vibration Fit &middot; Above the Green Line</p></div></div></div>',
  'Alignment Gym Session Scheduled!\n\n{{sessionTitle}}\nDate: {{scheduledDate}}\nTime: {{scheduledTime}}\nDuration: {{duration}} minutes\nHost: {{hostName}}\n\nView and join: {{joinLink}}\n\nVibration Fit',
  'VibrationFit Alignment Gym: "{{sessionTitle}}" on {{scheduledDate}} at {{scheduledTime}} with {{hostName}}. Join: {{joinLink}}',
  'Alignment Gym Scheduled: "{{sessionTitle}}" on {{scheduledDate}} at {{scheduledTime}} - {{graduateCount}} graduates notified',
  '["sessionTitle", "sessionDescription", "scheduledDate", "scheduledTime", "duration", "hostName", "joinLink", "graduateCount"]'::jsonb
),

-- Purchase Completed (Stripe)
(
  'purchase_completed',
  'Purchase Completed',
  'Admin SMS when a new Stripe purchase is completed.',
  'purchase',
  false, false, true,
  NULL, NULL, NULL,
  NULL,
  'New purchase: {{customerName}} - {{product}}{{paymentPlan}} - {{amount}}',
  '["customerName", "customerEmail", "amount", "product", "paymentPlan"]'::jsonb
),

-- Host Joined Session (sent to each participant when host enters the room)
(
  'host_joined_session',
  'Host Joined Session',
  'Sent to each participant when the host joins a video session. Includes a join link.',
  'sessions',
  true, true, false,
  '{{hostName}} is in the room - Join now!',
  '<div style="background:#000;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#1F1F1F;border:2px solid #39FF14;border-radius:16px;padding:40px;"><h1 style="color:#39FF14;font-size:24px;margin:0 0 8px;text-align:center;">Your Session is Starting!</h1><p style="color:#999;font-size:14px;margin:0 0 32px;text-align:center;">{{hostName}} is in the room</p><p style="color:#E5E5E5;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi {{participantName}},</p><p style="color:#E5E5E5;font-size:16px;line-height:1.6;margin:0 0 24px;"><strong style="color:white;">{{hostName}}</strong> has joined the room for your session "<strong style="color:white;">{{sessionTitle}}</strong>".</p><div style="text-align:center;margin:0 0 32px;"><a href="{{joinLink}}" style="display:inline-block;padding:18px 48px;background:#39FF14;color:#000;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px;">Join Session Now</a></div><p style="color:#999;font-size:14px;text-align:center;">See you in there!</p><div style="text-align:center;padding:24px 0 0;border-top:1px solid #333;"><p style="color:#555;font-size:12px;margin:0;">Vibration Fit &middot; Above the Green Line</p></div></div></div>',
  '{{hostName}} is in the room! Your session "{{sessionTitle}}" is starting. Join now: {{joinLink}}',
  '{{hostName}} is in the room! Your VibrationFit session "{{sessionTitle}}" is starting. Join now: {{joinLink}}',
  NULL,
  '["hostName", "participantName", "sessionTitle", "joinLink"]'::jsonb
);
