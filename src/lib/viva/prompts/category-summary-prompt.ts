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
import { getCategoryClarityField, getCategoryDreamField, getCategoryContrastField, getCategoryWorryField } from '@/lib/design-system/vision-categories'
import { computeTargetLengthRange, combineTextSources } from '../text-metrics'

export const CATEGORY_SUMMARY_SYSTEM_PROMPT = `${VIVA_PERSONA}

All responses must be in present tense, first person, and vibrationally activating.`

/**
 * Builds the category summary prompt with user data
 */
export function buildCategorySummaryPrompt(
  category: string,
  transcript: string,
  categoryName: string,
  profile: any,
  assessment: any
): string {
  // Get all 4 profile field types for this category
  const clarityField = getCategoryClarityField(category)
  const dreamField = getCategoryDreamField(category)
  const contrastField = getCategoryContrastField(category)
  const worryField = getCategoryWorryField(category)
  
  const profileClarity = profile?.[clarityField]?.trim() || null
  const profileDream = profile?.[dreamField]?.trim() || null
  const profileContrast = profile?.[contrastField]?.trim() || null
  const profileWorry = profile?.[worryField]?.trim() || null

  // Get category-specific assessment responses
  const categoryResponses = assessment?.responses?.filter((r: any) => r.category === category) || []

  // ENHANCED V3: Compute target length range for density preservation
  const assessmentText = categoryResponses.length > 0
    ? flattenAssessmentResponsesNumbered(categoryResponses, false)
    : ''
  
  // Combine all text sources including new profile fields
  const allProfileText = [profileClarity, profileDream, profileContrast, profileWorry]
    .filter(Boolean)
    .join('\n\n')
  const combinedInput = combineTextSources(transcript, allProfileText, assessmentText)
  const lengthRange = computeTargetLengthRange(combinedInput)

  // Build data sections
  let dataSections = ''

  if (transcript && transcript.trim()) {
    dataSections += `## DATA SOURCE 1: User's Current Reflection (Spoken/Written Input)
"${transcript}"

`
  }

  // Add profile clarity and dreams (Positive/Aspirational)
  if (profileClarity || profileDream) {
    dataSections += `## DATA SOURCE 2: User's Profile - Clarity & Dreams (Positive/Aspirational)
`
    if (profileClarity) {
      dataSections += `**What's Going Well:**
"${profileClarity}"

`
    }
    if (profileDream) {
      dataSections += `**Dreams & Aspirations:**
"${profileDream}"

`
    }
  }

  // Add profile contrast and worries (Awareness/Concerns)
  if (profileContrast || profileWorry) {
    dataSections += `## DATA SOURCE 3: User's Profile - Contrast & Worries (Awareness/Concerns)
`
    if (profileContrast) {
      dataSections += `**What's Not Working:**
"${profileContrast}"

`
    }
    if (profileWorry) {
      dataSections += `**Worries & Concerns:**
"${profileWorry}"

`
    }
  }

  if (categoryResponses.length > 0) {
    dataSections += `## DATA SOURCE 4: Assessment Responses (Their Own Answers)
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
1. First, create THREE separate summaries (one for each data source below)
2. Then, combine these summaries to identify what's going well and what's challenging
3. Use their actual words, phrases, and speech patterns throughout - reframe, don't rewrite
4. Preserve ALL distinct themes and ideas mentioned

${dataSections}

## STEP 1: Create Three Separate Summaries

For EACH data source above, create a brief summary that:
- Uses their exact words, phrases, and speech patterns
- Identifies what's going well in their own words
- Identifies what's challenging in their own words
- Maintains their voice, tone, and way of expressing themselves

## STEP 2: Combine Into Final Summary

Combine all three summaries to create one unified view that identifies:

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

