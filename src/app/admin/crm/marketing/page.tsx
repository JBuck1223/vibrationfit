'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button, Card, Badge, Container, Spinner, PageHero } from '@/lib/design-system/components'
import {
  Users,
  MousePointerClick,
  PlayCircle,
  UserPlus,
  ShoppingCart,
  DollarSign,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

interface PerformanceRow {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  visitors: number
  sessions: number
  pageviews: number
  engaged_visitors: number
  video_starts: number
  video_25: number
  video_50: number
  video_75: number
  video_95: number
  leads: number
  purchases: number
  revenue_cents: number
  spend: number
  budget: number
}

interface Totals {
  visitors: number
  sessions: number
  pageviews: number
  engaged_visitors: number
  video_starts: number
  video_25: number
  video_50: number
  video_75: number
  video_95: number
  leads: number
  purchases: number
  revenue_cents: number
  spend: number
}

const DATE_RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '12 months' },
]

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function formatSpend(dollars: number): string {
  return dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function pct(part: number, whole: number): string {
  if (!whole) return '0%'
  return Math.round((part / whole) * 100) + '%'
}

function sourceBadgeColor(source: string) {
  switch (source.toLowerCase()) {
    case 'facebook':
    case 'fb':
    case 'meta': return 'bg-blue-800 text-white'
    case 'instagram':
    case 'ig': return 'bg-pink-600 text-white'
    case 'google': return 'bg-blue-600 text-white'
    case 'tiktok': return 'bg-[#333] text-white'
    case 'youtube': return 'bg-red-600 text-white'
    case 'referral': return 'bg-[#00FFFF] text-black'
    case 'direct': return 'bg-[#555] text-white'
    default: return 'bg-[#BF00FF] text-white'
  }
}

export default function MarketingPerformancePage() {
  const [rows, setRows] = useState<PerformanceRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/marketing/performance?date_range=${dateRange}`)
      if (!response.ok) throw new Error('Failed to fetch performance data')
      const data = await response.json()
      setRows(data.rows || [])
      setTotals(data.totals || null)
    } catch (error) {
      console.error('Error fetching marketing performance:', error)
      toast.error('Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const funnelCards = totals
    ? [
        { label: 'Visitors', value: totals.visitors.toLocaleString(), sub: `${totals.sessions.toLocaleString()} sessions`, icon: Users },
        { label: 'Engaged', value: totals.engaged_visitors.toLocaleString(), sub: pct(totals.engaged_visitors, totals.visitors) + ' of visitors', icon: MousePointerClick },
        { label: 'Video 75%+', value: (totals.video_75).toLocaleString(), sub: `${totals.video_95.toLocaleString()} hit 95%`, icon: PlayCircle },
        { label: 'Leads', value: totals.leads.toLocaleString(), sub: pct(totals.leads, totals.visitors) + ' of visitors', icon: UserPlus },
        { label: 'Purchases', value: totals.purchases.toLocaleString(), sub: pct(totals.purchases, totals.visitors) + ' of visitors', icon: ShoppingCart },
        { label: 'Revenue', value: formatMoney(totals.revenue_cents), sub: totals.spend > 0 ? `${(totals.revenue_cents / 100 / totals.spend).toFixed(1)}x ROAS` : 'No spend logged', icon: DollarSign },
      ]
    : []

  return (
    <Container size="xl" className="py-8">
      <PageHero
        title="Ad Performance"
        subtitle="Every first touch, credited through engagement, video, leads, and revenue"
        className="mb-8"
      />

      <div className="flex flex-wrap items-center gap-3 mb-8">
        {DATE_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={dateRange === range.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDateRange(range.value)}
          >
            {range.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {funnelCards.map((card) => (
              <Card key={card.label} className="p-5">
                <div className="flex items-center gap-2 text-neutral-400 text-sm mb-2">
                  <card.icon className="w-4 h-4" />
                  {card.label}
                </div>
                <div className="text-2xl font-bold text-white">{card.value}</div>
                <div className="text-xs text-neutral-500 mt-1">{card.sub}</div>
              </Card>
            ))}
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#333] text-left text-neutral-400">
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium text-right">Visitors</th>
                    <th className="px-4 py-3 font-medium text-right">Engaged</th>
                    <th className="px-4 py-3 font-medium text-right">Vid 25</th>
                    <th className="px-4 py-3 font-medium text-right">Vid 50</th>
                    <th className="px-4 py-3 font-medium text-right">Vid 75</th>
                    <th className="px-4 py-3 font-medium text-right">Vid 95</th>
                    <th className="px-4 py-3 font-medium text-right">Leads</th>
                    <th className="px-4 py-3 font-medium text-right">Sales</th>
                    <th className="px-4 py-3 font-medium text-right">Revenue</th>
                    <th className="px-4 py-3 font-medium text-right">Spend</th>
                    <th className="px-4 py-3 font-medium text-right">ROAS</th>
                    <th className="px-4 py-3 font-medium text-right">CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={14} className="px-4 py-12 text-center text-neutral-500">
                        No visitor data in this window yet. Once campaigns start driving tagged
                        traffic, every source lands here automatically.
                      </td>
                    </tr>
                  )}
                  {rows.map((row, i) => {
                    const revenue = Number(row.revenue_cents)
                    const spend = Number(row.spend)
                    const purchases = Number(row.purchases)
                    return (
                      <tr key={i} className="border-b border-[#222] hover:bg-[#1A1A1A] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge className={sourceBadgeColor(row.utm_source)}>{row.utm_source}</Badge>
                            {row.utm_medium && (
                              <span className="text-xs text-neutral-500">{row.utm_medium}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-300">
                          {row.utm_campaign || <span className="text-neutral-600">untagged</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-white">{Number(row.visitors).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">
                          {Number(row.engaged_visitors).toLocaleString()}
                          <span className="text-neutral-600 text-xs ml-1">
                            {pct(Number(row.engaged_visitors), Number(row.visitors))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-300">{Number(row.video_25).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">{Number(row.video_50).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">{Number(row.video_75).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">{Number(row.video_95).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-[#00FFFF]">{Number(row.leads).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-[#39FF14]">{purchases.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-[#39FF14] font-semibold">{formatMoney(revenue)}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">
                          {spend > 0 ? formatSpend(spend) : <span className="text-neutral-600">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {spend > 0 ? (
                            <span className={revenue / 100 / spend >= 1 ? 'text-[#39FF14]' : 'text-[#FF0040]'}>
                              {(revenue / 100 / spend).toFixed(1)}x
                            </span>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-300">
                          {spend > 0 && purchases > 0 ? formatSpend(spend / purchases) : <span className="text-neutral-600">-</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-xs text-neutral-500 mt-4">
            First-touch attribution: visitors are grouped by the campaign that first brought them
            in, and all of their engagement, leads, and revenue is credited to that campaign.
            Spend comes from the matching campaign in Campaigns (by utm_campaign) — keep
            total_spent updated there for ROAS and CPA.
          </p>
        </>
      )}
    </Container>
  )
}
