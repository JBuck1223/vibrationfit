// Shared helpers for Travel Tracker media and link sections

import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'

export interface UploadedFileMeta {
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif)(\?|$)/i
const VIDEO_EXT = /\.(mp4|mov|webm|m4v|3gp)(\?|$)/i

export function isImageAttachment(a: { file_type: string | null; file_url: string }): boolean {
  if (a.file_type?.startsWith('image/')) return true
  return IMAGE_EXT.test(a.file_url)
}

export function isVideoAttachment(a: { file_type: string | null; file_url: string }): boolean {
  if (a.file_type?.startsWith('video/')) return true
  return VIDEO_EXT.test(a.file_url)
}

/**
 * Upload files to the user's travel folder on S3 and return the metadata
 * rows the attachment APIs expect. Progress reports overall percent across
 * all files.
 */
export async function uploadTravelFiles(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<UploadedFileMeta[]> {
  const results: UploadedFileMeta[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const { url } = await uploadUserFile('travel', file, undefined, (filePercent) => {
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

/** Human date range for a trip: "Jun 3 – Jun 12, 2025", or the year, or duration text. */
export function tripDateLabel(trip: {
  start_date: string | null
  end_date: string | null
  year: number | null
  duration_text?: string | null
}): string | null {
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, opts)

  if (trip.start_date && trip.end_date) {
    const sameYear = trip.start_date.slice(0, 4) === trip.end_date.slice(0, 4)
    const start = fmt(trip.start_date, sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
    const end = fmt(trip.end_date, { month: 'short', day: 'numeric', year: 'numeric' })
    return `${start} – ${end}`
  }
  if (trip.start_date) {
    return fmt(trip.start_date, { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (trip.year) return String(trip.year)
  return trip.duration_text || null
}
