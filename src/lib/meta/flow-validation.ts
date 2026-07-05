// Validation for automation rule flow payloads (shared by the admin API).

/** Light validation of a flow payload; returns an error string or null. */
export function validateFlow(flow: unknown): string | null {
  if (flow === null || flow === undefined) return null
  const f = flow as { steps?: unknown }
  if (typeof f !== 'object' || !Array.isArray(f.steps)) {
    return 'Flow must contain a steps array'
  }
  if (f.steps.length === 0) return 'Flow needs at least one step'
  if (f.steps.length > 20) return 'Flow cannot exceed 20 steps'

  const ids = new Set<string>()
  for (const raw of f.steps) {
    const step = raw as Record<string, unknown>
    if (!step.id || typeof step.id !== 'string') return 'Every step needs an id'
    if (ids.has(step.id)) return `Duplicate step id "${step.id}"`
    ids.add(step.id)
    if (step.type !== 'message' && step.type !== 'capture_email') {
      return `Invalid step type "${step.type}"`
    }
    if (step.type === 'message' && !((step.text as string) || '').trim()) {
      return 'Message steps need text'
    }
    if (step.email_template !== undefined && typeof step.email_template !== 'string') {
      return 'email_template must be a template slug string'
    }
    for (const key of ['confirm_text', 'confirm_known_text', 'confirm_button', 'confirm_no_button'] as const) {
      if (step[key] !== undefined && typeof step[key] !== 'string') {
        return `${key} must be a string`
      }
    }
    if (step.email_link !== undefined && typeof step.email_link !== 'string') {
      return 'email_link must be a URL string'
    }
    if (step.buttons !== undefined) {
      if (!Array.isArray(step.buttons) || step.buttons.length > 13) {
        return 'Buttons must be a list of at most 13'
      }
      for (const b of step.buttons as Array<Record<string, unknown>>) {
        if (!((b.label as string) || '').trim()) return 'Every button needs a label'
        if (!b.goto || typeof b.goto !== 'string') return 'Every button needs a target step'
      }
    }
  }

  // Referenced step ids must exist
  for (const raw of f.steps) {
    const step = raw as Record<string, unknown>
    const targets = [
      ...(Array.isArray(step.buttons)
        ? (step.buttons as Array<Record<string, unknown>>).map((b) => b.goto)
        : []),
      step.goto,
    ].filter(Boolean) as string[]
    for (const t of targets) {
      if (!ids.has(t)) return `Step "${step.id}" points at unknown step "${t}"`
    }
  }

  return null
}
