import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'
import { ensureProgress, loadSeed, markOnboardingStep } from '@/lib/life-activation/progress'

const CATEGORY_COLUMNS = [
  'forward',
  ...LIFE_CATEGORY_KEYS,
  'conclusion',
] as const

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const progress = await ensureProgress(supabase, user.id)
    const seed = await loadSeed(supabase, user.id)

    if (progress.draft_vision_id) {
      const { data: existing } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', progress.draft_vision_id)
        .eq('is_draft', true)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ draft: existing, existed: true, seed })
      }
    }

    const { data: openDraft } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_draft', true)
      .eq('is_active', false)
      .is('household_id', null)
      .maybeSingle()

    if (openDraft) {
      if (!progress.onboarding.welcome) {
        await markOnboardingStep(supabase, user.id, 'welcome', {
          draft_vision_id: openDraft.id,
          source_activation_id: seed.activationId,
        })
      } else {
        await supabase
          .from('life_activation_progress')
          .update({
            draft_vision_id: openDraft.id,
            source_activation_id: seed.activationId || progress.source_activation_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', progress.id)
      }
      return NextResponse.json({ draft: openDraft, existed: true, seed })
    }

    const visionData: Record<string, string> = {}
    for (const key of CATEGORY_COLUMNS) {
      visionData[key] = ''
    }

    if (seed.category && seed.visionStatement && LIFE_CATEGORY_KEYS.includes(seed.category as typeof LIFE_CATEGORY_KEYS[number])) {
      visionData[seed.category] = seed.visionStatement
    }

    const { data: categoryState } = await supabase
      .from('vision_new_category_state')
      .select('category, category_vision_text')
      .eq('user_id', user.id)

    for (const row of categoryState || []) {
      const key = row.category as string
      if (
        CATEGORY_COLUMNS.includes(key as typeof CATEGORY_COLUMNS[number]) &&
        row.category_vision_text &&
        !visionData[key]
      ) {
        visionData[key] = row.category_vision_text
      }
    }

    const { data: draft, error } = await supabase
      .from('vision_versions')
      .insert({
        user_id: user.id,
        title: 'Life Vision Draft',
        ...visionData,
        is_draft: true,
        is_active: false,
        richness_metadata: seed.activationId
          ? { source_activation_id: seed.activationId }
          : {},
        perspective: 'singular',
      })
      .select('*')
      .single()

    if (error || !draft) {
      console.error('[create-from-activation]', error)
      return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 })
    }

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
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id)
    }

    return NextResponse.json({ draft, existed: false, seed })
  } catch (error) {
    console.error('[create-from-activation]', error)
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 })
  }
}
