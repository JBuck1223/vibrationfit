// Get status of user's active vision generation batch

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's most recent batch (active or completed)
    const { data: batch } = await supabase
      .from('vision_generation_batches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!batch) {
      return NextResponse.json({ batch: null })
    }

    // Also get current category texts for display
    const { data: categoryTexts } = await supabase
      .from('vision_new_category_state')
      .select('category, category_vision_text')
      .eq('user_id', user.id)

    const textsMap: Record<string, string> = {}
    categoryTexts?.forEach(ct => {
      if (ct.category_vision_text) {
        textsMap[ct.category] = ct.category_vision_text
      }
    })

    return NextResponse.json({
      batch: {
        id: batch.id,
        status: batch.status,
        categoriesRequested: batch.categories_requested,
        categoriesCompleted: batch.categories_completed,
        categoriesFailed: batch.categories_failed,
        currentCategory: batch.current_category,
        visionId: batch.vision_id,
        errorMessage: batch.error_message,
        createdAt: batch.created_at,
        startedAt: batch.started_at,
        completedAt: batch.completed_at,
        updatedAt: batch.updated_at,
        retryCount: batch.retry_count
      },
      categoryTexts: textsMap
    })

  } catch (err) {
    console.error('[VisionBatch] Status error:', err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to get status' 
    }, { status: 500 })
  }
}

