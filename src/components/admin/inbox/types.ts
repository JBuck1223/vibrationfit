export interface InboxMessage {
  id: string
  channel: 'email' | 'sms'
  direction: 'inbound' | 'outbound'
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  subject: string | null
  preview: string | null
  status: string | null
  user_id: string | null
  lead_id: string | null
  created_at: string
}

export interface InboxCounts {
  email: { inbound: number; outbound: number; total: number }
  sms: { inbound: number; outbound: number; total: number }
  total: { inbound: number; outbound: number; total: number }
}

export type InboxChannel = 'all' | 'email' | 'sms'
export type InboxFilter = 'all' | 'inbox' | 'sent'
