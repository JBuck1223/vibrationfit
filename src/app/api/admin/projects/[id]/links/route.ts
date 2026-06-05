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

    const { data: linksOut } = await supabase
      .from('idea_project_links')
      .select('*, target:target_project_id(id, title, status, priority)')
      .eq('source_project_id', id)

    const { data: linksIn } = await supabase
      .from('idea_project_links')
      .select('*, source:source_project_id(id, title, status, priority)')
      .eq('target_project_id', id)

    return NextResponse.json({
      links_out: linksOut || [],
      links_in: linksIn || [],
    })
  } catch (error) {
    console.error('Error in links GET:', error)
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
    const { target_project_id, link_type } = body

    if (!target_project_id) {
      return NextResponse.json({ error: 'target_project_id is required' }, { status: 400 })
    }

    if (target_project_id === id) {
      return NextResponse.json({ error: 'Cannot link a project to itself' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('idea_project_links')
      .insert({
        source_project_id: id,
        target_project_id,
        link_type: link_type || 'related',
      })
      .select('*, target:target_project_id(id, title, status, priority)')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Link already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
    }

    return NextResponse.json({ link: data }, { status: 201 })
  } catch (error) {
    console.error('Error in links POST:', error)
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
    const linkId = searchParams.get('link_id')

    if (!linkId) {
      return NextResponse.json({ error: 'link_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('idea_project_links')
      .delete()
      .eq('id', linkId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in links DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
