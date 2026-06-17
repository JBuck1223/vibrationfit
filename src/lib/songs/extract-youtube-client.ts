export interface ExtractYoutubeResult {
  audio_url: string
  duration: number
  title: string | null
  youtube_url: string
}

const TIMEOUT_MESSAGE = 'That track took too long to prepare. Please try again.'

async function extractOnce(url: string): Promise<Response> {
  return fetch('/api/songs/extract-youtube', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
}

/**
 * Extract YouTube audio for the waveform scrubber. Retries once on timeout-style
 * failures — conversion can take 60–90s on busy RapidAPI hosts.
 */
export async function extractYoutubeAudio(url: string): Promise<ExtractYoutubeResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 2500))
    }

    const response = await extractOnce(url)

    if (!response.ok) {
      const err = await response.json().catch(() => ({} as { error?: string }))
      const retryable = response.status === 502 || response.status === 504 || response.status === 408
      if (retryable && attempt === 0) continue
      if (response.status === 504 || response.status === 408) {
        throw new Error(TIMEOUT_MESSAGE)
      }
      throw new Error(err.error || 'Failed to extract audio')
    }

    return response.json()
  }

  throw new Error(TIMEOUT_MESSAGE)
}
