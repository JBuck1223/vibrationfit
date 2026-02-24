// /src/lib/email/templates/household-invitation.ts
// Database-driven household invitation email

import { renderEmailTemplate } from './db'

export interface HouseholdInvitationEmailData {
  inviterName: string
  inviterEmail: string
  householdName: string
  invitationLink: string
  expiresInDays: number
}

export async function generateHouseholdInvitationEmail(
  data: HouseholdInvitationEmailData
): Promise<{ subject: string; htmlBody: string; textBody: string }> {
  return renderEmailTemplate('household-invitation', {
    inviterName: data.inviterName,
    inviterEmail: data.inviterEmail,
    householdName: data.householdName,
    invitationLink: data.invitationLink,
    expiresInDays: String(data.expiresInDays),
  })
}
