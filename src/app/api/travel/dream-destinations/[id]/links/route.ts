import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function assertAccess(supabase: SupabaseClient, dreamId: string) {
  const { data } = await supabase
    .from('dream_destinations')
    .select('id')
    .eq('id', dreamId)
    .single()
  return !!data
}

// POST /api/travel/dream-destinations/[id]/links - add an external bookmark
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!(await assertAccess(supabase, id))) {
      return NextResponse.json({ error: 'Dream destination not found' }, { status: 404 })
    }

    const body = await request.json()
    const { url, title } = body

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const normalizedUrl = /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`

    const { data, error } = await supabase
      .from('travel_reference_links')
      .insert({
        dream_destination_id: id,
        created_by: user.id,
        url: normalizedUrl,
        title: title?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Dream link creation error:', error)
      return NextResponse.json({ error: 'Failed to add link' }, { status: 500 })
    }

    return NextResponse.json({ link: data }, { status: 201 })
  } catch (error) {
    console.error('Error in dream links POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('link_id')

    if (!linkId) {
      return NextResponse.json({ error: 'link_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('travel_reference_links')
      .delete()
      .eq('id', linkId)
      .eq('dream_destination_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in dream links DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
