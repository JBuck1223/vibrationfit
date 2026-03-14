/**
 * Database-driven notification config engine.
 *
 * Fetches notification_configs by slug, applies {{variable}} substitution,
 * and sends across all enabled channels (email, SMS, admin SMS).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendAndLogEmail, sendAndLogBulkEmail } from '@/lib/email/send'
import { sendSMS } from '@/lib/messaging/twilio'

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
  email_subject: string | null
  email_body: string | null
  email_text_body: string | null
  sms_body: string | null
  admin_sms_body: string | null
  variables: string[]
}

export interface SendNotificationParams {
  slug: string
  variables: Record<string, string>
  /** Email recipient (user). Skipped if blank or channel disabled. */
  recipientEmail?: string
  /** SMS recipient (user). Skipped if blank or channel disabled. */
  recipientPhone?: string
  /** Optional userId for email logging context */
  userId?: string
}

export interface BulkRecipient {
  email?: string
  phone?: string
  userId?: string
  /** Per-recipient variable overrides (merged with base variables) */
  variables?: Record<string, string>
}

export interface SendBulkNotificationParams {
  slug: string
  variables: Record<string, string>
  recipients: BulkRecipient[]
}

// ── Config cache (per-request lifetime in serverless, avoids duplicate DB reads) ──

const configCache = new Map<string, { config: NotificationConfig | null; ts: number }>()
const CACHE_TTL_MS = 30_000

// ── Core ──

function applyVariables(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value ?? '')
  }
  return result
}

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

  // Email to user
  if (config.email_enabled && params.recipientEmail && config.email_subject && config.email_body) {
    try {
      await sendAndLogEmail({
        to: params.recipientEmail,
        subject: applyVariables(config.email_subject, vars),
        htmlBody: applyVariables(config.email_body, vars),
        textBody: config.email_text_body ? applyVariables(config.email_text_body, vars) : undefined,
        context: { userId: params.userId },
      })
    } catch (err) {
      console.error(`[notifications] Email failed for ${params.slug}:`, err)
    }
  }

  // SMS to user
  if (config.sms_enabled && params.recipientPhone && config.sms_body) {
    try {
      await sendSMS({
        to: params.recipientPhone,
        body: applyVariables(config.sms_body, vars),
      })
    } catch (err) {
      console.error(`[notifications] SMS failed for ${params.slug}:`, err)
    }
  }

  // Admin SMS
  if (config.admin_sms_enabled && config.admin_sms_body) {
    const phonesRaw = process.env.ADMIN_NOTIFICATION_PHONES
    if (phonesRaw) {
      const phones = phonesRaw.split(',').map(p => p.trim()).filter(Boolean)
      const body = applyVariables(config.admin_sms_body, vars)
      await Promise.allSettled(
        phones.map(phone => sendSMS({ to: phone, body }))
      ).catch(err => console.error(`[notifications] Admin SMS failed for ${params.slug}:`, err))
    }
  }
}

/**
 * Send a notification to many recipients (email + SMS) plus admin SMS.
 * Used for broadcast notifications like alignment gym announcements.
 */
export async function sendBulkNotification(params: SendBulkNotificationParams): Promise<void> {
  const config = await getNotificationConfig(params.slug)
  if (!config) {
    console.warn(`[notifications] No config found for slug: ${params.slug}`)
    return
  }

  const vars = params.variables

  // Bulk email
  if (config.email_enabled && config.email_subject && config.email_body) {
    const emailRecipients = params.recipients
      .filter(r => r.email)
      .map(r => ({ email: r.email!, userId: r.userId }))

    if (emailRecipients.length > 0) {
      try {
        await sendAndLogBulkEmail({
          recipients: emailRecipients,
          subject: applyVariables(config.email_subject, vars),
          htmlBody: applyVariables(config.email_body, vars),
          textBody: config.email_text_body ? applyVariables(config.email_text_body, vars) : undefined,
        })
        console.log(`[notifications] Bulk email sent to ${emailRecipients.length} for ${params.slug}`)
      } catch (err) {
        console.error(`[notifications] Bulk email failed for ${params.slug}:`, err)
      }
    }
  }

  // Bulk SMS
  if (config.sms_enabled && config.sms_body) {
    const smsRecipients = params.recipients.filter(r => r.phone)
    if (smsRecipients.length > 0) {
      const body = applyVariables(config.sms_body, vars)
      await Promise.allSettled(
        smsRecipients.map(r => sendSMS({ to: r.phone!, body }))
      ).catch(err => console.error(`[notifications] Bulk SMS failed for ${params.slug}:`, err))
      console.log(`[notifications] Bulk SMS sent to ${smsRecipients.length} for ${params.slug}`)
    }
  }

  // Admin SMS
  if (config.admin_sms_enabled && config.admin_sms_body) {
    const phonesRaw = process.env.ADMIN_NOTIFICATION_PHONES
    if (phonesRaw) {
      const phones = phonesRaw.split(',').map(p => p.trim()).filter(Boolean)
      const body = applyVariables(config.admin_sms_body, vars)
      await Promise.allSettled(
        phones.map(phone => sendSMS({ to: phone, body }))
      ).catch(() => {})
    }
  }
}
