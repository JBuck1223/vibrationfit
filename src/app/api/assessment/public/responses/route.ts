import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
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

    if (!assessment_id || !question_id || !category || response_value === undefined || response_value === null || !response_text || !green_line) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessment_results')
      .select('id, status, lead_id')
      .eq('id', assessment_id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    if (!assessment.lead_id) {
      return NextResponse.json(
        { error: 'This endpoint is only for lead-based assessments' },
        { status: 403 }
      )
    }

    if (assessment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot modify responses for completed assessment' },
        { status: 400 }
      )
    }

    const { data: response, error } = await supabase
      .from('assessment_responses')
      .upsert({
        assessment_id,
        question_id,
        question_text,
        category,
        response_value,
        response_text,
        response_emoji,
        green_line
      }, {
        onConflict: 'assessment_id,question_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving public assessment response:', error)
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    return NextResponse.json({ response }, { status: 201 })
  } catch (error) {
    console.error('Public assessment response POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
