import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface AttachmentInput {
  file_url?: string
  file_name?: string
  file_type?: string | null
  file_size?: number | null
}

async function assertAccess(supabase: SupabaseClient, tripId: string) {
  const { data } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .single()
  return !!data
}

// POST /api/travel/trips/[id]/attachments - persist uploaded media rows
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
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const body = await request.json()
    // Accepts a single attachment or a batch under `files`
    const items: AttachmentInput[] = Array.isArray(body.files) ? body.files : [body]

    const rows = items
      .filter((a) => a?.file_url && a?.file_name)
      .map((a) => ({
        trip_id: id,
        file_name: a.file_name,
        file_url: a.file_url,
        file_type: a.file_type || null,
        file_size: a.file_size || null,
        uploaded_by: user.id,
      }))

    if (rows.length === 0) {
      return NextResponse.json({ error: 'file_name and file_url are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('travel_attachments')
      .insert(rows)
      .select()

    if (error) {
      console.error('Trip attachment creation error:', error)
      return NextResponse.json({ error: 'Failed to save attachments' }, { status: 500 })
    }

    return NextResponse.json({ attachments: data }, { status: 201 })
  } catch (error) {
    console.error('Error in trip attachments POST:', error)
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
    const attachmentId = searchParams.get('attachment_id')

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachment_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('travel_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('trip_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in trip attachments DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
