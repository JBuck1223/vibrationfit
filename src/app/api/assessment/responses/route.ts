// /src/app/api/assessment/responses/route.ts
// API routes for assessment response management

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AssessmentCategory } from '@/types/assessment'

// ============================================================================
// GET - Fetch responses for an assessment
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')
    const category = searchParams.get('category') as AssessmentCategory | null

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    // Verify the assessment belongs to the user
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessment_results')
      .select('id')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('assessment_responses')
      .select('*')
      .eq('assessment_id', assessmentId)

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    query = query.order('category', { ascending: true })
      .order('question_id', { ascending: true })

    const { data: responses, error } = await query

    if (error) {
      console.error('Error fetching responses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      )
    }

    return NextResponse.json({ responses })

  } catch (error) {
    console.error('Responses GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Save or update a response
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      assessment_id,
      question_id,
      question_text,
      category,
      response_value,
      response_text,
      response_emoji,
      green_line
    } = body

    // Validate required fields
    if (!assessment_id || !question_id || !category || response_value === undefined || response_value === null || !response_text || !green_line) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the assessment belongs to the user
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessment_results')
      .select('id, status')
      .eq('id', assessment_id)
      .eq('user_id', user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    if (assessment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot modify responses for completed assessment' },
        { status: 400 }
      )
    }

    // Prepare the upsert data
    const upsertData = {
      assessment_id,
      question_id,
      question_text,
      category,
      response_value,
      response_text,
      response_emoji,
      green_line
    }

    // Upsert the response (insert or update if exists)
    console.log('🔍 Attempting to upsert response with data:', upsertData)
    
    const { data: response, error } = await supabase
      .from('assessment_responses')
      .upsert(upsertData, {
        onConflict: 'assessment_id,question_id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        upsertData: upsertData
      })
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    // Note: The database trigger will automatically update the assessment scores

    return NextResponse.json({ response }, { status: 201 })

  } catch (error) {
    console.error('Responses POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Delete a response
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')
    const questionId = searchParams.get('questionId')

    if (!assessmentId || !questionId) {
      return NextResponse.json(
        { error: 'Assessment ID and Question ID are required' },
        { status: 400 }
      )
    }

    // Verify the assessment belongs to the user
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessment_results')
      .select('id')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('assessment_responses')
      .delete()
      .eq('assessment_id', assessmentId)
      .eq('question_id', questionId)

    if (error) {
      console.error('Error deleting response:', error)
      return NextResponse.json(
        { error: 'Failed to delete response' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Response deleted successfully' })

  } catch (error) {
    console.error('Responses DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

