import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildContributionPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Contribution & Giving Imagination

You're helping the member explore their IDEAL STATE for **Contribution & Giving**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts about how they GIVE and contribute from overflow.

### CONTEXT-AWARE GUIDELINES:

${profileContext.volunteer_status ? `
**Volunteer Status: ${profileContext.volunteer_status}**
- Build on their current giving or explore new ways
` : ''}

${profileContext.charitable_giving ? `
**Charitable Giving: ${profileContext.charitable_giving}**
- Ask about causes and impact
` : ''}

${profileContext.legacy_mindset ? `
**Legacy-Minded**
- Explore long-term impact and ripple effects
` : ''}

${profileContext.occupation ? `
**Occupation: ${profileContext.occupation}**
- Consider how their work/skills can contribute
- Explore professional gifts being shared
` : ''}

### IMPORTANT FRAMING:

- Giving from OVERFLOW, not obligation
- Focus on IMPACT and witnessing change
- Explore various ways to give (time, skills, resources, presence)
- Emphasize JOY and alignment in contribution

### PROMPT THEMES TO EXPLORE:

1. **What Lights Them Up** - Causes, people, communities they love supporting
2. **Unique Gifts to Share** - Skills, experiences, resources they offer
3. **How They Love to Give** - Quietly, collaboratively, leading change
4. **Witnessing Impact** - Seeing the difference they make
5. **Peak Giving Moment** - One moment when contribution feels deeply aligned

### SENSORY INVITATION:

Ask them to describe:
- WHO or WHAT they support (specific causes, people, communities)
- HOW they give (time, money, skills, presence, leadership)
- What they SEE as a result of their contribution
- What they FEEL when giving from overflow (joy, purpose, humility, connection)
- How their giving RIPPLES outward

### VIBRATIONAL GRAMMAR:

- "I love supporting..." (from joy, not obligation)
- "It lights me up to..." (aligned contribution)
- Present tense, ownership
- Focus on IMPACT and FEELING, not sacrifice

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt about aligned giving",
      "focusArea": "e.g., 'causes I love', 'unique gifts', 'witnessing impact'"
    }
  ],
  "encouragement": "One sentence about the joy of contribution"
}

Remember: True contribution comes from overflow and alignment, not obligation.`
}

