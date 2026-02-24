// /src/lib/email/templates/personal-message.ts
// Database-driven personal message email

import { renderEmailTemplate } from './db'

export interface PersonalMessageEmailData {
  recipientName?: string
  senderName: string
  messageBody: string
  closingLine?: string
}

export async function generatePersonalMessageEmail(
  data: PersonalMessageEmailData
): Promise<{ subject: string; htmlBody: string; textBody: string }> {
  const greeting = data.recipientName
    ? `Hi ${data.recipientName},<br><br>`
    : ''
  const closingSection = data.closingLine
    ? `${data.closingLine}<br>`
    : ''
  const messageBodyHtml = data.messageBody.replace(/\n/g, '<br>')

  return renderEmailTemplate('personal-message', {
    recipientName: data.recipientName || '',
    senderName: data.senderName,
    messageBody: messageBodyHtml,
    closingLine: data.closingLine || '',
    greeting,
    closingSection,
  })
}
