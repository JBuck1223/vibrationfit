/**
 * Category Summary Prompt
 * 
 * Creates data-driven summaries of user's category reflections
 * combining transcript, profile story, and assessment responses.
 * 
 * ENHANCED V3: Now includes density awareness to match input richness
 * 
 * Used by: /api/viva/category-summary
 */

import { VIVA_PERSONA } from './shared/viva-persona'
import { flattenAssessmentResponsesNumbered } from '../prompt-flatteners'
import { getCategoryStateField, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { computeTargetLengthRange, combineTextSources } from '../text-metrics'

export const CATEGORY_SUMMARY_SYSTEM_PROMPT = `${VIVA_PERSONA}

All responses must be in present tense, first person, and vibrationally activating.`

/**
 * Builds the category summary prompt with user data
 */
export function buildCategorySummaryPrompt(
  category: LifeCategoryKey | string,
  transcript: string,
  categoryName: string,
  profile: any,
  assessment: any
): string {
  // Get state profile field for this category
  const stateField = getCategoryStateField(category as LifeCategoryKey)
  const profileState = profile?.[stateField]?.trim() || null

  // Get category-specific assessment responses
  const categoryResponses = assessment?.responses?.filter((r: any) => r.category === category) || []

  // ENHANCED V3: Compute target length range for density preservation
  const assessmentText = categoryResponses.length > 0
    ? flattenAssessmentResponsesNumbered(categoryResponses, false)
    : ''
  
  const allProfileText = profileState || ''
  const combinedInput = combineTextSources(transcript, allProfileText, assessmentText)
  const lengthRange = computeTargetLengthRange(combinedInput)

  // Build data sections
  let dataSections = ''

  if (transcript && transcript.trim()) {
    dataSections += `## DATA SOURCE 1: User's Current Reflection (Spoken/Written Input)
"${transcript}"

`
  }

  if (profileState) {
    dataSections += `## DATA SOURCE 2: User's Profile - Current State
**Current State of ${categoryName}:**
"${profileState}"

`
  }

  if (categoryResponses.length > 0) {
    dataSections += `## DATA SOURCE 3: Assessment Responses (Their Own Answers)
${assessmentText}`
  }

  return `${CATEGORY_SUMMARY_SYSTEM_PROMPT}

# YOUR TASK: Create a Data-Driven Summary of ${categoryName}

## CRITICAL INSTRUCTIONS:

**PRIMARY GOAL: Capture the user's voice using their own words. 80%+ of the output must be reframed from their actual speech patterns, phrases, and word choices. If it doesn't sound like them, it won't stick.**

**DENSITY PRESERVATION (CRITICAL):**
- Combined input length: ${lengthRange.inputChars} characters (${lengthRange.inputWords} words)
- Target output length: ${lengthRange.minChars}-${lengthRange.maxChars} characters to match input richness
- Match the density and variety of concepts in their input
- If they mention many areas, include them ALL
- Do NOT compress or simplify - preserve their breadth of expression
- Aim for 90-110% of input length to maintain detail level

**APPROACH:**
1. First, create a separate summary for each data source below
2. Then, combine these summaries to identify what's going well and what's challenging
3. Use their actual words, phrases, and speech patterns throughout - reframe, don't rewrite
4. Preserve ALL distinct themes and ideas mentioned

${dataSections}

## STEP 1: Create Separate Summaries

For EACH data source above, create a brief summary that:
- Uses their exact words, phrases, and speech patterns
- Identifies from their current state description what's going well
- Identifies from their current state description what's challenging
- Maintains their voice, tone, and way of expressing themselves

## STEP 2: Combine Into Final Summary

Combine all summaries to create one unified view that identifies:

**What's Going Really Well** - Things they mentioned that feel positive, aligned, or working well
- Extract their actual words and phrases
- Reframe in first person present tense USING THEIR SPEECH PATTERNS
- Be specific and grounded in what they actually said
- Include ALL positive themes they mentioned - don't consolidate or simplify

**What's Challenging** - Things they mentioned that feel difficult, frustrating, or out of alignment
- Use their actual words and phrases
- Reframe in first person present tense USING THEIR SPEECH PATTERNS
- Be compassionate but honest about what they expressed
- Include ALL challenges they mentioned - don't consolidate or simplify

## OUTPUT FORMAT (strict - no markdown, no vibrational summary):

CRITICAL: Do NOT use markdown formatting. No asterisks (**), no hash symbols (#), no markdown syntax. Use plain text with clean line breaks.

What's Going Really Well
[2-4 sentences using their own words/phrases - length scales with input richness]
[Target: ${Math.floor(lengthRange.minChars * 0.5)}-${Math.floor(lengthRange.maxChars * 0.5)} characters for this section]

What's Challenging  
[2-4 sentences using their own words/phrases - length scales with input richness]
[Target: ${Math.floor(lengthRange.minChars * 0.5)}-${Math.floor(lengthRange.maxChars * 0.5)} characters for this section]

That's it. Nothing else. No meta-commentary, no coaching, no suggestions. Just the summary in their voice.

REMEMBER: If they provided lots of detail, your summary should reflect that richness. Don't shrink abundant input into generic statements.`
}

