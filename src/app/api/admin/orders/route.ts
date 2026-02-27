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

    const { data: orders, error: ordersError } = await adminDb
      .from('orders')
      .select(`
        id,
        user_id,
        total_amount,
        currency,
        status,
        paid_at,
        promo_code,
        referral_source,
        campaign_name,
        metadata,
        created_at,
        stripe_payment_intent_id,
        stripe_checkout_session_id,
        user_accounts!inner (
          email,
          first_name,
          last_name,
          full_name,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [], emailStatuses: {} })
    }

    const userIds = [...new Set(orders.map(o => o.user_id))]

    // Scheduled messages for these users (created within a reasonable window of each order)
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

    return NextResponse.json({ orders, emailStatuses })
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

    const { data: order, error: orderError } = await adminDb
      .from('orders')
      .select(`
        id,
        user_id,
        total_amount,
        status,
        metadata,
        created_at,
        user_accounts!inner (
          email,
          first_name,
          last_name,
          full_name,
          phone
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const account = order.user_accounts as any
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

    const result = await triggerEvent('intensive.purchased', {
      email,
      userId: order.user_id,
      name: fullName || firstName,
      firstName,
      paymentPlan,
      orderId: order.id,
      intensiveId: intensiveItem?.id || '',
    })

    return NextResponse.json({
      success: true,
      message: `Resend triggered: ${result.rulesFired} rules fired, ${result.sequencesEnrolled} sequences enrolled`,
      result,
    })
  } catch (error) {
    console.error('Admin orders POST (resend) error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
