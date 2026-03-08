import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, email, profile } = body

    if (!lead_id || !email) {
      return NextResponse.json(
        { error: 'lead_id and email are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    const existingCheck = await supabase
      .from('assessment_results')
      .select('id, status')
      .eq('lead_id', lead_id)
      .maybeSingle()

    if (existingCheck.data) {
      return NextResponse.json({
        assessment: existingCheck.data,
        existing: true
      })
    }

    const { data: assessment, error } = await supabase
      .from('assessment_results')
      .insert({
        lead_id,
        email,
        user_id: null,
        status: 'in_progress',
        assessment_version: 1,
        max_possible_score: 420,
        started_at: new Date().toISOString(),
        is_draft: true,
        is_active: false,
        metadata: profile ? { profile } : {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating public assessment:', error)
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assessment }, { status: 201 })
  } catch (error) {
    console.error('Public assessment POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
