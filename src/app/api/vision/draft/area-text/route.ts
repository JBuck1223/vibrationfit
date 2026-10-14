/**
 * POST /api/vision/draft/area-text
 *
 * Start From Scratch autosave. Stores one beat of raw material for one life
 * area, verbatim, on the draft session's category text row.
 *
 * Body:
 *   { draftId, category, beat: 'now' | 'dream', text }
 *   { draftId, category, unknown: true }       // "I don't know yet"
 *   { draftId, category, unknown: false }      // clear the mark
 *
 * Returns the recomputed depth summary plus the area's coverage so the page
 * can light up the Now/Dream dots without a refetch. The passage tagger runs
 * in after() with a focusCategory hint so VIVA-mode gets the same tagged
 * notes the chat flow produces.
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isLifeCategoryKey } from '@/lib/design-system/vision-categories'
import {
  computeDepth,
  groupNotesByCategory,
  loadDraftSession,
  upsertCategoryText,
  type AreaBeat,
} from '@/lib/life-vision/draft-session'
import { persistMemberPassages, tagMemberPassages } from '@/lib/life-vision/passage-tagger'
import { summarizeAreas } from '@/lib/life-vision/vision-director'

const MAX_CHARS = 20_000

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const draftId = typeof body?.draftId === 'string' ? body.draftId : null
    const category = typeof body?.category === 'string' ? body.category : null
    if (!draftId || !category || !isLifeCategoryKey(category)) {
      return NextResponse.json({ error: 'Missing draftId or category' }, { status: 400 })
    }

    const beat: AreaBeat | null = body?.beat === 'now' || body?.beat === 'dream' ? body.beat : null
    const hasUnknown = typeof body?.unknown === 'boolean'
    if (!beat && !hasUnknown) {
      return NextResponse.json({ error: 'Provide beat + text or unknown' }, { status: 400 })
    }

    const { data: draft } = await supabase
      .from('vision_versions')
      .select('id, user_id, is_draft')
      .eq('id', draftId)
      .maybeSingle()
    if (!draft || draft.user_id !== user.id || !draft.is_draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const session = await loadDraftSession(supabase, draftId)
    if (!session) {
      return NextResponse.json({ error: 'No draft session' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()
    let savedText: string | null = null

    if (beat) {
      const raw = typeof body?.text === 'string' ? body.text : ''
      const text = raw.replace(/\r\n/g, '\n').trim().slice(0, MAX_CHARS)
      savedText = text
      const patch = beat === 'now'
        ? { now_text: text || null, now_at: text ? nowIso : null }
        : { dream_text: text || null, dream_at: text ? nowIso : null }
      // Writing a beat lifts an "I don't know yet" mark.
      await upsertCategoryText(supabase, session.id, category, { ...patch, ...(text ? { unknown_at: null } : {}) })
    } else {
      await upsertCategoryText(supabase, session.id, category, { unknown_at: body.unknown ? nowIso : null })
    }

    const refreshed = await loadDraftSession(supabase, draftId)
    const categoryText = refreshed?.categoryText ?? []
    const notes = refreshed?.notes ?? []
    const depth = computeDepth(notes, categoryText)
    const area = groupNotesByCategory(notes, categoryText).find((g) => g.category === category) ?? null

    // Re-tag the area's beats as verbatim passages (polarity + spill-over into
    // other areas). The beats are the source of truth, so member notes for this
    // area are replaced rather than accumulated across autosaves.
    if (beat && savedText && area) {
      const sessionId = session.id
      const combined = [
        area.nowText ? `What's going on now:\n${area.nowText}` : '',
        area.dreamText ? `Unleash your imagination:\n${area.dreamText}` : '',
      ].filter(Boolean).join('\n\n')
      after(async () => {
        try {
          const passages = await tagMemberPassages({
            memberMessage: combined,
            vivaQuestion: `Tell me about the ${category} area of your life: what's going on now, and what it looks like if it unfolded like a movie.`,
            focusCategory: category,
            userId: user.id,
            supabase,
          })
          await supabase
            .from('vision_draft_session_notes')
            .delete()
            .eq('session_id', sessionId)
            .eq('source', 'member')
            .eq('category', category)
          await persistMemberPassages(supabase, sessionId, passages)
        } catch (err) {
          console.error('[draft/area-text] passage tagging', err)
        }
      })
    }

    return NextResponse.json({
      ok: true,
      depth,
      areas: refreshed ? summarizeAreas(refreshed) : [],
      area: area
        ? {
            category: area.category,
            nowDone: area.nowDone,
            dreamDone: area.dreamDone,
            unknownYet: area.unknownYet,
            memberWords: area.memberWords,
            depth: area.depth,
          }
        : null,
    })
  } catch (error) {
    console.error('[draft/area-text]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
