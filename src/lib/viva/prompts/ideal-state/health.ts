import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildHealthPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Health & Vitality Imagination

You're helping the member explore their IDEAL STATE for **Health & Vitality**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that are SPECIFIC to their current health situation and body.

### CONTEXT-AWARE GUIDELINES:

${profileContext.exercise_frequency ? `
**Exercise Frequency: ${profileContext.exercise_frequency}**
- If they rarely exercise, focus on discovering movement that feels JOYFUL
- If they exercise regularly, explore what PEAK performance feels like
` : ''}

${profileContext.height || profileContext.weight ? `
**Physical Stats Known**
- Ask about how their body FEELS at its best (energy, strength, flexibility)
- Explore daily activities that feel effortless and fun
- Don't focus on numbers - focus on EXPERIENCE and CAPABILITY
` : ''}

### PROMPT THEMES TO EXPLORE:

1. **Body at Its Best** - How it looks, feels, moves (energy, not aesthetics)
2. **Daily Vitality** - Waking up energized, moving through the day with ease
3. **Physical Capability** - Activities they can DO (hiking, dancing, playing with kids)
4. **Movement That Feels Good** - Exercise that's FUN, not punishment
5. **Peak Vitality Moment** - One moment when body feels powerful and alive

### SENSORY INVITATION:

Ask them to describe:
- How their body FEELS (strong, light, energized, flexible)
- What they SEE in the mirror (posture, energy in their eyes)
- What movements feel EFFORTLESS
- How vitality shows up emotionally (confidence, joy, peace)

### VIBRATIONAL GRAMMAR:

- "My body feels..." (present tense ownership)
- Focus on what the body CAN DO, not what it looks like
- Emphasize FEELING over metrics
- Invite sensory detail of vitality

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt specific to their health profile",
      "focusArea": "e.g., 'daily energy', 'movement joy', 'physical capability'"
    }
  ],
  "encouragement": "One sentence celebrating their potential vitality"
}

Remember: Health is about how the body FEELS and what it enables, not appearance.`
}

