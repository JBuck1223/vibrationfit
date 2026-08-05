import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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
    const { url, title, task_id } = body

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const normalizedUrl = /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`

    const { data, error } = await supabase
      .from('project_reference_links')
      .insert({
        project_id: id,
        task_id: task_id || null,
        created_by: user.id,
        url: normalizedUrl,
        title: title?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Member link creation error:', error)
      return NextResponse.json({ error: 'Failed to add link' }, { status: 500 })
    }

    return NextResponse.json({ link: data }, { status: 201 })
  } catch (error) {
    console.error('Error in member links POST:', error)
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
    const { link_id, url, title } = body

    if (!link_id) {
      return NextResponse.json({ error: 'link_id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (url !== undefined) {
      if (!url?.trim()) {
        return NextResponse.json({ error: 'URL cannot be empty' }, { status: 400 })
      }
      updates.url = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
    }
    if (title !== undefined) updates.title = title?.trim() || null

    const { data, error } = await supabase
      .from('project_reference_links')
      .update(updates)
      .eq('id', link_id)
      .eq('project_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
    }

    return NextResponse.json({ link: data })
  } catch (error) {
    console.error('Error in member links PATCH:', error)
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
      .from('project_reference_links')
      .delete()
      .eq('id', linkId)
      .eq('project_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in member links DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
