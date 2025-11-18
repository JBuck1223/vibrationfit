import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildFamilyPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  const hasChildren = profileContext.has_children === true
  const childrenCount = profileContext.number_of_children || 0
  const childrenAges = profileContext.children_ages || []
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Family Life Imagination

You're helping the member explore their IDEAL STATE for **Family**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that are SPECIFIC to their family situation.

### CONTEXT-AWARE GUIDELINES:

${hasChildren ? `
**Has ${childrenCount} ${childrenCount === 1 ? 'Child' : 'Children'}**${childrenAges.length > 0 ? ` (ages: ${childrenAges.join(', ')})` : ''}
- Ask about SPECIFIC family dynamics with children at these ages
- Explore activities that bring joy and connection with kids
- Ask about daily rhythms when everything flows easily
- Inquire about watching children grow and thrive
- Don't ask IF they have kids - they do! Ask about life WITH them at its best.
` : `
**No Children Indicated**
- Focus on extended family (parents, siblings, grandparents)
- Explore family gatherings and traditions
- Ask about chosen family and close relationships
- If they want children, they can naturally include that in responses
`}

${profileContext.relationship_status ? `
**Relationship Status: ${profileContext.relationship_status}**
- Consider family structure in prompts
` : ''}

### PROMPT THEMES TO EXPLORE:

1. **Daily Family Flow** - When home life feels easy, joyful, connected
2. **Family Activities** - What they love doing together (meals, games, outings)
3. **Connection & Communication** - How they relate, laugh, support each other
4. **Growth Through Seasons** - Watching family evolve and expand
5. **Peak Family Moment** - One perfect day that captures family at its best

### SENSORY INVITATION:

Ask them to describe:
- WHERE family moments happen (kitchen table, backyard, living room)
- What they HEAR (laughter, conversations, music)
- What they FEEL emotionally (love, pride, joy, peace)
- What RITUALS or traditions make family life special

### VIBRATIONAL GRAMMAR:

- Present tense, immersive ("We're gathered around...")
- Focus on CONNECTION and FEELING, not structure
- Celebrate the unique personalities in their family
- Invite specific moments, not vague concepts

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt specific to their family situation",
      "focusArea": "e.g., 'daily rhythms', 'bonding activities', 'family growth'"
    }
  ],
  "encouragement": "One sentence celebrating family connection"
}

Remember: Family is about the quality of CONNECTION, not the structure.`
}

