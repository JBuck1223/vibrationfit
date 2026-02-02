import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/vibe-tribe/posts/[id]/comments
 * Get all comments for a post
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

    // Fetch comments for the post
    const { data: comments, error } = await supabase
      .from('vibe_comments')
      .select(`
        *,
        user:user_accounts!vibe_comments_user_id_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Check which comments the user has hearted
    const commentIds = (comments || []).map(c => c.id)
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
    const commentsWithHeartStatus = (comments || []).map(comment => ({
      ...comment,
      has_hearted: userHearts.includes(comment.id),
    }))

    return NextResponse.json({
      comments: commentsWithHeartStatus,
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
 * Add a comment to a post
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
    const { content } = body

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

    // Create comment
    const { data: newComment, error: insertError } = await supabase
      .from('vibe_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        *,
        user:user_accounts!vibe_comments_user_id_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating comment:', insertError)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...newComment,
        has_hearted: false,
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
