import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/vision/conversation
 * Save or update a vision conversation
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      vision_id,
      category,
      path_chosen,
      messages,
      vibrational_state,
      final_emotion_score,
      generated_vision,
      completed
    } = body

    // Validate required fields
    if (!vision_id || !category) {
      return NextResponse.json(
        { error: 'vision_id and category are required' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('vision_conversations')
      .select('id')
      .eq('vision_id', vision_id)
      .eq('category', category)
      .single()

    let result

    if (existing) {
      // Update existing conversation
      const updateData: Record<string, unknown> = {
        messages,
        updated_at: new Date().toISOString()
      }

      if (path_chosen) updateData.path_chosen = path_chosen
      if (vibrational_state) updateData.vibrational_state = vibrational_state
      if (final_emotion_score !== undefined) updateData.final_emotion_score = final_emotion_score
      if (generated_vision) {
        updateData.generated_vision = generated_vision
        updateData.vision_generated_at = new Date().toISOString()
      }
      if (completed) {
        updateData.completed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('vision_conversations')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new conversation
      const { data, error } = await supabase
        .from('vision_conversations')
        .insert({
          user_id: user.id,
          vision_id,
          category,
          path_chosen,
          messages: messages || [],
          vibrational_state,
          final_emotion_score,
          generated_vision,
          ...(completed && { completed_at: new Date().toISOString() })
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ conversation: result })
  } catch (error) {
    console.error('Error saving conversation:', error)
    return NextResponse.json(
      { error: 'Failed to save conversation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/vision/conversation?vision_id=xxx&category=xxx
 * Retrieve a specific conversation
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
    const category = searchParams.get('category')

    if (!vision_id) {
      return NextResponse.json(
        { error: 'vision_id is required' },
        { status: 400 }
      )
    }

    // If category is specified, get specific conversation
    if (category) {
      const { data, error } = await supabase
        .from('vision_conversations')
        .select('*')
        .eq('vision_id', vision_id)
        .eq('category', category)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error
      }

      return NextResponse.json({ conversation: data || null })
    }

    // Otherwise, get all conversations for this vision
    const { data, error } = await supabase
      .from('vision_conversations')
      .select('*')
      .eq('vision_id', vision_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ conversations: data })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
