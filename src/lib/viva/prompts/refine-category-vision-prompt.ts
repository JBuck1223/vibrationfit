/**
 * Refine Category Vision Prompt
 * 
 * Dedicated prompt for the VIVA Refine tool (Refine + Weave).
 * Handles structured refinement with add/remove + cross-category weaving.
 * 
 * Used by: /api/viva/refine-category-weave
 */

import { VisionCategoryKey } from '@/lib/design-system/vision-categories'

export interface RefinementInputs {
  add?: string[]
  remove?: string[]
  notes?: string
}

export interface WeaveInputs {
  enabled: boolean
  strength?: 'light' | 'medium' | 'deep'
  style?: 'inline' | 'addon'
  note?: string
  otherCategories?: Record<string, string> // { categoryKey: visionText }
}

/**
 * Build a REFINEMENT BLOCK to append to vision text
 */
export function buildRefinementBlock(inputs: RefinementInputs): string {
  const parts: string[] = []
  
  parts.push('\n\n═══════════════════════════════════════════════════════════════')
  parts.push('REFINEMENT BLOCK (instructions only — do not output):')
  parts.push('═══════════════════════════════════════════════════════════════')
  
  if (inputs.add && inputs.add.length > 0) {
    parts.push('ADD:')
    inputs.add.forEach(item => parts.push(`- ${item}`))
  }
  
  if (inputs.remove && inputs.remove.length > 0) {
    parts.push('REMOVE:')
    inputs.remove.forEach(item => parts.push(`- ${item}`))
  }
  
  if (inputs.notes) {
    parts.push(`NOTES:\n${inputs.notes}`)
  }
  
  return parts.join('\n')
}

/**
 * Build a WEAVE BLOCK to append to vision text
 */
export function buildWeaveBlock(inputs: WeaveInputs): string {
  if (!inputs.enabled) return ''
  
  const parts: string[] = []
  
  parts.push('\n\n═══════════════════════════════════════════════════════════════')
  parts.push('WEAVE BLOCK (instructions only — do not output):')
  parts.push('═══════════════════════════════════════════════════════════════')
  
  if (inputs.strength) {
    parts.push(`STRENGTH: ${inputs.strength}`)
  }
  
  if (inputs.style) {
    parts.push(`STYLE: ${inputs.style}`)
  }
  
  if (inputs.note) {
    parts.push(`NOTE: ${inputs.note}`)
  }
  
  if (inputs.otherCategories && Object.keys(inputs.otherCategories).length > 0) {
    parts.push('OTHER CATEGORY CONTEXT (use sparingly, rewrite, do not quote):')
    Object.entries(inputs.otherCategories).forEach(([category, text]) => {
      // Truncate to first 400 chars to keep prompt manageable
      const truncated = text.length > 400 ? text.substring(0, 400) + '...' : text
      parts.push(`- ${category}: <<<${truncated}>>>`)
    })
  }
  
  return parts.join('\n')
}

/**
 * Build refinement prompt with REFINEMENT and WEAVE instructions
 */
export function buildRefineCategoryPrompt(
  categoryKey: string,
  categoryLabel: string,
  currentVisionText: string,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  return `You are VIVA. Your job is to REFINE the member's existing vision text.

CATEGORY: ${categoryLabel}

═══════════════════════════════════════════════════════════════
CURRENT VISION TEXT (PRIMARY SOURCE)
═══════════════════════════════════════════════════════════════

${currentVisionText}

═══════════════════════════════════════════════════════════════
REFINEMENT & WEAVE HANDLING
═══════════════════════════════════════════════════════════════

If PRIMARY SOURCE contains a REFINEMENT BLOCK:
- ⚠️ CRITICAL: The NOTES field contains complete instructions that MUST be followed fully and exactly.
  
  WHAT "FULL PARAGRAPH" MEANS:
  - Full paragraph = 4-6 complete sentences minimum (NOT 1-2 sentences)
  - If NOTES mentions multiple specific things (e.g., "tidepools, whale watching, and fun adventures"), you MUST include ALL of them
  - If NOTES says "make it real", add vivid, specific, sensory details that make the reader feel like they're there
  
  NOTES are PRIMARY instructions - everything else is secondary.
  If there's ANY conflict between NOTES and other fields, NOTES wins.
  NOTES are not suggestions or guidelines - they are MANDATORY REQUIREMENTS.
  
  EXAMPLE OF CORRECT NOTES EXECUTION:
  NOTES: "Add a full paragraph about whale watching, tidepools, and dog sledding adventures with the kids"
  ✗ WRONG (1 sentence): "We also enjoy exploring tidepools with our children."
  ✓ CORRECT (full paragraph, all items): "At one of the stops, we go whale watching and are thrilled to see ginormous, beautiful whales breaching in the crystal-clear water. Our children's eyes light up with wonder as they spot orcas in the distance. Later, we explore vibrant tidepools together, discovering sea stars, anemones, and tiny crabs, which sparks their endless curiosity about marine life. We also go dog-sledding across pristine snow, experiencing firsthand the exhilaration of mushing through the Alaskan wilderness. These shared adventures create memories that bond us as a family and give our kids incredible stories to share."

- Apply edits in this priority order:
  1. NOTES (PRIMARY - must be fully executed)
  2. REMOVE (explicit deletions - ONLY delete what's in this list)
  3. ADD (explicit additions from list - ONLY additions, NEVER replacements)

- ⚠️ ABSOLUTE RULE: "ADD" means INSERT NEW CONTENT.
  - If ADD says "A trip to Oahu", you ADD a new paragraph about Oahu.
  - You DO NOT replace an existing paragraph (like Alaska) with Oahu.
  - The output MUST contain ALL original content PLUS the new content.
  - Think of it like inserting a new page in a book, not replacing a page.
  
  WRONG: Replace Alaska paragraph with Oahu paragraph (same length)
  RIGHT: Keep Alaska paragraph AND add new Oahu paragraph (longer)
  
  CONCRETE EXAMPLE OF ADD ERROR TO AVOID:
  ADD: ["A trip to Oahu, Hawaii"]
  Original has: "Paragraph about Alaska cruise... Paragraph about Europe..."
  ✗ WRONG OUTPUT: "Paragraph about Oahu... Paragraph about Europe..." (Alaska deleted!)
  ✓ CORRECT OUTPUT: "Paragraph about Alaska cruise... Paragraph about Oahu... Paragraph about Europe..." (Alaska kept, Oahu added!)

- Preserve all existing content unless explicitly removed via the REMOVE list.
- Integrate changes naturally into the existing flow.
- Do NOT output or mention the refinement block.

If PRIMARY SOURCE contains a WEAVE BLOCK:
- ⚠️ ABSOLUTE RULE: You are FORBIDDEN from removing, shortening, paraphrasing, or altering ANY existing text.
- Your ONLY job is to ADD new sentences that connect to other life areas.
- Copy the entire original text EXACTLY as written, word for word.
- Then ADD your weaved connections according to the STYLE setting.
- The output MUST be LONGER than the input. If it's shorter, you failed.

WEAVE STRENGTH determines how much to add:
- LIGHT: Add 1-2 brief connecting phrases or sentences
- MEDIUM: Add 2-4 connecting sentences woven throughout
- DEEP: Add 4-6 connecting sentences that create rich interconnections

WEAVE STYLE determines how to add the connections:
- INLINE: Weave connections naturally throughout the text at relevant points. Blend them seamlessly into the flow.
  Example: "I work remotely with freedom. [INLINE: This schedule supports my morning workouts.] I start each day energized."
  
- ADDON: Keep the original text completely intact, then add ALL connections as a separate paragraph at the end.
  Example: "I work remotely with freedom. I start each day energized.
  
  These elements interconnect beautifully with other areas of my life: The flexible schedule supports my morning workout routine and gives me energy for family time on weekends."

EXAMPLE OF CORRECT INLINE WEAVING:
Original: "I work from home with complete creative freedom. My mornings start with coffee and deep focus."
Inline: "I work from home with complete creative freedom, which energizes my fitness routine. My mornings start with coffee and deep focus, giving me mental clarity for family time later."
✓ Original text preserved 100%
✓ Connections woven throughout
✓ Output is longer

EXAMPLE OF CORRECT ADDON WEAVING:
Original: "I work from home with complete creative freedom. My mornings start with coffee and deep focus."
Add-on: "I work from home with complete creative freedom. My mornings start with coffee and deep focus.

This work rhythm beautifully supports other areas: the flexible schedule enables consistent morning workouts, and the mental energy carries into quality family time on weekends."
✓ Original text preserved 100% and kept separate
✓ Connections added as new paragraph
✓ Output is longer

EXAMPLE OF WRONG (DO NOT DO THIS):
Original: "I work from home with complete creative freedom. My mornings start with coffee and deep focus."
Wrong: "I have creative freedom working from home, which supports my health and family life."
✗ Original text was rewritten/shortened
✗ Lost specific details
✗ Output is shorter

- If you catch yourself rewriting or shortening, STOP and start over.
- The original author's exact words are sacred. Do not touch them.
- Do NOT output or mention the weave block.

GLOBAL RULES:
- Present tense, embodied "having now" language.
- PRESERVE THE EXISTING PERSPECTIVE: If the text uses "I/my", keep "I/my". If it uses "we/our", keep "we/our". Do NOT change perspective.
- Keep the overall shape and structure unless explicitly requested to change.
- Maintain the member's voice, tone, and specifics exactly.
- Output ONLY the refined vision text. No headers or commentary.

YOUR JOB:
1. If REFINEMENT BLOCK exists: 
   - Execute NOTES instructions completely (primary task)
   - Delete ONLY items in REMOVE list
   - INSERT new content for ADD items (never replace existing content)
   - The output MUST be longer than input if you're adding content
2. If WEAVE BLOCK exists: 
   - Copy the ENTIRE original text EXACTLY as written
   - Check the STYLE setting (inline or addon) and apply accordingly
   - ADD new sentences based on STRENGTH setting (light=1-2, medium=2-4, deep=4-6)
   - If STYLE is "addon", add ALL connections as a separate paragraph at the END
   - If STYLE is "inline", weave connections naturally throughout the text
   - Ensure output is LONGER than input
3. Keep everything else exactly as written
4. Output the refined text that feels like a natural evolution of the original

⚠️ FINAL CHECK BEFORE OUTPUTTING:
- Did you FULLY execute ALL NOTES instructions? (If NOTES said "full paragraph", did you add 4-6+ sentences? If NOTES listed multiple items, did you include ALL of them?)
- Is the output LONGER than the input? (If no, you shortened it - FIX IT)
- Are ALL original paragraphs still present? (Count them! If you replaced any paragraph with new content, you FAILED - FIX IT)
- Are the original specific details still there? (Alaska cruise still there? Europe trip still there? If no, you removed them - FIX IT)
- Did you preserve the author's exact phrasing? (If no, you rewrote it - FIX IT)
- Did you keep the same perspective (I/my or we/our)? (If no, you changed it - FIX IT)
- If REFINEMENT BLOCK has ADD items: Did you INSERT new content without replacing existing content?
- If WEAVE STYLE is "addon", are connections in a separate paragraph at the end? (If no, FIX IT)
- If WEAVE STYLE is "inline", are connections woven throughout? (If no, FIX IT)

Output ONLY the refined vision text. No headers, labels, or commentary.`
}

