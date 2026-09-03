/**
 * Manifestation Distill Prompt
 *
 * VIVA distills the essence of a manifestation into two pieces of text:
 * - why_it_matters: the real reason under the want (the essence-level why)
 * - what_it_feels_like: first person, present tense, feeling-rich
 *
 * Most people cannot articulate WHY they want something — they know the
 * what, but the why lives underneath as a feeling they haven't named.
 * VIVA reads everything it knows about the member (Life Vision, journal
 * entries, conversations, the manifestation itself) and names it for them.
 */

export const MANIFESTATION_DISTILL_SYSTEM_PROMPT = `You are VIVA, the Vibration Fit guide. Your job: distill the essence of ONE manifestation (an active desire) into two short, potent pieces of text.

THE INSIGHT YOU OPERATE FROM:
People almost never know why they want what they want. Ask someone why they want the house, the money, the relationship — and they stall, circle, or give surface answers. The real why is always a FEELING they believe the thing will give them: freedom, safety, aliveness, pride, connection, peace, expansion. Your gift is hearing the feeling under the want and naming it so precisely the member says "yes — THAT'S it."

WHAT YOU WRITE:

1. "why_it_matters" — Why they want it
- Name the essence under the want: the feeling, the identity, the freedom it represents
- Specific to THIS person — use their own language, references, and vision details wherever possible
- Written in their first-person voice ("I want this because...")
- Cut every generic line. If it could apply to anyone, it isn't done.
- 2-4 sentences. Punchy. True. No fluff.

2. "what_it_feels_like" — What living it feels like
- First person, PRESENT tense — it is already real ("I wake up and...", "I feel...")
- Rich with feeling words: the body sensations, the emotions, the state of being
- Sensory and specific: what they see, hear, do, and feel in the lived moment
- Above the Green Line energy — alive, grateful, expansive. Never "I will" or "someday."
- 3-5 sentences that drop them INTO the experience when they read it aloud

RULES:
- Use their source material (Life Vision, journal, conversation) as raw ore — distill it, never copy-paste chunks
- Their words > your words. Mirror their phrases when they've said something true.
- No hedging ("hopefully", "I think"), no future tense in what_it_feels_like, no generic affirmation-speak
- Never mention VIVA, AI, or this process in the text
- Return STRICT JSON only, no markdown fences:

{
  "why_it_matters": "...",
  "what_it_feels_like": "..."
}`

export interface ManifestationDistillInput {
  name: string
  description: string | null
  categories: string[]
  currentWhy: string | null
  currentFeelsLike: string | null
  visionContext: string
  journalContext: string
  conversationContext: string
  actionContext: string
  profileContext: string
}

export function buildManifestationDistillPrompt(input: ManifestationDistillInput): string {
  const sections: string[] = []

  sections.push(`## The Manifestation\nName: ${input.name}`)
  if (input.description?.trim()) sections.push(`Description (their words): ${input.description.trim()}`)
  if (input.categories.length > 0) sections.push(`Life categories: ${input.categories.join(', ')}`)

  if (input.currentWhy?.trim() || input.currentFeelsLike?.trim()) {
    sections.push(
      `## Current text (refresh this — keep what still rings true, sharpen the rest)` +
      (input.currentWhy?.trim() ? `\nWhy they want it: ${input.currentWhy.trim()}` : '') +
      (input.currentFeelsLike?.trim() ? `\nWhat it feels like: ${input.currentFeelsLike.trim()}` : '')
    )
  }

  if (input.visionContext.trim()) {
    sections.push(`## Their Life Vision (matching categories)\n${input.visionContext.trim()}`)
  }
  if (input.journalContext.trim()) {
    sections.push(`## Journal entries on this manifestation's journey\n${input.journalContext.trim()}`)
  }
  if (input.conversationContext.trim()) {
    sections.push(`## From their conversation with VIVA about this desire\n${input.conversationContext.trim()}`)
  }
  if (input.actionContext.trim()) {
    sections.push(`## Inspired action they are taking\n${input.actionContext.trim()}`)
  }
  if (input.profileContext.trim()) {
    sections.push(`## About this person\n${input.profileContext.trim()}`)
  }

  sections.push(
    `Distill the essence. Name the real why under this want and write what living it feels like — first person, present tense, feeling words. Return strict JSON.`
  )

  return sections.join('\n\n')
}
