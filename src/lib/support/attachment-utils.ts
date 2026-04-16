export type SupportAttachmentKind = 'audio' | 'video' | 'image' | 'document'

export function getSupportAttachmentKind(url: string): SupportAttachmentKind {
  const lower = url.toLowerCase()
  if (
    lower.includes('audio-recording') ||
    lower.endsWith('.mp3') ||
    lower.endsWith('.wav') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.m4a')
  ) {
    return 'audio'
  }
  if (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.heic')
  ) {
    return 'image'
  }
  if (
    lower.endsWith('.pdf') ||
    lower.endsWith('.doc') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.xls') ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.csv') ||
    lower.endsWith('.txt')
  ) {
    return 'document'
  }
  return 'video'
}

export function getSupportAttachmentDisplayName(url: string) {
  const parts = url.split('/')
  const raw = parts[parts.length - 1] || ''
  return raw.replace(/^\d+-[a-z0-9]+-/, '')
}
