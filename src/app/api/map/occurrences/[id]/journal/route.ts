import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVisionCategory } from '@/lib/design-system/vision-categories'
import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/map/occurrences/[id]/journal
 * Create a journal entry and link it to this occurrence (opt-in only).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: occurrenceId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      title?: string
      content?: string
      categories?: string[]
    }

    const content = body.content?.trim() ?? ''
    if (!content) {
      return NextResponse.json({ error: 'Journal content is required' }, { status: 400 })
    }

    const { data: occurrence, error: occError } = await supabase
      .from('commitment_occurrences')
      .select('id, user_id, occurred_on, commitment_id, journal_entry_id, commitment:commitments(title, category)')
      .eq('id', occurrenceId)
      .eq('user_id', user.id)
      .single()

    if (occError || !occurrence) {
      return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 })
    }

    if (occurrence.journal_entry_id) {
      return NextResponse.json(
        { error: 'This occurrence already has a journal entry' },
        { status: 409 },
      )
    }

    const commitment = occurrence.commitment as {
      title?: string
      category?: string
    } | null

    const defaultTitle = commitment?.title
      ? `MAP: ${commitment.title}`
      : 'MAP reflection'

    const title = body.title?.trim() || defaultTitle

    let categories = body.categories
    if (!categories?.length && commitment?.category) {
      const cat = getVisionCategory(commitment.category as LifeCategoryKey)
      if (cat) categories = [commitment.category]
    }

    const { data: journalEntry, error: journalError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        date: occurrence.occurred_on,
        title,
        content,
        categories: categories ?? [],
        image_urls: [],
        audio_recordings: [],
      })
      .select('id, title, content, date')
      .single()

    if (journalError || !journalEntry) {
      console.error('Error creating journal for occurrence:', journalError)
      return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
    }

    try {
      await supabase.rpc('increment_journal_stats', { p_user_id: user.id })
    } catch {
      /* non-critical */
    }

    const { data: updated, error: linkError } = await supabase
      .from('commitment_occurrences')
      .update({ journal_entry_id: journalEntry.id })
      .eq('id', occurrenceId)
      .eq('user_id', user.id)
      .select(
        '*, commitment:commitments(id, title, category, type, cadence, activity_type), journal:journal_entries(id, title, content, date)',
      )
      .single()

    if (linkError || !updated) {
      console.error('Error linking journal to occurrence:', linkError)
      return NextResponse.json({ error: 'Failed to link journal entry' }, { status: 500 })
    }

    return NextResponse.json({ occurrence: updated, journal_entry: journalEntry })
  } catch (err) {
    console.error('Error in POST /api/map/occurrences/[id]/journal:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/map/occurrences/[id]/journal
 * Link an existing journal entry to this occurrence (after /journal/new save).
 * Body: { journal_entry_id: string }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: occurrenceId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { journal_entry_id?: string }
    const journalEntryId = body.journal_entry_id?.trim()
    if (!journalEntryId) {
      return NextResponse.json({ error: 'journal_entry_id is required' }, { status: 400 })
    }

    const { data: journalEntry, error: journalError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('id', journalEntryId)
      .eq('user_id', user.id)
      .single()

    if (journalError || !journalEntry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    const { data: occurrence, error: occError } = await supabase
      .from('commitment_occurrences')
      .select('id, journal_entry_id')
      .eq('id', occurrenceId)
      .eq('user_id', user.id)
      .single()

    if (occError || !occurrence) {
      return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 })
    }

    if (occurrence.journal_entry_id && occurrence.journal_entry_id !== journalEntryId) {
      return NextResponse.json(
        { error: 'This occurrence already has a journal entry' },
        { status: 409 },
      )
    }

    const { data: updated, error: linkError } = await supabase
      .from('commitment_occurrences')
      .update({ journal_entry_id: journalEntryId })
      .eq('id', occurrenceId)
      .eq('user_id', user.id)
      .select(
        '*, commitment:commitments(id, title, category, type, cadence, activity_type), journal:journal_entries(id, title, content, date)',
      )
      .single()

    if (linkError || !updated) {
      console.error('Error linking journal to occurrence:', linkError)
      return NextResponse.json({ error: 'Failed to link journal entry' }, { status: 500 })
    }

    return NextResponse.json({ occurrence: updated })
  } catch (err) {
    console.error('Error in PATCH /api/map/occurrences/[id]/journal:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/map/occurrences/[id]/journal
 * Unlink journal from occurrence (does not delete the journal entry).
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id: occurrenceId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: updated, error } = await supabase
      .from('commitment_occurrences')
      .update({ journal_entry_id: null })
      .eq('id', occurrenceId)
      .eq('user_id', user.id)
      .select(
        '*, commitment:commitments(id, title, category, type, cadence, activity_type), journal:journal_entries(id, title, content, date)',
      )
      .single()

    if (error || !updated) {
      return NextResponse.json({ error: 'Failed to unlink journal' }, { status: 500 })
    }

    return NextResponse.json({ occurrence: updated })
  } catch (err) {
    console.error('Error in DELETE /api/map/occurrences/[id]/journal:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
