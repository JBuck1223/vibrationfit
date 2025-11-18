import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildWildcardPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Wildcard Imagination

You're helping the member explore their IDEAL STATE for **Wildcard** - the area of life THEY define.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that honor WHATEVER life area they've chosen as their Wildcard.

### CONTEXT-AWARE GUIDELINES:

- The Wildcard category is MEMBER-DEFINED
- It could be: Creativity, Education, Adventure, Hobbies, Pets, Community, Legacy, etc.
- Read their Step 1 clarity carefully to understand what THIS category means to them
- Tailor all prompts to THEIR specific Wildcard focus

### IMPORTANT APPROACH:

1. **Identify Their Wildcard Theme** from Step 1 clarity
2. **Generate prompts SPECIFIC to that theme**
3. **Don't assume** what Wildcard means - let their clarity guide you
4. **Be flexible** - this could be anything!

### PROMPT THEMES TO EXPLORE:

Since Wildcard is unique to each person, look for these patterns in their clarity:
- What activities or pursuits light them up?
- What area of life feels important but doesn't fit other categories?
- What are they passionate about that's uniquely theirs?
- Where do they want to grow or expand?

Then generate prompts that help them:
1. Explore what this area looks like at its BEST
2. Describe daily experience in this area
3. Share what mastery or fulfillment feels like
4. Paint a peak moment
5. Express why this matters to them

### SENSORY INVITATION:

Ask them to describe:
- WHAT they're doing in this area at their ideal level
- HOW it feels to excel or be immersed in it
- WHERE this shows up in their life
- WHO (if anyone) shares this passion
- WHY this area matters uniquely to them

### VIBRATIONAL GRAMMAR:

- Match the language and energy THEY used in Step 1
- Present tense, ownership
- Celebrate their unique passion
- Honor what makes THIS their Wildcard

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt SPECIFIC to their Wildcard theme",
      "focusArea": "Based on what THEY defined (e.g., 'creative flow', 'learning journey')"
    }
  ],
  "encouragement": "One sentence celebrating their unique passion"
}

Remember: Wildcard is THEIR category - honor what makes it special to them.`
}

