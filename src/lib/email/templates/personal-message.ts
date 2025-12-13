// /src/lib/email/templates/personal-message.ts
// Simple text-style email template that looks like a personal message

export interface PersonalMessageEmailData {
  recipientName?: string
  senderName: string
  messageBody: string
  closingLine?: string
}

export function generatePersonalMessageEmail(
  data: PersonalMessageEmailData
): { subject: string; htmlBody: string; textBody: string } {
  const { recipientName, senderName, messageBody, closingLine } = data

  const subject = `Message from ${senderName}`

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message from ${senderName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; background-color: #ffffff; color: #000000;">
  <div style="color: #000000;">
${recipientName ? `Hi ${recipientName},<br><br>` : ''}${messageBody.replace(/\n/g, '<br>')}<br><br>${closingLine ? `${closingLine}<br>` : ''}${senderName}
  </div>
</body>
</html>
`

  const textBody = `${recipientName ? `Hi ${recipientName},\n\n` : ''}${messageBody}\n\n${closingLine ? `${closingLine}\n` : ''}${senderName}`

  return { subject, htmlBody, textBody }
}

