// /src/lib/email/templates/db.ts
// Database access layer for email templates -- kept separate to avoid circular imports

import { createAdminClient } from '@/lib/supabase/admin'

export interface EmailTemplate {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  status: string
  subject: string
  html_body: string
  text_body: string | null
  variables: string[]
  triggers: string[]
  last_sent_at: string | null
  total_sent: number
}

function normalizeRow(row: any): EmailTemplate {
  return {
    ...row,
    variables: Array.isArray(row.variables) ? row.variables : [],
    triggers: Array.isArray(row.triggers) ? row.triggers : [],
  }
}

/**
 * Fetch an active email template by slug from the database
 */
export async function getEmailTemplate(slug: string): Promise<EmailTemplate | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !data) return null
  return normalizeRow(data)
}

/**
 * Fetch all active email templates
 */
export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('status', 'active')
    .order('name')

  if (error || !data) return []
  return data.map(normalizeRow)
}

/**
 * Replace all {{variable}} placeholders in a string
 */
function applyVariables(text: string, variables: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

/**
 * Render an email template: fetches from DB, substitutes variables,
 * returns { subject, htmlBody, textBody }
 */
export async function renderEmailTemplate(
  slug: string,
  variables: Record<string, string>
): Promise<{ subject: string; htmlBody: string; textBody: string }> {
  const template = await getEmailTemplate(slug)
  if (!template) {
    throw new Error(`Email template not found or inactive: ${slug}`)
  }

  return {
    subject: applyVariables(template.subject, variables),
    htmlBody: applyVariables(template.html_body, variables),
    textBody: applyVariables(template.text_body || '', variables),
  }
}
