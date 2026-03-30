/**
 * Admin Notification Configs API
 *
 * GET  - List all notification configs (with segment name)
 * PUT  - Update a single config (by id in body)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()

    const { data: configs, error: configsError } = await supabase
      .from('notification_configs')
      .select('*')
      .order('category')
      .order('name')

    if (configsError) {
      return NextResponse.json({ error: configsError.message }, { status: 500 })
    }

    // Fetch segment names for configs that have segment_id
    const segmentIds = (configs || [])
      .map(c => c.segment_id)
      .filter(Boolean) as string[]

    let segmentMap: Record<string, string> = {}
    if (segmentIds.length > 0) {
      const { data: segments } = await supabase
        .from('blast_segments')
        .select('id, name')
        .in('id', [...new Set(segmentIds)])

      if (segments) {
        segmentMap = Object.fromEntries(segments.map(s => [s.id, s.name]))
      }
    }

    const enriched = (configs || []).map(c => ({
      ...c,
      segment_name: c.segment_id ? (segmentMap[c.segment_id] || null) : null,
    }))

    return NextResponse.json({ configs: enriched })
  } catch (err) {
    console.error('Error in GET notification-configs:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const allowed = [
      'name', 'description',
      'email_enabled', 'sms_enabled', 'admin_sms_enabled',
      'email_template_slug', 'sms_template_slug', 'admin_sms_template_slug',
      'segment_id',
    ]

    const sanitized: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in updates) sanitized[key] = updates[key]
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('notification_configs')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ config: data })
  } catch (err) {
    console.error('Error in PUT notification-configs:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
