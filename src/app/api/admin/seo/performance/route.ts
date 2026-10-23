import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { SEO_PAGES } from '@/content/seo/registry'

export const dynamic = 'force-dynamic'

type Channel = 'organic' | 'ai' | 'paid' | 'social' | 'direct' | 'other'

const AI_REFERRERS = /chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|bard\.google\.com|you\.com|phind\.com/i
const SEARCH_REFERRERS = /google\.|bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org|search\.brave\.com/i
const SOCIAL_REFERRERS = /facebook\.com|instagram\.com|pinterest\.|tiktok\.com|youtube\.com|reddit\.com|t\.co|x\.com|linkedin\.com/i

type SessionRow = {
  id: string
  visitor_id: string
  landing_page: string | null
  referrer: string | null
  utm_medium: string | null
  utm_term: string | null
  gclid: string | null
  url_params: Record<string, string> | null
}

function channelOf(session: SessionRow): Channel {
  const medium = session.utm_medium?.toLowerCase() ?? ''
  if (session.gclid || ['cpc', 'ppc', 'paid', 'paidsearch'].includes(medium)) return 'paid'
  const referrer = session.referrer ?? ''
  if (AI_REFERRERS.test(referrer) || /chatgpt|perplexity/.test(session.url_params?.utm_source ?? '')) return 'ai'
  if (!referrer) return 'direct'
  if (SEARCH_REFERRERS.test(referrer)) return 'organic'
  if (SOCIAL_REFERRERS.test(referrer)) return 'social'
  return 'other'
}

type Totals = { sessions: number; visitors: Set<string>; channels: Record<Channel, number>; leads: number; customers: number; revenueCents: number }
const emptyTotals = (): Totals => ({ sessions: 0, visitors: new Set(), channels: { organic: 0, ai: 0, paid: 0, social: 0, direct: 0, other: 0 }, leads: 0, customers: 0, revenueCents: 0 })

async function inChunks<T>(ids: string[], fetchChunk: (chunk: string[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = []
  for (let i = 0; i < ids.length; i += 200) out.push(...(await fetchChunk(ids.slice(i, i + 200))))
  return out
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const days = Math.min(365, Math.max(1, parseInt(new URL(request.url).searchParams.get('days') || '30', 10) || 30))
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const paths = SEO_PAGES.map(page => `/${page.path}`)
  const admin = createAdminClient()

  const { data: sessionData, error } = await admin
    .from('sessions')
    .select('id, visitor_id, landing_page, referrer, utm_medium, utm_term, gclid, url_params')
    .in('landing_page', paths)
    .gte('started_at', since)
    .limit(20000)
  if (error) {
    console.error('SEO performance sessions error:', error)
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
  }
  const sessions = (sessionData ?? []) as SessionRow[]

  // Credit a lead / customer to the SEO page their visitor landed on first in range.
  const visitorPage = new Map<string, string>()
  for (const session of sessions) if (session.landing_page && !visitorPage.has(session.visitor_id)) visitorPage.set(session.visitor_id, session.landing_page)
  const visitorIds = [...visitorPage.keys()]

  const leads = await inChunks(visitorIds, async chunk => {
    const { data } = await admin.from('leads').select('visitor_id').in('visitor_id', chunk).gte('created_at', since)
    return (data ?? []) as { visitor_id: string }[]
  })
  const customers = await inChunks(visitorIds, async chunk => {
    const { data } = await admin.from('customers').select('visitor_id, total_spent, first_purchase_at').in('visitor_id', chunk).not('first_purchase_at', 'is', null)
    return (data ?? []) as { visitor_id: string; total_spent: number }[]
  })

  const byPage = new Map<string, Totals>(paths.map(path => [path, emptyTotals()]))
  const byKeyword = new Map<string, Totals & { page: string }>()
  const visitorKeyword = new Map<string, string>()

  for (const session of sessions) {
    const page = byPage.get(session.landing_page ?? '')
    if (!page) continue
    const channel = channelOf(session)
    page.sessions++
    page.visitors.add(session.visitor_id)
    page.channels[channel]++
    if (channel === 'paid') {
      const kw = (session.url_params?.kw || session.utm_term || '(not set)').toLowerCase()
      const key = `${session.landing_page}|${kw}`
      const row = byKeyword.get(key) ?? { ...emptyTotals(), page: session.landing_page! }
      row.sessions++
      row.visitors.add(session.visitor_id)
      byKeyword.set(key, row)
      if (!visitorKeyword.has(session.visitor_id)) visitorKeyword.set(session.visitor_id, key)
    }
  }
  for (const lead of leads) {
    const page = byPage.get(visitorPage.get(lead.visitor_id) ?? '')
    if (page) page.leads++
    const kwRow = byKeyword.get(visitorKeyword.get(lead.visitor_id) ?? '')
    if (kwRow) kwRow.leads++
  }
  for (const customer of customers) {
    const page = byPage.get(visitorPage.get(customer.visitor_id) ?? '')
    if (page) { page.customers++; page.revenueCents += customer.total_spent || 0 }
    const kwRow = byKeyword.get(visitorKeyword.get(customer.visitor_id) ?? '')
    if (kwRow) { kwRow.customers++; kwRow.revenueCents += customer.total_spent || 0 }
  }

  const serialize = (t: Totals) => ({ sessions: t.sessions, visitors: t.visitors.size, channels: t.channels, leads: t.leads, customers: t.customers, revenueCents: t.revenueCents })

  return NextResponse.json({
    days,
    pages: [...byPage.entries()].map(([path, totals]) => ({ path, ...serialize(totals) })),
    keywords: [...byKeyword.entries()]
      .map(([key, totals]) => ({ page: totals.page, keyword: key.split('|')[1], ...serialize(totals) }))
      .sort((a, b) => b.sessions - a.sessions),
    truncated: sessions.length >= 20000,
  })
}
