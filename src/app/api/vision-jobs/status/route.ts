import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get job status
    const { data: job, error } = await supabase
      .from('vision_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Update last_polled_at (so we know job is being monitored)
    await supabase
      .from('vision_generation_jobs')
      .update({ last_polled_at: new Date().toISOString() })
      .eq('id', jobId)

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      currentCategory: job.current_category,
      categoriesCompleted: job.categories_completed,
      categoriesFailed: job.categories_failed,
      totalCategories: job.total_categories,
      visionId: job.vision_id,
      error: job.error_message,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at
    })

  } catch (err) {
    console.error('[Job Status] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to get job status' },
      { status: 500 }
    )
  }
}

