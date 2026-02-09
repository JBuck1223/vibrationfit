import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/vibe-tribe/posts/[id]/pin
 * Pin a post (admin/coach only)
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

    // Check if user is admin
    const { data: account } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = account?.role === 'admin' || account?.role === 'super_admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can pin posts' }, { status: 403 })
    }

    // Verify post exists
    const adminClient = createAdminClient()
    const { data: post, error: postError } = await adminClient
      .from('vibe_posts')
      .select('id, is_deleted')
      .eq('id', postId)
      .single()
    
    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.is_deleted) {
      return NextResponse.json({ error: 'Cannot pin a deleted post' }, { status: 400 })
    }

    // Pin the post
    const { data: updatedPost, error: updateError } = await adminClient
      .from('vibe_posts')
      .update({
        is_pinned: true,
        pinned_at: new Date().toISOString(),
        pinned_by: user.id,
      })
      .eq('id', postId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error pinning post:', updateError)
      return NextResponse.json({ error: 'Failed to pin post' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
    })

  } catch (error: any) {
    console.error('PIN POST ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to pin post' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vibe-tribe/posts/[id]/pin
 * Unpin a post (admin/coach only)
 */
export async function DELETE(
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

    // Check if user is admin
    const { data: account } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = account?.role === 'admin' || account?.role === 'super_admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can unpin posts' }, { status: 403 })
    }

    // Unpin the post using admin client
    const adminClient = createAdminClient()
    const { data: updatedPost, error: updateError } = await adminClient
      .from('vibe_posts')
      .update({
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      })
      .eq('id', postId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error unpinning post:', updateError)
      return NextResponse.json({ error: 'Failed to unpin post' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
    })

  } catch (error: any) {
    console.error('UNPIN POST ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unpin post' },
      { status: 500 }
    )
  }
}
