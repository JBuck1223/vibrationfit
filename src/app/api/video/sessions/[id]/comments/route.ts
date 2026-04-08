import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/video/sessions/[id]/comments
 * Get all comments for a session (threaded structure)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: comments, error } = await adminClient
      .from('session_comments')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching session comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    const userIds = [...new Set((comments || []).map(c => c.user_id))]
    let usersMap: Record<string, { id: string; full_name: string | null; profile_picture_url: string | null; role: string | null }> = {}

    if (userIds.length > 0) {
      const { data: users } = await adminClient
        .from('user_accounts')
        .select('id, full_name, profile_picture_url, role')
        .in('id', userIds)

      if (users) {
        usersMap = users.reduce((acc, u) => {
          acc[u.id] = u
          return acc
        }, {} as typeof usersMap)
      }
    }

    const commentsWithUsers = (comments || []).map(comment => ({
      ...comment,
      user: usersMap[comment.user_id] || null,
    }))

    const commentIds = commentsWithUsers.map(c => c.id)
    let userHearts: string[] = []

    if (commentIds.length > 0) {
      const { data: hearts } = await adminClient
        .from('session_comment_hearts')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds)

      userHearts = (hearts || []).map(h => h.comment_id).filter(Boolean) as string[]
    }

    const commentsWithHeartStatus = commentsWithUsers.map(comment => ({
      ...comment,
      has_hearted: userHearts.includes(comment.id),
      replies: [] as any[],
    }))

    // Build threaded structure
    const commentMap = new Map<string, any>()
    const topLevelComments: any[] = []

    for (const comment of commentsWithHeartStatus) {
      commentMap.set(comment.id, comment)
    }

    for (const comment of commentsWithHeartStatus) {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          if (!parent.replies) parent.replies = []
          parent.replies.push(comment)
        }
      } else {
        topLevelComments.push(comment)
      }
    }

    return NextResponse.json({ comments: topLevelComments })
  } catch (error: any) {
    console.error('SESSION COMMENTS GET ERROR:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch comments' }, { status: 500 })
  }
}

/**
 * POST /api/video/sessions/[id]/comments
 * Add a comment to a session (or reply to another comment)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, parent_comment_id } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('session_comments')
        .select('id')
        .eq('id', parent_comment_id)
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    const { data: newComment, error: insertError } = await supabase
      .from('session_comments')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating session comment:', insertError)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    const adminClient = createAdminClient()
    const { data: userData } = await adminClient
      .from('user_accounts')
      .select('id, full_name, profile_picture_url, role')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      comment: {
        ...newComment,
        user: userData || null,
        has_hearted: false,
        replies: [],
      },
    })
  } catch (error: any) {
    console.error('SESSION COMMENTS POST ERROR:', error)
    return NextResponse.json({ error: error.message || 'Failed to create comment' }, { status: 500 })
  }
}
