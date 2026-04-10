/**
 * Database-driven notification config engine.
 *
 * Fetches notification_configs by slug (channel toggles + template slug refs + segment ref),
 * resolves actual template content from email_templates / sms_templates,
 * resolves audience from blast_segments via queryRecipients,
 * and sends across all enabled channels (email, SMS, admin SMS).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail, sendAndLogBulkEmail } from '@/lib/email/send'
import { sendSMS } from '@/lib/messaging/twilio'
import { renderEmailTemplate } from '@/lib/email/templates/db'
import { fillTemplate, trackTemplateSend } from '@/lib/messaging/templates'
import { queryRecipients, type BlastFilters, type BlastRecipient } from '@/lib/crm/blast-filters'

// ── Types ──

export interface NotificationConfig {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  email_enabled: boolean
  sms_enabled: boolean
  admin_sms_enabled: boolean
  email_template_slug: string | null
  sms_template_slug: string | null
  admin_sms_template_slug: string | null
  segment_id: string | null
  variables: string[]
}

export interface SendNotificationParams {
  slug: string
  variables: Record<string, string>
  recipientEmail?: string
  recipientPhone?: string
  userId?: string
}

export interface BulkRecipient {
  email?: string
  phone?: string
  userId?: string
  variables?: Record<string, string>
}

export interface SendBulkNotificationParams {
  slug: string
  variables: Record<string, string>
  /** If omitted, recipients are resolved from the config's segment_id */
  recipients?: BulkRecipient[]
}

// ── Config cache (per-request lifetime in serverless, avoids duplicate DB reads) ──

const configCache = new Map<string, { config: NotificationConfig | null; ts: number }>()
const CACHE_TTL_MS = 30_000

// ── Core ──

export async function getNotificationConfig(slug: string): Promise<NotificationConfig | null> {
  const cached = configCache.get(slug)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.config

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('notification_configs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    configCache.set(slug, { config: null, ts: Date.now() })
    return null
  }

  const config: NotificationConfig = {
    ...data,
    variables: Array.isArray(data.variables) ? data.variables : [],
  }
  configCache.set(slug, { config, ts: Date.now() })
  return config
}

/**
 * Resolve the audience for a notification from its linked segment.
 * Calls queryRecipients with the segment's filters to get a fresh audience.
 * Returns BulkRecipient[] mapped from BlastRecipient[].
 */
export async function resolveNotificationRecipients(
  slug: string
): Promise<BulkRecipient[]> {
  const config = await getNotificationConfig(slug)
  if (!config) {
    console.warn(`[notifications] No config found for slug: ${slug}`)
    return []
  }

  if (!config.segment_id) {
    console.warn(`[notifications] No segment linked to config: ${slug}`)
    return []
  }

  const supabase = createAdminClient()
  const { data: segment, error } = await supabase
    .from('blast_segments')
    .select('filters')
    .eq('id', config.segment_id)
    .single()

  if (error || !segment?.filters) {
    console.warn(`[notifications] Segment not found for config ${slug}: ${error?.message}`)
    return []
  }

  const filters = segment.filters as BlastFilters
  const blastRecipients = await queryRecipients(filters)

  return blastRecipients.map(mapBlastToBulk)
}

function mapBlastToBulk(r: BlastRecipient): BulkRecipient {
  return {
    email: r.email || undefined,
    phone: (r.smsOptIn && r.phone) ? r.phone : undefined,
    userId: r.userId,
  }
}

/**
 * Resolve the email template for a notification config.
 */
async function resolveEmailTemplate(
  config: NotificationConfig,
  vars: Record<string, string>
): Promise<{ subject: string; htmlBody: string; textBody: string } | null> {
  if (!config.email_template_slug) return null
  try {
    return await renderEmailTemplate(config.email_template_slug, vars)
  } catch {
    console.warn(`[notifications] Email template not found: ${config.email_template_slug}`)
    return null
  }
}

/**
 * Resolve an SMS template for a notification config.
 */
async function resolveSmsTemplate(
  templateSlug: string | null,
  vars: Record<string, string>
): Promise<string | null> {
  if (!templateSlug) return null
  try {
    return await fillTemplate(templateSlug, vars)
  } catch {
    console.warn(`[notifications] SMS template not found: ${templateSlug}`)
    return null
  }
}

/**
 * Send a notification to a single user + admins, using database config.
 * All channels that are disabled or missing templates are silently skipped.
 */
export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const config = await getNotificationConfig(params.slug)
  if (!config) {
    console.warn(`[notifications] No config found for slug: ${params.slug}`)
    return
  }

  const vars = params.variables

  if (config.email_enabled && params.recipientEmail && config.email_template_slug) {
    try {
      const rendered = await resolveEmailTemplate(config, vars)
      if (rendered) {
        await sendAndLogEmail({
          to: params.recipientEmail,
          subject: rendered.subject,
          htmlBody: rendered.htmlBody,
          textBody: rendered.textBody || undefined,
          context: { userId: params.userId },
        })
      }
    } catch (err) {
      console.error(`[notifications] Email failed for ${params.slug}:`, err)
    }
  }

  if (config.sms_enabled && params.recipientPhone && config.sms_template_slug) {
    try {
      const body = await resolveSmsTemplate(config.sms_template_slug, vars)
      if (body) {
        await sendSMS({ to: params.recipientPhone, body, userId: params.userId })
        trackTemplateSend(config.sms_template_slug).catch(() => {})
      }
    } catch (err) {
      console.error(`[notifications] SMS failed for ${params.slug}:`, err)
    }
  }

  if (config.admin_sms_enabled && config.admin_sms_template_slug) {
    const phonesRaw = process.env.ADMIN_NOTIFICATION_PHONES
    if (phonesRaw) {
      const phones = phonesRaw.split(',').map(p => p.trim()).filter(Boolean)
      const body = await resolveSmsTemplate(config.admin_sms_template_slug, vars)
      if (body) {
        await Promise.allSettled(
          phones.map(phone => sendSMS({ to: phone, body }))
        ).catch(err => console.error(`[notifications] Admin SMS failed for ${params.slug}:`, err))
      }
    }
  }
}

/**
 * Send a notification to many recipients (email + SMS) plus admin SMS.
 *
 * If `recipients` is omitted, the audience is resolved dynamically from
 * the config's linked blast_segment via queryRecipients().
 */
export async function sendBulkNotification(params: SendBulkNotificationParams): Promise<void> {
  const config = await getNotificationConfig(params.slug)
  if (!config) {
    console.warn(`[notifications] No config found for slug: ${params.slug}`)
    return
  }

  const vars = params.variables

  // Resolve recipients: explicit list or from segment
  let recipients = params.recipients
  if (!recipients || recipients.length === 0) {
    recipients = await resolveNotificationRecipients(params.slug)
    if (recipients.length === 0) {
      console.warn(`[notifications] No recipients resolved for ${params.slug}`)
      return
    }
    console.log(`[notifications] Resolved ${recipients.length} recipients from segment for ${params.slug}`)
  }

  // Bulk email
  if (config.email_enabled && config.email_template_slug) {
    const emailRecipients = recipients
      .filter(r => r.email)
      .map(r => ({ email: r.email!, userId: r.userId }))

    if (emailRecipients.length > 0) {
      try {
        const rendered = await resolveEmailTemplate(config, vars)
        if (rendered) {
          await sendAndLogBulkEmail({
            recipients: emailRecipients,
            subject: rendered.subject,
            htmlBody: rendered.htmlBody,
            textBody: rendered.textBody || undefined,
          })
          console.log(`[notifications] Bulk email sent to ${emailRecipients.length} for ${params.slug}`)
        }
      } catch (err) {
        console.error(`[notifications] Bulk email failed for ${params.slug}:`, err)
      }
    }
  }

  // Bulk SMS
  if (config.sms_enabled && config.sms_template_slug) {
    const smsRecipients = recipients.filter(r => r.phone)
    if (smsRecipients.length > 0) {
      const body = await resolveSmsTemplate(config.sms_template_slug, vars)
      if (body) {
        const results = await Promise.allSettled(
          smsRecipients.map(r => sendSMS({ to: r.phone!, body }))
        )
        const successCount = results.filter(r => r.status === 'fulfilled').length
        if (successCount > 0) {
          trackTemplateSend(config.sms_template_slug, successCount).catch(() => {})
        }
        console.log(`[notifications] Bulk SMS sent to ${successCount}/${smsRecipients.length} for ${params.slug}`)
      }
    }
  }

  // Admin SMS
  if (config.admin_sms_enabled && config.admin_sms_template_slug) {
    const phonesRaw = process.env.ADMIN_NOTIFICATION_PHONES
    if (phonesRaw) {
      const phones = phonesRaw.split(',').map(p => p.trim()).filter(Boolean)
      const body = await resolveSmsTemplate(config.admin_sms_template_slug, vars)
      if (body) {
        await Promise.allSettled(
          phones.map(phone => sendSMS({ to: phone, body }))
        ).catch(() => {})
      }
    }
  }
}
