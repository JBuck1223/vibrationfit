/**
 * Blueprint Prompt
 * 
 * Step 3: Being/Doing/Receiving blueprint generation
 * 
 * Generates Being/Doing/Receiving loops with Who/What/Where/Why framework
 * for a specific life category, creating a general vision blueprint.
 * 
 * Less specifics, more about the identity → action → evidence loops.
 * 
 * Used by: /api/viva/blueprint (Step 3 of category flow)
 */

import { VIVA_PERSONA_WITH_GOLDEN_RULES } from './shared/viva-persona'
import { computeTargetLengthRange, combineTextSources } from '../text-metrics'

/**
 * Being/Doing/Receiving Loop structure
 */
export interface BeingDoingReceivingLoop {
  /** Being: Identity & felt state ("I am...", "I feel...") */
  being: string
  
  /** Doing: Natural actions & rhythms ("I start each day...", "I regularly...") */
  doing: string
  
  /** Receiving: Evidence, support, synchronicity ("Life responds with...", "I am surrounded by...") */
  receiving: string
  
  /** Optional: The essence word for this loop */
  essence?: string
}

/**
 * Builds the blueprint generation prompt
 * 
 * @param category - Category key (e.g., 'money', 'health')
 * @param categoryName - Display name (e.g., 'Money', 'Health')
 * @param currentState - Their current state description (from Step 1)
 * @param idealState - Ideal state imagination (from Step 2)
 * @returns Complete prompt for blueprint generation
 */
export function buildBlueprintPrompt(
  category: string,
  categoryName: string,
  currentState: string,
  idealState: string
): string {
  const combinedInput = combineTextSources(currentState, idealState)
  const lengthRange = computeTargetLengthRange(combinedInput)
  
  return `${VIVA_PERSONA_WITH_GOLDEN_RULES}

# YOUR TASK: Create Being/Doing/Receiving Blueprint for ${categoryName}

You're helping the member create their **general vision blueprint** for the **${categoryName}** area of their life.

This is Step 3 of 6 - not the final vision text, but the structural loops that will inform it.

## WHAT YOU KNOW (From Steps 1-2):

**Current State (Where They Are Now):**
${currentState}

**Ideal State (What They Imagined):**
${idealState}

## DENSITY GUIDANCE:

- Combined input length: ${lengthRange.inputChars} characters
- If they provided lots of detail: generate 3-5 loops covering distinct aspects
- If they provided moderate detail: generate 2-3 loops
- If they provided minimal detail: generate 1-2 loops
- Each loop should reference the Who/What/Where/Why framework

## THE BEING/DOING/RECEIVING FRAMEWORK:

Every loop has three interrelated states:

### BEING: Identity & Felt State
- Who you are in this vision
- How you feel
- Your emotional baseline
- Examples: "I am confident in my financial decisions," "I feel peaceful about money," "I embody generosity"

### DOING: Natural Actions & Rhythms
- What you naturally do from that state of being
- Your routines and rituals
- How you move through your day/week/month
- Examples: "I review my finances weekly with curiosity," "I invest 20% of my income," "I give generously to causes I believe in"

### RECEIVING: Evidence, Support, Synchronicity
- What comes to you as a result
- How life supports you
- The nourishment you experience
- Examples: "Opportunities align with my values," "My accounts grow steadily," "I am surrounded by financially savvy friends"

## THE LOOP PATTERN:

Start with Being → Flow into Doing → Complete with Receiving

This creates a dynamic cycle: Your identity leads to natural actions, which attract supportive results.

## CRITICAL INSTRUCTIONS:

1. **Multiple Loops if Warranted**
   - If the member mentioned multiple distinct aspects (e.g., income AND giving AND investments), create separate loops
   - Don't consolidate everything into one loop if they gave rich detail
   - Each loop should feel complete on its own

2. **Who/What/Where/Why Integration**
   - Each loop should naturally answer at least 2 of these questions
   - Who: Who am I being? Who am I with?
   - What: What am I doing? What is happening?
   - Where: Where am I? What's the environment?
   - Why: Why does this matter? What does this represent?

3. **Preserve ALL Distinct Themes**
   - If they mentioned 5 different desires, don't compress them into 2 generic statements
   - Keep their specific themes and interests
   - Match the variety of concepts in their input

4. **Present-Tense, First-Person Only**
   - No "I want," "I will," "I wish," "I hope to"
   - Write as if it's happening now
   - Use their language and phrasing

5. **Concrete Yet General**
   - Include specific rhythms/rituals when mentioned ("Every Sunday...")
   - But don't invent ultra-specific details they didn't hint at
   - Later steps (scenes) will add vivid specifics

## OUTPUT FORMAT:

Return strict JSON:

{
  "loops": [
    {
      "being": "Identity and felt state in first person, present tense (1-2 sentences)",
      "doing": "Natural actions and rhythms in first person, present tense (2-3 sentences)",
      "receiving": "What comes as a result, evidence and support (1-2 sentences)",
      "essence": "Optional one-word essence (e.g., 'Freedom', 'Flow', 'Abundance')"
    }
  ],
  "summary": "One sentence describing the overall blueprint"
}

## EXAMPLE LOOP (Money category):

{
  "being": "I am confident and intentional with money. I feel a deep sense of security and abundance.",
  "doing": "I review my finances every Sunday morning with curiosity and care. I invest 20% of my income in aligned opportunities. I give 10% to causes that matter to me, and I spend the rest on experiences that bring joy.",
  "receiving": "My accounts grow steadily without stress. Opportunities find me that align with my values. I am surrounded by financially savvy friends who inspire and support me.",
  "essence": "Abundance"
}

## REMEMBER:

- This is a BLUEPRINT, not final vision text
- General patterns, not ultra-specific scenes (those come in Step 4)
- Multiple loops if their input warrants it
- Preserve their themes and variety of ideas
- Present-tense, their voice, believable

Generate the blueprint now based on the ${categoryName} data above.`
}

