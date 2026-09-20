import { READ_TOOLS } from '@/lib/viva/modes'

export type CoachToolStepLike = {
  text?: string
  toolCalls?: Array<{ toolName: string }>
  toolResults?: Array<{ toolName?: string; output?: unknown }>
}

function asOutput(output: unknown): { success?: unknown; message?: unknown; link?: unknown } | null {
  if (!output || typeof output !== 'object') return null
  return output as { success?: unknown; message?: unknown; link?: unknown }
}

function spokenFromSteps(steps: CoachToolStepLike[], fallbackText = ''): string {
  const joined = steps.map(step => step.text || '').join('').trim()
  return joined || fallbackText.trim()
}

/** After a write action, the next model step must speak — not call another tool or go silent. */
export function shouldForceCoachNarration(steps: CoachToolStepLike[]): boolean {
  const readNames = READ_TOOLS as readonly string[]
  return steps.some(step =>
    (step.toolCalls || []).some(call => !readNames.includes(call.toolName))
  )
}

/** User-facing confirmation from tool results when the model produced no text. */
export function narrateCoachToolResults(steps: CoachToolStepLike[]): string | null {
  const lines: string[] = []
  const seen = new Set<string>()

  for (const step of steps) {
    for (const result of step.toolResults || []) {
      const output = asOutput(result.output)
      if (!output) continue
      const message = typeof output.message === 'string' ? output.message.trim() : ''
      if (!message || seen.has(message)) continue
      seen.add(message)
      const link = typeof output.link === 'string' ? output.link : ''
      if (link && !message.includes(link)) {
        const trimmed = message.replace(/[.]$/, '')
        lines.push(`${trimmed} — [open it](${link}).`)
      } else {
        lines.push(message)
      }
    }
  }

  return lines.length > 0 ? lines.join('\n\n') : null
}

export function resolveCoachReply(steps: CoachToolStepLike[], fallbackText = ''): string {
  return spokenFromSteps(steps, fallbackText) || narrateCoachToolResults(steps) || ''
}
