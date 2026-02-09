// /src/app/api/crm/campaigns/[id]/route.ts
// Individual campaign operations

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'

// Allowed fields for campaign updates
const CAMPAIGN_UPDATABLE_FIELDS = [
  'name', 'slug', 'status', 'campaign_type', 'objective', 'target_audience',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'start_date', 'end_date', 'budget', 'cost_per_lead_target',
  'creative_urls', 'landing_page_url', 'tracking_url',
  'total_clicks', 'total_spent',
] as const

function pickAllowedFields(body: Record<string, unknown>, allowedFields: readonly string[]) {
  const result: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      result[key] = body[key]
    }
  }
  return result
}

// GET /api/crm/campaigns/[id] - Get campaign details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Get campaign
    const { data: campaign, error } = await adminClient
      .from('marketing_campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching campaign:', error)
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get related leads
    const { data: leads } = await adminClient
      .from('leads')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      campaign,
      leads: leads || [],
      leadCount: leads?.length || 0,
      conversionCount: leads?.filter((l) => l.status === 'converted').length || 0,
    })
  } catch (error: unknown) {
    console.error('Error in get campaign API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/crm/campaigns/[id] - Update campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const body = await request.json()
    const updateData = pickAllowedFields(body, CAMPAIGN_UPDATABLE_FIELDS)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update campaign
    const { data: campaign, error } = await adminClient
      .from('marketing_campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (error: unknown) {
    console.error('Error in update campaign API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/crm/campaigns/[id] - Archive campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Archive instead of delete (safer)
    const { error } = await adminClient
      .from('marketing_campaigns')
      .update({ status: 'archived' })
      .eq('id', id)

    if (error) {
      console.error('Error archiving campaign:', error)
      return NextResponse.json({ error: 'Failed to archive campaign' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error in delete campaign API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
