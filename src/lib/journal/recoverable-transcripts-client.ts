/** Client-only: hide recoverable banners user dismissed or already saved. */

const DISMISSED_KEY = 'vf_dismissed_recoverable_fps'
const LEGACY_DISMISSED_KEY = 'vf_dismissed_recoverable'

export function recordingFingerprint(keyOrUrl: string): string {
  const match = keyOrUrl.match(/recording-\d+/)
  return match?.[0] ?? keyOrUrl.split('/').pop()?.replace(/\.[^.]+$/, '') ?? keyOrUrl
}

function readDismissedFingerprints(): string[] {
  try {
    // Clear old list: restore used to dismiss by mistake; don't carry those over.
    if (localStorage.getItem(LEGACY_DISMISSED_KEY)) {
      localStorage.removeItem(LEGACY_DISMISSED_KEY)
    }
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
  } catch {
    return []
  }
}

export function getDismissedRecoverableFingerprints(): string[] {
  return readDismissedFingerprints()
}

export function dismissRecoverableFingerprint(keyOrUrl: string) {
  try {
    const fp = recordingFingerprint(keyOrUrl)
    const existing = readDismissedFingerprints()
    if (!existing.includes(fp)) {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...existing, fp]))
    }
  } catch {
    /* localStorage unavailable */
  }
}

/** After a successful journal save that includes this recording. */
export function dismissRecoverableForSavedRecordings(
  recordings: Array<{ url?: string }>
) {
  for (const rec of recordings) {
    if (rec.url) dismissRecoverableFingerprint(rec.url)
  }
}
