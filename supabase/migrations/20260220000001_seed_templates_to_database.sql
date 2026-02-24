-- ============================================================================
-- SEED FILE-BASED TEMPLATES INTO DATABASE
-- Migrates all hardcoded SMS and email templates to database-driven system
-- ============================================================================

-- ============================================================================
-- SMS TEMPLATES (from src/lib/messaging/templates.ts)
-- ============================================================================

INSERT INTO sms_templates (slug, name, description, category, status, body, variables, triggers)
VALUES
  (
    'lead-confirmation',
    'Lead Confirmation',
    'Auto-sent when a new lead submits a contact form',
    'marketing',
    'active',
    'Hi {{name}}, thanks for reaching out to Vibration Fit! We received your message and will respond within 24 hours. Reply STOP to opt out. - Team Vibration Fit',
    '["name"]'::jsonb,
    '["Lead submits contact form", "API: POST /api/leads"]'::jsonb
  ),
  (
    'lead-follow-up',
    'Lead Follow-up',
    'Manual follow-up message for new leads',
    'marketing',
    'active',
    'Hi {{name}}, this is Jordan from Vibration Fit. Following up on your interest. Do you have any questions I can help with? - Jordan',
    '["name"]'::jsonb,
    '["Manual send from CRM"]'::jsonb
  ),
  (
    'demo-confirmation',
    'Demo Confirmation',
    'Sent when a demo is scheduled',
    'sessions',
    'active',
    'Hi {{name}}, your Vibration Fit demo is confirmed for {{date}} at {{time}}. Looking forward to it! Reply STOP to opt out. - Jordan',
    '["name", "date", "time"]'::jsonb,
    '["Demo scheduled in CRM"]'::jsonb
  ),
  (
    'demo-reminder-24h',
    'Demo Reminder (24 hours)',
    'Sent 24 hours before a scheduled demo',
    'sessions',
    'active',
    'Hi {{name}}, reminder: Your Vibration Fit demo is tomorrow at {{time}}. See you then! Reply CANCEL to reschedule. - Jordan',
    '["name", "time"]'::jsonb,
    '["Scheduled: 24h before demo"]'::jsonb
  ),
  (
    'demo-reminder-1h',
    'Demo Reminder (1 hour)',
    'Sent 1 hour before a scheduled demo',
    'sessions',
    'active',
    'Hi {{name}}, your demo starts in 1 hour. Join here: {{link}} - Jordan',
    '["name", "link"]'::jsonb,
    '["Scheduled: 1h before demo"]'::jsonb
  ),
  (
    'intensive-confirmation',
    'Intensive Intake Confirmation',
    'Sent when someone submits an intensive intake form',
    'intensive',
    'active',
    E'Hi {{name}}, thank you for your interest in the 72-Hour Activation Intensive! We\'ll review your intake and reach out within 24 hours. - Team Vibration Fit',
    '["name"]'::jsonb,
    '["Intensive intake form submitted"]'::jsonb
  ),
  (
    'support-created',
    'Support Ticket Created (SMS)',
    'SMS notification when a support ticket is created',
    'support',
    'active',
    E'Your support ticket #{{ticket_number}} has been created. We\'ll respond soon. View details: {{link}} - Vibration Fit Support',
    '["ticket_number", "link"]'::jsonb,
    '["Support ticket created", "API: POST /api/support/tickets"]'::jsonb
  ),
  (
    'support-reply',
    'Support Reply Notification (SMS)',
    'SMS notification when a support ticket gets a reply',
    'support',
    'active',
    'New reply to your ticket #{{ticket_number}}. View here: {{link}} - Vibration Fit Support',
    '["ticket_number", "link"]'::jsonb,
    '["Support ticket reply added"]'::jsonb
  ),
  (
    'support-resolved',
    'Support Ticket Resolved (SMS)',
    'SMS notification when a support ticket is resolved',
    'support',
    'active',
    'Your support ticket #{{ticket_number}} has been resolved! Reply REOPEN if you need more help. - Vibration Fit Support',
    '["ticket_number"]'::jsonb,
    '["Support ticket status changed to resolved"]'::jsonb
  ),
  (
    'customer-welcome',
    'Customer Welcome',
    'Welcome SMS for new customers after signup',
    'onboarding',
    'active',
    'Welcome to Vibration Fit, {{name}}! Ready to create your Life Vision? Start here: {{link}} - Jordan',
    '["name", "link"]'::jsonb,
    '["User completes signup and subscription"]'::jsonb
  ),
  (
    'customer-reengagement',
    'Re-engagement',
    'Sent to inactive customers to re-engage',
    'marketing',
    'active',
    E'Hey {{name}}, we noticed you haven\'t logged in for a while. Need any help with your vision? I\'m here! - Jordan',
    '["name"]'::jsonb,
    '["Manual send from CRM", "Scheduled: after 14 days inactive"]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  triggers = EXCLUDED.triggers,
  updated_at = NOW();


-- ============================================================================
-- EMAIL TEMPLATES (from src/lib/email/templates/*.ts)
-- ============================================================================

INSERT INTO email_templates (slug, name, description, category, status, subject, html_body, text_body, variables, triggers)
VALUES
  (
    'household-invitation',
    'Household Invitation',
    'Invite family members to join your household account',
    'household',
    'active',
    '{{inviterName}} invited you to join their Vibration Fit Household',
    E'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>You''re Invited to Join {{householdName}}</title>\n</head>\n<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #000000; color: #ffffff;">\n  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">\n    <tr>\n      <td align="center" style="padding: 40px 20px;">\n        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">\n          <tr>\n            <td style="padding: 0 0 24px; text-align: center;">\n              <div style="display: inline-block; padding: 8px 24px; background-color: rgba(57, 255, 20, 0.1); border-radius: 50px; border: 2px solid #39FF14; margin-bottom: 16px;">\n                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #39FF14; text-transform: uppercase; letter-spacing: 1px;">\n                  Household Invitation\n                </p>\n              </div>\n            </td>\n          </tr>\n          <tr>\n            <td style="padding: 0;">\n              <div style="padding: 40px; background-color: #1F1F1F; border-radius: 16px; border: 2px solid #39FF14;">\n                <h1 style="margin: 0 0 24px; font-size: 28px; font-weight: bold; color: #ffffff; text-align: center; line-height: 1.2;">\n                  You''re Invited!\n                </h1>\n                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">\n                  Hi there!\n                </p>\n                <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">\n                  <strong style="color: #39FF14;">{{inviterName}}</strong> ({{inviterEmail}}) has invited you to join their Vibration Fit Household: <strong style="color: #39FF14;">{{householdName}}</strong>\n                </p>\n                <div style="margin: 32px 0; padding: 24px; background-color: #000000; border-radius: 12px; border: 2px solid #39FF14;">\n                  <p style="margin: 0 0 16px; font-size: 11px; color: #39FF14; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: center;">\n                    What''s Included\n                  </p>\n                  <table width="100%" cellpadding="0" cellspacing="0">\n                    <tr><td style="padding: 10px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="30" style="vertical-align: top;"><div style="width: 20px; height: 20px; background-color: #39FF14; border-radius: 50%; display: inline-block;"></div></td><td style="color: #E5E5E5; font-size: 15px; line-height: 1.5;">Shared Vision Pro subscription</td></tr></table></td></tr>\n                    <tr><td style="padding: 10px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="30" style="vertical-align: top;"><div style="width: 20px; height: 20px; background-color: #39FF14; border-radius: 50%; display: inline-block;"></div></td><td style="color: #E5E5E5; font-size: 15px; line-height: 1.5;">Shared token pool for VIVA</td></tr></table></td></tr>\n                    <tr><td style="padding: 10px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="30" style="vertical-align: top;"><div style="width: 20px; height: 20px; background-color: #39FF14; border-radius: 50%; display: inline-block;"></div></td><td style="color: #E5E5E5; font-size: 15px; line-height: 1.5;">Shared storage for vision boards, journals &amp; media</td></tr></table></td></tr>\n                    <tr><td style="padding: 10px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="30" style="vertical-align: top;"><div style="width: 20px; height: 20px; background-color: #39FF14; border-radius: 50%; display: inline-block;"></div></td><td style="color: #E5E5E5; font-size: 15px; line-height: 1.5;">All Vision Pro platform features</td></tr></table></td></tr>\n                  </table>\n                </div>\n                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">\n                  <tr>\n                    <td align="center">\n                      <a href="{{invitationLink}}" style="display: inline-block; padding: 18px 48px; background-color: #39FF14; color: #000000; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 50px; text-align: center;">\n                        Accept Invitation\n                      </a>\n                    </td>\n                  </tr>\n                </table>\n                <div style="padding: 16px; background-color: #000000; border-radius: 12px; border: 2px solid #FFB701; margin-bottom: 24px;">\n                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #FFB701; text-align: center; font-weight: 600;">\n                    Expires in {{expiresInDays}} days\n                  </p>\n                </div>\n                <div style="height: 2px; background-color: #39FF14; margin: 32px 0;"></div>\n                <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">\n                  Can''t click the button? Copy this link:\n                </p>\n                <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #39FF14; word-break: break-all; text-align: center;">\n                  {{invitationLink}}\n                </p>\n              </div>\n            </td>\n          </tr>\n          <tr>\n            <td style="padding: 32px 20px 0; text-align: center;">\n              <p style="margin: 0 0 12px; font-size: 13px; color: #999999;">\n                Questions? Reply to this email or visit <a href="https://vibrationfit.com/support" style="color: #39FF14; text-decoration: none; font-weight: 600;">vibrationfit.com/support</a>\n              </p>\n              <p style="margin: 0 0 8px; font-size: 11px; color: #666666;">\n                Vibration Fit &middot; <span style="color: #39FF14;">Above the Green Line</span>\n              </p>\n              <p style="margin: 0; font-size: 10px; color: #555555;">\n                This invitation was sent by {{inviterName}}.\n              </p>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>',
    E'YOU''RE INVITED TO JOIN {{householdName}}\n\nVibration Fit Household Invitation\n\nHi there!\n\n{{inviterName}} ({{inviterEmail}}) has invited you to join their Vibration Fit Household: {{householdName}}\n\nWHAT''S INCLUDED\n\n- Shared Vision Pro subscription\n- Shared token pool for VIVA\n- Shared storage for vision boards, journals & media\n- All Vision Pro platform features\n\nACCEPT YOUR INVITATION\n{{invitationLink}}\n\nEXPIRES IN {{expiresInDays}} DAYS\n\nQuestions? Reply to this email or visit:\nhttps://vibrationfit.com/support\n\nVibration Fit\nAbove the Green Line\n\nThis invitation was sent by {{inviterName}}.',
    '["inviterName", "inviterEmail", "householdName", "invitationLink", "expiresInDays"]'::jsonb,
    '["Admin clicks Send Invitation in Household Settings", "API: POST /api/household/invite"]'::jsonb
  ),
  (
    'support-ticket-created',
    'Support Ticket Created',
    'Confirmation email sent when a user creates a support ticket',
    'support',
    'active',
    'Support Ticket Created: {{ticketNumber}}',
    E'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Support Ticket Created</title>\n</head>\n<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #000000; color: #ffffff;">\n  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">\n    <tr>\n      <td align="center" style="padding: 40px 20px;">\n        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">\n          <tr>\n            <td style="padding: 0 0 24px; text-align: center;">\n              <div style="display: inline-block; padding: 8px 24px; background-color: rgba(57, 255, 20, 0.1); border-radius: 50px; border: 2px solid #39FF14; margin-bottom: 16px;">\n                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #39FF14; text-transform: uppercase; letter-spacing: 1px;">\n                  Vibration Fit Support\n                </p>\n              </div>\n            </td>\n          </tr>\n          <tr>\n            <td style="padding: 0;">\n              <div style="padding: 40px; background-color: #1F1F1F; border-radius: 16px; border: 2px solid #39FF14;">\n                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">\n                  <tr>\n                    <td align="center">\n                      <div style="display: inline-block; width: 64px; height: 64px; background-color: #39FF14; border-radius: 50%;">\n                        <span style="font-size: 32px; line-height: 64px; color: #000000;">&#10003;</span>\n                      </div>\n                    </td>\n                  </tr>\n                </table>\n                <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: bold; color: #ffffff; text-align: center; line-height: 1.2;">\n                  Ticket Created Successfully\n                </h1>\n                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">\n                  <tr>\n                    <td align="center">\n                      <div style="display: inline-block; padding: 8px 20px; background-color: #000000; border-radius: 50px; border: 2px solid #39FF14;">\n                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #39FF14; font-family: ''Courier New'', monospace;">\n                          {{ticketNumber}}\n                        </p>\n                      </div>\n                    </td>\n                  </tr>\n                </table>\n                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">\n                  {{customerGreeting}} We''ve received your support request.\n                </p>\n                <div style="margin: 32px 0; padding: 24px; background-color: #000000; border-radius: 12px; border: 2px solid #39FF14;">\n                  <p style="margin: 0 0 8px; font-size: 11px; color: #39FF14; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Subject</p>\n                  <p style="margin: 0 0 20px; font-size: 18px; color: #ffffff; font-weight: 600; line-height: 1.4;">{{ticketSubject}}</p>\n                  <p style="margin: 0 0 8px; font-size: 11px; color: #39FF14; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Status</p>\n                  <div style="display: inline-block; padding: 6px 14px; background-color: #000000; border-radius: 50px; border: 2px solid #39FF14;">\n                    <p style="margin: 0; font-size: 13px; color: #39FF14; font-weight: 600;">{{ticketStatusDisplay}}</p>\n                  </div>\n                </div>\n                <div style="padding: 20px; background-color: #000000; border-radius: 12px; border-left: 4px solid #39FF14; margin-bottom: 32px;">\n                  <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #E5E5E5;">\n                    <strong style="color: #39FF14;">Quick Response Guarantee:</strong> We''ll reply within 24 hours during business days.\n                  </p>\n                </div>\n                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">\n                  <tr>\n                    <td align="center">\n                      <a href="{{ticketUrl}}" style="display: inline-block; padding: 18px 48px; background-color: #39FF14; color: #000000; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 50px; text-align: center;">\n                        View Your Ticket &rarr;\n                      </a>\n                    </td>\n                  </tr>\n                </table>\n                <div style="height: 2px; background-color: #39FF14; margin: 32px 0;"></div>\n                <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">\n                  Can''t click the button? Copy this link:\n                </p>\n                <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #39FF14; word-break: break-all; text-align: center;">\n                  {{ticketUrl}}\n                </p>\n              </div>\n            </td>\n          </tr>\n          <tr>\n            <td style="padding: 32px 20px 0; text-align: center;">\n              <p style="margin: 0 0 12px; font-size: 13px; color: #999999;">\n                Questions? Reply to this email or visit <a href="https://vibrationfit.com/support" style="color: #39FF14; text-decoration: none; font-weight: 600;">vibrationfit.com/support</a>\n              </p>\n              <p style="margin: 0 0 8px; font-size: 11px; color: #666666;">\n                Vibration Fit &middot; <span style="color: #39FF14;">Above the Green Line</span>\n              </p>\n              <p style="margin: 0; font-size: 10px; color: #555555;">\n                This email was sent because you submitted a support request.\n              </p>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>',
    E'TICKET CREATED SUCCESSFULLY\n\nVibration Fit Support - Ticket {{ticketNumber}}\n\n{{customerGreeting}} We''ve received your support request.\n\nTICKET DETAILS\n\nSubject: {{ticketSubject}}\nStatus: {{ticketStatusDisplay}}\nTicket #: {{ticketNumber}}\n\nQUICK RESPONSE GUARANTEE\nWe''ll reply within 24 hours during business days.\n\nVIEW YOUR TICKET\n{{ticketUrl}}\n\nQuestions? Reply to this email or visit:\nhttps://vibrationfit.com/support\n\nVibration Fit\nAbove the Green Line\n\nThis email was sent because you submitted a support request.',
    '["ticketNumber", "ticketSubject", "ticketStatus", "ticketStatusDisplay", "ticketUrl", "customerName", "customerGreeting"]'::jsonb,
    '["User submits support form at /support", "API: POST /api/support/tickets"]'::jsonb
  ),
  (
    'personal-message',
    'Personal Message',
    'Simple text-style email that looks like a personal message from a real person',
    'notifications',
    'active',
    'Message from {{senderName}}',
    E'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Message from {{senderName}}</title>\n</head>\n<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; background-color: #ffffff; color: #000000;">\n  <div style="color: #000000;">\n{{greeting}}{{messageBody}}{{closingSection}}{{senderName}}\n  </div>\n</body>\n</html>',
    E'{{greeting}}{{messageBody}}\n\n{{closingSection}}{{senderName}}',
    '["recipientName", "senderName", "messageBody", "closingLine", "greeting", "closingSection"]'::jsonb,
    '["Manual send from admin", "CRM: Send personal message"]'::jsonb
  ),
  (
    'session-invitation',
    'Session Invitation',
    'Invite a participant to a video coaching session',
    'sessions',
    'active',
    '{{hostName}} has scheduled a session with you!',
    E'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>You''re Invited: {{sessionTitle}}</title>\n</head>\n<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #000000; color: #ffffff;">\n  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">\n    <tr>\n      <td align="center" style="padding: 40px 20px;">\n        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">\n          <tr>\n            <td style="padding: 0 0 24px; text-align: center;">\n              <div style="display: inline-block; padding: 8px 24px; background-color: rgba(57, 255, 20, 0.1); border-radius: 50px; border: 2px solid #39FF14; margin-bottom: 16px;">\n                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #39FF14; text-transform: uppercase; letter-spacing: 1px;">\n                  Session Invitation\n                </p>\n              </div>\n            </td>\n          </tr>\n          <tr>\n            <td style="padding: 0;">\n              <div style="padding: 40px; background-color: #1F1F1F; border-radius: 16px; border: 2px solid #39FF14;">\n                <h1 style="margin: 0 0 24px; font-size: 28px; font-weight: bold; color: #ffffff; text-align: center; line-height: 1.2;">\n                  {{sessionTitle}}\n                </h1>\n                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">\n                  Hi {{participantName}}!\n                </p>\n                <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">\n                  <strong style="color: #39FF14;">{{hostName}}</strong> has scheduled a video session with you.\n                </p>\n                {{descriptionBlock}}\n                <div style="margin: 32px 0; padding: 24px; background-color: #000000; border-radius: 12px; border: 2px solid #39FF14;">\n                  <p style="margin: 0 0 16px; font-size: 11px; color: #39FF14; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: center;">\n                    Session Details\n                  </p>\n                  <table width="100%" cellpadding="0" cellspacing="0">\n                    <tr><td style="padding: 12px 0; border-bottom: 1px solid #333333;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="color: #999999; font-size: 14px; width: 100px;">Date</td><td style="color: #FFFFFF; font-size: 14px; font-weight: 600;">{{scheduledDate}}</td></tr></table></td></tr>\n                    <tr><td style="padding: 12px 0; border-bottom: 1px solid #333333;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="color: #999999; font-size: 14px; width: 100px;">Time</td><td style="color: #FFFFFF; font-size: 14px; font-weight: 600;">{{scheduledTime}}</td></tr></table></td></tr>\n                    <tr><td style="padding: 12px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="color: #999999; font-size: 14px; width: 100px;">Duration</td><td style="color: #FFFFFF; font-size: 14px; font-weight: 600;">{{durationMinutes}} minutes</td></tr></table></td></tr>\n                  </table>\n                </div>\n                <div style="margin: 0 0 32px; padding: 20px; background-color: rgba(20, 184, 166, 0.1); border-radius: 12px; border: 2px solid #14B8A6;">\n                  <p style="margin: 0 0 12px; font-size: 11px; color: #14B8A6; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Before You Join</p>\n                  <ul style="margin: 0; padding-left: 20px; color: #E5E5E5; font-size: 14px; line-height: 1.8;">\n                    <li>Find a quiet, well-lit space</li>\n                    <li>Test your camera and microphone</li>\n                    <li>Have a stable internet connection</li>\n                    <li>Come with an open mind and clear intentions</li>\n                  </ul>\n                </div>\n                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">\n                  <tr>\n                    <td align="center">\n                      <a href="{{joinLink}}" style="display: inline-block; padding: 18px 48px; background-color: #39FF14; color: #000000; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 50px; text-align: center;">\n                        Join Session\n                      </a>\n                    </td>\n                  </tr>\n                </table>\n                <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.6; color: #666666; text-align: center;">\n                  You can join up to 10 minutes before the scheduled time.\n                </p>\n                <div style="height: 2px; background-color: #39FF14; margin: 32px 0;"></div>\n                <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">\n                  Can''t click the button? Copy this link:\n                </p>\n                <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #39FF14; word-break: break-all; text-align: center;">\n                  {{joinLink}}\n                </p>\n              </div>\n            </td>\n          </tr>\n          <tr>\n            <td style="padding: 32px 20px 0; text-align: center;">\n              <p style="margin: 0 0 12px; font-size: 13px; color: #999999;">\n                Questions? Reply to this email or visit <a href="https://vibrationfit.com/support" style="color: #39FF14; text-decoration: none; font-weight: 600;">vibrationfit.com/support</a>\n              </p>\n              <p style="margin: 0 0 8px; font-size: 11px; color: #666666;">\n                Vibration Fit &middot; <span style="color: #39FF14;">Above the Green Line</span>\n              </p>\n              <p style="margin: 0; font-size: 10px; color: #555555;">\n                This session was scheduled by {{hostName}}.\n              </p>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>',
    E'SESSION INVITATION: {{sessionTitle}}\n\nVibration Fit Video Session\n\nHi {{participantName}}!\n\n{{hostName}} has scheduled a video session with you.\n\n{{descriptionText}}\n\nSESSION DETAILS\n\nDate: {{scheduledDate}}\nTime: {{scheduledTime}}\nDuration: {{durationMinutes}} minutes\n\nBEFORE YOU JOIN\n\n- Find a quiet, well-lit space\n- Test your camera and microphone\n- Have a stable internet connection\n- Come with an open mind and clear intentions\n\nJOIN YOUR SESSION\n{{joinLink}}\n\nYou can join up to 10 minutes before the scheduled time.\n\nQuestions? Reply to this email or visit:\nhttps://vibrationfit.com/support\n\nVibration Fit\nAbove the Green Line\n\nThis session was scheduled by {{hostName}}.',
    '["participantName", "hostName", "sessionTitle", "sessionDescription", "scheduledDate", "scheduledTime", "durationMinutes", "joinLink", "descriptionBlock", "descriptionText"]'::jsonb,
    '["Admin creates session with participant at /admin/sessions/new", "API: POST /api/video/sessions with participant_email"]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  triggers = EXCLUDED.triggers,
  updated_at = NOW();
