// Rate limiting for public API endpoints.
//
// Uses Upstash Redis (REST API, no SDK needed) when UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are set, so limits are shared across all serverless
// instances. Falls back to a per-instance in-memory counter otherwise —
// best-effort, but still blunts single-source abuse.
//
// Fails OPEN on any internal error: rate limiting must never break the funnel.

import { NextRequest, NextResponse } from 'next/server'

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// ---- In-memory fallback (fixed window, per serverless instance) ----

const memoryCounters = new Map<string, { count: number; resetAt: number }>()
const MEMORY_MAX_KEYS = 10_000

function memoryHit(key: string, limit: number, windowMs: number): { limited: boolean; retryAfterSec: number } {
  const now = Date.now()
  const entry = memoryCounters.get(key)

  if (!entry || entry.resetAt <= now) {
    if (memoryCounters.size >= MEMORY_MAX_KEYS) {
      for (const [k, v] of memoryCounters) {
        if (v.resetAt <= now) memoryCounters.delete(k)
      }
      if (memoryCounters.size >= MEMORY_MAX_KEYS) memoryCounters.clear()
    }
    memoryCounters.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, retryAfterSec: 0 }
  }

  entry.count += 1
  if (entry.count > limit) {
    return { limited: true, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
  }
  return { limited: false, retryAfterSec: 0 }
}

// ---- Upstash Redis (fixed window via INCR + PEXPIRE pipeline) ----

async function upstashHit(key: string, limit: number, windowMs: number): Promise<{ limited: boolean; retryAfterSec: number }> {
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, windowMs.toString(), 'NX'],
    ]),
    signal: AbortSignal.timeout(2000),
  })

  if (!res.ok) throw new Error(`Upstash ${res.status}`)

  const results = (await res.json()) as Array<{ result?: number; error?: string }>
  const count = results[0]?.result
  if (typeof count !== 'number') throw new Error('Upstash bad response')

  if (count > limit) {
    return { limited: true, retryAfterSec: Math.max(1, Math.ceil(windowMs / 1000)) }
  }
  return { limited: false, retryAfterSec: 0 }
}

// ---- Public API ----

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Check the rate limit for this request. Returns a 429 NextResponse when the
 * limit is exceeded, or null when the request may proceed.
 *
 * Usage at the top of a route handler:
 *   const limited = await rateLimit(request, 'leads', 5)
 *   if (limited) return limited
 *
 * @param name     Namespace for the endpoint (e.g. 'leads').
 * @param limit    Max requests per window per IP.
 * @param windowMs Window length in ms (default 60s).
 */
export async function rateLimit(
  request: NextRequest,
  name: string,
  limit: number,
  windowMs = 60_000
): Promise<NextResponse | null> {
  try {
    const ip = getClientIp(request)
    const key = `rl:${name}:${ip}`

    const result =
      UPSTASH_URL && UPSTASH_TOKEN
        ? await upstashHit(key, limit, windowMs)
        : memoryHit(key, limit, windowMs)

    if (result.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': result.retryAfterSec.toString() },
        }
      )
    }
    return null
  } catch (err) {
    // Fail open — rate limiting must never take down the funnel
    console.warn(`[rate-limit] check failed for "${name}" (allowing request):`, err)
    return null
  }
}
