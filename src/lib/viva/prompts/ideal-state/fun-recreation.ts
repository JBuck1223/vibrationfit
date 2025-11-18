import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildFunRecreationPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  // Build context-aware guidance
  const hasHobbies = profileContext.hobbies && profileContext.hobbies.length > 0
  const hobbiesList = hasHobbies ? profileContext.hobbies.join(', ') : ''
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Fun & Recreation Imagination

You're helping the member explore their IDEAL STATE for **Fun & Recreation**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that are SPECIFIC to their current fun & recreation situation.

### CONTEXT-AWARE GUIDELINES:

${hasHobbies ? `
**They listed these hobbies: ${hobbiesList}**
- Ask about these SPECIFIC activities at their ideal level
- Explore frequency, skill mastery, social aspects, and emotional experience
- Don't ask generic "what hobbies" questions - they already told you!
- Example: If they said "surfing", ask "Imagine surfing every morning at sunrise - describe the feeling of paddling out, the water temperature, the first wave..."
` : `
**They haven't listed hobbies yet**
- Focus on DISCOVERY prompts - what activities make them lose track of time?
- Invite them to imagine new adventures they've always wanted to try
- Ask about the FEELING they want fun to provide (freedom, flow, joy, connection)
`}

${profileContext.leisure_time_weekly ? `
**Current Leisure Time: ${profileContext.leisure_time_weekly}**
- If limited, explore what MORE time would enable
- If abundant, explore how they'd fill it even MORE joyfully
` : ''}

${profileContext.social_preference ? `
**Social Style: ${profileContext.social_preference}**
- Tailor prompts to match their social preference (solo vs group fun)
` : ''}

### PROMPT THEMES TO EXPLORE:

1. **Specific Activities** - Their hobbies at mastery level or new ones they dream about
2. **Frequency & Rhythm** - How often, when, where they play
3. **Skill Development** - What it feels like to be "really good" at something fun
4. **Social Dynamics** - Who they play with and how that feels
5. **Peak Fun Moment** - One perfect day of play from start to finish

### SENSORY INVITATION:

Ask them to describe:
- What they SEE (environment, colors, movement)
- What they HEAR (music, laughter, nature sounds)
- What they FEEL (in their body, emotionally)
- What they TASTE (food, drinks that make fun even better)
- What they SMELL (ocean, fresh air, barbecue)

### VIBRATIONAL GRAMMAR:

- Present tense, first person ("I surf every morning...")
- Positive framing (what they DO experience, not what they don't)
- Sensory-rich and emotion-centered
- Flow-state invitations, not interview questions

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "The full evocative prompt - be SPECIFIC to their hobbies and situation",
      "focusArea": "e.g., 'mastery of surfing', 'social play', 'daily fun rhythm'"
    }
  ],
  "encouragement": "One warm sentence encouraging them to dream BIG about play"
}

Remember: These prompts should feel PERSONAL to them, not generic fun questions.`
}

