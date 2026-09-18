/**
 * When the responder calls a write tool (journal, song, story, …) and then
 * finishes without speaking, the client treats the turn as a failed stream.
 * The action still happened. Speak in coaching voice from the tool results
 * so chat matches reality — not a raw "Added X" receipt.
 */

export type CoachToolResultLike = {
  output?: unknown
}

export type CoachStepLike = {
  text?: string
  toolResults?: Array<CoachToolResultLike | undefined>
}

type CoachActionKind =
  | 'journal'
  | 'manifestation'
  | 'not_found'
  | 'failure'
  | 'other'

type CoachActionFact = {
  kind: CoachActionKind
  success: boolean
  title?: string
  link?: string
  attachedNames?: string[]
  chosenTruth?: string
  why?: string
  feel?: string
  message?: string
}

export function buildCoachSpokenReply(steps: CoachStepLike[]): string {
  const spoken = steps
    .map((step) => (step.text || '').trim())
    .filter(Boolean)
    .join('\n\n')
  if (spoken) return spoken
  return formatCoachToolConfirmations(steps)
}

export function formatCoachToolConfirmations(steps: CoachStepLike[]): string {
  const facts = collectCoachActionFacts(steps)
  if (facts.length === 0) return ''
  return narrateCoachActions(facts)
}

function collectCoachActionFacts(steps: CoachStepLike[]): CoachActionFact[] {
  const facts: CoachActionFact[] = []
  for (const step of steps) {
    for (const result of step.toolResults || []) {
      if (!result) continue
      const fact = factFromToolOutput(result.output)
      if (fact) facts.push(fact)
    }
  }
  return facts
}

function factFromToolOutput(output: unknown): CoachActionFact | null {
  if (!output || typeof output !== 'object') return null
  const rec = output as Record<string, unknown>
  if (rec.not_found) {
    const query = typeof rec.query === 'string' && rec.query.trim() ? rec.query.trim() : 'that'
    return { kind: 'not_found', success: false, title: query, message: asString(rec.message) }
  }

  const message = asString(rec.message)
  const kind = parseKind(rec.kind, message)
  if (kind === 'other' && !message) return null

  const attachedNames = stringList(rec.attached_names)
  return {
    kind: rec.success === false ? 'failure' : kind,
    success: rec.success !== false,
    title: asString(rec.title) || titleFromMessage(message),
    link: asString(rec.link),
    attachedNames,
    chosenTruth: asString(rec.chosen_truth),
    why: asString(rec.why),
    feel: asString(rec.feel),
    message,
  }
}

function narrateCoachActions(facts: CoachActionFact[]): string {
  const created = facts.filter((f) => f.success && f.kind !== 'not_found')
  const misses = facts.filter((f) => f.kind === 'not_found')
  const failures = facts.filter((f) => !f.success && f.kind !== 'not_found')

  if (misses.length && created.length === 0) {
    const query = misses[0].title || 'that'
    return `I don't have "${query}" yet. If you want me to create it and attach what we just talked about, I can.`
  }

  const journal = created.find((f) => f.kind === 'journal')
  const manifestation = created.find((f) => f.kind === 'manifestation')

  if (journal && manifestation) {
    return joinBlocks([
      `This belongs on the manifestation — ${manifestation.title || 'that desire'} is the reality this shift is building. I created it and captured "${journal.title || 'this'}" as the journal on it, so the journey stays attached to the desire.`,
      truthLine(journal.chosenTruth || manifestation.why || manifestation.feel),
      linkLine([
        manifestation.link ? `[Open the manifestation](${manifestation.link})` : '',
        journal.link ? `[Open the journal](${journal.link})` : '',
      ]),
    ])
  }

  if (journal) {
    const attached = journal.attachedNames?.[0]
    const lead = attached
      ? `I created "${journal.title || 'this'}" and attached it to ${attached}. That's the journaled journey for this manifestation — so the wobble, what became clear, and the truth you chose live with the desire.`
      : `I captured "${journal.title || 'this'}" in your journal so this stays with you.`
    return joinBlocks([
      lead,
      truthLine(journal.chosenTruth),
      journal.link ? `[Open the journal](${journal.link})` : '',
    ])
  }

  if (manifestation) {
    const body = manifestation.why || manifestation.feel
      ? `I created ${manifestation.title || 'that manifestation'} as the one we're living into. ${manifestation.why || manifestation.feel}`
      : `I created ${manifestation.title || 'that manifestation'} as the one we're living into.`
    return joinBlocks([
      body,
      manifestation.link ? `[Open the manifestation](${manifestation.link})` : '',
    ])
  }

  const lines = [...created, ...failures]
    .map((fact) => {
      const text = fact.message || ''
      if (!text) return ''
      if (fact.link && fact.success) return `${text} [Open it](${fact.link})`
      return text
    })
    .filter(Boolean)

  return lines.join('\n\n')
}

function parseKind(raw: unknown, message?: string): CoachActionKind {
  if (raw === 'journal' || raw === 'manifestation') return raw
  if (message && /journal/i.test(message)) return 'journal'
  if (message && /manifestation/i.test(message)) return 'manifestation'
  return 'other'
}

function titleFromMessage(message?: string): string | undefined {
  if (!message) return undefined
  const quoted = message.match(/"([^"]+)"/)
  return quoted?.[1]
}

function truthLine(text?: string): string {
  if (!text) return ''
  return `The truth we landed: ${text}`
}

function linkLine(links: string[]): string {
  return links.filter(Boolean).join(' · ')
}

function joinBlocks(parts: string[]): string {
  return parts.filter(Boolean).join('\n\n')
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const names = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return names.length > 0 ? names : undefined
}
