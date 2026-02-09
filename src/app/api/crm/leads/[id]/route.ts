// /src/app/api/crm/leads/[id]/route.ts
// Individual lead operations

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'

// Allowed fields for lead updates
const LEAD_UPDATABLE_FIELDS = [
  'status', 'first_name', 'last_name', 'email', 'phone', 'company', 'message',
  'source', 'metadata', 'notes', 'assigned_to', 'converted_to_user_id',
  'conversion_value', 'sms_opt_in', 'sms_consent_date', 'sms_opt_out_date',
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

    // Get lead
    const { data: lead, error } = await adminClient
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching lead:', error)
      const status = error.code === 'PGRST116' ? 404 : 500
      const message = error.code === 'PGRST116' ? 'Lead not found' : 'Failed to fetch lead'
      return NextResponse.json({ error: message }, { status })
    }

    // Get campaign if associated
    let campaign = null
    if (lead.campaign_id) {
      const { data: campaignData } = await adminClient
        .from('marketing_campaigns')
        .select('id, name, slug, utm_campaign')
        .eq('id', lead.campaign_id)
        .single()

      campaign = campaignData
    }

    // Get SMS messages
    const { data: messages } = await adminClient
      .from('sms_messages')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      lead,
      campaign,
      messages: messages || [],
    })
  } catch (error: unknown) {
    console.error('Error in get lead API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const body = await request.json()
    const updateData = pickAllowedFields(body, LEAD_UPDATABLE_FIELDS)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Update lead
    const { data: lead, error } = await adminClient
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    return NextResponse.json({ lead })
  } catch (error: unknown) {
    console.error('Error in update lead API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
