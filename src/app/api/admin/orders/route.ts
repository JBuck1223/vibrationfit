/**
 * Admin Orders API
 *
 * GET  /api/admin/orders           - List recent orders with email delivery status
 * POST /api/admin/orders           - Resend purchase emails for a given order
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/middleware/admin'
import { triggerEvent } from '@/lib/messaging/events'

// ─── GET: list orders + email status ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const adminDb = createAdminClient()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch orders (no join -- orders FK goes to auth.users, not user_accounts)
    const { data: orders, error: ordersError } = await adminDb
      .from('orders')
      .select('id, user_id, total_amount, currency, status, paid_at, promo_code, referral_source, campaign_name, metadata, created_at, stripe_payment_intent_id, stripe_checkout_session_id')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [], emailStatuses: {} })
    }

    // Batch-fetch user accounts for all orders
    const userIds = [...new Set(orders.map(o => o.user_id))]

    const { data: accounts } = await adminDb
      .from('user_accounts')
      .select('id, email, first_name, last_name, full_name, phone')
      .in('id', userIds)

    const accountMap = new Map(
      (accounts || []).map(a => [a.id, a])
    )

    // Merge account data onto each order
    const enrichedOrders = orders.map(order => ({
      ...order,
      user_accounts: accountMap.get(order.user_id) || {
        email: null,
        first_name: null,
        last_name: null,
        full_name: null,
        phone: null,
      },
    }))

    // Scheduled messages for these users
    const { data: scheduledMessages } = await adminDb
      .from('scheduled_messages')
      .select('id, recipient_user_id, recipient_email, status, subject, scheduled_for, sent_at, error_message, created_at')
      .in('recipient_user_id', userIds)
      .order('created_at', { ascending: false })

    // Send log for these users
    const { data: sendLog } = await adminDb
      .from('message_send_log')
      .select('id, recipient_user_id, recipient_email, status, subject, sent_at, error_message, created_at')
      .in('recipient_user_id', userIds)
      .order('created_at', { ascending: false })

    // Build per-order email status by matching user_id + time proximity
    const emailStatuses: Record<string, {
      scheduled: Array<{
        id: string
        status: string
        subject: string | null
        scheduledFor: string
        sentAt: string | null
        error: string | null
        createdAt: string
      }>
      sent: Array<{
        id: string
        status: string
        subject: string | null
        sentAt: string | null
        error: string | null
      }>
    }> = {}

    for (const order of orders) {
      const orderTime = new Date(order.created_at).getTime()
      const windowMs = 10 * 60 * 1000 // 10-minute window

      const matchingScheduled = (scheduledMessages || []).filter(m => {
        if (m.recipient_user_id !== order.user_id) return false
        const msgTime = new Date(m.created_at).getTime()
        return Math.abs(msgTime - orderTime) < windowMs
      })

      const matchingSent = (sendLog || []).filter(m => {
        if (m.recipient_user_id !== order.user_id) return false
        const msgTime = new Date(m.created_at).getTime()
        return Math.abs(msgTime - orderTime) < windowMs
      })

      emailStatuses[order.id] = {
        scheduled: matchingScheduled.map(m => ({
          id: m.id,
          status: m.status,
          subject: m.subject,
          scheduledFor: m.scheduled_for,
          sentAt: m.sent_at,
          error: m.error_message,
          createdAt: m.created_at,
        })),
        sent: matchingSent.map(m => ({
          id: m.id,
          status: m.status,
          subject: m.subject,
          sentAt: m.sent_at,
          error: m.error_message,
        })),
      }
    }

    return NextResponse.json({ orders: enrichedOrders, emailStatuses })
  } catch (error) {
    console.error('Admin orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST: resend purchase emails ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Fetch order
    const { data: order, error: orderError } = await adminDb
      .from('orders')
      .select('id, user_id, total_amount, status, metadata, created_at')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch the user account separately
    const { data: account } = await adminDb
      .from('user_accounts')
      .select('email, first_name, last_name, full_name, phone')
      .eq('id', order.user_id)
      .single()

    const email = account?.email
    const fullName = account?.full_name || ''
    const firstName = account?.first_name || fullName.split(' ')[0] || email?.split('@')[0] || ''

    if (!email) {
      return NextResponse.json({ error: 'No email address on user account' }, { status: 400 })
    }

    // Look up order items to get intensive details
    const { data: orderItems } = await adminDb
      .from('order_items')
      .select('id, payment_plan, metadata')
      .eq('order_id', orderId)

    const intensiveItem = orderItems?.find((item: any) =>
      item.metadata?.payment_plan || item.payment_plan
    )

    const paymentPlan = intensiveItem?.payment_plan || intensiveItem?.metadata?.payment_plan || 'full'

    // Fire triggerEvent for any configured automation rules / sequences
    const result = await triggerEvent('intensive.purchased', {
      email,
      userId: order.user_id,
      name: fullName || firstName,
      firstName,
      paymentPlan,
      orderId: order.id,
      intensiveId: intensiveItem?.id || '',
    })

    // If no automation rules matched, fall back to queuing via the email_templates
    // table directly so the message still goes through the scheduled_messages pipeline
    let fallbackQueued = false
    if (result.rulesFired === 0 && result.sequencesEnrolled === 0) {
      const { data: template } = await adminDb
        .from('email_templates')
        .select('id, subject, html_body, text_body')
        .eq('slug', 'intensive-purchase-confirmation')
        .eq('status', 'active')
        .maybeSingle()

      if (template) {
        const variables: Record<string, string> = {
          firstName,
          name: fullName || firstName,
          email,
          paymentPlan,
          orderId: order.id,
        }

        let subject = template.subject
        let body = template.html_body
        let textBody = template.text_body || ''
        for (const [key, value] of Object.entries(variables)) {
          const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
          subject = subject.replace(re, value)
          body = body.replace(re, value)
          textBody = textBody.replace(re, value)
        }

        const { error: insertError } = await adminDb.from('scheduled_messages').insert({
          message_type: 'email',
          recipient_email: email,
          recipient_name: fullName || firstName,
          recipient_user_id: order.user_id,
          subject,
          body,
          text_body: textBody || null,
          scheduled_for: new Date().toISOString(),
          email_template_id: template.id,
        })

        if (!insertError) {
          fallbackQueued = true
        } else {
          console.error('Failed to queue fallback email:', insertError)
        }
      }
    }

    const parts: string[] = []
    if (result.rulesFired > 0) parts.push(`${result.rulesFired} automation rule(s) fired`)
    if (result.sequencesEnrolled > 0) parts.push(`${result.sequencesEnrolled} sequence(s) enrolled`)
    if (fallbackQueued) parts.push(`purchase confirmation queued via template`)
    if (parts.length === 0) parts.push('No automation rules, sequences, or fallback template found. Create an active email_template with slug "intensive-purchase-confirmation" or an automation rule for the "intensive.purchased" event.')

    return NextResponse.json({
      success: result.rulesFired > 0 || result.sequencesEnrolled > 0 || fallbackQueued,
      message: parts.join('; '),
      result,
      fallbackQueued,
    })
  } catch (error) {
    console.error('Admin orders POST (resend) error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
