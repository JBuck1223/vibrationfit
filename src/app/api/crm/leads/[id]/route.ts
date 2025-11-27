// /src/app/api/crm/leads/[id]/route.ts

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'
// Individual lead operations

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

    // Use admin client for database queries (bypasses RLS)
    const adminClient = createAdminClient()
    }

    // Get lead
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('❌ Error fetching lead:', error)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get campaign if associated
    let campaign = null
    if (lead.campaign_id) {
      const { data: campaignData } = await supabase
        .from('marketing_campaigns')
        .select('id, name, slug, utm_campaign')
        .eq('id', lead.campaign_id)
        .single()

      campaign = campaignData
    }

    // Get SMS messages
    const { data: messages } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('lead_id', params.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      lead,
      campaign,
      messages: messages || [],
    })
  } catch (error: any) {
    console.error('❌ Error in get lead API:', error)
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

    // Update lead
    const { data: lead, error } = await supabase
      .from('leads')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating lead:', error)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    return NextResponse.json({ lead })
  } catch (error: any) {
    console.error('❌ Error in update lead API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

