// /src/app/api/crm/customers/[id]/route.ts
// Individual customer operations

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', params.id)
      .single()

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get activity metrics
    const { data: activityMetrics } = await supabase
      .from('user_activity_metrics')
      .select('*')
      .eq('user_id', params.id)
      .single()

    // Get revenue metrics
    const { data: revenueMetrics } = await supabase
      .from('user_revenue_metrics')
      .select('*')
      .eq('user_id', params.id)
      .single()

    // Get SMS messages
    const { data: messages } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('user_id', params.id)
      .order('created_at', { ascending: true })

    // Get support tickets
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })

    // Get related lead (if converted from lead)
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('converted_to_user_id', params.id)
      .single()

    return NextResponse.json({
      customer: {
        ...profile,
        activity_metrics: activityMetrics || {},
        revenue_metrics: revenueMetrics || {},
      },
      messages: messages || [],
      tickets: tickets || [],
      lead: lead || null,
    })
  } catch (error: any) {
    console.error('❌ Error in get customer API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Update activity metrics (manual status/tags/notes)
    const { data: metrics, error } = await supabase
      .from('user_activity_metrics')
      .upsert({
        user_id: params.id,
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating customer:', error)
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }

    return NextResponse.json({ metrics })
  } catch (error: any) {
    console.error('❌ Error in update customer API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

