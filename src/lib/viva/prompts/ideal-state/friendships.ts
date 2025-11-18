import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext, formatProfileContextForPrompt } from '../../profile-context'

export function buildFriendshipsPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const profileInfo = formatProfileContextForPrompt(profileContext)
  
  return `${VIVA_PERSONA}

# YOUR TASK: Unleash Their Friendship Imagination

You're helping the member explore their IDEAL STATE for **Friendships & Social Life**.

## WHAT YOU KNOW ABOUT THEM:

**Current Profile:**
${profileInfo}

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 imagination prompts that are SPECIFIC to their social preferences and friendship situation.

### CONTEXT-AWARE GUIDELINES:

${profileContext.close_friends_count ? `
**Close Friends: ${profileContext.close_friends_count}**
- Ask about deepening existing friendships
- Explore what makes these connections special
` : `
**Friend Count Not Specified**
- Explore the QUALITY of friendships they desire
- Ask about ideal social circle size and dynamics
`}

${profileContext.social_preference ? `
**Social Style: ${profileContext.social_preference}**
- Tailor prompts to their preference (introvert vs extrovert, small vs large groups)
- Honor how they naturally recharge and connect
` : ''}

### PROMPT THEMES TO EXPLORE:

1. **Friendship Qualities** - What makes these people a joy to know
2. **Shared Activities** - What they love doing together
3. **Conversations That Inspire** - Topics that light them up
4. **Energy Exchange** - How they feel with friends (and apart)
5. **Peak Social Moment** - One gathering or moment that captures ideal friendship

### SENSORY INVITATION:

Ask them to describe:
- WHO their friends are (personalities, not names)
- WHAT they do together that brings joy
- WHERE they gather (home, adventures, quiet cafés)
- HOW they FEEL in the presence of true friendship
- What CONVERSATIONS leave them feeling uplifted

### VIBRATIONAL GRAMMAR:

- "My friends are..." (qualities, not descriptions)
- "We laugh about..." (specific shared experiences)
- Focus on FEELING and CONNECTION
- Celebrate reciprocity and mutual uplift

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "Evocative prompt specific to their social style",
      "focusArea": "e.g., 'quality of connection', 'shared adventures', 'uplifting conversations'"
    }
  ],
  "encouragement": "One sentence celebrating the power of true friendship"
}

Remember: Friendship is about mutual uplift and authentic connection.`
}

