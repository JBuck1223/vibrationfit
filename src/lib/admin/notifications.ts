import { createAdminClient } from '@/lib/supabase/admin'

export type AdminNotificationType =
  | 'purchase'
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
