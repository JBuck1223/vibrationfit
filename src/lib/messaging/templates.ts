// /src/lib/messaging/templates.ts
// SMS message templates for VibrationFit

export interface MessageTemplate {
  id: string
  name: string
  category: 'lead' | 'customer' | 'support' | 'demo'
  body: string
  variables: string[] // e.g., ['name', 'time', 'date']
}

export const SMS_TEMPLATES: MessageTemplate[] = [
  // Lead Templates
  {
    id: 'lead-confirmation',
    name: 'Lead Confirmation',
    category: 'lead',
    body: 'Hi {{name}}, thanks for reaching out to Vibration Fit! We received your message and will respond within 24 hours. Reply STOP to opt out. - Team Vibration Fit',
    variables: ['name'],
  },
  {
    id: 'lead-follow-up',
    name: 'Lead Follow-up',
    category: 'lead',
    body: 'Hi {{name}}, this is Jordan from Vibration Fit. Following up on your interest. Do you have any questions I can help with? - Jordan',
    variables: ['name'],
  },

  // Demo Templates
  {
    id: 'demo-confirmation',
    name: 'Demo Confirmation',
    category: 'demo',
    body: 'Hi {{name}}, your Vibration Fit demo is confirmed for {{date}} at {{time}}. Looking forward to it! Reply STOP to opt out. - Jordan',
    variables: ['name', 'date', 'time'],
  },
  {
    id: 'demo-reminder-24h',
    name: 'Demo Reminder (24 hours)',
    category: 'demo',
    body: 'Hi {{name}}, reminder: Your Vibration Fit demo is tomorrow at {{time}}. See you then! Reply CANCEL to reschedule. - Jordan',
    variables: ['name', 'time'],
  },
  {
    id: 'demo-reminder-1h',
    name: 'Demo Reminder (1 hour)',
    category: 'demo',
    body: 'Hi {{name}}, your demo starts in 1 hour. Join here: {{link}} - Jordan',
    variables: ['name', 'link'],
  },

  // Intensive Templates
  {
    id: 'intensive-confirmation',
    name: 'Intensive Intake Confirmation',
    category: 'lead',
    body: 'Hi {{name}}, thank you for your interest in the 72-Hour Activation Intensive! We\'ll review your intake and reach out within 24 hours. - Team Vibration Fit',
    variables: ['name'],
  },

  // Support Templates
  {
    id: 'support-created',
    name: 'Support Ticket Created',
    category: 'support',
    body: 'Your support ticket #{{ticket_number}} has been created. We\'ll respond soon. View details: {{link}} - Vibration Fit Support',
    variables: ['ticket_number', 'link'],
  },
  {
    id: 'support-reply',
    name: 'Support Reply Notification',
    category: 'support',
    body: 'New reply to your ticket #{{ticket_number}}. View here: {{link}} - Vibration Fit Support',
    variables: ['ticket_number', 'link'],
  },
  {
    id: 'support-resolved',
    name: 'Support Ticket Resolved',
    category: 'support',
    body: 'Your support ticket #{{ticket_number}} has been resolved! Reply REOPEN if you need more help. - Vibration Fit Support',
    variables: ['ticket_number'],
  },

  // Customer Engagement Templates
  {
    id: 'customer-welcome',
    name: 'Customer Welcome',
    category: 'customer',
    body: 'Welcome to Vibration Fit, {{name}}! 🎉 Ready to create your Life Vision? Start here: {{link}} - Jordan',
    variables: ['name', 'link'],
  },
  {
    id: 'customer-reengagement',
    name: 'Re-engagement',
    category: 'customer',
    body: 'Hey {{name}}, we noticed you haven\'t logged in for a while. Need any help with your vision? I\'m here! - Jordan',
    variables: ['name'],
  },
]

/**
 * Replace template variables with actual values
 */
export function fillTemplate(
  templateId: string,
  variables: Record<string, string>
): string {
  const template = SMS_TEMPLATES.find((t) => t.id === templateId)

  if (!template) {
    throw new Error(`Template not found: ${templateId}`)
  }

  let message = template.body

  // Replace all {{variable}} placeholders
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    message = message.replace(new RegExp(placeholder, 'g'), value)
  })

  return message
}

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): MessageTemplate | undefined {
  return SMS_TEMPLATES.find((t) => t.id === templateId)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: MessageTemplate['category']
): MessageTemplate[] {
  return SMS_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Validate that all required variables are provided
 */
export function validateTemplateVariables(
  templateId: string,
  variables: Record<string, string>
): { valid: boolean; missing?: string[] } {
  const template = getTemplate(templateId)

  if (!template) {
    return { valid: false, missing: ['template not found'] }
  }

  const missing = template.variables.filter((v) => !variables[v])

  if (missing.length > 0) {
    return { valid: false, missing }
  }

  return { valid: true }
}












