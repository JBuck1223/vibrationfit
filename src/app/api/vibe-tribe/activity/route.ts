import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActivityItem } from '@/lib/vibe-tribe/types'

/**
 * GET /api/vibe-tribe/activity
 * Get personal activity feed for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // all, posts, hearts_received, comments
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const activities: ActivityItem[] = []

    // Get user's posts
    if (filter === 'all' || filter === 'posts') {
      const { data: posts } = await supabase
        .from('vibe_posts')
        .select('id, content, vibe_tag, created_at, hearts_count, comments_count')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      posts?.forEach(post => {
        activities.push({
          id: `post-${post.id}`,
          type: 'post',
          title: 'You posted',
          description: post.content?.substring(0, 100) || 'Shared media',
          timestamp: post.created_at,
          post_id: post.id,
          vibe_tag: post.vibe_tag,
        })
      })
    }

    // Get hearts received on user's posts
    if (filter === 'all' || filter === 'hearts_received') {
      const { data: postHearts } = await supabase
        .from('vibe_hearts')
        .select(`
          id,
          created_at,
          post:vibe_posts!vibe_hearts_post_id_fkey (
            id,
            content,
            vibe_tag,
            user_id
          ),
          user:user_accounts!vibe_hearts_user_id_fkey (
            full_name
          )
        `)
        .not('post_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filter to only hearts on current user's posts
      postHearts?.forEach(heart => {
        if (heart.post && (heart.post as any).user_id === user.id && heart.user) {
          activities.push({
            id: `heart-post-${heart.id}`,
            type: 'heart_received',
            title: `${(heart.user as any).full_name || 'Someone'} hearted your post`,
            description: (heart.post as any).content?.substring(0, 100) || 'Your post',
            timestamp: heart.created_at,
            post_id: (heart.post as any).id,
            vibe_tag: (heart.post as any).vibe_tag,
          })
        }
      })

      // Get hearts received on user's comments
      const { data: commentHearts } = await supabase
        .from('vibe_hearts')
        .select(`
          id,
          created_at,
          comment:vibe_comments!vibe_hearts_comment_id_fkey (
            id,
            content,
            post_id,
            user_id
          ),
          user:user_accounts!vibe_hearts_user_id_fkey (
            full_name
          )
        `)
        .not('comment_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      commentHearts?.forEach(heart => {
        if (heart.comment && (heart.comment as any).user_id === user.id && heart.user) {
          activities.push({
            id: `heart-comment-${heart.id}`,
            type: 'heart_received',
            title: `${(heart.user as any).full_name || 'Someone'} hearted your comment`,
            description: (heart.comment as any).content?.substring(0, 100) || 'Your comment',
            timestamp: heart.created_at,
            post_id: (heart.comment as any).post_id,
            comment_id: (heart.comment as any).id,
          })
        }
      })
    }

    // Get comments on user's posts
    if (filter === 'all' || filter === 'comments') {
      const { data: comments } = await supabase
        .from('vibe_comments')
        .select(`
          id,
          content,
          created_at,
          post:vibe_posts!vibe_comments_post_id_fkey (
            id,
            content,
            vibe_tag,
            user_id
          ),
          user:user_accounts!vibe_comments_user_id_fkey (
            full_name
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      comments?.forEach(comment => {
        if (comment.post && (comment.post as any).user_id === user.id && comment.user) {
          // Only show comments from others on our posts
          if ((comment as any).user_id !== user.id) {
            activities.push({
              id: `comment-${comment.id}`,
              type: 'comment',
              title: `${(comment.user as any).full_name || 'Someone'} commented on your post`,
              description: comment.content?.substring(0, 100) || '',
              timestamp: comment.created_at,
              post_id: (comment.post as any).id,
              comment_id: comment.id,
              vibe_tag: (comment.post as any).vibe_tag,
            })
          }
        }
      })
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Limit total activities
    const limitedActivities = activities.slice(0, limit)

    return NextResponse.json({
      activities: limitedActivities,
    })

  } catch (error: any) {
    console.error('VIBE TRIBE ACTIVITY GET ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
