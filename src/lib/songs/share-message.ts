/**
 * Client-side share flow for public song links.
 *
 * Builds the "Check out this song..." message and prefers the native share
 * sheet (mobile/Safari) so the message travels with the link. Falls back to
 * copying "message + link" to the clipboard.
 */

export type ShareSongOutcome = 'shared' | 'copied' | 'dismissed'

export function songShareMessage(isCreator: boolean): string {
  return isCreator
    ? 'Check out this song I made on VibrationFit.com'
    : 'Check out this song I found on VibrationFit.com'
}

export async function shareSongLink(options: {
  url: string
  title?: string
  isCreator: boolean
}): Promise<ShareSongOutcome> {
  const { url, title, isCreator } = options
  const message = songShareMessage(isCreator)

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: title ? `${title} | Vibration Fit` : 'Vibration Fit',
        text: message,
        url,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'dismissed'
      }
      // Native share unavailable/failed — fall through to clipboard.
    }
  }

  await navigator.clipboard.writeText(`${message}\n${url}`)
  return 'copied'
}
