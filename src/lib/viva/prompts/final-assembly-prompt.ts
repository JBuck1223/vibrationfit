/**
 * Final Assembly Prompt
 * 
 * Step 6: Generates Forward and Conclusion sections, tests vibrational grammar
 * consistency across the assembled vision, and ensures all categories harmonize.
 * 
 * Used by: /api/viva/final-assembly (Step 6 of overall flow)
 */

import { VIVA_PERSONA_WITH_GOLDEN_RULES } from './shared/viva-persona'

/**
 * Builds the final assembly prompt for Forward/Conclusion generation
 * 
 * @param assembledVision - The complete 12-category vision text from Step 5
 * @param userProfile - User profile data for personalization
 * @param assessmentSummary - Assessment summary for context
 * @returns Complete prompt for final assembly
 */
export function buildFinalAssemblyPrompt(
  assembledVision: string,
  userProfile: any,
  assessmentSummary: any
): string {
  const firstName = userProfile?.first_name || 'friend'
  const age = userProfile?.date_of_birth
    ? new Date().getFullYear() - new Date(userProfile.date_of_birth).getFullYear()
    : null
  const location = userProfile?.city && userProfile?.state
    ? `${userProfile.city}, ${userProfile.state}`
    : null
  const occupation = userProfile?.occupation || null

  return `${VIVA_PERSONA_WITH_GOLDEN_RULES}

# YOUR TASK: Final Polish & Bookends for ${firstName}'s Complete Life Vision

You are completing the **final assembly** of ${firstName}'s Life Vision Document.

The 12 core category sections have already been created and assembled. Now you need to:
1. Generate a personal **Forward** section (introduction/opening)
2. Generate a powerful **Conclusion** section (closure/empowerment)
3. Test the assembled vision for vibrational grammar consistency
4. Ensure all categories harmonize

## ASSEMBLED VISION (12 Categories - Already Complete):

${assembledVision}

## ABOUT ${firstName.toUpperCase()}:

${age ? `- Age: ${age}` : ''}
${location ? `- Location: ${location}` : ''}
${occupation ? `- Occupation: ${occupation}` : ''}
${assessmentSummary?.overall_percentage ? `- Overall Alignment: ${assessmentSummary.overall_percentage}%` : ''}
${assessmentSummary?.green_line_status ? `- Green Line Status: ${assessmentSummary.green_line_status}` : ''}

## YOUR TASKS:

### 1. Generate FORWARD Section (2-3 paragraphs)

The Forward is ${firstName}'s personal introduction to their Life Vision. It should:

**Content:**
- Welcome them into their vision with warmth and recognition
- Acknowledge the journey they've taken to create this document
- Set the context for why this vision matters
- Reference 1-2 specific themes that emerged across their categories
- Be personal but not overly intimate - it's for THEM to read

**Tone:**
- Warm, wise, empowering
- Present-tense when describing the vision itself
- Grounded and believable (not hypey or generic)
- Should feel like a trusted guide speaking directly to them

**Structure:**
- Paragraph 1: Welcome + acknowledgment of their journey
- Paragraph 2: What this vision represents for them (themes across categories)
- Paragraph 3: How to use this document (it's a living guide)

**Example tone (adapt to ${firstName}):**
"Welcome to your Life Vision, ${firstName}. This document is the culmination of deep reflection, honest assessment, and courageous imagination. It represents who you are choosing to be and how you are choosing to live. As you read through these pages, you'll notice themes that weave through your life—[specific theme from their vision]—creating a tapestry that is unmistakably yours. This is your North Star, your decision filter, your reminder of what matters most."

### 2. Generate CONCLUSION Section (2-3 paragraphs)

The Conclusion closes the vision document with empowerment and clarity. It should:

**Content:**
- Affirm that this vision is already accessible to them
- Remind them this is a living document (not set in stone)
- Offer 1-2 specific suggestions for next steps (without being prescriptive)
- Close with empowering present-tense statement

**Tone:**
- Celebratory but grounded
- Empowering without being preachy
- Future-ready but present-focused
- Should leave them feeling energized and clear

**Structure:**
- Paragraph 1: Affirmation that this vision is real and accessible now
- Paragraph 2: Reminder it's a living document + how to work with it
- Paragraph 3: Empowering closing statement

**Example tone (adapt to ${firstName}):**
"This vision is not someday—it begins now, in the small choices and clear intentions you bring to each day. Some aspects are already alive in your life, waiting to be noticed and nourished. Others are emerging, revealing themselves in moments of alignment. This document will evolve as you do. Return to it when you need clarity, when you're making big decisions, or simply when you want to remember who you are choosing to be. You have everything you need to live this life, ${firstName}. Trust yourself. Trust the timing. Trust the journey."

### 3. Test Vibrational Grammar Consistency

Review the assembled vision and identify any violations of vibrational grammar:

**Check for:**
- Comparative language ("used to... but now", "no longer", "will someday")
- Lack language ("I don't", "I want", "I wish", "I hope to", "I will")
- Past-tense references that imply "not yet" energy
- Future-conditional phrasing ("when I finally", "once I")
- "But/however/even though" constructions

**Note:** You don't need to rewrite the vision - just flag any issues for the harmonization_notes

### 4. Check for Harmony Across Categories

Ensure categories reference and support each other:

**Check that:**
- Work mentions how it affects money, health, family
- Money references giving, stuff, experiences from travel/fun
- Health connects to energy for work, presence with family, travel adventures
- Love/family/social create coherent relationship landscape

**Note:** Look for opportunities where categories could be MORE integrated (not rewrite, just note)

## OUTPUT FORMAT:

Return strict JSON:

{
  "forward": "2-3 paragraphs of personalized introduction (as text, not array)",
  "conclusion": "2-3 paragraphs of empowering closure (as text, not array)",
  "harmonizationNotes": [
    "Specific note about vibrational grammar issue or harmony opportunity",
    "Another specific observation"
  ]
}

## CRITICAL REQUIREMENTS:

1. **Voice Match**: Forward and Conclusion should match ${firstName}'s voice from the assembled vision
2. **Present-Tense**: Both sections should be primarily present-tense
3. **Specific**: Reference actual themes from their vision (not generic)
4. **Brief**: Forward = 150-250 words, Conclusion = 150-250 words
5. **Honest Harmonization**: If grammar/harmony is perfect, say so. If not, be specific about issues.

Generate the final assembly components now.`
}

