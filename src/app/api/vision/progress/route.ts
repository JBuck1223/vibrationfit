import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/vision/progress?vision_id=xxx
 * Get progress for a specific vision
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vision_id = searchParams.get('vision_id')

    if (!vision_id) {
      return NextResponse.json(
        { error: 'vision_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('vision_progress')
      .select('*')
      .eq('vision_id', vision_id)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    // If no progress exists, create it
    if (!data) {
      const { data: newProgress, error: createError } = await supabase
        .from('vision_progress')
        .insert({
          user_id: user.id,
          vision_id,
          total_categories: 12,
          categories_completed: []
        })
        .select()
        .single()

      if (createError) throw createError
      return NextResponse.json({ progress: newProgress })
    }

    return NextResponse.json({ progress: data })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/vision/progress
 * Update vision progress (current category, etc.)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vision_id, current_category } = body

    if (!vision_id) {
      return NextResponse.json(
        { error: 'vision_id is required' },
        { status: 400 }
      )
    }

    // Update progress
    const updateData: Record<string, unknown> = {
      last_activity: new Date().toISOString()
    }

    if (current_category !== undefined) {
      updateData.current_category = current_category
    }

    const { data, error } = await supabase
      .from('vision_progress')
      .update(updateData)
      .eq('vision_id', vision_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ progress: data })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
