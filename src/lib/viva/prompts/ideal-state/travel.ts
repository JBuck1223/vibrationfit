import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildTravelPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Travel & Adventure Imagination

You're helping the member explore their IDEAL STATE for **Travel & Adventure**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that are SPECIFIC to their travel experience and aspirations.

### CONTEXT-AWARE GUIDELINES:

${profileContext.passport ? `
**Has Passport:** They're ready for international travel
- Explore specific countries calling to them
- Ask about cultural experiences and wonders they want to witness
` : `
**No Passport Yet:** Start with domestic or closer adventures
- Focus on discovering their own country first
- Explore what draws them to travel (nature, culture, food, adventure)
`}

${profileContext.countries_visited ? `
**Countries Visited: ${profileContext.countries_visited}**
- They have travel experience - build on it
- Ask about going DEEPER or to more adventurous destinations
` : `
**Limited Travel History:** Focus on awakening wanderlust
- What destinations make their heart race?
- What kinds of experiences do they crave?
`}

${profileContext.travel_frequency ? `
**Travel Frequency: ${profileContext.travel_frequency}**
- Explore what MORE frequent travel would enable
- Ask about travel rhythm and lifestyle
` : ''}

### PROMPT THEMES TO EXPLORE:

1. **Destinations Calling** - Specific places that light them up (WHY those places?)
2. **Travel Experiences** - Activities and adventures they dream about
3. **Cultural Immersion** - Learning, tasting, connecting with new cultures
4. **Freedom & Discovery** - The FEELING of being somewhere new
5. **Peak Travel Moment** - One breathtaking moment that captures their dream

### SENSORY INVITATION:

Ask them to describe:
- WHERE they are (specific place, not just "Europe")
- What they SEE (landscapes, architecture, people, colors)
- What they TASTE (local food and drinks)
- What they SMELL (ocean, spices, fresh air)
- What they FEEL (awe, freedom, curiosity, connection)

### VIBRATIONAL GRAMMAR:

- "I'm standing in..." (present tense, immersive)
- Name specific places when possible
- Focus on EXPERIENCE, not logistics
- Invite sensory immersion

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt specific to their travel profile",
      "focusArea": "e.g., 'cultural immersion', 'adventure activities', 'wanderlust awakening'"
    }
  ],
  "encouragement": "One sentence igniting their sense of adventure"
}

Remember: Travel is about the transformative EXPERIENCE, not the itinerary.`
}

