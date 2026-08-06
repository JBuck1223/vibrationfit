// ============================================================================
// Household Vision Pluralization
// ============================================================================
// Rewrites personal life vision sections ("I/my", partner referenced by name)
// into shared household perspective ("we/our") when converting a personal
// vision to a household vision.

import OpenAI from 'openai'
import { trackTokenUsage } from '@/lib/tokens/tracking'

const PLURALIZE_MODEL = 'gpt-4o-mini'

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function buildSystemPrompt(memberFirstNames: string[]): string {
  const names = memberFirstNames.filter(Boolean)
  const namesLine = names.length > 0
    ? `The household members sharing this vision are: ${names.join(' and ')}.`
    : 'The vision is shared by the members of a household (typically a couple).'

  return [
    'You convert a member\'s personal life vision text into a shared household vision.',
    namesLine,
    '',
    'Rewrite the text from first-person singular to first-person plural:',
    '- I -> we, me -> us, my -> our, mine -> ours, myself -> ourselves.',
    '- When the text mentions a household member by name together with the writer (e.g. "Jordan and I"), fold them into "we"/"us"/"our".',
    '- When a household member is the object of the writer\'s action or feeling (e.g. "I love watching Jordan smile"), rephrase into natural mutual phrasing (e.g. "we love watching each other smile") while preserving the intent.',
    '- Keep every other name exactly as written (children, friends, pets, places, businesses).',
    '',
    'Preserve the meaning, tone, tense, level of detail, and the exact paragraph and line-break structure.',
    'Do not add, remove, summarize, or reorder content beyond what the perspective change requires.',
    'Return only the rewritten text, with no commentary or formatting wrappers.',
  ].join('\n')
}

export interface PluralizeVisionResult {
  /** Section key -> rewritten text (falls back to original on failure). */
  sections: Record<string, string | null>
  /** Sections that were successfully rewritten. */
  pluralizedSections: string[]
  /** Sections that fell back to the original text due to an error. */
  failedSections: string[]
}

/**
 * Rewrite vision sections into "we/our" household perspective.
 * Sections are processed in parallel; any individual failure falls back to
 * the original text so conversion never blocks on the AI step.
 */
export async function pluralizeVisionSections(params: {
  sections: Record<string, string | null>
  memberFirstNames: string[]
  /** Acting user, for token usage attribution. */
  userId: string
  visionId?: string
}): Promise<PluralizeVisionResult> {
  const { sections, memberFirstNames, userId, visionId } = params
  const openai = getOpenAI()
  const systemPrompt = buildSystemPrompt(memberFirstNames)

  const result: PluralizeVisionResult = {
    sections: { ...sections },
    pluralizedSections: [],
    failedSections: [],
  }

  let totalInputTokens = 0
  let totalOutputTokens = 0

  await Promise.all(
    Object.entries(sections).map(async ([key, text]) => {
      if (!text || !text.trim()) return
      try {
        const response = await openai.chat.completions.create({
          model: PLURALIZE_MODEL,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
        })
        const rewritten = response.choices[0]?.message?.content?.trim()
        if (!rewritten) throw new Error('Empty completion')
        result.sections[key] = rewritten
        result.pluralizedSections.push(key)
        totalInputTokens += response.usage?.prompt_tokens || 0
        totalOutputTokens += response.usage?.completion_tokens || 0
      } catch (err) {
        console.error(`[Pluralize] Failed for section "${key}", keeping original text:`, err)
        result.failedSections.push(key)
      }
    })
  )

  if (totalInputTokens + totalOutputTokens > 0) {
    await trackTokenUsage({
      user_id: userId,
      action_type: 'vision_refinement',
      model_used: PLURALIZE_MODEL,
      tokens_used: totalInputTokens + totalOutputTokens,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      success: result.failedSections.length === 0,
      metadata: {
        feature: 'convert_to_household_pluralization',
        vision_id: visionId,
        sections_pluralized: result.pluralizedSections.length,
        sections_failed: result.failedSections.length,
      },
    }).catch(err => console.error('[Pluralize] Failed to track token usage:', err))
  }

  return result
}
