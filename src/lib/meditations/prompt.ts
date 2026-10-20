/**
 * Mureka has no tempo control and drifts faster when it adds rhythm, so the
 * prompt rules out anything percussive. A reference clip is the reliable way to set pace.
 */
export function buildInstrumentalPrompt(mood: string): string {
  const feeling = mood.trim() || 'calm and spacious'
  return [
    'very slow, unhurried, largo',
    feeling,
    'beatless ambient instrumental',
    'no drums, no percussion, no beat, no rhythm section',
    'long sustained pads and slow evolving chords',
    'notes change rarely, lots of space between phrases',
    'continuous texture, no intro, no ending',
    'no vocals, no lyrics',
    'soft dynamics, suitable for breathwork and meditation',
  ].join(', ')
}
