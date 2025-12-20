import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create the job record
    const { data: job, error: jobError } = await supabase
      .from('vision_generation_jobs')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_categories: 12,
        categories_completed: 0,
        categories_failed: 0
      })
      .select()
      .single()

    if (jobError) {
      console.error('[Create Job] Error creating job:', jobError)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    console.log('[Create Job] Created job:', job.id)

    // Immediately trigger the background processor
    // Note: This still processes in-request, but the UI can close and poll for status
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/vision-jobs/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id })
      })
    } catch (triggerError) {
      console.error('[Create Job] Failed to trigger processor:', triggerError)
      // Job is still created, processor will pick it up on next cron/poll
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status
    })

  } catch (err) {
    console.error('[Create Job] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create job' },
      { status: 500 }
    )
  }
}

