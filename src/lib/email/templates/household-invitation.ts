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

  const subject = `${inviterName} invited you to join their VibrationFit Household`

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
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #199D67 0%, #14B8A6 100%); border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background-color: rgba(0, 0, 0, 0.3);">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
                🏠 Household Invitation
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; background-color: #1F1F1F;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 24px; font-size: 18px; line-height: 1.6; color: #ffffff;">
                Hi there! 👋
              </p>

              <!-- Main Message -->
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #E5E5E5;">
                <strong style="color: #199D67;">${inviterName}</strong> (${inviterEmail}) has invited you to join their VibrationFit Household: <strong style="color: #14B8A6;">${householdName}</strong>
              </p>

              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #E5E5E5;">
                By joining their household, you'll have access to:
              </p>

              <!-- Benefits List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #199D67; font-size: 20px; margin-right: 12px;">✓</span>
                    <span style="color: #E5E5E5; font-size: 15px;">Shared Vision Pro subscription</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #199D67; font-size: 20px; margin-right: 12px;">✓</span>
                    <span style="color: #E5E5E5; font-size: 15px;">Shared token pool for VIVA AI</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #199D67; font-size: 20px; margin-right: 12px;">✓</span>
                    <span style="color: #E5E5E5; font-size: 15px;">Shared storage for vision boards, journals & media</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #199D67; font-size: 20px; margin-right: 12px;">✓</span>
                    <span style="color: #E5E5E5; font-size: 15px;">All Vision Pro platform features</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${invitationLink}" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #199D67, #14B8A6); color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 600; border-radius: 50px; box-shadow: 0 6px 20px rgba(25, 157, 103, 0.4); text-align: center;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration Notice -->
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #999999; text-align: center;">
                ⏰ This invitation expires in <strong style="color: #FFB701;">${expiresInDays} days</strong>
              </p>

              <!-- Divider -->
              <div style="height: 1px; background: linear-gradient(to right, transparent, #333333, transparent); margin: 32px 0;"></div>

              <!-- Alternative Link -->
              <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.6; color: #999999;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #14B8A6; word-break: break-all;">
                ${invitationLink}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: rgba(0, 0, 0, 0.5); text-align: center;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #999999;">
                Questions? Reply to this email or visit our <a href="https://vibrationfit.com/support" style="color: #14B8A6; text-decoration: none;">support center</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #666666;">
                © ${new Date().getFullYear()} VibrationFit. All rights reserved.
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
You're Invited to Join ${householdName} on VibrationFit!

Hi there!

${inviterName} (${inviterEmail}) has invited you to join their VibrationFit Household: ${householdName}

By joining their household, you'll have access to:
✓ Shared Vision Pro subscription
✓ Shared token pool for VIVA AI
✓ Shared storage for vision boards, journals & media
✓ All Vision Pro platform features

Accept your invitation by clicking this link:
${invitationLink}

⏰ This invitation expires in ${expiresInDays} days.

Questions? Reply to this email or visit https://vibrationfit.com/support

© ${new Date().getFullYear()} VibrationFit. All rights reserved.
`

  return { subject, htmlBody, textBody }
}

