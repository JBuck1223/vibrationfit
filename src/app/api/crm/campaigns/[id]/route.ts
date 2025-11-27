// /src/app/api/crm/campaigns/[id]/route.ts

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'
// Individual campaign operations

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/crm/campaigns/[id] - Get campaign details
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

    // Get campaign
    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('❌ Error fetching campaign:', error)
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get related leads
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', params.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      campaign,
      leads: leads || [],
      leadCount: leads?.length || 0,
      conversionCount: leads?.filter((l) => l.status === 'converted').length || 0,
    })
  } catch (error: any) {
    console.error('❌ Error in get campaign API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/crm/campaigns/[id] - Update campaign
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

    // Update campaign
    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating campaign:', error)
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (error: any) {
    console.error('❌ Error in update campaign API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/crm/campaigns/[id] - Delete campaign
export async function DELETE(
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

    // Archive instead of delete (safer)
    const { error } = await supabase
      .from('marketing_campaigns')
      .update({ status: 'archived' })
      .eq('id', params.id)

    if (error) {
      console.error('❌ Error archiving campaign:', error)
      return NextResponse.json({ error: 'Failed to archive campaign' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Error in delete campaign API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

