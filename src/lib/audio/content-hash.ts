import crypto from 'crypto'
import { normalizeText } from '@/lib/audio/content-normalize'

export { normalizeText } from '@/lib/audio/content-normalize'

export function hashContent(text: string): string {
  const normalized = normalizeText(text)
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

export function contentMatchesHash(text: string | null | undefined, contentHash: string | null | undefined): boolean {
  if (!text?.trim() || !contentHash) return false
  return hashContent(text) === contentHash
}
