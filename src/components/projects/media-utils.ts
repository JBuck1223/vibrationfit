// Shared helpers for Project Hub media (notes, links, and attachment sections)

import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import type { IdeaAttachment } from '@/lib/projects/types'

export interface UploadedFileMeta {
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif)(\?|$)/i
const VIDEO_EXT = /\.(mp4|mov|webm|m4v|3gp)(\?|$)/i

export function isImageAttachment(a: Pick<IdeaAttachment, 'file_type' | 'file_url'>): boolean {
  if (a.file_type?.startsWith('image/')) return true
  return IMAGE_EXT.test(a.file_url)
}

export function isVideoAttachment(a: Pick<IdeaAttachment, 'file_type' | 'file_url'>): boolean {
  if (a.file_type?.startsWith('video/')) return true
  return VIDEO_EXT.test(a.file_url)
}

/**
 * Upload files to the user's projects folder on S3 and return the metadata
 * rows the attachment APIs expect. Progress reports overall percent across
 * all files.
 */
export async function uploadProjectFiles(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<UploadedFileMeta[]> {
  const results: UploadedFileMeta[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const { url } = await uploadUserFile('projects', file, undefined, (filePercent) => {
      onProgress?.(Math.round(((i + filePercent / 100) / files.length) * 100))
    })
    results.push({
      file_name: file.name,
      file_url: url,
      file_type: file.type || null,
      file_size: file.size || null,
    })
  }
  onProgress?.(100)
  return results
}

/** Format a YYYY-MM-DD date string without timezone drift. */
export function formatNoteDate(noteDate: string): string {
  const date = new Date(`${noteDate.slice(0, 10)}T00:00:00`)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Today as a local YYYY-MM-DD string. */
export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function faviconUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`
  } catch {
    return null
  }
}

export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
