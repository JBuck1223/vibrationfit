// Start a new vision generation batch
// Creates a batch record and returns the batch ID for polling

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for existing active batch
    const { data: existingBatch } = await supabase
      .from('vision_generation_batches')
      .select('id, status, categories_completed, current_category')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing', 'retrying'])
      .maybeSingle()

    if (existingBatch) {
      // Return existing batch instead of creating new one
      return NextResponse.json({
        batchId: existingBatch.id,
        status: existingBatch.status,
        categoriesCompleted: existingBatch.categories_completed,
        currentCategory: existingBatch.current_category,
        message: 'Existing batch found'
      })
    }

    // Get user profile for perspective
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('perspective')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    // Check which categories already have text (skip them)
    const { data: categoryStates } = await supabase
      .from('vision_new_category_state')
      .select('category, category_vision_text')
      .eq('user_id', user.id)

    const alreadyCompleted = categoryStates
      ?.filter(cs => cs.category_vision_text && cs.category_vision_text.length > 50)
      .map(cs => cs.category) || []

    const allCategories = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality']
    const categoriesToProcess = allCategories.filter(c => !alreadyCompleted.includes(c))

    if (categoriesToProcess.length === 0) {
      return NextResponse.json({
        error: 'All categories already have generated text',
        alreadyCompleted
      }, { status: 400 })
    }

    // Create new batch
    const { data: newBatch, error: insertError } = await supabase
      .from('vision_generation_batches')
      .insert({
        user_id: user.id,
        categories_requested: categoriesToProcess,
        categories_completed: alreadyCompleted,
        status: 'pending',
        perspective: profile?.perspective || 'singular'
      })
      .select()
      .single()

    if (insertError) {
      console.error('[VisionBatch] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
    }

    console.log(`[VisionBatch] Created batch ${newBatch.id} for user ${user.id}`)
    console.log(`[VisionBatch] Categories to process: ${categoriesToProcess.length}, already done: ${alreadyCompleted.length}`)

    return NextResponse.json({
      batchId: newBatch.id,
      status: 'pending',
      categoriesRequested: categoriesToProcess,
      categoriesCompleted: alreadyCompleted,
      message: 'Batch created'
    })

  } catch (err) {
    console.error('[VisionBatch] Start error:', err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to start batch' 
    }, { status: 500 })
  }
}

