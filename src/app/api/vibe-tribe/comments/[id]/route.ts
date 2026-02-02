import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/vibe-tribe/comments/[id]
 * Soft delete a comment (owner or admin only)
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

    // Get the comment to check ownership
    const { data: comment, error: fetchError } = await supabase
      .from('vibe_comments')
      .select('id, user_id, post_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user is owner or admin
    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = comment.user_id === user.id
    const isAdmin = userAccount?.role === 'admin' || userAccount?.role === 'super_admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 })
    }

    // Soft delete the comment
    const { error: deleteError } = await supabase
      .from('vibe_comments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('VIBE TRIBE COMMENT DELETE ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
