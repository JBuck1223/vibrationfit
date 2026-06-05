import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/messaging/twilio'

export type AdminNotificationType =
  | 'purchase'
  | 'refund'
  | 'subscription_canceled'
  | 'intensive_completed'
  | 'lead_created'
  | 'support_ticket'

interface CreateNotificationParams {
  type: AdminNotificationType
  title: string
  body?: string
  metadata?: Record<string, unknown>
  link?: string
}

export async function createAdminNotification(params: CreateNotificationParams) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from('admin_notifications').insert({
      type: params.type,
      title: params.title,
      body: params.body || null,
      metadata: params.metadata || {},
      link: params.link || null,
    })

    if (error) {
      console.error('Failed to create admin notification:', error)
    }
  } catch (err) {
    console.error('createAdminNotification error:', err)
  }
}

/**
 * Send an SMS to all admin phone numbers configured in ADMIN_NOTIFICATION_PHONES.
 * Logs per-recipient failures so they don't vanish silently.
 */
export async function notifyAdminSMS(message: string) {
  const phonesRaw = process.env.ADMIN_NOTIFICATION_PHONES
  if (!phonesRaw) {
    console.warn('[notifyAdminSMS] ADMIN_NOTIFICATION_PHONES not set — skipping')
    return
  }

  const phones = phonesRaw.split(',').map(p => p.trim()).filter(Boolean)
  if (phones.length === 0) return

  const results = await Promise.allSettled(
    phones.map(phone => sendSMS({ to: phone, body: message }))
  )

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[notifyAdminSMS] Failed to send to ${phones[i]}:`, result.reason)
    } else if (!result.value.success) {
      console.error(`[notifyAdminSMS] SMS rejected for ${phones[i]}:`, result.value.error)
    }
  })
}
