import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PATCH /api/vibe-tribe/comments/[id]
 * Edit a comment (owner only)
 */
export async function PATCH(
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

    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: comment, error: fetchError } = await adminClient
      .from('vibe_comments')
      .select('id, user_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: 'Only the author can edit a comment' }, { status: 403 })
    }

    // Try updating with edited_at; fall back to content-only if column doesn't exist yet
    let updated;
    let updateError;

    ({ data: updated, error: updateError } = await adminClient
      .from('vibe_comments')
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single())

    if (updateError?.code === 'PGRST204') {
      // edited_at column doesn't exist yet - update content only
      ({ data: updated, error: updateError } = await adminClient
        .from('vibe_comments')
        .update({ content: content.trim() })
        .eq('id', id)
        .select('*')
        .single())
    }

    if (updateError) {
      console.error('Error updating comment:', updateError)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, comment: { ...updated, edited_at: updated?.edited_at || new Date().toISOString() } })
  } catch (error: any) {
    console.error('VIBE TRIBE COMMENT PATCH ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update comment' },
      { status: 500 }
    )
  }
}

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

    const adminClient = createAdminClient()

    // Get the comment to check ownership
    const { data: comment, error: fetchError } = await adminClient
      .from('vibe_comments')
      .select('id, user_id, post_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user is owner or admin
    const { data: userAccount } = await adminClient
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
    const { error: deleteError } = await adminClient
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
