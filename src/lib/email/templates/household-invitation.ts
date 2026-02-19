// /src/lib/email/templates/household-invitation.ts
// Email template for household invitation

export interface HouseholdInvitationEmailData {
  inviterName: string
  inviterEmail: string
  householdName: string
  invitationLink: string
  expiresInDays: number
}

export function generateHouseholdInvitationEmail(
  data: HouseholdInvitationEmailData
): { subject: string; htmlBody: string; textBody: string } {
  const { inviterName, inviterEmail, householdName, invitationLink, expiresInDays } = data

  const subject = `${inviterName} invited you to join their Vibration Fit Household`

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${householdName}</title>
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
                  Household Invitation
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
                  You're Invited!
                </h1>

                <!-- Greeting -->
                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">
                  Hi there!
                </p>

                <!-- Main Message -->
                <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">
                  <strong style="color: #39FF14;">${inviterName}</strong> (${inviterEmail}) has invited you to join their Vibration Fit Household: <strong style="color: #39FF14;">${householdName}</strong>
                </p>

                <!-- Benefits Card -->
                <div style="margin: 32px 0; padding: 24px; background-color: #000000; border-radius: 12px; border: 2px solid #39FF14;">
                  <p style="margin: 0 0 16px; font-size: 11px; color: #39FF14; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: center;">
                    What's Included
                  </p>

                  <!-- Benefits List -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 10px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="30" style="vertical-align: top;">
                              <div style="width: 20px; height: 20px; background-color: #39FF14; border-radius: 50%; display: inline-block;"></div>
                            </td>
                            <td style="color: #E5E5E5; font-size: 15px; line-height: 1.5;">
                              Shared Vision Pro subscription
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="30" style="vertical-align: top;">
                              <div style="width: 20px; height: 20px; background-color: #39FF14; border-radius: 50%; display: inline-block;"></div>
                            </td>
                            <td style="color: #E5E5E5; font-size: 15px; line-height: 1.5;">
                              Shared token pool for VIVA AI
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="30" style="vertical-align: top;">
                              <div style="width: 20px; height: 20px; background-color: #39FF14; border-radius: 50%; display: inline-block;"></div>
                            </td>
                            <td style="color: #E5E5E5; font-size: 15px; line-height: 1.5;">
                              Shared storage for vision boards, journals & media
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="30" style="vertical-align: top;">
                              <div style="width: 20px; height: 20px; background-color: #39FF14; border-radius: 50%; display: inline-block;"></div>
                            </td>
                            <td style="color: #E5E5E5; font-size: 15px; line-height: 1.5;">
                              All Vision Pro platform features
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td align="center">
                      <a href="${invitationLink}" style="display: inline-block; padding: 18px 48px; background-color: #39FF14; color: #000000; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 50px; text-align: center;">
                        Accept Invitation
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Expiration Notice -->
                <div style="padding: 16px; background-color: #000000; border-radius: 12px; border: 2px solid #FFB701; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #FFB701; text-align: center; font-weight: 600;">
                    Expires in ${expiresInDays} days
                  </p>
                </div>

                <!-- Divider -->
                <div style="height: 2px; background-color: #39FF14; margin: 32px 0;"></div>

                <!-- Alternative Link -->
                <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">
                  Can't click the button? Copy this link:
                </p>
                <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #39FF14; word-break: break-all; text-align: center;">
                  ${invitationLink}
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
                © ${new Date().getFullYear()} Vibration Fit · <span style="color: #39FF14;">Above the Green Line</span>
              </p>
              <p style="margin: 0; font-size: 10px; color: #555555;">
                This invitation was sent by ${inviterName}.
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
YOU'RE INVITED TO JOIN ${householdName}

Vibration Fit Household Invitation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi there!

${inviterName} (${inviterEmail}) has invited you to join their Vibration Fit Household: ${householdName}

WHAT'S INCLUDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Shared Vision Pro subscription
• Shared token pool for VIVA AI
• Shared storage for vision boards, journals & media
• All Vision Pro platform features

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCEPT YOUR INVITATION
${invitationLink}

EXPIRES IN ${expiresInDays} DAYS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions? Reply to this email or visit:
https://vibrationfit.com/support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

© ${new Date().getFullYear()} Vibration Fit
Above the Green Line

This invitation was sent by ${inviterName}.
`

  return { subject, htmlBody, textBody }
}

