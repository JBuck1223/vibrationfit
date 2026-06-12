import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assessment_id, scores } = body

    if (!assessment_id || !scores || typeof scores !== 'object') {
      return NextResponse.json(
        { error: 'assessment_id and scores object are required' },
        { status: 400 }
      )
    }

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessment_results')
      .select('id, status')
      .eq('id', assessment_id)
      .eq('user_id', user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('assessment_results')
      .update({ self_assessment_scores: scores, updated_at: new Date().toISOString() })
      .eq('id', assessment_id)
      .select('self_assessment_scores')
      .single()

    if (error) {
      console.error('Error saving self-assessment scores:', error)
      return NextResponse.json({ error: 'Failed to save scores' }, { status: 500 })
    }

    return NextResponse.json({ self_assessment_scores: data.self_assessment_scores }, { status: 200 })

  } catch (error) {
    console.error('Self-assessment POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('assessment_results')
      .select('self_assessment_scores')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching self-assessment scores:', error)
      return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
    }

    return NextResponse.json({ self_assessment_scores: data?.self_assessment_scores || null })

  } catch (error) {
    console.error('Self-assessment GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
