/**
 * POST /api/vision/draft/turn
 *
 * Directed intake ("Talk it out"). One turn = the VIVA card the member read
 * plus their long-form reply. The reply is tagged into verbatim passages by
 * life area (spill-over counts), depth is recomputed across everything the
 * session holds (turns + row beats), and VIVA writes the next card from the
 * gaps. Roster / persona extraction runs in after() so VIVA keeps learning
 * names and places the way the chat flow did.
 *
 * Body: { draftId, promptText, targetCategories, text }
 * Returns: { ok, turn, depth, areas, nextPrompt | null }
 *
 * Body: { draftId, peek: true }
 * Returns the card the member should see now without recording anything
 * (resume after reload, or first open of the Talk it out tab).
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isLifeCategoryKey, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import {
  computeDepth,
  countWords,
  insertDraftSessionTurn,
  loadDraftSession,
} from '@/lib/life-vision/draft-session'
import { persistMemberPassages, tagMemberPassages } from '@/lib/life-vision/passage-tagger'
import {
  loadDirectorContext,
  nextDirectorPrompt,
  summarizeAreas,
} from '@/lib/life-vision/vision-director'
import { runGetToKnowYouExtraction } from '@/lib/roster/get-to-know-you-extractor'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const MAX_CHARS = 40_000
const MIN_WORDS = 3

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const draftId = typeof body?.draftId === 'string' ? body.draftId : null
    const peek = body?.peek === true
    const promptText = typeof body?.promptText === 'string' ? body.promptText.trim() : ''
    const rawText = typeof body?.text === 'string' ? body.text : ''
    const text = rawText.replace(/\r\n/g, '\n').trim().slice(0, MAX_CHARS)
    const targetCategories: LifeCategoryKey[] = Array.isArray(body?.targetCategories)
      ? body.targetCategories.filter((c: unknown): c is LifeCategoryKey => typeof c === 'string' && isLifeCategoryKey(c))
      : []

    if (!draftId || (!peek && !promptText)) {
      return NextResponse.json({ error: 'Missing draftId or promptText' }, { status: 400 })
    }
    const memberWords = countWords(text)
    if (!peek && memberWords < MIN_WORDS) {
      return NextResponse.json({ error: 'Say a little more first' }, { status: 400 })
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

    if (peek) {
      const depth = computeDepth(session.notes, session.categoryText)
      const nextPrompt = await nextDirectorPrompt(supabase, user.id, session, { depth })
      return NextResponse.json({
        ok: true,
        turnCount: session.turns.length,
        depth,
        areas: summarizeAreas(session),
        nextPrompt,
      })
    }

    // 1. Tag the reply into verbatim passages. Inline: the next card depends
    //    on where these words landed.
    const passages = await tagMemberPassages({
      memberMessage: text,
      vivaQuestion: promptText,
      focusCategory: targetCategories.length === 1 ? targetCategories[0] : null,
      userId: user.id,
      supabase,
    })
    await persistMemberPassages(supabase, session.id, passages)

    // 2. Record the turn.
    const turn = await insertDraftSessionTurn(supabase, session.id, {
      turn_index: session.turns.length,
      prompt_text: promptText,
      target_categories: targetCategories,
      member_text: text,
      member_words: memberWords,
      tagged_at: new Date().toISOString(),
    })

    // 3. Roster / persona keep learning, off the request path.
    const context = await loadDirectorContext(supabase, user.id)
    after(async () => {
      try {
        await runGetToKnowYouExtraction(
          supabase,
          user.id,
          [
            { role: 'assistant', content: promptText },
            { role: 'user', content: text },
          ],
          [context.rosterBlock, context.personaBlock].filter(Boolean).join('\n'),
        )
      } catch (err) {
        console.error('[draft/turn] Get to Know You extraction', err)
      }
    })

    // 4. Recompute coverage and ask VIVA for the next card.
    const refreshed = (await loadDraftSession(supabase, draftId)) ?? session
    const depth = computeDepth(refreshed.notes, refreshed.categoryText)
    const nextPrompt = await nextDirectorPrompt(supabase, user.id, refreshed, { context, depth })

    return NextResponse.json({
      ok: true,
      turn,
      turnCount: refreshed.turns.length,
      taggedPassages: passages.length,
      depth,
      areas: summarizeAreas(refreshed),
      nextPrompt,
    })
  } catch (error) {
    console.error('[draft/turn]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
