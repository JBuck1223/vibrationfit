import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateCommitmentPayload } from '@/lib/map/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('target_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('commitments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (targetId) {
      query = query.eq('vision_target_id', targetId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: commitments, error } = await query

    if (error) {
      console.error('Error fetching commitments:', error)
      return NextResponse.json({ error: 'Failed to fetch commitments' }, { status: 500 })
    }

    return NextResponse.json({ commitments: commitments ?? [] })
  } catch (err) {
    console.error('Error in GET /api/map/commitments:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateCommitmentPayload = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.category?.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (!body.type || !['recurring', 'project'].includes(body.type)) {
      return NextResponse.json({ error: 'Type must be recurring or project' }, { status: 400 })
    }
    if (body.type === 'recurring' && !body.cadence) {
      return NextResponse.json({ error: 'Cadence is required for recurring commitments' }, { status: 400 })
    }
    if (body.type === 'project' && !body.end_date) {
      return NextResponse.json({ error: 'End date is required for project commitments' }, { status: 400 })
    }

    const { data: commitment, error } = await supabase
      .from('commitments')
      .insert({
        user_id: user.id,
        vision_target_id: body.vision_target_id || null,
        category: body.category,
        parent_commitment_id: body.parent_commitment_id || null,
        type: body.type,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        cadence: body.cadence || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating commitment:', error)
      return NextResponse.json({ error: 'Failed to create commitment' }, { status: 500 })
    }

    return NextResponse.json({ commitment }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/map/commitments:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
