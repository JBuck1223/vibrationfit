import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: intensiveItem } = await supabase
      .from('order_items')
      .select(`
        id,
        amount,
        payment_plan,
        installments_total,
        installments_paid,
        next_installment_date,
        completion_status,
        started_at,
        completed_at,
        created_at,
        stripe_checkout_session_id,
        orders!inner(user_id),
        products!inner(name, product_type, key)
      `)
      .eq('orders.user_id', user.id)
      .eq('products.product_type', 'intensive')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!intensiveItem) {
      return NextResponse.json({ intensive: null })
    }

    const product = intensiveItem.products as any
    const isHousehold = product?.key?.includes('household')

    let installments: Array<{
      number: number
      amount: number
      status: 'paid' | 'upcoming' | 'scheduled'
      date: string | null
    }> = []

    const paymentPlan = intensiveItem.payment_plan || 'full'
    const total = intensiveItem.installments_total || 1
    const paid = intensiveItem.installments_paid || (paymentPlan === 'full' ? 1 : 0)

    if (paymentPlan === 'full') {
      installments = [{
        number: 1,
        amount: intensiveItem.amount,
        status: 'paid',
        date: intensiveItem.created_at,
      }]
    } else if (stripe && intensiveItem.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          intensiveItem.stripe_checkout_session_id
        )

        if (session.subscription && typeof session.subscription === 'string') {
          const invoices = await stripe.invoices.list({
            subscription: session.subscription,
            limit: total,
          })

          const sortedInvoices = invoices.data.sort(
            (a, b) => (a.created || 0) - (b.created || 0)
          )

          for (let i = 0; i < total; i++) {
            const invoice = sortedInvoices[i]
            if (invoice && (invoice.status === 'paid' || invoice.amount_paid > 0)) {
              installments.push({
                number: i + 1,
                amount: invoice.amount_paid,
                status: 'paid',
                date: invoice.created
                  ? new Date(invoice.created * 1000).toISOString()
                  : null,
              })
            } else if (invoice && invoice.status === 'open') {
              installments.push({
                number: i + 1,
                amount: invoice.amount_due,
                status: 'upcoming',
                date: invoice.due_date
                  ? new Date(invoice.due_date * 1000).toISOString()
                  : invoice.next_payment_attempt
                    ? new Date(invoice.next_payment_attempt * 1000).toISOString()
                    : null,
              })
            } else {
              installments.push({
                number: i + 1,
                amount: intensiveItem.amount,
                status: 'scheduled',
                date: intensiveItem.next_installment_date || null,
              })
            }
          }
        }
      } catch {
        // Fall back to DB-only data if Stripe call fails
      }
    }

    if (installments.length === 0) {
      for (let i = 0; i < total; i++) {
        installments.push({
          number: i + 1,
          amount: intensiveItem.amount,
          status: i < paid ? 'paid' : 'scheduled',
          date: i === 0 ? intensiveItem.created_at : null,
        })
      }
    }

    return NextResponse.json({
      intensive: {
        id: intensiveItem.id,
        productName: product?.name || 'Vision Activation Intensive',
        isHousehold,
        paymentPlan,
        installmentsTotal: total,
        installmentsPaid: paid,
        amount: intensiveItem.amount,
        completionStatus: intensiveItem.completion_status,
        startedAt: intensiveItem.started_at,
        completedAt: intensiveItem.completed_at,
        purchasedAt: intensiveItem.created_at,
        installments,
      },
    })
  } catch (error) {
    console.error('Intensive billing API error:', error)
    return NextResponse.json({ error: 'Failed to fetch intensive data' }, { status: 500 })
  }
}
