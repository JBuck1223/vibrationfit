import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Create admin client that bypasses RLS
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify super_admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminAccount } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminAccount?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()
    const now = new Date().toISOString()

    // Delete related data in order (to avoid foreign key issues)
    
    // 1. Delete journal entries
    await adminClient
      .from('journal_entries')
      .delete()
      .eq('user_id', userId)

    // 2. Delete vision board items
    await adminClient
      .from('vision_board_items')
      .delete()
      .eq('user_id', userId)

    // 3. Delete audio tracks (need to get vision first)
    await adminClient
      .from('audio_tracks')
      .delete()
      .eq('user_id', userId)

    // 4. Delete audio sets
    await adminClient
      .from('audio_sets')
      .delete()
      .eq('user_id', userId)

    // 5. Delete visions
    await adminClient
      .from('vision_versions')
      .delete()
      .eq('user_id', userId)

    // 6. Delete assessment responses (need assessment first)
    const { data: assessments } = await adminClient
      .from('assessment_results')
      .select('id')
      .eq('user_id', userId)

    if (assessments && assessments.length > 0) {
      const assessmentIds = assessments.map(a => a.id)
      await adminClient
        .from('assessment_responses')
        .delete()
        .in('assessment_id', assessmentIds)
      
      await adminClient
        .from('assessment_insights')
        .delete()
        .in('assessment_id', assessmentIds)
    }

    // 7. Delete assessment results
    await adminClient
      .from('assessment_results')
      .delete()
      .eq('user_id', userId)

    // 8. Delete user profiles
    await adminClient
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    // 9. Delete intensive responses
    await adminClient
      .from('intensive_responses')
      .delete()
      .eq('user_id', userId)

    // 10. Get existing intensive info before deleting
    const { data: existingChecklist } = await adminClient
      .from('intensive_checklist')
      .select('intensive_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 11. Delete intensive checklist
    await adminClient
      .from('intensive_checklist')
      .delete()
      .eq('user_id', userId)

    // 12. Delete orders (cascades to order_items)
    await adminClient
      .from('orders')
      .delete()
      .eq('user_id', userId)

    // 13. Reset user_accounts to minimal state (keep user but clear settings)
    await adminClient
      .from('user_accounts')
      .update({
        first_name: null,
        last_name: null,
        phone: null,
        updated_at: now
      })
      .eq('id', userId)

    // 14. Create fresh order and intensive order item
    const { data: intensiveProduct, error: productError } = await adminClient
      .from('products')
      .select('id')
      .eq('key', 'intensive')
      .maybeSingle()

    if (productError || !intensiveProduct) {
      return NextResponse.json({
        error: 'Intensive product not found'
      }, { status: 500 })
    }

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: 49900,
        currency: 'usd',
        status: 'paid',
        paid_at: now,
        metadata: { source: 'admin_reset' },
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({
        error: 'Failed to create order for intensive reset'
      }, { status: 500 })
    }

    const { data: newPurchase, error: purchaseError } = await adminClient
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: intensiveProduct.id,
        price_id: null,
        quantity: 1,
        amount: 49900,
        currency: 'usd',
        is_subscription: false,
        stripe_payment_intent_id: `reset_${Date.now()}`,
        payment_plan: 'full',
        installments_total: 1,
        installments_paid: 1,
        completion_status: 'pending',
        created_at: now,
      })
      .select()
      .single()

    if (purchaseError || !newPurchase) {
      console.error('Error creating new intensive order item:', purchaseError)
      return NextResponse.json({
        error: 'Failed to create new intensive order item'
      }, { status: 500 })
    }

    // 15. Create fresh intensive checklist
    const { error: checklistError } = await adminClient
      .from('intensive_checklist')
      .insert({
        intensive_id: newPurchase.id,
        user_id: userId,
        status: 'pending',
        created_at: now,
        updated_at: now
      })

    if (checklistError) {
      console.error('Error creating new intensive checklist:', checklistError)
      return NextResponse.json({ 
        error: 'Failed to create new intensive checklist' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User reset to fresh intensive state',
      userId,
      newIntensiveId: newPurchase.id
    })

  } catch (error) {
    console.error('Error resetting user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
