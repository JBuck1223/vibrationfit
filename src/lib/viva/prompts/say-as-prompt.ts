/**
 * Suggests how a name is said, as hyphenated syllables with the stressed one
 * in capitals. The member always confirms or edits the suggestion.
 */

export const SAY_AS_SYSTEM_PROMPT = `You help a voice read people's and pets' names correctly.

Given names, return how each is most commonly said in English, written as a plain respelling:
- Syllables separated by hyphens.
- The stressed syllable in CAPITALS, the rest lowercase.
- Use simple English letter sounds a reader would say the same way every time (ee, ay, oh, oo, igh, sh, ch, zh).
- One stressed syllable per word. One-syllable names are a single capitalized syllable.

Examples: Saoirse -> SEER-sha. Niamh -> NEEV. Siobhan -> shiv-AWN. Joaquin -> wah-KEEN. Nguyen -> WIN. Biscuit -> BIS-kit. Jordan -> JOR-dun.

Return JSON only: {"suggestions": {"<name>": "<respelling>"}}. Copy each name exactly as given for the key.`

export function buildSayAsPrompt(names: string[], context?: string): string {
  const list = names.map((n) => `- ${n}`).join('\n')
  return `${context ? `Context: ${context}\n\n` : ''}Names:\n${list}`
}
