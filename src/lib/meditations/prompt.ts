import { DEFAULT_BPM } from './constants'

export function buildInstrumentalPrompt(mood: string, bpm: number): string {
  const feeling = mood.trim() || 'calm and spacious'
  const tempo = Number.isFinite(bpm) ? bpm : DEFAULT_BPM
  return [
    feeling,
    `${tempo} BPM`,
    'slow and spacious ambient instrumental',
    'continuous texture',
    'no vocals',
    'no lyrics',
    'no intro',
    'no ending',
    'soft dynamics',
    'suitable for meditation',
  ].join(', ')
}
