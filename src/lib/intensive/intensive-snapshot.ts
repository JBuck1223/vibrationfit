/**
 * Client-side session cache for a user's intensive/settings/admin status.
 *
 * Why this exists:
 *   `GlobalLayout.tsx` needs to know three things on every route change:
 *     1) Is the user in an active intensive? (affects sidebar + layout)
 *     2) Is the user a super-admin? (bypasses intensive locking)
 *     3) Did the user complete the settings step? (intensive access gating)
 *
 *   Doing those three DB queries on every `usePathname()` change means 2-3
 *   Supabase round trips before the new page is allowed to render. That's
 *   what made sidebar clicks feel slow.
 *
 * Strategy:
 *   - Fetch once per browser session (persisted to `sessionStorage`).
 *   - Key by user id so multi-account switching gets a clean miss.
 *   - Users who are NOT in an active intensive (the vast majority after
 *     onboarding) get a long TTL — they should almost never re-query.
 *   - Users who ARE in an active intensive get a short TTL so step
 *     progression is reflected quickly, plus an explicit `invalidate()`
 *     call-site after step completions.
 *   - In-memory promise coalescing prevents duplicate concurrent fetches
 *     (e.g. GlobalLayout + IntensiveLockedOverlay mounting at the same time).
 */

'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { IntensiveData } from './utils-client'

export interface IntensiveSnapshot {
  userId: string
  hasActiveIntensive: boolean
  intensive: IntensiveData | null
  isSuperAdmin: boolean
  settingsComplete: boolean
  checkedAt: number
}

const STORAGE_KEY = 'vf-intensive-snapshot-v1'
// Non-intensive users: cache for 30 min. They almost never transition back into intensive.
const IDLE_TTL_MS = 1000 * 60 * 30
// Active intensive users: keep stale data briefly so rapid nav doesn't thrash, but
// re-fetch soon so step progression shows up quickly.
const ACTIVE_TTL_MS = 1000 * 10

let memoryCache: IntensiveSnapshot | null = null
let inflight: Promise<IntensiveSnapshot | null> | null = null

function readFromSession(): IntensiveSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as IntensiveSnapshot
  } catch {
    return null
  }
}

function writeToSession(snap: IntensiveSnapshot): void {
  memoryCache = snap
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snap))
  } catch {
    // sessionStorage can be disabled (private mode, quota); in-memory cache still works for the session
  }
}

function isFresh(snap: IntensiveSnapshot): boolean {
  const ttl = snap.hasActiveIntensive ? ACTIVE_TTL_MS : IDLE_TTL_MS
  return Date.now() - snap.checkedAt < ttl
}

/**
 * Synchronous cache peek. Returns `null` if nothing cached for this user
 * or if the cached snapshot is stale.
 */
export function peekIntensiveSnapshot(userId: string | null): IntensiveSnapshot | null {
  if (!userId) return null
  if (memoryCache && memoryCache.userId === userId && isFresh(memoryCache)) {
    return memoryCache
  }
  const fromStorage = readFromSession()
  if (fromStorage && fromStorage.userId === userId && isFresh(fromStorage)) {
    memoryCache = fromStorage
    return fromStorage
  }
  return null
}

async function fetchSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<IntensiveSnapshot> {
  const [intensiveRes, accountRes] = await Promise.all([
    supabase
      .from('intensive_checklist')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_accounts')
      .select('role, first_name, last_name, email, phone')
      .eq('id', userId)
      .single(),
  ])

  const intensive = (intensiveRes.data as IntensiveData | null) ?? null
  const account = accountRes.data ?? null

  const snapshot: IntensiveSnapshot = {
    userId,
    hasActiveIntensive: !!intensive,
    intensive,
    isSuperAdmin: account?.role === 'super_admin',
    settingsComplete: !!(
      account &&
      account.first_name?.trim() &&
      account.last_name?.trim() &&
      account.email?.trim() &&
      account.phone?.trim()
    ),
    checkedAt: Date.now(),
  }

  writeToSession(snapshot)
  return snapshot
}

/**
 * Returns the cached snapshot if fresh, otherwise fetches and caches.
 * Concurrent callers share a single in-flight request.
 *
 * Pass `{ forceRefresh: true }` after a step completion to bypass the cache.
 */
export async function loadIntensiveSnapshot(
  userId: string | null,
  options?: { forceRefresh?: boolean },
): Promise<IntensiveSnapshot | null> {
  if (!userId) return null

  if (!options?.forceRefresh) {
    const cached = peekIntensiveSnapshot(userId)
    if (cached) return cached
  }

  if (inflight) return inflight

  const supabase = createClient()
  inflight = fetchSnapshot(supabase, userId)
    .catch((err) => {
      console.error('intensive-snapshot: fetch failed', err)
      return null
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/**
 * Clear the cache. Call after sign-out, or after any state change that
 * would invalidate the snapshot (e.g. the user just completed an intensive
 * step or finished their intensive entirely).
 */
export function invalidateIntensiveSnapshot(): void {
  memoryCache = null
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
