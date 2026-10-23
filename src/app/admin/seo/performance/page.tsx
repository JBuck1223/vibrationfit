'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Panel, Stat, fmt } from '@/components/admin-seo/ui'

type Channels = { organic: number; ai: number; paid: number; social: number; direct: number; other: number }
type Row = { sessions: number; visitors: number; channels: Channels; leads: number; customers: number; revenueCents: number }
type PageRow = Row & { path: string }
type KeywordRow = Row & { page: string; keyword: string }
type Data = { days: number; pages: PageRow[]; keywords: KeywordRow[]; truncated: boolean }

const RANGES = [7, 30, 90, 365]
const CHANNELS: { key: keyof Channels; label: string }[] = [
  { key: 'organic', label: 'Organic' },
  { key: 'ai', label: 'AI search' },
  { key: 'paid', label: 'Paid' },
  { key: 'social', label: 'Social' },
  { key: 'direct', label: 'Direct' },
]

const usd = (cents: number) => (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const rate = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—')

export default function SeoAdminPerformance() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/seo/performance?days=${days}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  const sum = (key: 'sessions' | 'visitors' | 'leads' | 'customers' | 'revenueCents') => data?.pages.reduce((s, p) => s + p[key], 0) ?? 0
  const sumChannel = (key: keyof Channels) => data?.pages.reduce((s, p) => s + p.channels[key], 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance</h1>
          <p className="mt-1 text-sm text-neutral-400">Sessions that landed on an SEO page, by channel, with the leads and revenue those visitors went on to produce.</p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map(range => (
            <button key={range} type="button" onClick={() => setDays(range)} className={`rounded-full border px-3 py-1.5 text-sm ${days === range ? 'border-[#39FF14] text-[#39FF14]' : 'border-white/15 text-neutral-300 hover:border-white/40'}`}>
              {range === 365 ? '12 months' : `${range} days`}
            </button>
          ))}
          <button type="button" onClick={load} aria-label="Refresh" className="rounded-full border border-white/15 p-2 text-neutral-300 hover:border-white/40">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <Panel><p className="text-sm text-red-400">{error}</p></Panel>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Landing sessions" value={fmt(sum('sessions'))} sub={`${fmt(sum('visitors'))} visitors`} />
        <Stat label="Organic search" value={fmt(sumChannel('organic'))} sub="Google, Bing, DuckDuckGo…" />
        <Stat label="AI search" value={fmt(sumChannel('ai'))} sub="ChatGPT, Perplexity, Claude, Gemini, Copilot" />
        <Stat label="Paid (Google Ads)" value={fmt(sumChannel('paid'))} />
        <Stat label="Leads → customers" value={`${fmt(sum('leads'))} → ${fmt(sum('customers'))}`} sub={`${usd(sum('revenueCents'))} revenue`} />
      </div>

      <Panel title="By page">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="pb-2">Page</th>
                <th className="pb-2 text-right">Sessions</th>
                {CHANNELS.map(c => <th key={c.key} className="pb-2 text-right">{c.label}</th>)}
                <th className="pb-2 text-right">Leads</th>
                <th className="pb-2 text-right">Lead rate</th>
                <th className="pb-2 text-right">Customers</th>
                <th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.pages ?? []).map(page => (
                <tr key={page.path}>
                  <td className="py-2"><Link href={`/admin/seo/pages${page.path}`} className="text-white hover:text-[#39FF14]">{page.path}</Link></td>
                  <td className="py-2 text-right tabular-nums">{fmt(page.sessions)}</td>
                  {CHANNELS.map(c => <td key={c.key} className="py-2 text-right tabular-nums text-neutral-300">{fmt(page.channels[c.key])}</td>)}
                  <td className="py-2 text-right tabular-nums">{fmt(page.leads)}</td>
                  <td className="py-2 text-right tabular-nums text-neutral-400">{rate(page.leads, page.visitors)}</td>
                  <td className="py-2 text-right tabular-nums">{fmt(page.customers)}</td>
                  <td className="py-2 text-right tabular-nums">{usd(page.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && sum('sessions') === 0 && <p className="mt-4 text-sm text-neutral-500">No landing sessions in this range yet. Results appear as pages get indexed and ads go live.</p>}
      </Panel>

      <Panel title="Paid clicks by ad keyword">
        <p className="mb-3 text-xs text-neutral-500">From the <code className="text-neutral-300">kw</code> Final URL suffix param (falls back to utm_term). Credited to the visitor&rsquo;s first paid keyword.</p>
        {(data?.keywords.length ?? 0) === 0 ? (
          <p className="text-sm text-neutral-500">No paid clicks yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr><th className="pb-2">Keyword</th><th className="pb-2">Landing page</th><th className="pb-2 text-right">Clicks (sessions)</th><th className="pb-2 text-right">Leads</th><th className="pb-2 text-right">Lead rate</th><th className="pb-2 text-right">Customers</th><th className="pb-2 text-right">Revenue</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data!.keywords.map(row => (
                  <tr key={`${row.page}-${row.keyword}`}>
                    <td className="py-2 text-neutral-100">{row.keyword}</td>
                    <td className="py-2 text-neutral-400">{row.page}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(row.sessions)}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(row.leads)}</td>
                    <td className="py-2 text-right tabular-nums text-neutral-400">{rate(row.leads, row.visitors)}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(row.customers)}</td>
                    <td className="py-2 text-right tabular-nums">{usd(row.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {data?.truncated && <p className="text-xs text-yellow-300">Showing the first 20,000 sessions in range; narrow the date range for exact totals.</p>}
    </div>
  )
}
