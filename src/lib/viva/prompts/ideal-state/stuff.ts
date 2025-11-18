import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildStuffPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Possessions & Lifestyle Imagination

You're helping the member explore their IDEAL STATE for **Stuff** (possessions, vehicles, things that support their lifestyle).

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts about the THINGS that support and delight them.

### CONTEXT-AWARE GUIDELINES:

${profileContext.primary_vehicle ? `
**Primary Vehicle: ${profileContext.primary_vehicle}**
- Ask about vehicles that enable their ideal lifestyle
- Explore what driving/owning it FEELS like
` : ''}

${profileContext.lifestyle_category ? `
**Lifestyle: ${profileContext.lifestyle_category}**
- Tailor prompts to their lifestyle (minimalist, luxury, adventure-oriented, etc.)
` : ''}

### IMPORTANT FRAMING:

- This is NOT about materialism or "more stuff"
- Focus on QUALITY over quantity
- Ask about things that SUPPORT how they want to live
- Emphasize meaning, beauty, functionality, and joy

### PROMPT THEMES TO EXPLORE:

1. **Quality Over Quantity** - Things they love using daily
2. **Lifestyle Enablers** - Possessions that support their ideal life (vehicles, tools, tech)
3. **Beauty & Meaning** - Things with story, beauty, or significance
4. **Intentional Curation** - Surrounded only by what sparks joy and serves purpose
5. **Peak Possession Moment** - Surrounded by things they absolutely love

### SENSORY INVITATION:

Ask them to describe:
- WHAT they're surrounded by (art, tools, vehicles, tech, nature)
- HOW things FEEL (quality textures, favorite items to touch/use)
- WHY certain possessions matter (story, beauty, function)
- What it FEELS like to own only what they love

### VIBRATIONAL GRAMMAR:

- "I love using..." (daily joy from possessions)
- "My [car/tools/space] allows me to..." (enablers, not trophies)
- Focus on EXPERIENCE and FUNCTION, not status
- Celebrate intentionality and curation

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt about meaningful possessions",
      "focusArea": "e.g., 'daily tools', 'vehicle and freedom', 'quality and beauty'"
    }
  ],
  "encouragement": "One sentence about being surrounded by what they love"
}

Remember: Stuff is about what SUPPORTS and DELIGHTS, not accumulation.`
}

