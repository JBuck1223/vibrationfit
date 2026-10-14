/**
 * POST /api/vision/draft/start
 *
 * Start Fresh: opens the member's one personal draft for the scratch flow.
 * The member writes "what's going on now" and "unleash your imagination"
 * per area (see /api/vision/draft/area-text); those beats live on the draft
 * session and never touch the draft's vision text until compose-first runs.
 * At that point the old draft text is overwritten, area by area.
 *
 * - Existing personal draft: reuse it. Its session becomes `scratch` mode so
 *   the Update tab can resume here while the draft is still blank.
 * - No draft: insert a blank one (parent_id = active vision if any) with a
 *   `scratch` session; the activation seed prefills the seeded area's beats.
 *
 * Returns { draft, session, existed }.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LIFE_CATEGORY_KEYS, isLifeCategoryKey } from '@/lib/design-system/vision-categories'
import { ensureProgress, loadSeed, markOnboardingStep } from '@/lib/life-activation/progress'
import {
  computeDepth,
  ensureDraftSession,
  loadDraftSession,
  upsertCategoryText,
  type DraftSessionPayload,
} from '@/lib/life-vision/draft-session'
import { summarizeAreas } from '@/lib/life-vision/vision-director'

/** Session + depth + per-area summary. The directed-flow card is fetched by
 *  the client via /api/vision/draft/turn { peek: true } so a page load never
 *  pays for a model call. */
function withCoverage(session: DraftSessionPayload) {
  return {
    session,
    depth: computeDepth(session.notes, session.categoryText),
    areas: summarizeAreas(session),
  }
}

const CATEGORY_COLUMNS = ['forward', ...LIFE_CATEGORY_KEYS, 'conclusion'] as const
const DREAM_KEYS = ['want', 'why', 'feel', 'become'] as const

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existingDraft, error: draftFetchError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_draft', true)
      .eq('is_active', false)
      .is('household_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (draftFetchError) {
      console.error('[draft/start] fetch draft', draftFetchError)
      return NextResponse.json({ error: 'Failed to check existing draft' }, { status: 500 })
    }

    if (existingDraft) {
      const draftHasText = CATEGORY_COLUMNS.some(
        (k) => typeof existingDraft[k] === 'string' && existingDraft[k].trim(),
      )
      let session = await ensureDraftSession(supabase, user.id, String(existingDraft.id), {
        draftHasText,
        mode: 'scratch',
      })
      if (session.mode !== 'scratch') {
        await supabase.from('vision_draft_sessions').update({ mode: 'scratch' }).eq('id', session.id)
        session = { ...session, mode: 'scratch' }
      }
      return NextResponse.json({ draft: existingDraft, ...withCoverage(session), existed: true })
    }

    const [{ data: active }, progress, seed] = await Promise.all([
      supabase
        .from('vision_versions')
        .select('id, perspective')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .is('household_id', null)
        .maybeSingle(),
      ensureProgress(supabase, user.id),
      loadSeed(supabase, user.id),
    ])

    const blank: Record<string, string> = {}
    for (const key of CATEGORY_COLUMNS) blank[key] = ''

    const now = new Date().toISOString()
    const { data: draft, error: createError } = await supabase
      .from('vision_versions')
      .insert({
        user_id: user.id,
        household_id: null,
        title: 'Life Vision Draft',
        perspective: active?.perspective === 'plural' ? 'plural' : 'singular',
        ...blank,
        is_active: false,
        is_draft: true,
        parent_id: active?.id ?? null,
        refined_categories: [],
        richness_metadata: seed.activationId ? { source_activation_id: seed.activationId } : {},
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single()

    if (createError || !draft) {
      console.error('[draft/start] create draft', createError)
      return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 })
    }

    const session = await ensureDraftSession(supabase, user.id, String(draft.id), {
      seed,
      draftHasText: false,
      mode: 'scratch',
    })

    // Activation words land in the seeded area's beats so the row opens with
    // their own text already there.
    if (seed.category && isLifeCategoryKey(seed.category)) {
      const nowText = seed.currentState?.trim() || ''
      const dreamParts: string[] = []
      if (seed.dreamResponse) {
        for (const key of DREAM_KEYS) {
          const value = seed.dreamResponse[key]?.trim()
          if (value) dreamParts.push(value)
        }
      }
      const vision = seed.visionStatement?.trim()
      if (vision) dreamParts.push(vision)
      const dreamText = dreamParts.join('\n\n')
      if (nowText || dreamText) {
        await upsertCategoryText(supabase, session.id, seed.category, {
          ...(nowText ? { now_text: nowText, now_at: now } : {}),
          ...(dreamText ? { dream_text: dreamText, dream_at: now } : {}),
        })
      }
    }

    // Keep the /begin dashboard pointed at this draft.
    if (!progress.onboarding.welcome) {
      await markOnboardingStep(supabase, user.id, 'welcome', {
        draft_vision_id: draft.id,
        source_activation_id: seed.activationId,
      })
    } else {
      await supabase
        .from('life_activation_progress')
        .update({
          draft_vision_id: draft.id,
          source_activation_id: seed.activationId || progress.source_activation_id,
          updated_at: now,
        })
        .eq('id', progress.id)
    }

    const fresh = (await loadDraftSession(supabase, String(draft.id))) ?? session
    return NextResponse.json({ draft, ...withCoverage(fresh), existed: false })
  } catch (error) {
    console.error('[draft/start]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
