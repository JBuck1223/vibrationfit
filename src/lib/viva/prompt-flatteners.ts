/**
 * ============================
 *   Token-Aware Prompt Flatteners
 * ============================
 * 
 * These utilities flatten profile and assessment data into efficient,
 * token-aware formats for AI prompts.
 * 
 * Used across all VIVA endpoints to ensure consistent, efficient
 * data formatting while preserving key information.
 */

/**
 * Truncates values to max length for token efficiency
 */
export function ellipsize(val: any, max = 220): string {
  const s = typeof val === 'string' ? val : String(val ?? '')
  return s.length > max ? `${s.slice(0, max)}…` : s
}

/**
 * Flattens ANY profile object into lean key:value lines.
 * - Skips null/empty/system fields
 * - Excludes _story fields (handled separately)
 * - Joins arrays into comma-separated strings
 * - Caps total lines for token safety
 * 
 * @param profile - Profile object to flatten
 * @param maxFields - Maximum number of fields to include (default: 200)
 * @returns Formatted string of key:value pairs
 */
export function flattenProfile(profile: Record<string, any> = {}, maxFields = 200): string {
  const omit = new Set(['id', 'user_id', 'created_at', 'updated_at', 'completion_percentage'])
  const lines = Object.entries(profile)
    .filter(([k, v]) => !omit.has(k) && v !== null && v !== undefined && v !== '' && !k.includes('_story'))
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? ellipsize(v.join(', ')) : ellipsize(v)}`)
  return lines.slice(0, maxFields).join('\n')
}

/**
 * Flattens assessment into compact text
 * - Keeps overall/category scores (note: never ask the model to output scores)
 * - Converts Q&A to lightweight lines
 * - Removes any "green line"/signals entirely
 * 
 * @param assessment - Assessment object with responses
 * @param maxQA - Maximum number of Q&A pairs to include (default: 300)
 * @returns Formatted string with scores and Q&A pairs
 */
export function flattenAssessment(assessment: any = {}, maxQA = 300): string {
  const header: string[] = []
  if (assessment.overall_percentage !== undefined) {
    header.push(`- overall_percentage: ${assessment.overall_percentage}`)
  }
  if (assessment.category_scores) {
    header.push(`- category_scores: ${JSON.stringify(assessment.category_scores)}`)
  }

  const qas = (assessment.responses ?? [])
    .slice(0, maxQA)
    .map((r: any, i: number) => {
      const cat = r?.category ? ` (${r.category})` : ''
      const q = ellipsize(r?.question_text ?? '', 240)
      const a = ellipsize(r?.response_text ?? '', 280)
      return `#${i + 1}${cat}\nQ: ${q}\nA: ${a}`
    })

  return [header.join('\n'), qas.join('\n')].filter(Boolean).join('\n')
}

/**
 * Flattens assessment with green line and score details
 * Used when you need to show scoring context to the AI model
 * 
 * @param assessment - Assessment object with responses
 * @param maxQA - Maximum number of Q&A pairs to include (default: 300)
 * @returns Formatted string with scores, Q&A pairs, and green line info
 */
export function flattenAssessmentWithScores(assessment: any = {}, maxQA = 300): string {
  const header: string[] = []
  if (assessment.overall_percentage !== undefined) {
    header.push(`- overall_percentage: ${assessment.overall_percentage}`)
  }
  if (assessment.category_scores) {
    header.push(`- category_scores: ${JSON.stringify(assessment.category_scores)}`)
  }

  const qas = (assessment.responses ?? [])
    .slice(0, maxQA)
    .map((r: any, i: number) => {
      const cat = r?.category ? ` (${r.category})` : ''
      const q = ellipsize(r?.question_text ?? '', 240)
      const a = ellipsize(r?.response_text ?? '', 280)
      const score = r?.response_value ?? 0
      const greenLine = r?.green_line
      const greenLineText = greenLine ? ` | Green Line: ${greenLine === 'above' ? 'Above (aligned)' : 'Below (needs work)'}` : ''
      return `#${i + 1}${cat}\nQ: ${q}\nA: ${a}\nScore: ${score}/5${greenLineText}`
    })

  return [header.join('\n'), qas.join('\n')].filter(Boolean).join('\n')
}

/**
 * Flattens assessment responses with numbered format (1., 2., etc.)
 * Used in prompt-suggestions and chat routes
 * 
 * @param responses - Array of assessment responses
 * @param includeCategory - Whether to show category in numbering
 * @returns Formatted string with numbered Q&A pairs
 */
export function flattenAssessmentResponsesNumbered(
  responses: any[] = [],
  includeCategory = false
): string {
  return responses
    .map((r, idx) => {
      const cat = includeCategory && r?.category ? ` (${r.category})` : ''
      const q = ellipsize(r?.question_text ?? '', 240)
      const a = ellipsize(r?.response_text ?? '', 280)
      const score = r?.response_value ?? 0
      const greenLine = r?.green_line
      const greenLineText = greenLine ? ` | Green Line: ${greenLine === 'above' ? 'Above (aligned)' : 'Below (needs work)'}` : ''
      return `${idx + 1}. Q: ${q}${cat}\n   A: ${a}\n   Score: ${score}/5${greenLineText}`
    })
    .join('\n\n')
}

/**
 * Flattens profile stories (category-specific user narratives)
 * Used when you need just the story fields, not all profile data
 * 
 * @param profile - Profile object with _story fields
 * @param categories - Array of category keys to include (default: all)
 * @returns Formatted string with category stories
 */
export function flattenProfileStories(
  profile: Record<string, any> = {},
  categories: string[] = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality']
): string {
  const stories = categories
    .map(cat => {
      const storyKey = `${cat}_story`
      const story = profile[storyKey]
      if (!story || story.trim().length === 0) return null
      return `## ${cat}\n${ellipsize(story, 500)}`
    })
    .filter((s): s is string => s !== null)
  
  return stories.join('\n\n')
}

