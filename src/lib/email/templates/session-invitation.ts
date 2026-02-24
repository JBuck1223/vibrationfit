// /src/lib/email/templates/session-invitation.ts
// Database-driven session invitation email

import { renderEmailTemplate } from './db'

export interface SessionInvitationEmailData {
  participantName: string
  participantEmail: string
  hostName: string
  sessionTitle: string
  sessionDescription?: string
  scheduledDate: string
  scheduledTime: string
  durationMinutes: number
  joinLink: string
}

export async function generateSessionInvitationEmail(
  data: SessionInvitationEmailData
): Promise<{ subject: string; htmlBody: string; textBody: string }> {
  const descriptionBlock = data.sessionDescription
    ? `<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #999999; text-align: center; font-style: italic;">"${data.sessionDescription}"</p>`
    : ''

  const descriptionText = data.sessionDescription
    ? `"${data.sessionDescription}"`
    : ''

  return renderEmailTemplate('session-invitation', {
    participantName: data.participantName || 'there',
    hostName: data.hostName,
    sessionTitle: data.sessionTitle,
    sessionDescription: data.sessionDescription || '',
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime,
    durationMinutes: String(data.durationMinutes),
    joinLink: data.joinLink,
    descriptionBlock,
    descriptionText,
  })
}
