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
      .from('idea_comments')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    const userIds = [...new Set((data || []).map(c => c.user_id).filter(Boolean))]
    let userMap = new Map<string, { full_name: string | null; email: string }>()

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user_accounts')
        .select('id, full_name, email')
        .in('id', userIds)

      userMap = new Map((users || []).map(u => [u.id, u]))
    }

    const comments = (data || []).map(c => {
      const user = c.user_id ? userMap.get(c.user_id) : null
      return {
        ...c,
        user_name: user?.full_name || null,
        user_email: user?.email || null,
      }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error in comments GET:', error)
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
    const { body: commentBody } = body

    if (!commentBody?.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('idea_comments')
      .insert({
        project_id: id,
        user_id: auth.user.id,
        body: commentBody.trim(),
        type: 'comment',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('full_name, email')
      .eq('id', auth.user.id)
      .single()

    return NextResponse.json({
      comment: {
        ...data,
        user_name: userAccount?.full_name || null,
        user_email: userAccount?.email || auth.user.email || null,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error in comments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
