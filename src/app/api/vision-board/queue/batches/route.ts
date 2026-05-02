import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_JOBS = 200

type QueueItemInput = {
  name: string
  description: string
  category: string
  categoryLabel: string
  ideaId?: string
}

/**
 * POST /api/vision-board/queue/batches
 * Create a persistent vision-board creation batch and job rows (replaces sessionStorage for large queues).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const items = (body.items || []) as QueueItemInput[]

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    if (items.length > MAX_JOBS) {
      return NextResponse.json(
        { error: `Too many items in one batch (max ${MAX_JOBS})` },
        { status: 400 }
      )
    }

    for (const item of items) {
      if (!item.name?.trim() || !item.description?.trim() || !item.category || !item.categoryLabel) {
        return NextResponse.json(
          { error: 'Each item must include name, description, category, and categoryLabel' },
          { status: 400 }
        )
      }
    }

    const { data: batch, error: batchError } = await supabase
      .from('vision_board_queue_batches')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_jobs: items.length,
        jobs_succeeded: 0,
        jobs_failed: 0,
        metadata: { source: 'viva_ideas' },
      })
      .select('id')
      .single()

    if (batchError || !batch) {
      console.error('vision_board_queue_batches insert error:', batchError)
      return NextResponse.json({ error: 'Failed to create queue batch' }, { status: 500 })
    }

    const batchId = batch.id

    const jobRows = items.map((item, index) => ({
      batch_id: batchId,
      user_id: user.id,
      sort_index: index,
      name: item.name.trim(),
      description: item.description.trim(),
      category: item.category,
      category_label: item.categoryLabel,
      idea_id: item.ideaId || null,
      status: 'pending' as const,
    }))

    const { error: jobsError } = await supabase.from('vision_board_queue_jobs').insert(jobRows)

    if (jobsError) {
      console.error('vision_board_queue_jobs insert error:', jobsError)
      await supabase.from('vision_board_queue_batches').delete().eq('id', batchId)
      return NextResponse.json({ error: 'Failed to create queue jobs' }, { status: 500 })
    }

    return NextResponse.json({ batchId })
  } catch (e) {
    console.error('POST /api/vision-board/queue/batches', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
