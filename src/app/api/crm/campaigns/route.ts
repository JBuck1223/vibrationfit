// /src/app/api/crm/campaigns/route.ts
// Campaign management API endpoints

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'

// Allowed fields for campaign creation
const CAMPAIGN_INSERT_FIELDS = [
  'name', 'slug', 'status', 'campaign_type', 'objective', 'target_audience',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'start_date', 'end_date', 'budget', 'cost_per_lead_target',
  'creative_urls', 'landing_page_url', 'tracking_url',
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

// GET /api/crm/campaigns - List all campaigns
export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let query = adminClient
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('campaign_type', type)
    }

    const { data: campaigns, error } = await query

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({ campaigns })
  } catch (error: unknown) {
    console.error('Error in campaigns API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/crm/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }

    // Generate slug from name if not provided
    const slug =
      body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const insertData = pickAllowedFields(body, CAMPAIGN_INSERT_FIELDS)

    // Create campaign
    const { data: campaign, error } = await adminClient
      .from('marketing_campaigns')
      .insert({
        ...insertData,
        slug,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)

      if (error.code === '23505') {
        return NextResponse.json({ error: 'Campaign slug already exists' }, { status: 400 })
      }

      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in create campaign API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
