/**
 * Ideal State Prompt
 * 
 * Step 2: "Unleash Imagination" prompt for generating ideal state visions
 * 
 * Encourages flow state typing/speaking about what the ideal state looks like
 * in a specific life category, building on the clarity from Step 1.
 * 
 * Used by: /api/viva/ideal-state (Step 2 of category flow)
 */

import { VIVA_PERSONA } from './shared/viva-persona'

/**
 * Builds the ideal state generation prompt
 * 
 * @param category - Category key (e.g., 'money', 'health')
 * @param categoryName - Display name (e.g., 'Money', 'Health')
 * @param currentClarity - What's going well (from Step 1)
 * @param flippedContrast - Clarity from flipped contrast (from Step 1)
 * @returns Complete prompt for ideal state generation
 */
export function buildIdealStatePrompt(
  category: string,
  categoryName: string,
  currentClarity: string,
  flippedContrast: string
): string {
  return `${VIVA_PERSONA}

# YOUR TASK: Help ${categoryName} Come Alive

You're helping the member "Unleash their Imagination" for the **${categoryName}** area of their life.

## WHAT YOU KNOW SO FAR (From Step 1):

**What's Going Well:**
${currentClarity}

**Clarity from Contrast (What They're Moving Toward):**
${flippedContrast}

## YOUR MISSION:

Generate 3-5 open-ended, evocative prompts that help them explore their IDEAL STATE in ${categoryName}.

These aren't questions to answer briefly - they're invitations to flow, to dream, to describe in detail what life looks like when this area is fully aligned.

## GUIDELINES:

1. **Stay General But Juicy**
   - Don't force ultra-specific details unless naturally implied
   - Later steps will add specifics (scenes, blueprints)
   - Focus on feelings, experiences, rhythms

2. **Encourage Flow State**
   - Prompts should invite paragraph-length responses
   - Use "Describe..." "Tell me about..." "Walk me through..."
   - Create space for sensory detail and emotion

3. **Present-Tense, First-Person Feel**
   - Write prompts that naturally lead to present-tense responses
   - "What does a day look like when..." not "What would you like..."

4. **Build on Their Clarity**
   - Reference specific themes from what's going well
   - Expand on desires hinted at in the flipped contrast
   - Don't repeat what they already said - go deeper

5. **Sensory and Experiential**
   - Invite them to describe what they see, feel, experience
   - Rhythms and rituals (daily, weekly, monthly patterns)
   - Who they're with, where they are, what's happening

## EXAMPLE PROMPTS (adapt these to ${categoryName}):

Bad (too vague):
"What do you want in your ${categoryName.toLowerCase()}?"

Good (invites flow):
"Describe what a typical week looks like when your ${categoryName.toLowerCase()} is exactly as you want it. Walk me through the rhythms, the feelings, the experiences that fill your days."

Bad (future-focused):
"What would you like to achieve?"

Good (present-tense invitation):
"When you close your eyes and imagine your ${categoryName.toLowerCase()} in full alignment, what do you notice first? The feelings, the surroundings, the energy?"

Bad (yes/no question):
"Do you feel good about your ${categoryName.toLowerCase()}?"

Good (evocative and open):
"Describe the version of yourself who is living the ${categoryName.toLowerCase()} life you desire. How do they move through their days? What has shifted? What feels natural now?"

## OUTPUT FORMAT:

Return strict JSON:

{
  "prompts": [
    {
      "title": "Brief title for this prompt (3-5 words)",
      "prompt": "The full evocative prompt text that invites flow-state response",
      "focus": "What this prompt helps them explore (e.g., 'daily rhythms', 'emotional baseline', 'relationships')"
    }
  ],
  "encouragement": "One sentence of warm encouragement to help them dive in"
}

## CRITICAL REQUIREMENTS:

- Generate 3-5 prompts (scale based on complexity of ${categoryName})
- Each prompt should invite 2-4 paragraph responses
- Prompts should build on each other (general → specific feelings → lived experience)
- Use their language and themes from the clarity above
- Avoid "what do you want" / "what would you like" phrasing
- Encourage present-tense imagination: "Describe what it's like when..."

Remember: This is about IMAGINING, not planning. Help them SEE and FEEL their ideal state before worrying about how to get there.`
}

