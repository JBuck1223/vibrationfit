import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (you can add your own admin check here)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // For now, allow any authenticated user (you can restrict this)
    // TODO: Add proper admin check (e.g., check user role in database)

    const { userId, paymentPlan = 'full' } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Create intensive purchase
    const { data: intensive, error: intensiveError } = await supabase
      .from('intensive_purchases')
      .insert({
        user_id: userId,
        payment_plan: paymentPlan,
        installments_total: paymentPlan === 'full' ? 1 : paymentPlan === '2pay' ? 2 : 3,
        installments_paid: 1,
        completion_status: 'pending',
        activation_deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours from now
        stripe_payment_intent_id: `manual_enrollment_${Date.now()}`,
        continuity_plan: 'annual'
      })
      .select()
      .single()

    if (intensiveError) {
      console.error('Error creating intensive purchase:', intensiveError)
      return NextResponse.json({ error: 'Failed to create intensive purchase' }, { status: 500 })
    }

    // Create checklist
    const { error: checklistError } = await supabase
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
