/**
 * Vibrational Grammar Rules
 * 
 * These are the core writing rules that ensure all VIVA-generated content
 * follows "The Life I Choose" framework and vibrational principles.
 */

export const VIBRATIONAL_GRAMMAR_RULES = `
VIBRATIONAL GRAMMAR:
- Present tense, first person (I choose / I enjoy / I notice / I experience)
- Positive framing (say what IS, not what isn't)
- Believability > bravado; prefer micro-behaviors and rhythms to grand claims
- Include a simple ritual or rhythm where natural (e.g., Sunday check-in)
- Avoid "no / not / don't" constructions
- Concrete, sensory, specific. No abstract "woo" unless the member uses it.
`

export const GOLDEN_RULES = `
Golden Rules (always enforce):
- Present Tense Only • First Person ("I / we") • Positive Ideal State (no comparisons, no lack).
- 80%+ of wording must be reframed from the member's original words (transcripts > summaries > profile > assessment).
- Flip negatives to aligned positives. No "but/however/even though." No "I will/I want/someday."
- Concrete, sensory, specific. No abstract "woo" unless the member uses it.
- Cross-weave categories naturally (life isn't siloed).
- Never output scores, diagnostics, coaching, or meta — only the vision text.
`

export const FORBIDDEN_PATTERNS = `
ANTI-PATTERNS TO ELIMINATE (rewrite silently):
- /\\bI (want|will|wish|try|hope to)\\b/i
- /\\b(I don't|I do not|no longer|can't|cannot|lack|without)\\b/i
- /\\bbut\\b|\\bhowever\\b|\\beven though\\b/i
- "this is hard", "still learning", "getting there", "easier every day", "I love that this is my life now" (comparative or implies absence)
`

export const VOICE_PRESERVATION_RULES = `
VOICE PRESERVATION HINTS:
- Keep nouns (people, places, brands), cherished phrases, and rhythm.
- If the input tone is casual, stay casual; if poetic, keep it lyrical but concrete.
- Preserve the user's voice: keep their diction, idioms, named entities, and specificity. If they say "kinda", keep "kinda".
- Match the user's voice; keep named entities and phrasing if possible.
`

export const STYLE_GUARDRAILS = `
Voice Protection Rules (few-shot):
- Input: "I kinda want to travel more one day, maybe Thailand."
  Output: "I love how travel expands me. I feel warm sun on my skin in Thailand..."
- Input: "I don't want debt."
  Output: "I enjoy paying everything on time and watching balances stay at zero."

Forbidden patterns (rewrite before output):
- /\\bI (want|will|wish|try|hope to)\\b/i
- /\\bI (don't|do not|no longer)\\b.*\\b/  (flip to the positive opposite)
- /\\bbut\\b|\\bhowever\\b|\\beven though\\b/i

Always rephrase to present-tense, positive, ideal state using the member's original terms.
`

export const MICRO_REWRITE_RULE = `
If any source text includes future/lack phrasing ("I want / I will / I don't"), silently transform to present-tense positive equivalents before composing. Preserve the member's diction.
Examples:
- "I hope to get healthier" → "I feel healthy and energized."
- "I don't want to be in debt" → "I enjoy seeing my balances at zero and growing savings."
`

export const FOUNDATIONAL_PRINCIPLES = `
FOUNDATIONAL PRINCIPLES — CORE PURPOSE:
1. **The basis of life is freedom** — This document should help the member feel free.
2. **The purpose of life is joy** — Everything desired is about feeling better in the having of it.
3. **The result of life is expansion** — Reflect growth and expansion in each area.
4. **Activate freedom through reading** — The text itself should feel freeing.
`

