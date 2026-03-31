export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

interface UnifiedMessage {
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

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel') || 'all'
    const filter = searchParams.get('filter') || 'inbox'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const search = searchParams.get('search')?.trim() || ''

    const adminClient = createAdminClient()
    const offset = (page - 1) * limit

    const messages: UnifiedMessage[] = []
    let totalEmail = 0
    let totalSms = 0

    const directionFilter =
      filter === 'inbox' ? 'inbound' :
      filter === 'sent' ? 'outbound' :
      null

    // Fetch emails
    if (channel === 'all' || channel === 'email') {
      let query = adminClient
        .from('email_messages')
        .select('id, from_email, to_email, subject, body_text, direction, status, user_id, created_at', { count: 'exact' })

      if (directionFilter) query = query.eq('direction', directionFilter)
      if (search) {
        query = query.or(`subject.ilike.%${search}%,from_email.ilike.%${search}%,to_email.ilike.%${search}%,body_text.ilike.%${search}%`)
      }

      const { data: emails, count } = await query
        .order('created_at', { ascending: false })
        .range(0, 999)

      totalEmail = count || 0

      emails?.forEach((e) => {
        const isInbound = e.direction === 'inbound'
        messages.push({
          id: e.id,
          channel: 'email',
          direction: e.direction as 'inbound' | 'outbound',
          contact_name: null,
          contact_email: isInbound ? e.from_email : e.to_email,
          contact_phone: null,
          subject: e.subject || null,
          preview: e.body_text ? e.body_text.substring(0, 120) : null,
          status: e.status,
          user_id: e.user_id || null,
          lead_id: null,
          created_at: e.created_at,
        })
      })
    }

    // Fetch SMS
    if (channel === 'all' || channel === 'sms') {
      let query = adminClient
        .from('sms_messages')
        .select('id, from_number, to_number, body, direction, status, user_id, lead_id, created_at', { count: 'exact' })

      if (directionFilter) query = query.eq('direction', directionFilter)
      if (search) {
        query = query.or(`body.ilike.%${search}%,from_number.ilike.%${search}%,to_number.ilike.%${search}%`)
      }

      const { data: smsMessages, count } = await query
        .order('created_at', { ascending: false })
        .range(0, 999)

      totalSms = count || 0

      smsMessages?.forEach((s) => {
        const isInbound = s.direction === 'inbound'
        messages.push({
          id: s.id,
          channel: 'sms',
          direction: s.direction as 'inbound' | 'outbound',
          contact_name: null,
          contact_email: null,
          contact_phone: isInbound ? s.from_number : s.to_number,
          subject: null,
          preview: s.body ? s.body.substring(0, 120) : null,
          status: s.status,
          user_id: s.user_id || null,
          lead_id: s.lead_id || null,
          created_at: s.created_at,
        })
      })
    }

    // Sort combined results by created_at desc
    messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Resolve contact names from user_accounts and leads
    const userIds = [...new Set(messages.filter(m => m.user_id).map(m => m.user_id!))]
    const leadIds = [...new Set(messages.filter(m => m.lead_id).map(m => m.lead_id!))]

    const userMap = new Map<string, string>()
    const leadMap = new Map<string, { name: string; email: string | null; phone: string | null }>()

    if (userIds.length > 0) {
      const { data: users } = await adminClient
        .from('user_accounts')
        .select('id, full_name, email, phone')
        .in('id', userIds)

      users?.forEach(u => {
        userMap.set(u.id, u.full_name || u.email)
      })
    }

    if (leadIds.length > 0) {
      const { data: leads } = await adminClient
        .from('leads')
        .select('id, first_name, last_name, email, phone')
        .in('id', leadIds)

      leads?.forEach(l => {
        const name = [l.first_name, l.last_name].filter(Boolean).join(' ')
        leadMap.set(l.id, { name: name || l.email || 'Unknown Lead', email: l.email, phone: l.phone })
      })
    }

    // Enrich messages with contact names
    for (const msg of messages) {
      if (msg.user_id && userMap.has(msg.user_id)) {
        msg.contact_name = userMap.get(msg.user_id)!
      } else if (msg.lead_id && leadMap.has(msg.lead_id)) {
        const lead = leadMap.get(msg.lead_id)!
        msg.contact_name = lead.name
        if (!msg.contact_email) msg.contact_email = lead.email
        if (!msg.contact_phone) msg.contact_phone = lead.phone
      }
    }

    // Paginate the combined sorted result
    const paginated = messages.slice(offset, offset + limit)
    const total = messages.length

    return NextResponse.json({
      messages: paginated,
      total,
      totalEmail,
      totalSms,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: unknown) {
    console.error('Error fetching inbox:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
