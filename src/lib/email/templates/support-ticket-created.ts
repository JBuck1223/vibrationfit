// /src/lib/email/templates/support-ticket-created.ts
// Database-driven support ticket created email

import { renderEmailTemplate } from './db'

export interface SupportTicketCreatedEmailData {
  ticketNumber: string
  ticketSubject: string
  ticketStatus: string
  ticketUrl: string
  customerName?: string
}

export async function generateSupportTicketCreatedEmail(
  data: SupportTicketCreatedEmailData
): Promise<{ subject: string; htmlBody: string; textBody: string }> {
  const statusDisplay =
    data.ticketStatus.charAt(0).toUpperCase() +
    data.ticketStatus.slice(1).replace('_', ' ')

  const greeting = data.customerName
    ? `Hi ${data.customerName}!`
    : 'Hi there!'

  return renderEmailTemplate('support-ticket-created', {
    ticketNumber: data.ticketNumber,
    ticketSubject: data.ticketSubject,
    ticketStatus: data.ticketStatus,
    ticketStatusDisplay: statusDisplay,
    ticketUrl: data.ticketUrl,
    customerName: data.customerName || '',
    customerGreeting: greeting,
  })
}
