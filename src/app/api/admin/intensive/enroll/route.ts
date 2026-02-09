import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/middleware/admin'

export async function POST(request: NextRequest) {
  try {
    // Auth check with regular client
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Admin check
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, paymentPlan = 'full' } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Use service role client for database operations (bypasses RLS)
    const adminDb = createAdminClient()

    const { data: intensiveProduct, error: productError } = await adminDb
      .from('products')
      .select('id')
      .eq('key', 'intensive')
      .maybeSingle()

    if (productError || !intensiveProduct) {
      console.error('Error finding intensive product:', productError)
      return NextResponse.json({ error: 'Intensive product not found' }, { status: 500 })
    }

    const { data: order, error: orderError } = await adminDb
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: 0,
        currency: 'usd',
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: { source: 'admin_enroll', enrolled_by: user.id },
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const { data: intensive, error: intensiveError } = await adminDb
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: intensiveProduct.id,
        price_id: null,
        quantity: 1,
        amount: 0,
        currency: 'usd',
        is_subscription: false,
        stripe_payment_intent_id: `manual_enrollment_${Date.now()}`,
        payment_plan: paymentPlan,
        installments_total: paymentPlan === 'full' ? 1 : paymentPlan === '2pay' ? 2 : 3,
        installments_paid: 1,
        completion_status: 'pending',
        activation_deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (intensiveError) {
      console.error('Error creating intensive order item:', intensiveError)
      return NextResponse.json({ error: 'Failed to create intensive order item' }, { status: 500 })
    }

    // Create checklist
    const { error: checklistError } = await adminDb
      .from('intensive_checklist')
      .insert({
        intensive_id: intensive.id,
        user_id: userId
      })

    if (checklistError) {
      console.error('Error creating checklist:', checklistError)
      return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      intensiveId: intensive.id,
      message: 'User enrolled in intensive successfully'
    })

  } catch (error) {
    console.error('Error in enroll route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
