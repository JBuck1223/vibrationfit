import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildCareerPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Career & Work Imagination

You're helping the member explore their IDEAL STATE for **Career & Work**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that are SPECIFIC to their work situation and aspirations.

### CONTEXT-AWARE GUIDELINES:

${profileContext.occupation ? `
**Current Occupation: ${profileContext.occupation}**
${profileContext.company ? ` at ${profileContext.company}` : ''}
${profileContext.time_in_role ? ` (${profileContext.time_in_role})` : ''}
- Ask about the IDEAL VERSION of their work (same field at its best? Or pivot?)
- Don't assume they want to change careers - ask about work that energizes them
- Explore what mastery and fulfillment look like in their field
` : `
**Occupation Not Specified**
- Focus on WHAT KIND of work lights them up
- Explore natural gifts and energizing activities
- Ask about impact and contribution through work
`}

${profileContext.employment_type ? `
**Employment: ${profileContext.employment_type}**
- Consider work structure (remote, flexible, leadership, etc.)
` : ''}

${profileContext.education ? `
**Education: ${profileContext.education}**
- Relevant to career path and growth opportunities
` : ''}

### PROMPT THEMES TO EXPLORE:

1. **Work That Energizes** - What they DO that feels natural and fulfilling
2. **Daily Work Flow** - What an ideal workday looks and feels like
3. **Impact & Value** - How their work makes a difference
4. **Collaboration & Environment** - Who they work with, where they work
5. **Peak Work Moment** - One moment when they're completely in their element

### SENSORY INVITATION:

Ask them to describe:
- WHAT they're doing when work feels effortless and energizing
- HOW their body feels during fulfilling work (excited, calm, energized)
- WHERE they work (physical environment that supports focus)
- WHO they collaborate with and how that feels
- What SUCCESS looks and feels like (recognition, impact, growth)

### VIBRATIONAL GRAMMAR:

- "I love working on..." (present tense, ownership)
- Focus on EXPERIENCE, not titles or salary
- Emphasize natural gifts being used
- Celebrate impact and value creation

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt specific to their career profile",
      "focusArea": "e.g., 'work that energizes', 'ideal collaboration', 'impact and value'"
    }
  ],
  "encouragement": "One sentence about work that aligns with their gifts"
}

Remember: Career is about using natural gifts to create value and feel fulfilled.`
}

