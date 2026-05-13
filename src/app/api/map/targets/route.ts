import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateVisionTargetPayload } from '@/lib/map/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: targets, error } = await supabase
      .from('vision_targets')
      .select('*, commitments(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching targets:', error)
      return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 })
    }

    return NextResponse.json({ targets: targets ?? [] })
  } catch (err) {
    console.error('Error in GET /api/map/targets:', err)
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

    const body: CreateVisionTargetPayload = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.category?.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    const { data: target, error } = await supabase
      .from('vision_targets')
      .insert({
        user_id: user.id,
        category: body.category,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        vision_version_id: body.vision_version_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating target:', error)
      return NextResponse.json({ error: 'Failed to create target' }, { status: 500 })
    }

    return NextResponse.json({ target }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/map/targets:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
