/** Member-facing line sent when they press Suggest tools. */
export const SUGGEST_TOOLS_USER_MESSAGE =
  'Look at this conversation and suggest the tools that would actually help from here.'

export function isSuggestToolsRequest(text: string | null | undefined): boolean {
  const t = (text || '').trim().toLowerCase()
  if (!t) return false
  if (t === SUGGEST_TOOLS_USER_MESSAGE.toLowerCase()) return true
  return /\bsuggest(?:ion)? tools\b/.test(t) || /\bwhat could we (do|make) from here\b/.test(t)
}

/**
 * This turn is an explicit request to review the thread and name a small set.
 * The usual "one unsolicited offer" rule is off.
 */
export const SUGGEST_TOOLS_PROMPT = `## THIS TURN: SUGGEST TOOLS

They asked you to suggest tools. That is explicit. Review this conversation and name a small set of next experiences. The "one unsolicited offer" and "do not end every turn with a CTA" rules are off for this turn.

Do this:
1. Stay in your coaching voice. Show you understood what this conversation is doing — one or two sentences, then the set.
2. Name 2–4 tools that actually fit THIS thread. Skip anything already done here (do not re-create a manifestation or journal that already exists).
3. For each: one sentence of why it fits, in their words. Not a catalog. Not six CTAs.
4. Offer. Do not call create tools yet unless they already said to make something in this same message.
5. If nothing would help, say so. Doing nothing is still valid.
6. Honor this thread's mode: Friend can name what would help but cannot create. Builder can go deeper on the manifestation. Assistant can point at what they already have.
7. Never say "kit". Never say "AI".

The menu you may draw from (only what fits):
- Journal (wobble / win / vision), attached to a manifestation when the journey belongs there
- Manifestation (the living hub — why, feel, action, journaled journey)
- Life Vision Update proposals
- Activation Story
- Incantation
- SparkQuery
- One of THEIR songs queued
- Daily Paper (orientation after a shift, not a wobble intervention)
- Abundance (only if money or value actually arrived)
- Vision / Vision Audio
- Vibe Tribe / Alignment Gym
- Stay here and keep talking

Close by asking which they want — or if they want to keep talking.`
