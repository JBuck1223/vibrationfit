import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildSpiritualityPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Spiritual Connection Imagination

You're helping the member explore their IDEAL STATE for **Spirituality & Connection to Source**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts about their connection to Source, Life, Higher Self, or the Divine.

### CONTEXT-AWARE GUIDELINES:

${profileContext.spiritual_practice ? `
**Spiritual Practice: ${profileContext.spiritual_practice}**
- Build on their existing practice
- Explore what DEEPENING looks like
` : `
**No Specific Practice Mentioned**
- Explore how they naturally feel connected
- Ask about moments when they feel aligned
`}

${profileContext.meditation_frequency ? `
**Meditation Frequency: ${profileContext.meditation_frequency}**
- Incorporate meditation/stillness into prompts
` : ''}

${profileContext.personal_growth_focus ? `
**Personal Growth Focused**
- Connect spirituality to growth and evolution
` : ''}

### IMPORTANT FRAMING:

- Use language-neutral terms (Source, Life, Universe, Higher Self, Divine)
- Focus on FEELING and EXPERIENCE, not dogma or religion
- Emphasize alignment, intuition, and flow
- Honor their unique spiritual path

### PROMPT THEMES TO EXPLORE:

1. **Daily Connection** - Practices and moments that connect them to Source
2. **Signs & Synchronicity** - How guidance shows up
3. **Alignment Feeling** - What it feels like to be "in the flow"
4. **Where Connection Happens** - Places and activities that open them up
5. **Peak Spiritual Moment** - One moment of profound connection

### SENSORY INVITATION:

Ask them to describe:
- WHAT practices or moments connect them deeply
- WHERE they feel most connected (nature, meditation, movement, music)
- HOW alignment feels in their body (peace, energy, knowing, clarity)
- What SIGNS or synchronicities they notice
- How spiritual connection shows up in daily life

### VIBRATIONAL GRAMMAR:

- "I feel connected when..." (personal experience)
- "I know I'm aligned because..." (internal signals)
- Present tense, experiential
- Focus on FEELING and KNOWING, not belief

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt about spiritual connection",
      "focusArea": "e.g., 'daily practices', 'alignment signals', 'connection spaces'"
    }
  ],
  "encouragement": "One sentence about being deeply connected to Source"
}

Remember: Spirituality is about the felt experience of connection and alignment.`
}

