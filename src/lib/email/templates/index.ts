// /src/lib/email/templates/index.ts
// Central registry - all email templates are now database-driven via email_templates table

// Core DB functions (in separate file to avoid circular imports)
export {
  getEmailTemplate,
  getAllEmailTemplates,
  renderEmailTemplate,
  type EmailTemplate,
} from './db'

// Backward-compatible generator functions
export { generateHouseholdInvitationEmail } from './household-invitation'
export { generateSupportTicketCreatedEmail } from './support-ticket-created'
export { generatePersonalMessageEmail } from './personal-message'
export { generateSessionInvitationEmail } from './session-invitation'
