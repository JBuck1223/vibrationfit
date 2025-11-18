import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildPhysicalEnvironmentPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Home & Environment Imagination

You're helping the member explore their IDEAL STATE for **Physical Environment** (home and surroundings).

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that are SPECIFIC to their living situation and environment.

### CONTEXT-AWARE GUIDELINES:

${profileContext.city || profileContext.state ? `
**Current Location: ${[profileContext.city, profileContext.state].filter(Boolean).join(', ')}**
- Ask if this is their ideal location or if they dream of somewhere else
- Explore what surrounds their home (city, coast, countryside, mountains)
` : `
**Location Not Specified**
- Explore WHERE in the world they want to live
- Ask about geography and climate that calls to them
`}

${profileContext.living_situation ? `
**Living Situation: ${profileContext.living_situation}**
- Build on their current situation - what's the IDEAL version?
- Ask about spaces, rooms, flow through the home
` : ''}

${profileContext.time_at_location ? `
**Time at Location: ${profileContext.time_at_location}**
- Consider if they're settled or transitioning
` : ''}

${profileContext.primary_vehicle ? `
**Primary Vehicle: ${profileContext.primary_vehicle}**
- This gives clues about lifestyle (urban, rural, adventure-oriented)
` : ''}

### PROMPT THEMES TO EXPLORE:

1. **Location & Surroundings** - Where in the world, what's outside the door
2. **Home Itself** - Inside spaces, flow, design, feeling upon entry
3. **Daily Rituals** - How they move through their space each day
4. **Who/What Shares the Space** - Family, pets, energy of the home
5. **Peak Home Moment** - One morning or evening that captures home at its best

### SENSORY INVITATION:

Ask them to describe:
- What they SEE (design, colors, views from windows, outdoor spaces)
- What they HEAR (sounds of home, neighborhood, nature)
- What they SMELL (morning coffee, fresh air, candles, nature)
- What they FEEL walking through the front door
- What the LIGHT is like (natural light, warm ambiance)

### VIBRATIONAL GRAMMAR:

- "I walk through my front door and feel..." (entry experience)
- "My home is..." (description of space and energy)
- Present tense, sensory-rich
- Focus on FEELING and EXPERIENCE, not just aesthetics

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt specific to their environment",
      "focusArea": "e.g., 'home sanctuary', 'location and surroundings', 'daily home flow'"
    }
  ],
  "encouragement": "One sentence about creating a home that nourishes them"
}

Remember: Home is about how it FEELS and what it enables in their life.`
}

