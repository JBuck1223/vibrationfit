import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
      // Get user's post IDs first
      const { data: userPosts } = await supabase
        .from('vibe_posts')
        .select('id, content, vibe_tag')
        .eq('user_id', user.id)
        .eq('is_deleted', false)

      const userPostIds = (userPosts || []).map(p => p.id)
      const userPostsMap = (userPosts || []).reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as Record<string, any>)

      if (userPostIds.length > 0) {
        const { data: postHearts } = await supabase
          .from('vibe_hearts')
          .select('id, created_at, post_id, user_id')
          .in('post_id', userPostIds)
          .order('created_at', { ascending: false })
          .limit(limit)

        // Fetch user names for hearts (using admin client to bypass RLS)
        const heartUserIds = [...new Set((postHearts || []).map(h => h.user_id))]
        let heartUsersMap: Record<string, string> = {}
        if (heartUserIds.length > 0) {
          const adminClient = createAdminClient()
          const { data: heartUsers } = await adminClient
            .from('user_accounts')
            .select('id, full_name')
            .in('id', heartUserIds)
          if (heartUsers) {
            heartUsersMap = heartUsers.reduce((acc, u) => {
              acc[u.id] = u.full_name || 'Someone'
              return acc
            }, {} as Record<string, string>)
          }
        }

        postHearts?.forEach(heart => {
          const post = userPostsMap[heart.post_id]
          if (post) {
            activities.push({
              id: `heart-post-${heart.id}`,
              type: 'heart_received',
              title: `${heartUsersMap[heart.user_id] || 'Someone'} hearted your post`,
              description: post.content?.substring(0, 100) || 'Your post',
              timestamp: heart.created_at,
              post_id: post.id,
              vibe_tag: post.vibe_tag,
            })
          }
        })
      }

      // Get hearts received on user's comments
      const { data: userComments } = await supabase
        .from('vibe_comments')
        .select('id, content, post_id')
        .eq('user_id', user.id)
        .eq('is_deleted', false)

      const userCommentIds = (userComments || []).map(c => c.id)
      const userCommentsMap = (userComments || []).reduce((acc, c) => {
        acc[c.id] = c
        return acc
      }, {} as Record<string, any>)

      if (userCommentIds.length > 0) {
        const { data: commentHearts } = await supabase
          .from('vibe_hearts')
          .select('id, created_at, comment_id, user_id')
          .in('comment_id', userCommentIds)
          .order('created_at', { ascending: false })
          .limit(limit)

        // Fetch user names for comment hearts (using admin client to bypass RLS)
        const commentHeartUserIds = [...new Set((commentHearts || []).map(h => h.user_id))]
        let commentHeartUsersMap: Record<string, string> = {}
        if (commentHeartUserIds.length > 0) {
          const adminClient2 = createAdminClient()
          const { data: commentHeartUsers } = await adminClient2
            .from('user_accounts')
            .select('id, full_name')
            .in('id', commentHeartUserIds)
          if (commentHeartUsers) {
            commentHeartUsersMap = commentHeartUsers.reduce((acc, u) => {
              acc[u.id] = u.full_name || 'Someone'
              return acc
            }, {} as Record<string, string>)
          }
        }

        commentHearts?.forEach(heart => {
          const comment = userCommentsMap[heart.comment_id]
          if (comment) {
            activities.push({
              id: `heart-comment-${heart.id}`,
              type: 'heart_received',
              title: `${commentHeartUsersMap[heart.user_id] || 'Someone'} hearted your comment`,
              description: comment.content?.substring(0, 100) || 'Your comment',
              timestamp: heart.created_at,
              post_id: comment.post_id,
              comment_id: comment.id,
            })
          }
        })
      }
    }

    // Get comments on user's posts
    if (filter === 'all' || filter === 'comments') {
      // Get user's post IDs first (reuse if already fetched)
      const { data: userPostsForComments } = await supabase
        .from('vibe_posts')
        .select('id, content, vibe_tag')
        .eq('user_id', user.id)
        .eq('is_deleted', false)

      const userPostIdsForComments = (userPostsForComments || []).map(p => p.id)
      const userPostsMapForComments = (userPostsForComments || []).reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as Record<string, any>)

      if (userPostIdsForComments.length > 0) {
        // Get comments on user's posts (excluding user's own comments)
        const { data: comments } = await supabase
          .from('vibe_comments')
          .select('id, content, created_at, post_id, user_id')
          .in('post_id', userPostIdsForComments)
          .neq('user_id', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(limit)

        // Fetch user names for commenters (using admin client to bypass RLS)
        const commenterIds = [...new Set((comments || []).map(c => c.user_id))]
        let commentersMap: Record<string, string> = {}
        if (commenterIds.length > 0) {
          const adminClient3 = createAdminClient()
          const { data: commenters } = await adminClient3
            .from('user_accounts')
            .select('id, full_name')
            .in('id', commenterIds)
          if (commenters) {
            commentersMap = commenters.reduce((acc, u) => {
              acc[u.id] = u.full_name || 'Someone'
              return acc
            }, {} as Record<string, string>)
          }
        }

        comments?.forEach(comment => {
          const post = userPostsMapForComments[comment.post_id]
          if (post) {
            activities.push({
              id: `comment-${comment.id}`,
              type: 'comment',
              title: `${commentersMap[comment.user_id] || 'Someone'} commented on your post`,
              description: comment.content?.substring(0, 100) || '',
              timestamp: comment.created_at,
              post_id: post.id,
              comment_id: comment.id,
              vibe_tag: post.vibe_tag,
            })
          }
        })
      }
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
