import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/video/session-comments/[id]/heart
 * Heart a session comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: comment, error: commentError } = await supabase
      .from('session_comments')
      .select('id')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const { error: insertError } = await supabase
      .from('session_comment_hearts')
      .insert({ user_id: user.id, comment_id: commentId })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Already hearted' }, { status: 409 })
      }
      console.error('Error adding heart to session comment:', insertError)
      return NextResponse.json({ error: 'Failed to add heart' }, { status: 500 })
    }

    const { data: updatedComment } = await supabase
      .from('session_comments')
      .select('hearts_count')
      .eq('id', commentId)
      .single()

    return NextResponse.json({ success: true, hearts_count: updatedComment?.hearts_count || 0 })
  } catch (error: any) {
    console.error('SESSION COMMENT HEART POST ERROR:', error)
    return NextResponse.json({ error: error.message || 'Failed to add heart' }, { status: 500 })
  }
}

/**
 * DELETE /api/video/session-comments/[id]/heart
 * Remove heart from a session comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error: deleteError } = await supabase
      .from('session_comment_hearts')
      .delete()
      .eq('user_id', user.id)
      .eq('comment_id', commentId)

    if (deleteError) {
      console.error('Error removing heart from session comment:', deleteError)
      return NextResponse.json({ error: 'Failed to remove heart' }, { status: 500 })
    }

    const { data: updatedComment } = await supabase
      .from('session_comments')
      .select('hearts_count')
      .eq('id', commentId)
      .single()

    return NextResponse.json({ success: true, hearts_count: updatedComment?.hearts_count || 0 })
  } catch (error: any) {
    console.error('SESSION COMMENT HEART DELETE ERROR:', error)
    return NextResponse.json({ error: error.message || 'Failed to remove heart' }, { status: 500 })
  }
}
