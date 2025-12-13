// /src/lib/email/templates/index.ts
// Central registry of all email templates

export interface EmailTemplateMetadata {
  id: string
  name: string
  description: string
  category: string
  triggers: string[]
  variables: string[]
  status: 'active' | 'planned'
  lastSent?: string | null
  totalSent?: number
  templateFile: string | null
}

export const EMAIL_TEMPLATES: EmailTemplateMetadata[] = [
  {
    id: 'household-invitation',
    name: 'Household Invitation',
    description: 'Invite family members to join your household account',
    category: 'Household',
    triggers: [
      'Admin clicks "Send Invitation" in Household Settings',
      'API: POST /api/household/invite',
    ],
    variables: ['inviterName', 'inviterEmail', 'householdName', 'invitationLink', 'expiresInDays'],
    status: 'active',
    lastSent: '2025-11-14',
    totalSent: 12,
    templateFile: 'household-invitation.ts',
  },
  {
    id: 'support-ticket-created',
    name: 'Support Ticket Created',
    description: 'Confirmation email sent when a user creates a support ticket',
    category: 'Support',
    triggers: [
      'User submits support form at /support',
      'API: POST /api/support/tickets',
    ],
    variables: ['ticketNumber', 'ticketSubject', 'ticketStatus', 'ticketUrl', 'customerName'],
    status: 'active',
    templateFile: 'support-ticket-created.ts',
  },
  {
    id: 'personal-message',
    name: 'Personal Message',
    description: 'Simple text-style email that looks like a personal message from a real person',
    category: 'Communication',
    triggers: [
      'Manual send from admin',
      'CRM: Send personal message',
    ],
    variables: ['recipientName', 'senderName', 'messageBody', 'closingLine'],
    status: 'active',
    templateFile: 'personal-message.ts',
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Welcome new users to VibrationFit',
    category: 'Onboarding',
    triggers: [
      'User completes signup',
      'Auth: Email verification success',
    ],
    variables: ['userName', 'verificationLink'],
    status: 'planned',
    templateFile: null,
  },
  {
    id: 'intensive-welcome',
    name: 'Intensive Program Welcome',
    description: 'Onboarding email for Intensive program purchasers',
    category: 'Intensive',
    triggers: [
      'Stripe webhook: intensive purchase complete',
      'Subscription status: active',
    ],
    variables: ['userName', 'dashboardLink', 'callScheduleLink'],
    status: 'planned',
    templateFile: null,
  },
  {
    id: 'token-purchase-confirmation',
    name: 'Token Pack Purchase',
    description: 'Confirmation email when user buys token packs',
    category: 'Billing',
    triggers: [
      'Stripe webhook: token pack purchase complete',
      'Payment status: succeeded',
    ],
    variables: ['userName', 'tokenAmount', 'receiptLink'],
    status: 'planned',
    templateFile: null,
  },
  {
    id: 'subscription-renewal',
    name: 'Subscription Renewal',
    description: 'Notification of upcoming subscription renewal',
    category: 'Billing',
    triggers: [
      'Scheduled: 7 days before renewal',
      'Stripe: subscription active',
    ],
    variables: ['userName', 'renewalDate', 'amount', 'planName'],
    status: 'planned',
    templateFile: null,
  },
]

// Export individual template generators
export { generateHouseholdInvitationEmail } from './household-invitation'
export { generateSupportTicketCreatedEmail } from './support-ticket-created'
export { generatePersonalMessageEmail } from './personal-message'

