import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VibeComment } from '@/lib/vibe-tribe/types'

/**
 * GET /api/vibe-tribe/posts/[id]/comments
 * Get all comments for a post (threaded structure)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch ALL comments for the post (including replies)
    const { data: comments, error } = await supabase
      .from('vibe_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Fetch user data for all comments (using admin client to bypass RLS)
    const userIds = [...new Set((comments || []).map(c => c.user_id))]
    let usersMap: Record<string, { id: string; full_name: string | null; profile_picture_url: string | null }> = {}
    
    if (userIds.length > 0) {
      const adminClient = createAdminClient()
      const { data: users } = await adminClient
        .from('user_accounts')
        .select('id, full_name, profile_picture_url')
        .in('id', userIds)
      
      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as typeof usersMap)
      }
    }

    // Attach user data to comments
    const commentsWithUsers = (comments || []).map(comment => ({
      ...comment,
      user: usersMap[comment.user_id] || null,
    }))

    // Check which comments the user has hearted
    const commentIds = commentsWithUsers.map(c => c.id)
    let userHearts: string[] = []
    
    if (commentIds.length > 0) {
      const { data: hearts } = await supabase
        .from('vibe_hearts')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds)
      
      userHearts = (hearts || []).map(h => h.comment_id).filter(Boolean) as string[]
    }

    // Add has_hearted flag to each comment
    const commentsWithHeartStatus = commentsWithUsers.map(comment => ({
      ...comment,
      has_hearted: userHearts.includes(comment.id),
      replies: [] as VibeComment[],
    }))

    // Build threaded structure: separate top-level comments from replies
    const commentMap = new Map<string, VibeComment>()
    const topLevelComments: VibeComment[] = []

    // First pass: index all comments by ID
    for (const comment of commentsWithHeartStatus) {
      commentMap.set(comment.id, comment)
    }

    // Second pass: attach replies to their parents
    for (const comment of commentsWithHeartStatus) {
      if (comment.parent_comment_id) {
        // This is a reply - attach to parent
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          if (!parent.replies) parent.replies = []
          parent.replies.push(comment)
        }
      } else {
        // Top-level comment
        topLevelComments.push(comment)
      }
    }

    return NextResponse.json({
      comments: topLevelComments,
    })

  } catch (error: any) {
    console.error('VIBE TRIBE COMMENTS GET ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vibe-tribe/posts/[id]/comments
 * Add a comment to a post (or reply to another comment)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, parent_comment_id } = body

    // Validation
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('vibe_posts')
      .select('id')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If replying to a comment, verify the parent comment exists
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('vibe_comments')
        .select('id')
        .eq('id', parent_comment_id)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Create comment (or reply)
    const { data: newComment, error: insertError } = await supabase
      .from('vibe_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating comment:', insertError)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    // Fetch user data for the comment (using admin client to bypass RLS)
    const adminClient = createAdminClient()
    const { data: userData } = await adminClient
      .from('user_accounts')
      .select('id, full_name, profile_picture_url')
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
    console.error('VIBE TRIBE COMMENTS POST ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    )
  }
}
