'use client'

/**
 * Client-side error logger. Sends errors to the backend so they appear in
 * server logs (e.g. Vercel Logs) and can be inspected when functionality
 * fails in production. Does not replace console logging; use for persistence.
 */

export interface ClientErrorPayload {
  message: string
  stack?: string
  type: 'error' | 'rejection'
  url?: string
  /** Optional label, e.g. from ErrorBoundary */
  label?: string
}

const ENDPOINT = '/api/log/client-error'

export function logClientError(payload: ClientErrorPayload): void {
  const url = typeof window !== 'undefined' ? window.location.href : undefined
  const body = {
    ...payload,
    url: payload.url ?? url,
  }
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Silently ignore network errors to avoid feedback loops
  })
}
