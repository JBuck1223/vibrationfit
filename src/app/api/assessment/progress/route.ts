// /src/app/api/assessment/progress/route.ts
// API route for calculating assessment progress

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assessmentQuestions, filterQuestionsByProfile } from '@/lib/assessment/questions'

// ============================================================================
// GET - Calculate assessment progress
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

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    // Verify the assessment belongs to the user
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Fetch user profile for conditional logic
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Fetch all responses for this assessment
    const { data: responses, error: responsesError } = await supabase
      .from('assessment_responses')
      .select('question_id, category')
      .eq('assessment_id', assessmentId)

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      )
    }

    const responseMap = new Map(responses?.map(r => [r.question_id, true]) || [])

    // Calculate progress per category and overall
    let totalQuestions = 0
    let answeredQuestions = 0
    const categoryProgress: Record<string, { total: number; answered: number; percentage: number }> = {}

    for (const categoryData of assessmentQuestions) {
      const filteredQuestions = filterQuestionsByProfile(
        categoryData.questions,
        profile || {}
      )

      const categoryAnswered = filteredQuestions.filter(q => responseMap.has(q.id)).length
      const categoryTotal = filteredQuestions.length

      categoryProgress[categoryData.category] = {
        total: categoryTotal,
        answered: categoryAnswered,
        percentage: categoryTotal > 0 ? Math.round((categoryAnswered / categoryTotal) * 100) : 0
      }

      totalQuestions += categoryTotal
      answeredQuestions += categoryAnswered
    }

    const overallPercentage = totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0

    return NextResponse.json({
      assessment_id: assessmentId,
      overall: {
        total: totalQuestions,
        answered: answeredQuestions,
        percentage: overallPercentage
      },
      categories: categoryProgress,
      is_complete: answeredQuestions === totalQuestions
    })

  } catch (error) {
    console.error('Progress GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

