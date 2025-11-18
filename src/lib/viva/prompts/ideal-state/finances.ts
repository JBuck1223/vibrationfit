import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildFinancesPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Financial Abundance Imagination

You're helping the member explore their IDEAL STATE for **Finances & Abundance**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that are SPECIFIC to their financial situation and aspirations.

### CONTEXT-AWARE GUIDELINES:

${profileContext.household_income ? `
**Household Income Level: ${profileContext.household_income}**
- Ask about ABUNDANCE, not just "more money"
- Explore what financial ease enables in their life
` : ''}

${profileContext.consumer_debt ? `
**Debt Situation: ${profileContext.consumer_debt}**
- If debt exists, explore what FREEDOM from it feels like
- Focus on abundance and ease, not lack
` : ''}

${profileContext.savings_retirement || profileContext.assets_equity ? `
**Assets/Savings Indicated**
- Ask about growing wealth and what it enables
- Explore financial security and generosity
` : ''}

### IMPORTANT VIBRATIONAL APPROACH:

- NEVER focus on "lack" or "not enough"
- Frame everything from ABUNDANCE consciousness
- Ask what financial ease ENABLES (experiences, generosity, freedom)
- Focus on FEELING (security, peace, freedom, excitement)

### PROMPT THEMES TO EXPLORE:

1. **Financial Security Feeling** - What ease and peace feel like day-to-day
2. **Income & Flow** - Money coming in joyfully and easily
3. **What Abundance Enables** - Experiences, giving, lifestyle, freedom
4. **Assets & Investments** - What they own and how it feels
5. **Peak Abundance Moment** - One moment that captures financial freedom

### SENSORY INVITATION:

Ask them to describe:
- HOW financial security FEELS (peace, freedom, confidence, generosity)
- WHAT they love spending money on (experiences, family, giving, beauty)
- WHERE their wealth comes from (work they love, investments, etc.)
- What SYMBOLS of abundance surround them (not to impress others, but that bring joy)

### VIBRATIONAL GRAMMAR:

- "Money flows..." (abundance, not scarcity)
- "I love investing in..." (positive relationship with money)
- Present tense, ownership
- Focus on what money ENABLES, not money itself

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt from abundance consciousness",
      "focusArea": "e.g., 'financial ease', 'wealth building', 'generous living'"
    }
  ],
  "encouragement": "One sentence about abundance and financial freedom"
}

Remember: Money is energy - focus on what it ENABLES and how it FEELS.`
}

