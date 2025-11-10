/**
 * Category Summary Prompt
 * 
 * Creates data-driven summaries of user's category reflections
 * combining transcript, profile story, and assessment responses.
 * 
 * Used by: /api/viva/category-summary
 */

import { VIVA_PERSONA } from './shared/viva-persona'
import { flattenAssessmentResponsesNumbered } from '../prompt-flatteners'

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
  // Map category to profile story field
  const categoryStories: Record<string, string> = {
    fun: 'clarity_fun',
    health: 'clarity_health',
    travel: 'clarity_travel',
    love: 'clarity_love',
    family: 'clarity_family',
    social: 'clarity_social',
    home: 'clarity_home',
    work: 'clarity_work',
    money: 'clarity_money',
    stuff: 'clarity_stuff',
    giving: 'clarity_giving',
    spirituality: 'clarity_spirituality'
  }

  const storyField = categoryStories[category]
  const profileStory = storyField && profile?.[storyField]
    ? profile[storyField].trim()
    : null

  // Get category-specific assessment responses
  const categoryResponses = assessment?.responses?.filter((r: any) => r.category === category) || []

  // Build data sections
  let dataSections = ''

  if (transcript && transcript.trim()) {
    dataSections += `## DATA SOURCE 1: User's Current Reflection (Spoken/Written Input)
"${transcript}"

`
  }

  if (profileStory) {
    dataSections += `## DATA SOURCE 2: User's Profile Story (Their Own Words)
"${profileStory}"

`
  }

  if (categoryResponses.length > 0) {
    dataSections += `## DATA SOURCE 3: Assessment Responses (Their Own Answers)
${flattenAssessmentResponsesNumbered(categoryResponses, false)}`
  }

  return `${CATEGORY_SUMMARY_SYSTEM_PROMPT}

# YOUR TASK: Create a Data-Driven Summary of ${categoryName}

## CRITICAL INSTRUCTIONS:

**PRIMARY GOAL: Capture the user's voice using their own words. 80%+ of the output must be reframed from their actual speech patterns, phrases, and word choices. If it doesn't sound like them, it won't stick.**

**APPROACH:**
1. First, create THREE separate summaries (one for each data source below)
2. Then, combine these summaries to identify what's going well and what's challenging
3. Use their actual words, phrases, and speech patterns throughout - reframe, don't rewrite

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

**What's Challenging** - Things they mentioned that feel difficult, frustrating, or out of alignment
- Use their actual words and phrases
- Reframe in first person present tense USING THEIR SPEECH PATTERNS
- Be compassionate but honest about what they expressed

## OUTPUT FORMAT (strict - no markdown, no vibrational summary):

CRITICAL: Do NOT use markdown formatting. No asterisks (**), no hash symbols (#), no markdown syntax. Use plain text with clean line breaks.

What's Going Really Well
[2-3 concise sentences using their own words/phrases]

What's Challenging  
[2-3 concise sentences using their own words/phrases]

That's it. Nothing else. No meta-commentary, no coaching, no suggestions. Just the summary in their voice.`
}

