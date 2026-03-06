import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const householdId = request.nextUrl.searchParams.get('householdId')
    if (!householdId) {
      return NextResponse.json({ error: 'householdId required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: membership } = await serviceClient
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId)
      .eq('status', 'active')

    if (!membership || membership.length === 0) {
      return NextResponse.json({ intensives: [] })
    }

    const memberIds = membership.map(m => m.user_id)

    const isAdminOfHousehold = memberIds.includes(user.id)
    if (!isAdminOfHousehold) {
      return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })
    }

    const { data: adminMembership } = await serviceClient
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const { data: checklists } = await serviceClient
      .from('intensive_checklist')
      .select('id, user_id, status, created_at, intensive_id')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })

    if (!checklists || checklists.length === 0) {
      return NextResponse.json({ intensives: [] })
    }

    const orderItemIds = [...new Set(checklists.map(c => c.intensive_id))]
    const { data: orderItems } = await serviceClient
      .from('order_items')
      .select('id, order_id, orders!inner(user_id)')
      .in('id', orderItemIds)

    const intensives = checklists.map(checklist => {
      const orderItem = orderItems?.find(oi => oi.id === checklist.intensive_id)
      const purchaserId = (orderItem as any)?.orders?.user_id
      return {
        userId: checklist.user_id,
        status: checklist.status || 'pending',
        purchasedByAdmin: purchaserId !== checklist.user_id,
        checklistId: checklist.id,
      }
    })

    return NextResponse.json({
      intensives,
      isAdmin: adminMembership?.role === 'admin',
    })
  } catch (error) {
    console.error('Error in GET /api/household/intensives:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
