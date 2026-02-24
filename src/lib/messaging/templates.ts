// /src/lib/messaging/templates.ts
// SMS message templates - database-driven via sms_templates table

import { createAdminClient } from '@/lib/supabase/admin'

export interface MessageTemplate {
  id: string
  slug: string
  name: string
  category: string
  body: string
  variables: string[]
  description?: string
  status: string
}

function mapRow(row: any): MessageTemplate {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    body: row.body,
    variables: Array.isArray(row.variables) ? row.variables : [],
    description: row.description,
    status: row.status,
  }
}

/**
 * Get template by slug from the database
 */
export async function getTemplate(slug: string): Promise<MessageTemplate | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sms_templates')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !data) return null
  return mapRow(data)
}

/**
 * Get all active templates
 */
export async function getAllTemplates(): Promise<MessageTemplate[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sms_templates')
    .select('*')
    .eq('status', 'active')
    .order('name')

  if (error || !data) return []
  return data.map(mapRow)
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(
  category: string
): Promise<MessageTemplate[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sms_templates')
    .select('*')
    .eq('category', category)
    .eq('status', 'active')
    .order('name')

  if (error || !data) return []
  return data.map(mapRow)
}

/**
 * Fetch template from DB and replace {{variable}} placeholders with actual values
 */
export async function fillTemplate(
  slug: string,
  variables: Record<string, string>
): Promise<string> {
  const template = await getTemplate(slug)
  if (!template) {
    throw new Error(`SMS template not found: ${slug}`)
  }

  return applyVariables(template.body, variables)
}

/**
 * Validate that all required variables are provided for a template
 */
export async function validateTemplateVariables(
  slug: string,
  variables: Record<string, string>
): Promise<{ valid: boolean; missing?: string[] }> {
  const template = await getTemplate(slug)
  if (!template) {
    return { valid: false, missing: ['template not found'] }
  }

  const missing = template.variables.filter((v) => !variables[v])
  if (missing.length > 0) {
    return { valid: false, missing }
  }

  return { valid: true }
}

/**
 * Replace {{variable}} placeholders in a string with provided values
 */
export function applyVariables(
  text: string,
  variables: Record<string, string>
): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

/**
 * Increment the total_sent counter and update last_sent_at for a template
 */
export async function trackTemplateSend(slug: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase
      .from('sms_templates')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('slug', slug)
  } catch {
    // Non-critical tracking -- don't fail the send
  }
}
