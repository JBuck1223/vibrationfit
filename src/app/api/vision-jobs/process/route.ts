import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes per request (will process one category)

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json()
    
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the job
    const { data: job, error: jobError } = await supabase
      .from('vision_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('[Process Job] Job not found:', jobId)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // If job is already completed or failed, return current status
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({
        status: job.status,
        jobId: job.id,
        categoriesCompleted: job.categories_completed,
        categoriesFailed: job.categories_failed
      })
    }

    // Mark as processing if pending
    if (job.status === 'pending') {
      await supabase
        .from('vision_generation_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', jobId)
    }

    // Get category keys in order
    const categoryKeys = VISION_CATEGORIES
      .filter(c => c.order > 0 && c.order < 13)
      .map(c => c.key)
      .sort((a, b) => {
        const catA = getVisionCategory(a)
        const catB = getVisionCategory(b)
        return (catA?.order || 0) - (catB?.order || 0)
      })

    // Get all category states to check what's already done
    const { data: categoryStates } = await supabase
      .from('vision_new_category_state')
      .select('category, category_vision_text, ideal_state, clarity_keys, contrast_flips, blueprint_data')
      .eq('user_id', job.user_id)
      .in('category', categoryKeys)

    // Get all scenes
    const { data: allScenes } = await supabase
      .from('scenes')
      .select('*')
      .eq('user_id', job.user_id)
      .in('category', categoryKeys)

    // Group scenes by category
    const scenesByCategory: Record<string, any[]> = {}
    allScenes?.forEach(scene => {
      if (!scenesByCategory[scene.category]) {
        scenesByCategory[scene.category] = []
      }
      scenesByCategory[scene.category].push({
        title: scene.title,
        text: scene.text,
        essence_word: scene.essence_word
      })
    })

    // Get profile for perspective
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('perspective')
      .eq('user_id', job.user_id)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle()

    const perspective = profile?.perspective || 'singular'

    // Find next category to process
    const nextCategory = categoryKeys.find(key => {
      const state = categoryStates?.find(cs => cs.category === key)
      return !state?.category_vision_text || state.category_vision_text.trim().length === 0
    })

    if (!nextCategory) {
      // All categories are complete! Assemble the vision
      console.log('[Process Job] All categories complete, assembling vision...')
      
      await supabase
        .from('vision_generation_jobs')
        .update({
          current_category: 'Assembling final vision'
        })
        .eq('id', jobId)

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/viva/assemble-vision-from-queue`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Pass user context for server-side auth
            'x-user-id': job.user_id
          }
        })

        if (!response.ok) {
          throw new Error('Failed to assemble vision')
        }

        const data = await response.json()

        // Mark job as completed
        await supabase
          .from('vision_generation_jobs')
          .update({
            status: 'completed',
            vision_id: data.visionId,
            completed_at: new Date().toISOString(),
            current_category: null
          })
          .eq('id', jobId)

        return NextResponse.json({
          status: 'completed',
          jobId: job.id,
          visionId: data.visionId
        })
      } catch (assemblyError) {
        console.error('[Process Job] Assembly error:', assemblyError)
        
        await supabase
          .from('vision_generation_jobs')
          .update({
            status: 'failed',
            error_message: `Assembly failed: ${assemblyError instanceof Error ? assemblyError.message : 'Unknown error'}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId)

        return NextResponse.json({
          status: 'failed',
          error: 'Assembly failed'
        }, { status: 500 })
      }
    }

    // Process the next category
    console.log(`[Process Job] Processing category: ${nextCategory}`)
    
    const category = getVisionCategory(nextCategory)
    const state = categoryStates?.find(cs => cs.category === nextCategory)

    await supabase
      .from('vision_generation_jobs')
      .update({
        current_category: category?.label || nextCategory
      })
      .eq('id', jobId)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/viva/category-vision`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': job.user_id
        },
        body: JSON.stringify({
          categoryKey: nextCategory,
          idealStateText: state?.ideal_state || '',
          currentStateText: '',
          scenes: scenesByCategory[nextCategory] || [],
          blueprintData: state?.blueprint_data || null,
          transcript: '',
          perspective
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate ${nextCategory}`)
      }

      const data = await response.json()

      if (!data.categoryText || data.categoryText.trim().length === 0) {
        throw new Error(`Empty response for ${nextCategory}`)
      }

      // Update job progress
      await supabase
        .from('vision_generation_jobs')
        .update({
          categories_completed: job.categories_completed + 1
        })
        .eq('id', jobId)

      // Trigger next category processing
      setTimeout(() => {
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/vision-jobs/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        }).catch(err => console.error('[Process Job] Failed to trigger next:', err))
      }, 100) // Small delay to allow response to return

      return NextResponse.json({
        status: 'processing',
        jobId: job.id,
        currentCategory: nextCategory,
        categoriesCompleted: job.categories_completed + 1,
        totalCategories: job.total_categories
      })

    } catch (categoryError) {
      console.error(`[Process Job] Error processing ${nextCategory}:`, categoryError)
      
      // Update job with failure
      await supabase
        .from('vision_generation_jobs')
        .update({
          categories_failed: job.categories_failed + 1,
          error_message: categoryError instanceof Error ? categoryError.message : 'Unknown error'
        })
        .eq('id', jobId)

      // If too many failures, mark job as failed
      if (job.categories_failed + 1 >= 3) {
        await supabase
          .from('vision_generation_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId)

        return NextResponse.json({
          status: 'failed',
          error: 'Too many category failures'
        }, { status: 500 })
      }

      // Continue with next category despite error
      setTimeout(() => {
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/vision-jobs/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        }).catch(err => console.error('[Process Job] Failed to trigger next:', err))
      }, 100)

      return NextResponse.json({
        status: 'processing',
        error: `Failed ${nextCategory}, continuing...`,
        categoriesFailed: job.categories_failed + 1
      })
    }

  } catch (err) {
    console.error('[Process Job] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to process job' },
      { status: 500 }
    )
  }
}

