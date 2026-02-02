import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/vibe-tribe/posts/[id]/heart
 * Add a heart to a post
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

    // Try to add heart (will fail if already exists due to unique constraint)
    const { error: insertError } = await supabase
      .from('vibe_hearts')
      .insert({
        user_id: user.id,
        post_id: postId,
      })

    if (insertError) {
      // Check if it's a duplicate error
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Already hearted' }, { status: 409 })
      }
      console.error('Error adding heart:', insertError)
      return NextResponse.json({ error: 'Failed to add heart' }, { status: 500 })
    }

    // Get updated hearts count
    const { data: updatedPost } = await supabase
      .from('vibe_posts')
      .select('hearts_count')
      .eq('id', postId)
      .single()

    return NextResponse.json({
      success: true,
      hearts_count: updatedPost?.hearts_count || 0,
    })

  } catch (error: any) {
    console.error('VIBE TRIBE HEART POST ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add heart' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vibe-tribe/posts/[id]/heart
 * Remove a heart from a post
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

    // Remove the heart
    const { error: deleteError } = await supabase
      .from('vibe_hearts')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (deleteError) {
      console.error('Error removing heart:', deleteError)
      return NextResponse.json({ error: 'Failed to remove heart' }, { status: 500 })
    }

    // Get updated hearts count
    const { data: updatedPost } = await supabase
      .from('vibe_posts')
      .select('hearts_count')
      .eq('id', postId)
      .single()

    return NextResponse.json({
      success: true,
      hearts_count: updatedPost?.hearts_count || 0,
    })

  } catch (error: any) {
    console.error('VIBE TRIBE HEART DELETE ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove heart' },
      { status: 500 }
    )
  }
}
