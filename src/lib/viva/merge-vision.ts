// ============================================================================
// Household Vision Merge Synthesis
// ============================================================================
// Blends two members' personal life vision sections into one shared
// household vision written in first-person plural ("we/our").

import OpenAI from 'openai'
import { trackTokenUsage } from '@/lib/tokens/tracking'

// Synthesis needs to faithfully weave two voices together; use the full
// model rather than mini for quality.
const MERGE_MODEL = 'gpt-4o'

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function buildMergeSystemPrompt(name1: string, name2: string): string {
  return [
    `You merge two household members' personal life vision texts into one shared household vision. The members are ${name1} and ${name2}.`,
    '',
    'You will receive both members\' versions of the same life category. Weave them into a single cohesive text written in first-person plural ("we/our"):',
    '- Include the desires, details, and imagery from BOTH versions. Where they overlap, unify into one statement. Where they differ, keep both — they are complementary parts of the shared vision, never contradictions.',
    '- Rewrite all first-person singular language (I, me, my) into plural (we, us, our).',
    `- When a version mentions the other member by name (e.g. "${name2} and I"), fold it into "we"/"us"/"our". When one member is the object of the other's action or feeling (e.g. "I love watching ${name2} smile"), rephrase into natural mutual phrasing (e.g. "we love watching each other smile").`,
    '- If an activity or practice appears in only one member\'s version and is clearly individual rather than shared, keep it and attribute it to that member by name. Only use activities that actually appear in the provided texts.',
    '- Keep every other name exactly as written (children, friends, pets, places, businesses).',
    '- Preserve the present-tense, positive, ideal-state tone of the source texts and their paragraph structure.',
    '- Aim for roughly the length of the longer version; do not pad, repeat, or invent new content that appears in neither version.',
    '- If one version is empty, simply rewrite the other into "we/our" perspective.',
    '',
    'Return only the merged text, with no commentary, headers, or formatting wrappers.',
  ].join('\n')
}

export interface MergeVisionResult {
  /** Section key -> merged text (falls back to the longer source on failure). */
  sections: Record<string, string>
  /** Sections that were successfully synthesized by the AI. */
  mergedSections: string[]
  /** Sections that fell back to the longer source text due to an error. */
  failedSections: string[]
}

/**
 * Synthesize two members' vision sections into shared "we/our" sections.
 * Sections run in parallel; any individual failure falls back to the longer
 * of the two source texts so the merge never blocks on the AI step.
 */
export async function mergeVisionSections(params: {
  /** Section key -> [member1 text, member2 text] */
  sections: Record<string, [string, string]>
  memberName1: string
  memberName2: string
  /** Acting user, for token usage attribution. */
  userId: string
}): Promise<MergeVisionResult> {
  const { sections, memberName1, memberName2, userId } = params
  const openai = getOpenAI()
  const systemPrompt = buildMergeSystemPrompt(memberName1, memberName2)

  const result: MergeVisionResult = {
    sections: {},
    mergedSections: [],
    failedSections: [],
  }

  let totalInputTokens = 0
  let totalOutputTokens = 0

  await Promise.all(
    Object.entries(sections).map(async ([key, [text1, text2]]) => {
      const t1 = (text1 || '').trim()
      const t2 = (text2 || '').trim()
      const fallback = t1.length > t2.length ? t1 : t2
      result.sections[key] = fallback

      if (!t1 && !t2) return

      const userPrompt = [
        `${memberName1}'s version:`,
        t1 || '(empty)',
        '',
        `${memberName2}'s version:`,
        t2 || '(empty)',
      ].join('\n')

      try {
        const response = await openai.chat.completions.create({
          model: MERGE_MODEL,
          temperature: 0.4,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        })
        const merged = response.choices[0]?.message?.content?.trim()
        if (!merged) throw new Error('Empty completion')
        result.sections[key] = merged
        result.mergedSections.push(key)
        totalInputTokens += response.usage?.prompt_tokens || 0
        totalOutputTokens += response.usage?.completion_tokens || 0
      } catch (err) {
        console.error(`[Merge] Synthesis failed for section "${key}", using longer source text:`, err)
        result.failedSections.push(key)
      }
    })
  )

  if (totalInputTokens + totalOutputTokens > 0) {
    await trackTokenUsage({
      user_id: userId,
      action_type: 'vision_refinement',
      model_used: MERGE_MODEL,
      tokens_used: totalInputTokens + totalOutputTokens,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      success: result.failedSections.length === 0,
      metadata: {
        feature: 'merge_visions_synthesis',
        sections_merged: result.mergedSections.length,
        sections_failed: result.failedSections.length,
      },
    }).catch(err => console.error('[Merge] Failed to track token usage:', err))
  }

  return result
}
