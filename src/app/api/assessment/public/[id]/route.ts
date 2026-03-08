import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: assessment, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('id', id)
      .not('lead_id', 'is', null)
      .single()

    if (error || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    const { data: responses, error: responsesError } = await supabase
      .from('assessment_responses')
      .select('*')
      .eq('assessment_id', id)
      .order('category', { ascending: true })
      .order('question_id', { ascending: true })

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
    }

    const responseCounts: Record<string, number> = {}
    if (responses) {
      for (const r of responses) {
        responseCounts[r.category] = (responseCounts[r.category] || 0) + 1
      }
    }

    return NextResponse.json({
      assessment,
      responses: responses || [],
      response_counts: responseCounts
    })
  } catch (error) {
    console.error('Public assessment GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: existing, error: checkError } = await supabase
      .from('assessment_results')
      .select('id, status, lead_id')
      .eq('id', id)
      .not('lead_id', 'is', null)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    if (existing.status === 'completed') {
      return NextResponse.json(
        { error: 'Assessment is already completed' },
        { status: 400 }
      )
    }

    const { data: assessment, error } = await supabase
      .from('assessment_results')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        is_draft: false,
        is_active: true
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error completing public assessment:', error)
      return NextResponse.json(
        { error: 'Failed to complete assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error('Public assessment PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
