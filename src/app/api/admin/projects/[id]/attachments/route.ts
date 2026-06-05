import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('idea_attachments')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
    }

    return NextResponse.json({ attachments: data || [] })
  } catch (error) {
    console.error('Error in attachments GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const body = await request.json()
    const { file_name, file_url, file_type, file_size } = body

    if (!file_name || !file_url) {
      return NextResponse.json({ error: 'file_name and file_url are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('idea_attachments')
      .insert({
        project_id: id,
        file_name,
        file_url,
        file_type: file_type || null,
        file_size: file_size || null,
        uploaded_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create attachment' }, { status: 500 })
    }

    return NextResponse.json({ attachment: data }, { status: 201 })
  } catch (error) {
    console.error('Error in attachments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    await params
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachment_id')

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachment_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('idea_attachments')
      .delete()
      .eq('id', attachmentId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in attachments DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
