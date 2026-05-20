export function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
}

export function storyTextMatchesTrack(storyContent: string | null | undefined, trackText: string | null | undefined): boolean {
  if (!storyContent?.trim() || !trackText?.trim()) return false
  return normalizeText(storyContent) === normalizeText(trackText)
}
