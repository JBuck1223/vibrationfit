/**
 * Merge State Prompt
 * 
 * Used to merge two state texts into a unified, coherent state description
 * that preserves 80%+ of the user's original words.
 * (e.g., merging an existing state with a recording transcript)
 * 
 * Used by: /api/viva/merge-clarity (legacy), /api/viva/merge-state
 */

import { VIVA_PERSONA } from './shared/viva-persona'

export const MERGE_STATE_SYSTEM_PROMPT = `${VIVA_PERSONA}

Your task is to merge two state texts, keeping 80%+ of the user's original words intact.
The result should be a unified, coherent state description that combines both inputs naturally.`

/** @deprecated Use MERGE_STATE_SYSTEM_PROMPT instead */
export const MERGE_CLARITY_SYSTEM_PROMPT = MERGE_STATE_SYSTEM_PROMPT

/**
 * Builds the user prompt for merging state texts
 */
export function buildMergeStatePrompt(params: {
  currentState: string
  newStateText: string
  category: string
  categoryName: string
}): string {
  const { currentState, newStateText, category, categoryName } = params

  return `Merge the following two state descriptions for ${categoryName}, keeping 80%+ of the user's original words intact. Create a unified, coherent state description that flows naturally.

CURRENT STATE:
${currentState || '(none provided)'}

NEW STATE INPUT:
${newStateText || '(none provided)'}

Merge these into a single, unified state description that:
- Preserves 80%+ of the user's original words from both inputs
- Flows naturally and coherently
- Maintains present tense, first person
- Is vibrationally activating and specific
- Combines the best elements from both inputs without redundancy

Return only the merged state description, no explanation or commentary.`
}

/** @deprecated Use buildMergeStatePrompt instead */
export const buildMergeClarityPrompt = buildMergeStatePrompt
