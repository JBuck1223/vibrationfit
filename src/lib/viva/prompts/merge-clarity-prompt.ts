/**
 * Merge Clarity Prompt
 * 
 * Used to merge two clarity statements into a unified, coherent clarity statement
 * that preserves 80%+ of the user's original words.
 * 
 * Used by: /api/viva/merge-clarity
 */

import { VIVA_PERSONA } from './shared/viva-persona'

export const MERGE_CLARITY_SYSTEM_PROMPT = `${VIVA_PERSONA}

Your task is to merge two clarity texts, keeping 80%+ of the user's original words intact.
The result should be a unified, coherent clarity statement that combines both inputs naturally.`

/**
 * Builds the user prompt for merging clarity statements
 */
export function buildMergeClarityPrompt(params: {
  currentClarity: string
  clarityFromContrast: string
  category: string
  categoryName: string
}): string {
  const { currentClarity, clarityFromContrast, category, categoryName } = params

  return `Merge the following two clarity statements for ${categoryName}, keeping 80%+ of the user's original words intact. Create a unified, coherent clarity statement that flows naturally.

CURRENT CLARITY:
${currentClarity || '(none provided)'}

CLARITY FROM CONTRAST:
${clarityFromContrast || '(none provided)'}

Merge these into a single, unified clarity statement that:
- Preserves 80%+ of the user's original words from both inputs
- Flows naturally and coherently
- Maintains present tense, first person
- Is vibrationally activating and specific
- Combines the best elements from both inputs without redundancy

Return only the merged clarity statement, no explanation or commentary.`
}

