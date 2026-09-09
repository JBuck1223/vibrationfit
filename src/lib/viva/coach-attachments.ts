/**
 * VIVA chat attachments — persist in ai_conversations.context and
 * shape the current turn for the vision-capable responder.
 */

export type VivaPersistedAttachment = {
  url: string
  name: string
  type: 'image' | 'document'
  mimeType?: string
}

export type CoachUserContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image'; image: string; mediaType?: string }
      | { type: 'file'; data: string; mediaType: string; filename?: string }
    >

const IMAGE_EXT = /\.(heic|heif|jpe?g|png|gif|webp|bmp|tif?f)$/i
const PDF_EXT = /\.pdf$/i

export function isImageAttachment(attachment: VivaPersistedAttachment): boolean {
  if (attachment.type === 'image') return true
  const mime = attachment.mimeType || ''
  if (mime.startsWith('image/')) return true
  return IMAGE_EXT.test(attachment.name)
}

export function parseVivaAttachments(value: unknown): VivaPersistedAttachment[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const rec = item as Record<string, unknown>
    if (typeof rec.url !== 'string' || !/^https:\/\//i.test(rec.url)) return []
    const name = typeof rec.name === 'string' && rec.name.trim() ? rec.name.trim().slice(0, 200) : 'file'
    const type: VivaPersistedAttachment['type'] = rec.type === 'document' ? 'document' : 'image'
    const mimeType = typeof rec.mimeType === 'string' ? rec.mimeType : undefined
    return [{ url: rec.url, name, type, mimeType }]
  })
}

export function describeAttachments(attachments: VivaPersistedAttachment[]): string {
  if (attachments.length === 0) return ''
  if (attachments.length === 1) {
    return isImageAttachment(attachments[0]) ? 'Shared a photo.' : `Shared ${attachments[0].name}.`
  }
  const photos = attachments.filter(isImageAttachment).length
  if (photos === attachments.length) {
    return `Shared ${photos} photos.`
  }
  return `Shared ${attachments.length} files.`
}

export function buildUserMessageContent(
  text: string,
  attachments: VivaPersistedAttachment[] = [],
): CoachUserContent {
  const images = attachments.filter(isImageAttachment)
  const docs = attachments.filter((a) => !isImageAttachment(a))
  const parts: string[] = []
  const trimmed = text.trim()
  if (trimmed) parts.push(trimmed)
  if (docs.length > 0) {
    parts.push(docs.map((d) => `Attached file: ${d.name} (${d.url})`).join('\n'))
  }
  const combined = parts.join('\n\n')
  const pdfs = docs.filter((d) => d.mimeType === 'application/pdf' || PDF_EXT.test(d.name))

  if (images.length === 0 && pdfs.length === 0) return combined

  const content: Exclude<CoachUserContent, string> = []
  if (combined) content.push({ type: 'text', text: combined })
  for (const img of images) {
    content.push({
      type: 'image',
      image: img.url,
      ...(img.mimeType && img.mimeType.startsWith('image/') ? { mediaType: img.mimeType } : {}),
    })
  }
  for (const doc of pdfs) {
    content.push({
      type: 'file',
      data: doc.url,
      mediaType: 'application/pdf',
      filename: doc.name,
    })
  }
  return content
}
