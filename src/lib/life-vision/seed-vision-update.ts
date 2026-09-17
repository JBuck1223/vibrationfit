import type { SupabaseClient } from '@supabase/supabase-js'
import { VISION_UPDATE_CLOSE, VISION_UPDATE_OPEN_PREFIX, VISION_UPDATE_OPEN_SUFFIX } from '@/lib/viva/prompts/vision-update-prompts'
import { ensureVisionDraft } from '@/lib/manifestations/kit-helpers'
import { getVisionCategoryLabel, isLifeCategoryKey, type VisionCategoryKey } from '@/lib/design-system/vision-categories'

export type VisionUpdateSeedProposal = {
  category: string
  content: string
}

export function frameVisionUpdateSeedMessage(input: {
  intro: string
  proposals: VisionUpdateSeedProposal[]
}): string {
  const blocks = input.proposals
    .filter((p) => isLifeCategoryKey(p.category) && p.content.trim())
    .map((p) => (
      `${VISION_UPDATE_OPEN_PREFIX}${p.category}${VISION_UPDATE_OPEN_SUFFIX}\n${p.content.trim()}\n${VISION_UPDATE_CLOSE}`
    ))
  return [input.intro.trim(), ...blocks].filter(Boolean).join('\n\n')
}

export async function seedVisionUpdateProposals(
  supabase: SupabaseClient,
  userId: string,
  proposals: VisionUpdateSeedProposal[],
): Promise<{ success: true; link: string; draftId: string } | { success: false; message: string }> {
  const valid = proposals.filter((p) => isLifeCategoryKey(p.category) && p.content.trim())
  if (valid.length === 0) {
    return { success: false, message: 'Nothing to propose — I need at least one category with text.' }
  }

  const draft = await ensureVisionDraft(supabase, userId)
  if ('error' in draft) return { success: false, message: draft.error }

  let { data: session } = await supabase
    .from('conversation_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('mode', 'vision_update')
    .eq('vision_id', draft.id)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) {
    const { data: created, error } = await supabase
      .from('conversation_sessions')
      .insert({
        user_id: userId,
        mode: 'vision_update',
        vision_id: draft.id,
        title: 'Vision Update',
        preview_message: 'Proposed Life Vision updates from VIVA chat',
        message_count: 1,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (error || !created) {
      return { success: false, message: 'Could not open Life Vision Update.' }
    }
    session = created
  }

  const labels = valid.map((p) => getVisionCategoryLabel(p.category as VisionCategoryKey)).join(', ')
  const message = frameVisionUpdateSeedMessage({
    intro: `I proposed updates to ${labels}. Review each one — accept, edit, or discard — before they touch your draft.`,
    proposals: valid,
  })

  const { error: messageError } = await supabase.from('ai_conversations').insert({
    user_id: userId,
    conversation_id: session.id,
    role: 'assistant',
    message,
    context: { mode: 'vision_update', draft_id: draft.id, seeded_from: 'viva_coach' },
  })
  if (messageError) {
    console.error('[VIVA] seed vision update failed:', messageError)
    return { success: false, message: 'Could not seed the Life Vision proposals.' }
  }

  await supabase
    .from('conversation_sessions')
    .update({
      last_message_at: new Date().toISOString(),
      preview_message: `Proposed updates: ${labels}`,
    })
    .eq('id', session.id)

  return { success: true, link: '/life-vision/update', draftId: draft.id }
}
