// /src/app/api/assessment/route.ts
// API routes for assessment CRUD operations

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AssessmentResult, AssessmentResponse, AssessmentCategory } from '@/types/assessment'

// ============================================================================
// GET - Fetch user's assessments
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
    const assessmentId = searchParams.get('id')
    const includeResponses = searchParams.get('includeResponses') === 'true'
    const includeInsights = searchParams.get('includeInsights') === 'true'

    // Fetch specific assessment by ID
    if (assessmentId) {
      const { data: assessment, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('id', assessmentId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching assessment:', error)
        return NextResponse.json(
          { error: 'Failed to fetch assessment' },
          { status: 500 }
        )
      }

      if (!assessment) {
        return NextResponse.json(
          { error: 'Assessment not found' },
          { status: 404 }
        )
      }

      // Fetch responses if requested
      let responses = null
      if (includeResponses) {
        const { data: responsesData, error: responsesError } = await supabase
          .from('assessment_responses')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('category', { ascending: true })
          .order('question_id', { ascending: true })

        if (responsesError) {
          console.error('Error fetching responses:', responsesError)
        } else {
          responses = responsesData
        }
      }

      // Fetch insights if requested
      let insights = null
      if (includeInsights) {
        const { data: insightsData, error: insightsError } = await supabase
          .from('assessment_insights')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('confidence_score', { ascending: false })

        if (insightsError) {
          console.error('Error fetching insights:', insightsError)
        } else {
          insights = insightsData
        }
      }

      return NextResponse.json({
        assessment,
        responses,
        insights
      })
    }

    // Fetch all assessments for user
    const { data: assessments, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assessments })

  } catch (error) {
    console.error('Assessment GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create new assessment
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
    const { profile_version_id, assessment_version = 1 } = body

    // Create new assessment
    const { data: assessment, error } = await supabase
      .from('assessment_results')
      .insert({
        user_id: user.id,
        profile_version_id,
        status: 'in_progress',
        assessment_version,
        max_possible_score: 420, // 12 categories × 35 max points each (7 questions × 5 max points)
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating assessment:', error)
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assessment }, { status: 201 })

  } catch (error) {
    console.error('Assessment POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH - Update assessment (status, completion, etc.)
// ============================================================================
export async function PATCH(request: NextRequest) {
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
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { data: assessment, error } = await supabase
      .from('assessment_results')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating assessment:', error)
      return NextResponse.json(
        { error: 'Failed to update assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assessment })

  } catch (error) {
    console.error('Assessment PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Delete assessment and all related data
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('assessment_results')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting assessment:', error)
      return NextResponse.json(
        { error: 'Failed to delete assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Assessment deleted successfully' })

  } catch (error) {
    console.error('Assessment DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

