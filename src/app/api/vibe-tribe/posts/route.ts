import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VibeTag, VIBE_TAGS } from '@/lib/vibe-tribe/types'

/**
 * GET /api/vibe-tribe/posts
 * Fetch posts with optional tag filter, search, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag') as VibeTag | null
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Validate tag if provided
    if (tag && !VIBE_TAGS.includes(tag)) {
      return NextResponse.json({ error: 'Invalid vibe tag' }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from('vibe_posts')
      .select(`
        *,
        user:user_accounts!vibe_posts_user_id_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `, { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply tag filter if provided
    if (tag) {
      query = query.eq('vibe_tag', tag)
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      query = query.ilike('content', `%${search.trim()}%`)
    }

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching vibe posts:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    // Check which posts the current user has hearted
    const postIds = (posts || []).map(p => p.id)
    let userHearts: string[] = []
    
    if (postIds.length > 0) {
      const { data: hearts } = await supabase
        .from('vibe_hearts')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)
      
      userHearts = (hearts || []).map(h => h.post_id).filter(Boolean) as string[]
    }

    // Add has_hearted flag to each post
    const postsWithHeartStatus = (posts || []).map(post => ({
      ...post,
      has_hearted: userHearts.includes(post.id),
    }))

    return NextResponse.json({
      posts: postsWithHeartStatus,
      hasMore: (count || 0) > offset + limit,
      total: count || 0,
    })

  } catch (error: any) {
    console.error('VIBE TRIBE POSTS GET ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vibe-tribe/posts
 * Create a new post
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, media_urls = [], vibe_tag, life_categories = [] } = body

    // Validation
    if (!vibe_tag || !VIBE_TAGS.includes(vibe_tag)) {
      return NextResponse.json(
        { error: 'Valid vibe_tag is required (win, wobble, vision, collaboration)' },
        { status: 400 }
      )
    }

    // Must have either content or media
    if ((!content || content.trim() === '') && media_urls.length === 0) {
      return NextResponse.json(
        { error: 'Post must have content or media' },
        { status: 400 }
      )
    }

    // Determine media type
    let media_type: 'none' | 'image' | 'video' | 'mixed' = 'none'
    if (media_urls.length > 0) {
      const hasImages = media_urls.some((url: string) => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
      )
      const hasVideos = media_urls.some((url: string) => 
        /\.(mp4|webm|mov)$/i.test(url)
      )
      
      if (hasImages && hasVideos) {
        media_type = 'mixed'
      } else if (hasVideos) {
        media_type = 'video'
      } else if (hasImages) {
        media_type = 'image'
      }
    }

    // Create post
    const { data: newPost, error: insertError } = await supabase
      .from('vibe_posts')
      .insert({
        user_id: user.id,
        content: content?.trim() || null,
        media_urls,
        media_type,
        vibe_tag,
        life_categories,
      })
      .select(`
        *,
        user:user_accounts!vibe_posts_user_id_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating vibe post:', insertError)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post: {
        ...newPost,
        has_hearted: false,
      },
    })

  } catch (error: any) {
    console.error('VIBE TRIBE POSTS POST ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    )
  }
}
