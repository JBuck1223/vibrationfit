import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// PATCH /api/life-explorer/activity-log/[id]
// Updates entry fields. If body.media is provided it replaces all media rows.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.entry_date !== undefined) updates.entry_date = body.entry_date
  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description || null
  if (body.duration_minutes !== undefined) updates.duration_minutes = body.duration_minutes
  if (body.reading_materials !== undefined) updates.reading_materials = body.reading_materials
  if (body.subjects !== undefined) updates.subjects = body.subjects
  if (body.expedition_id !== undefined) updates.expedition_id = body.expedition_id || null

  const { data: entry, error } = await supabase
    .from('le_activity_logs')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (Array.isArray(body.media)) {
    const { error: deleteError } = await supabase
      .from('le_activity_media')
      .delete()
      .eq('activity_log_id', id)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    if (body.media.length > 0) {
      const { error: insertError } = await supabase.from('le_activity_media').insert(
        body.media.map((m: { media_type?: string; url: string; caption?: string }) => ({
          activity_log_id: id,
          student_id: entry.student_id,
          created_by: user.id,
          household_id: entry.household_id,
          media_type: m.media_type || 'photo',
          url: m.url,
          caption: m.caption || null,
        }))
      )
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }
  }

  const { data: media } = await supabase
    .from('le_activity_media')
    .select('*')
    .eq('activity_log_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ entry: { ...entry, media: media || [] } })
}

// DELETE /api/life-explorer/activity-log/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('le_activity_logs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
