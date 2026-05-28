import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OccurrenceStatus } from '@/lib/map/types'

/**
 * GET /api/map/occurrences?date=YYYY-MM-DD
 *
 * List occurrences for a given date (defaults to today).
 * Includes the parent commitment for display.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const commitmentId = searchParams.get('commitment_id')

    let query = supabase
      .from('commitment_occurrences')
      .select(
        '*, commitment:commitments(id, title, category, type, cadence, vision_target_id, activity_type), journal:journal_entries(id, title, content, date)',
      )
      .eq('user_id', user.id)
      .order('occurred_on', { ascending: true })

    if (commitmentId) {
      query = query.eq('commitment_id', commitmentId)
    } else if (from && to) {
      query = query.gte('occurred_on', from).lte('occurred_on', to)
    } else {
      const singleDate = date || new Date().toISOString().split('T')[0]
      query = query.eq('occurred_on', singleDate)
    }

    const { data: occurrences, error } = await query

    if (error) {
      console.error('Error fetching occurrences:', error)
      return NextResponse.json({ error: 'Failed to fetch occurrences' }, { status: 500 })
    }

    return NextResponse.json({ occurrences: occurrences ?? [] })
  } catch (err) {
    console.error('Error in GET /api/map/occurrences:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/map/occurrences
 *
 * Verify an occurrence: set status to yes/no/skipped.
 * Body: { id: string, status: 'yes' | 'no' | 'skipped', note?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, note, journal_entry_id } = body as {
      id: string
      status: OccurrenceStatus
      note?: string
      journal_entry_id?: string | null
    }

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }
    if (!['yes', 'no', 'skipped', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      status,
      verified_at: status === 'pending' ? null : new Date().toISOString(),
    }
    if (note !== undefined) updates.note = note
    if (journal_entry_id !== undefined) updates.journal_entry_id = journal_entry_id

    const { data: occurrence, error } = await supabase
      .from('commitment_occurrences')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(
        '*, commitment:commitments(id, title, category), journal:journal_entries(id, title, content, date)',
      )
      .single()

    if (error) {
      console.error('Error verifying occurrence:', error)
      return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
    }

    if (status === 'yes' && occurrence?.occurred_on) {
      await supabase
        .from('area_activations')
        .upsert(
          {
            user_id: user.id,
            area: 'map',
            activation_date: occurrence.occurred_on,
            metadata: { commitment_id: occurrence.commitment_id },
          },
          { onConflict: 'user_id,area,activation_date' }
        )
    }

    return NextResponse.json({ occurrence })
  } catch (err) {
    console.error('Error in PATCH /api/map/occurrences:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
