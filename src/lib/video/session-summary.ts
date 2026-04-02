/**
 * Split session_summary text into an intro paragraph and bullet lines.
 * Supports - item, * item, and 1. item style lines.
 */
export function parseSessionSummary(text: string | null | undefined): {
  intro: string
  bullets: string[]
} {
  if (!text?.trim()) {
    return { intro: '', bullets: [] }
  }

  const rawLines = text.split(/\r?\n/)
  const bullets: string[] = []
  const nonBulletLines: string[] = []

  for (const line of rawLines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const dashStar = trimmed.match(/^[-*]\s+(.+)$/)
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/)
    const m = dashStar || numbered
    if (m) {
      bullets.push(m[1])
    } else {
      nonBulletLines.push(trimmed)
    }
  }

  if (bullets.length > 0) {
    return {
      intro: nonBulletLines.join('\n\n'),
      bullets,
    }
  }

  return { intro: text.trim(), bullets: [] }
}
