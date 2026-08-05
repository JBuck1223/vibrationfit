import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Confirm the current member can collaborate on the project: RLS returns the
// row for the owner and for household members it is shared with.
async function assertAccess(supabase: any, projectId: string) {
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()
  return !!data
}

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
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const { body: noteBody, task_id, note_date, attachments } = body

    if (!noteBody?.trim() && !(Array.isArray(attachments) && attachments.length > 0)) {
      return NextResponse.json({ error: 'Note text or attachments required' }, { status: 400 })
    }

    const insertPayload: Record<string, unknown> = {
      project_id: id,
      created_by: user.id,
      body: (noteBody || '').trim(),
    }
    if (task_id) insertPayload.task_id = task_id
    if (note_date) insertPayload.note_date = note_date

    const { data: note, error } = await supabase
      .from('project_notes')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('Member note creation error:', error)
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }

    // Media uploaded as part of the note (already on S3; persist the refs)
    if (Array.isArray(attachments) && attachments.length > 0) {
      const rows = attachments
        .filter((a: any) => a?.file_url && a?.file_name)
        .map((a: any) => ({
          project_id: id,
          task_id: task_id || null,
          note_id: note.id,
          file_name: a.file_name,
          file_url: a.file_url,
          file_type: a.file_type || null,
          file_size: a.file_size || null,
          uploaded_by: user.id,
        }))
      if (rows.length > 0) {
        const { error: attachError } = await supabase
          .from('project_attachments')
          .insert(rows)
        if (attachError) {
          console.error('Note attachment insert error:', attachError)
        }
      }
    }

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Error in member notes POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
    const body = await request.json()
    const { note_id, body: noteBody, note_date } = body

    if (!note_id) {
      return NextResponse.json({ error: 'note_id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (noteBody !== undefined) {
      if (!noteBody?.trim()) {
        return NextResponse.json({ error: 'Note text cannot be empty' }, { status: 400 })
      }
      updates.body = noteBody.trim()
    }
    if (note_date !== undefined) updates.note_date = note_date

    const { data, error } = await supabase
      .from('project_notes')
      .update(updates)
      .eq('id', note_id)
      .eq('project_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
    }

    return NextResponse.json({ note: data })
  } catch (error) {
    console.error('Error in member notes PATCH:', error)
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
    const noteId = searchParams.get('note_id')

    if (!noteId) {
      return NextResponse.json({ error: 'note_id is required' }, { status: 400 })
    }

    // Attached media rows cascade with the note (note_id FK ON DELETE CASCADE)
    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', noteId)
      .eq('project_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in member notes DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
