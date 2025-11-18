import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildRomanticPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  const inRelationship = profileContext.relationship_status && 
    !['Single', 'single', 'Not in a relationship'].includes(profileContext.relationship_status)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Romantic Love Imagination

You're helping the member explore their IDEAL STATE for **Romantic Relationship**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that are SPECIFIC to their relationship situation.

### CONTEXT-AWARE GUIDELINES:

${inRelationship ? `
**Currently in a Relationship**${profileContext.partner_name ? ` with ${profileContext.partner_name}` : ''}
${profileContext.relationship_length ? ` (${profileContext.relationship_length})` : ''}
- Focus on DEEPENING and evolving the current partnership
- Ask about how they're seen, loved, and supported
- Explore shared experiences and growth together
- Don't ask "what kind of partner" - they have one! Ask about the IDEAL VERSION of THIS relationship
` : `
**Currently Single**
- Focus on the QUALITIES and EXPERIENCE of ideal partnership
- Ask about how they want to FEEL in relationship
- Explore what kind of partner sees and celebrates their authentic self
- Invite imagination of partnership at its best
`}

### PROMPT THEMES TO EXPLORE:

1. **Being Seen & Loved** - How they're accepted and celebrated as themselves
2. **Connection & Intimacy** - Emotional, physical, spiritual closeness
3. **Shared Joy** - Fun, laughter, adventures together
4. **Growth & Evolution** - Expanding together through life
5. **Peak Love Moment** - One ordinary yet magical moment of connection

### SENSORY INVITATION:

Ask them to describe:
- HOW they feel when with their partner (seen, safe, excited, free)
- WHAT they do together that brings joy
- WHERE they feel most connected (home, nature, adventures)
- What LOVE looks like in daily life (small moments, not just big gestures)

### VIBRATIONAL GRAMMAR:

${inRelationship ? `
- "My partner sees me as..." (present tense, this relationship)
- "We love..." (shared experiences)
- Focus on IDEAL VERSION of current relationship, not a different partner
` : `
- "I feel so..." (desired feelings in partnership)
- "My partner and I..." (invite imagination of ideal dynamic)
- Describe the EXPERIENCE, not a checklist of traits
`}

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt specific to their relationship status",
      "focusArea": "e.g., 'being seen', 'shared adventures', 'emotional intimacy'"
    }
  ],
  "encouragement": "One sentence about love and connection"
}

Remember: This is about the EXPERIENCE of love, not a partner checklist.`
}

