// /src/app/api/crm/leads/route.ts
// Admin lead management API

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = createAdminClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const campaignId = searchParams.get('campaign_id')
    const search = searchParams.get('search')

    let query = adminClient
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      )
    }

    const { data: leads, error } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    return NextResponse.json({ leads })
  } catch (error: unknown) {
    console.error('Error in leads API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: lead, error } = await adminClient
      .from('leads')
      .insert({
        type: body.type || 'contact',
        status: body.status || 'new',
        first_name: body.first_name || null,
        last_name: body.last_name || null,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        message: body.message || null,
        source: body.source || 'admin_manual',
        notes: body.notes || null,
        metadata: body.metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
