// /src/lib/email/templates/session-invitation.ts
// Email template for video session invitations

export interface SessionInvitationEmailData {
  participantName: string
  participantEmail: string
  hostName: string
  sessionTitle: string
  sessionDescription?: string
  scheduledDate: string  // Formatted date string
  scheduledTime: string  // Formatted time string
  durationMinutes: number
  joinLink: string
}

export function generateSessionInvitationEmail(
  data: SessionInvitationEmailData
): { subject: string; htmlBody: string; textBody: string } {
  const { 
    participantName, 
    hostName, 
    sessionTitle, 
    sessionDescription,
    scheduledDate, 
    scheduledTime, 
    durationMinutes,
    joinLink 
  } = data

  const subject = `${hostName} has scheduled a session with you!`

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited: ${sessionTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 0 0 24px; text-align: center;">
              <div style="display: inline-block; padding: 8px 24px; background-color: rgba(57, 255, 20, 0.1); border-radius: 50px; border: 2px solid #39FF14; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #39FF14; text-transform: uppercase; letter-spacing: 1px;">
                  Session Invitation
                </p>
              </div>
            </td>
          </tr>

          <!-- Hero Card -->
          <tr>
            <td style="padding: 0;">
              <div style="padding: 40px; background-color: #1F1F1F; border-radius: 16px; border: 2px solid #39FF14;">
              
                <!-- Title -->
                <h1 style="margin: 0 0 24px; font-size: 28px; font-weight: bold; color: #ffffff; text-align: center; line-height: 1.2;">
                  ${sessionTitle}
                </h1>

                <!-- Greeting -->
                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">
                  Hi ${participantName || 'there'}!
                </p>

                <!-- Main Message -->
                <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">
                  <strong style="color: #39FF14;">${hostName}</strong> has scheduled a video session with you.
                </p>

                ${sessionDescription ? `
                <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #999999; text-align: center; font-style: italic;">
                  "${sessionDescription}"
                </p>
                ` : ''}

                <!-- Session Details Card -->
                <div style="margin: 32px 0; padding: 24px; background-color: #000000; border-radius: 12px; border: 2px solid #39FF14;">
                  <p style="margin: 0 0 16px; font-size: 11px; color: #39FF14; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: center;">
                    Session Details
                  </p>

                  <!-- Details -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #333333;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color: #999999; font-size: 14px; width: 100px;">
                              Date
                            </td>
                            <td style="color: #FFFFFF; font-size: 14px; font-weight: 600;">
                              ${scheduledDate}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #333333;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color: #999999; font-size: 14px; width: 100px;">
                              Time
                            </td>
                            <td style="color: #FFFFFF; font-size: 14px; font-weight: 600;">
                              ${scheduledTime}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color: #999999; font-size: 14px; width: 100px;">
                              Duration
                            </td>
                            <td style="color: #FFFFFF; font-size: 14px; font-weight: 600;">
                              ${durationMinutes} minutes
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Preparation Tips -->
                <div style="margin: 0 0 32px; padding: 20px; background-color: rgba(20, 184, 166, 0.1); border-radius: 12px; border: 2px solid #14B8A6;">
                  <p style="margin: 0 0 12px; font-size: 11px; color: #14B8A6; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                    Before You Join
                  </p>
                  <ul style="margin: 0; padding-left: 20px; color: #E5E5E5; font-size: 14px; line-height: 1.8;">
                    <li>Find a quiet, well-lit space</li>
                    <li>Test your camera and microphone</li>
                    <li>Have a stable internet connection</li>
                    <li>Come with an open mind and clear intentions</li>
                  </ul>
                </div>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td align="center">
                      <a href="${joinLink}" style="display: inline-block; padding: 18px 48px; background-color: #39FF14; color: #000000; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 50px; text-align: center;">
                        Join Session
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.6; color: #666666; text-align: center;">
                  You can join up to 10 minutes before the scheduled time.
                </p>

                <!-- Divider -->
                <div style="height: 2px; background-color: #39FF14; margin: 32px 0;"></div>

                <!-- Alternative Link -->
                <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">
                  Can't click the button? Copy this link:
                </p>
                <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #39FF14; word-break: break-all; text-align: center;">
                  ${joinLink}
                </p>

              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px 0; text-align: center;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #999999;">
                Questions? Reply to this email or visit <a href="https://vibrationfit.com/support" style="color: #39FF14; text-decoration: none; font-weight: 600;">vibrationfit.com/support</a>
              </p>
              <p style="margin: 0 0 8px; font-size: 11px; color: #666666;">
                © ${new Date().getFullYear()} VibrationFit · <span style="color: #39FF14;">Above the Green Line</span>
              </p>
              <p style="margin: 0; font-size: 10px; color: #555555;">
                This session was scheduled by ${hostName}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const textBody = `
SESSION INVITATION: ${sessionTitle}

VibrationFit Video Session

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi ${participantName || 'there'}!

${hostName} has scheduled a video session with you.

${sessionDescription ? `"${sessionDescription}"` : ''}

SESSION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date: ${scheduledDate}
Time: ${scheduledTime}
Duration: ${durationMinutes} minutes

BEFORE YOU JOIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Find a quiet, well-lit space
• Test your camera and microphone
• Have a stable internet connection
• Come with an open mind and clear intentions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JOIN YOUR SESSION
${joinLink}

You can join up to 10 minutes before the scheduled time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions? Reply to this email or visit:
https://vibrationfit.com/support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

© ${new Date().getFullYear()} VibrationFit
Above the Green Line

This session was scheduled by ${hostName}.
`

  return { subject, htmlBody, textBody }
}

