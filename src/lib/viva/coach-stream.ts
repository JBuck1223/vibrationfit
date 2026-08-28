/**
 * /viva coach stream protocol + mobile-safe reader.
 *
 * iOS WebKit (Safari, Chrome, Firefox — all WebKit) has two failure modes that
 * left members staring at "Here with you..." forever:
 *
 * 1. fetch() does not resolve until response headers arrive. The coach route
 *    used to wait through retrieve + Luna before sending any bytes, so Safari
 *    often dropped the connection without rejecting.
 * 2. Even after headers, response.body.getReader() frequently never yields
 *    chunks. XMLHttpRequest onprogress is the reliable path on iOS.
 *
 * The server now writes ~2KB of padding immediately (WebKit buffers streamed
 * bodies until that threshold), then a meta line, then tokens.
 */

export const COACH_STREAM_PAD_CHAR = '\u200c'
export const COACH_STREAM_PAD_LENGTH = 2048
export const COACH_STREAM_PADDING = COACH_STREAM_PAD_CHAR.repeat(COACH_STREAM_PAD_LENGTH)

/** First payload line after padding: RS + JSON meta + newline, then tokens. */
export const COACH_STREAM_META_MARKER = '\x1e'

export type CoachStreamIndicator = {
  source: string
  detail: string
}

export type CoachStreamMeta = {
  indicators?: CoachStreamIndicator[]
}

export type ParsedCoachStream = {
  indicators?: CoachStreamIndicator[]
  text: string
  /** False while we only have padding or a partial meta line. */
  ready: boolean
}

export function parseCoachStreamBuffer(raw: string): ParsedCoachStream {
  let i = 0
  while (i < raw.length && raw[i] === COACH_STREAM_PAD_CHAR) i++
  const stripped = raw.slice(i)
  if (!stripped) return { text: '', ready: false }

  if (stripped.startsWith(COACH_STREAM_META_MARKER)) {
    const nl = stripped.indexOf('\n')
    if (nl === -1) return { text: '', ready: false }
    let indicators: CoachStreamIndicator[] | undefined
    try {
      const meta = JSON.parse(stripped.slice(1, nl)) as CoachStreamMeta
      if (Array.isArray(meta.indicators)) indicators = meta.indicators
    } catch {
      // Malformed meta — still surface whatever follows so a reply is not lost
    }
    return { indicators, text: stripped.slice(nl + 1), ready: true }
  }

  // Backward compatible: plain token stream with no framing
  return { text: stripped, ready: true }
}

export class CoachStreamError extends Error {
  status?: number
  tokensRemaining?: number

  constructor(message: string, opts?: { status?: number; tokensRemaining?: number }) {
    super(message)
    this.name = 'CoachStreamError'
    this.status = opts?.status
    this.tokensRemaining = opts?.tokensRemaining
  }
}

export function isIOSWebKit(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS 13+ reports as Macintosh
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

type CoachStreamHeaders = {
  conversationId: string | null
}

export type ReadCoachStreamOptions = {
  url: string
  body: unknown
  signal?: AbortSignal
  timeoutMs?: number
  onHeaders?: (headers: CoachStreamHeaders) => void
  onUpdate: (parsed: ParsedCoachStream) => void
}

export type ReadCoachStreamResult = {
  conversationId: string | null
  parsed: ParsedCoachStream
}

const DEFAULT_TIMEOUT_MS = 120_000

function throwIfHttpError(status: number, bodyText: string): void {
  if (status >= 200 && status < 300) return
  let message = 'Request failed'
  let tokensRemaining: number | undefined
  try {
    const data = JSON.parse(bodyText) as { error?: string; tokensRemaining?: number }
    if (data.error) message = data.error
    if (typeof data.tokensRemaining === 'number') tokensRemaining = data.tokensRemaining
  } catch {
    if (bodyText.trim()) message = bodyText.trim().slice(0, 200)
  }
  throw new CoachStreamError(message, { status, tokensRemaining })
}

function readConversationId(getter: (name: string) => string | null): string | null {
  return getter('X-Conversation-Id') || getter('x-conversation-id')
}

async function readCoachStreamXhr(
  options: ReadCoachStreamOptions,
  timeoutMs: number
): Promise<ReadCoachStreamResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let settled = false
    let lastParsed: ParsedCoachStream = { text: '', ready: false }
    let conversationId: string | null = null
    let headersAnnounced = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      fn()
    }

    const onAbort = () => {
      xhr.abort()
      finish(() => reject(new CoachStreamError('Request cancelled')))
    }

    const cleanup = () => {
      options.signal?.removeEventListener('abort', onAbort)
    }

    xhr.open('POST', options.url)
    xhr.responseType = 'text'
    xhr.timeout = timeoutMs
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Accept', 'text/plain')

    if (options.signal) {
      if (options.signal.aborted) {
        onAbort()
        return
      }
      options.signal.addEventListener('abort', onAbort)
    }

    const consume = () => {
      if (xhr.readyState >= 2 && !headersAnnounced) {
        headersAnnounced = true
        conversationId = readConversationId((name) => xhr.getResponseHeader(name))
        options.onHeaders?.({ conversationId })
      }
      const raw = typeof xhr.responseText === 'string' ? xhr.responseText : ''
      lastParsed = parseCoachStreamBuffer(raw)
      options.onUpdate(lastParsed)
    }

    xhr.onprogress = consume

    xhr.onload = () => {
      try {
        consume()
        throwIfHttpError(xhr.status, typeof xhr.responseText === 'string' ? xhr.responseText : '')
        finish(() => resolve({ conversationId, parsed: lastParsed }))
      } catch (err) {
        finish(() => reject(err))
      }
    }

    xhr.onerror = () => {
      finish(() => reject(new CoachStreamError('Network error')))
    }

    xhr.ontimeout = () => {
      finish(() => reject(new CoachStreamError('VIVA is taking longer than expected. Try sending that again.')))
    }

    xhr.onabort = () => {
      if (settled) return
      finish(() => reject(new CoachStreamError('Request cancelled')))
    }

    xhr.send(JSON.stringify(options.body))
  })
}

async function readCoachStreamFetch(
  options: ReadCoachStreamOptions,
  timeoutMs: number
): Promise<ReadCoachStreamResult> {
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs)

  const onAbort = () => timeoutController.abort()
  if (options.signal) {
    if (options.signal.aborted) timeoutController.abort()
    else options.signal.addEventListener('abort', onAbort)
  }

  try {
    const response = await fetch(options.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
      },
      credentials: 'same-origin',
      body: JSON.stringify(options.body),
      signal: timeoutController.signal,
    })

    const conversationId = readConversationId((name) => response.headers.get(name))
    options.onHeaders?.({ conversationId })

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '')
      throwIfHttpError(response.status, bodyText)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let raw = ''
    let lastParsed: ParsedCoachStream = { text: '', ready: false }

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
        lastParsed = parseCoachStreamBuffer(raw)
        options.onUpdate(lastParsed)
      }
      raw += decoder.decode()
      lastParsed = parseCoachStreamBuffer(raw)
      options.onUpdate(lastParsed)
    } else {
      // Some WebKit builds expose a body only as text()
      raw = await response.text()
      lastParsed = parseCoachStreamBuffer(raw)
      options.onUpdate(lastParsed)
    }

    return { conversationId, parsed: lastParsed }
  } catch (err) {
    if (err instanceof CoachStreamError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new CoachStreamError('VIVA is taking longer than expected. Try sending that again.')
    }
    throw err instanceof Error ? err : new CoachStreamError('Network error')
  } finally {
    clearTimeout(timeoutId)
    options.signal?.removeEventListener('abort', onAbort)
  }
}

export async function readCoachStream(options: ReadCoachStreamOptions): Promise<ReadCoachStreamResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  if (isIOSWebKit()) {
    return readCoachStreamXhr(options, timeoutMs)
  }
  return readCoachStreamFetch(options, timeoutMs)
}
