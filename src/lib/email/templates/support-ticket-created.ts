// /src/lib/email/templates/support-ticket-created.ts
// Email template for support ticket creation confirmation

export interface SupportTicketCreatedEmailData {
  ticketNumber: string
  ticketSubject: string
  ticketStatus: string
  ticketUrl: string
  customerName?: string
}

export function generateSupportTicketCreatedEmail(
  data: SupportTicketCreatedEmailData
): { subject: string; htmlBody: string; textBody: string } {
  const { ticketNumber, ticketSubject, ticketStatus, ticketUrl, customerName } = data

  const subject = `Support Ticket Created: ${ticketNumber}`

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Ticket Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          
          <!-- Brand Header with Neon Green -->
          <tr>
            <td style="padding: 0 0 24px; text-align: center;">
              <div style="display: inline-block; padding: 8px 24px; background-color: rgba(57, 255, 20, 0.1); border-radius: 50px; border: 2px solid #39FF14; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #39FF14; text-transform: uppercase; letter-spacing: 1px;">
                  Vibration Fit Support
                </p>
              </div>
            </td>
          </tr>

          <!-- Hero Card with Neon Green Border -->
          <tr>
            <td style="padding: 0;">
              <div style="padding: 40px; background-color: #1F1F1F; border-radius: 16px; border: 2px solid #39FF14;">
                  
                  <!-- Success Icon -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; width: 64px; height: 64px; background-color: #39FF14; border-radius: 50%;">
                          <span style="font-size: 32px; line-height: 64px; color: #000000;">✓</span>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Title -->
                  <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: bold; color: #ffffff; text-align: center; line-height: 1.2;">
                    Ticket Created Successfully
                  </h1>

                  <!-- Ticket Number Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; padding: 8px 20px; background-color: #000000; border-radius: 50px; border: 2px solid #39FF14;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #39FF14; font-family: 'Courier New', monospace;">
                            ${ticketNumber}
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Greeting -->
                  <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #E5E5E5; text-align: center;">
                    ${customerName ? `Hi ${customerName}!` : 'Hi there!'} We've received your support request.
                  </p>

                  <!-- Ticket Details Card -->
                  <div style="margin: 32px 0; padding: 24px; background-color: #000000; border-radius: 12px; border: 2px solid #39FF14;">
                    <p style="margin: 0 0 8px; font-size: 11px; color: #39FF14; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                      Subject
                    </p>
                    <p style="margin: 0 0 20px; font-size: 18px; color: #ffffff; font-weight: 600; line-height: 1.4;">
                      ${ticketSubject}
                    </p>
                    
                    <p style="margin: 0 0 8px; font-size: 11px; color: #39FF14; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                      Status
                    </p>
                    <div style="display: inline-block; padding: 6px 14px; background-color: #000000; border-radius: 50px; border: 2px solid #39FF14;">
                      <p style="margin: 0; font-size: 13px; color: #39FF14; font-weight: 600;">
                        ${ticketStatus.charAt(0).toUpperCase() + ticketStatus.slice(1).replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <!-- Response Time -->
                  <div style="padding: 20px; background-color: #000000; border-radius: 12px; border-left: 4px solid #39FF14; margin-bottom: 32px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #E5E5E5;">
                      <span style="font-size: 20px; margin-right: 8px;">⚡</span>
                      <strong style="color: #39FF14;">Quick Response Guarantee:</strong> We'll reply within 24 hours during business days.
                    </p>
                  </div>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <a href="${ticketUrl}" style="display: inline-block; padding: 18px 48px; background-color: #39FF14; color: #000000; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 50px; text-align: center;">
                        View Your Ticket →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider -->
                  <div style="height: 2px; background-color: #39FF14; margin: 32px 0;"></div>

                  <!-- Alternative Link -->
                  <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">
                    Can't click the button? Copy this link:
                  </p>
                  <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #39FF14; word-break: break-all; text-align: center;">
                    ${ticketUrl}
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
                This email was sent because you submitted a support request.
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
✓ TICKET CREATED SUCCESSFULLY

Vibration Fit Support · Ticket ${ticketNumber}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${customerName ? `Hi ${customerName}!` : 'Hi there!'} We've received your support request.

TICKET DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: ${ticketSubject}
Status: ${ticketStatus.charAt(0).toUpperCase() + ticketStatus.slice(1).replace('_', ' ')}
Ticket #: ${ticketNumber}

⚡ QUICK RESPONSE GUARANTEE
We'll reply within 24 hours during business days.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VIEW YOUR TICKET
${ticketUrl}

Questions? Reply to this email or visit:
https://vibrationfit.com/support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

© ${new Date().getFullYear()} Vibration Fit
Above the Green Line

This email was sent because you submitted a support request.
`

  return { subject, htmlBody, textBody }
}

