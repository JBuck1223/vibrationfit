// ============================================================================
// Member Access Gate (request proxy)
// ============================================================================
//
// Member pages are for paying members only. A signed-in account without
// member access (e.g. a Free Activation account) is sent to /join before any
// member page renders. Members reach Vibe Tribe only once Getting Started
// opens its step; until then they are sent back to /begin. The legacy
// Intensive pages all continue in Getting Started.
//
// The database decides (has_member_access / vibe_tribe_unlocked). A "yes" is
// remembered for five minutes in a signed, httpOnly cookie so page loads and
// prefetches do not each ask again; a "no" is never remembered, so a member
// who just paid, or just reached the Vibe Tribe step, gets in at once.

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const ACCESS_COOKIE = 'vf_access'
const ACCESS_TTL_SECONDS = 5 * 60

/** Member pages a non-member may still open: to manage billing, rejoin or get help. */
const NON_MEMBER_ALLOWED = ['/account', '/support']

/** Pages that are Vibe Tribe. */
const VIBE_TRIBE_PREFIXES = ['/vibe-tribe', '/tribe']

function under(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

interface CachedAccess {
  member: boolean
  tribe: boolean
}

async function sign(value: string): Promise<string> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, '0')).join('')
}

async function readCache(req: NextRequest, userId: string): Promise<CachedAccess | null> {
  const raw = req.cookies.get(ACCESS_COOKIE)?.value
  if (!raw) return null
  const [uid, exp, flags, mac] = raw.split('.')
  if (uid !== userId || !exp || !flags || !mac) return null
  if (Number(exp) * 1000 < Date.now()) return null
  if ((await sign(`${uid}.${exp}.${flags}`)) !== mac) return null
  return { member: flags[0] === '1', tribe: flags[1] === '1' }
}

async function writeCache(res: NextResponse, userId: string, access: CachedAccess) {
  if (!access.member) return
  const exp = Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS
  const body = `${userId}.${exp}.1${access.tribe ? '1' : '0'}`
  res.cookies.set({
    name: ACCESS_COOKIE,
    value: `${body}.${await sign(body)}`,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ACCESS_TTL_SECONDS,
  })
}

function redirectTo(req: NextRequest, res: NextResponse, pathname: string) {
  const target = NextResponse.redirect(new URL(pathname, req.nextUrl.origin))
  // Keep any refreshed session cookies the proxy already set.
  res.cookies.getAll().forEach((c) => target.cookies.set(c))
  return target
}

/**
 * Gate one member-page request. Returns a redirect when the account may not
 * see this page, otherwise null (the caller continues with `res`).
 */
export async function gateMemberPage(
  req: NextRequest,
  res: NextResponse,
  supabase: SupabaseClient,
  userId: string,
): Promise<NextResponse | null> {
  const pathname = req.nextUrl.pathname

  // The Intensive is retired: every Intensive page continues in Getting Started.
  if (pathname === '/intensive' || pathname.startsWith('/intensive/')) {
    return redirectTo(req, res, '/begin')
  }

  const wantsTribe = under(pathname, VIBE_TRIBE_PREFIXES)
  const cached = await readCache(req, userId)
  if (cached?.member && (!wantsTribe || cached.tribe)) return null

  const [{ data: member, error: memberError }, tribeResult] = await Promise.all([
    supabase.rpc('has_member_access', { uid: userId }),
    wantsTribe ? supabase.rpc('vibe_tribe_unlocked', { uid: userId }) : Promise.resolve({ data: cached?.tribe ?? false, error: null }),
  ])
  const isMember = !memberError && member === true
  const tribeOpen = isMember && !tribeResult.error && tribeResult.data === true

  if (!isMember) {
    if (under(pathname, NON_MEMBER_ALLOWED)) return null
    return redirectTo(req, res, '/join')
  }

  await writeCache(res, userId, { member: true, tribe: tribeOpen })

  if (wantsTribe && !tribeOpen) {
    const back = redirectTo(req, res, '/begin')
    return back
  }
  return null
}
