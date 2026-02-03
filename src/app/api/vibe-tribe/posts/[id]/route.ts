import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/vibe-tribe/posts/[id]
 * Get a single post by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: post, error } = await supabase
      .from('vibe_posts')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Fetch user data (using admin client to bypass RLS)
    const adminClientForUser = createAdminClient()
    const { data: userData } = await adminClientForUser
      .from('user_accounts')
      .select('id, full_name, profile_picture_url')
      .eq('id', post.user_id)
      .single()
    
    const postWithUser = { ...post, user: userData || null }

    // Check if user has hearted this post
    const { data: heart } = await supabase
      .from('vibe_hearts')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', id)
      .maybeSingle()

    return NextResponse.json({
      post: {
        ...postWithUser,
        has_hearted: !!heart,
      },
    })

  } catch (error: any) {
    console.error('VIBE TRIBE POST GET ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vibe-tribe/posts/[id]
 * Soft delete a post (owner or admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the post to check ownership
    const { data: post, error: fetchError } = await supabase
      .from('vibe_posts')
      .select('id, user_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user is owner or admin
    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = post.user_id === user.id
    const isAdmin = userAccount?.role === 'admin' || userAccount?.role === 'super_admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 })
    }

    // Soft delete the post using admin client to bypass RLS
    // (Authorization is already verified above)
    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient
      .from('vibe_posts')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting vibe post:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('VIBE TRIBE POST DELETE ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    )
  }
}
