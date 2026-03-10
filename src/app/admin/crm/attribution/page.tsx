'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import { ArrowUpRight, Eye, Globe, Monitor, Smartphone, Tablet, Users, UserCheck, MousePointerClick, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Visitor {
  id: string
  first_landing_page: string | null
  first_referrer: string | null
  first_utm_source: string | null
  first_utm_medium: string | null
  first_utm_campaign: string | null
  first_utm_content: string | null
  first_utm_term: string | null
  first_gclid: string | null
  first_fbclid: string | null
  session_count: number
  total_pageviews: number
  user_id: string | null
  first_seen_at: string
  last_seen_at: string
  converted: boolean
  user_email: string | null
  user_name: string | null
}

interface SourceBreakdown {
  name: string
  visitors: number
  converted: number
  conversionRate: number
}

interface Totals {
  visitors: number
  converted: number
  sessions: number
  pageviews: number
}

export default function AttributionPage() {
  const router = useRouter()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [sources, setSources] = useState<SourceBreakdown[]>([])
  const [mediums, setMediums] = useState<string[]>([])
  const [totals, setTotals] = useState<Totals>({ visitors: 0, converted: 0, sessions: 0, pageviews: 0 })
  const [loading, setLoading] = useState(true)

  const [sourceFilter, setSourceFilter] = useState('all')
  const [mediumFilter, setMediumFilter] = useState('all')
  const [dateRange, setDateRange] = useState('30')
  const [showConverted, setShowConverted] = useState(false)
  const [view, setView] = useState<'visitors' | 'sources'>('visitors')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (sourceFilter !== 'all') params.append('source', sourceFilter)
      if (mediumFilter !== 'all') params.append('medium', mediumFilter)
      params.append('date_range', dateRange)
      if (showConverted) params.append('converted', 'true')

      const response = await fetch(`/api/admin/attribution?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch attribution data')

      const data = await response.json()
      setVisitors(data.visitors)
      setSources(data.sources)
      setMediums(data.mediums)
      setTotals(data.totals)
    } catch (error) {
      console.error('Error fetching attribution:', error)
      toast.error('Failed to load attribution data')
    } finally {
      setLoading(false)
    }
  }, [sourceFilter, mediumFilter, dateRange, showConverted])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function truncatePath(path: string | null, maxLen = 40) {
    if (!path) return '-'
    return path.length > maxLen ? path.slice(0, maxLen) + '...' : path
  }

  function getSourceBadgeColor(source: string | null) {
    if (!source) return 'bg-[#555] text-white'
    switch (source.toLowerCase()) {
      case 'google': return 'bg-blue-600 text-white'
      case 'facebook':
      case 'fb':
      case 'meta': return 'bg-blue-800 text-white'
      case 'instagram':
      case 'ig': return 'bg-pink-600 text-white'
      case 'tiktok': return 'bg-[#333] text-white'
      case 'youtube':
      case 'yt': return 'bg-red-600 text-white'
      case 'twitter':
      case 'x': return 'bg-[#333] text-white'
      case 'email':
      case 'newsletter': return 'bg-emerald-600 text-white'
      default: return 'bg-accent-500/20 text-accent-400'
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Attribution"
          subtitle="Visitor acquisition, sessions, and conversion tracking"
        >
          <div className="flex gap-2">
            <Button
              variant={view === 'visitors' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('visitors')}
            >
              <Users className="w-4 h-4 mr-1" />
              Visitors
            </Button>
            <Button
              variant={view === 'sources' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('sources')}
            >
              <Globe className="w-4 h-4 mr-1" />
              Sources
            </Button>
          </div>
        </PageHero>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">{totals.visitors}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> Visitors
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary-500">{totals.converted}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <UserCheck className="w-3 h-3" /> Converted
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-secondary-500">{totals.sessions}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <MousePointerClick className="w-3 h-3" /> Sessions
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-accent-500">{totals.pageviews}</div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <FileText className="w-3 h-3" /> Pageviews
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[#1A1A1A] border border-[#333] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-[#1A1A1A] border border-[#333] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Sources</option>
            <option value="direct">Direct</option>
            {sources.map(s => (
              s.name !== 'direct' && (
                <option key={s.name} value={s.name}>{s.name}</option>
              )
            ))}
          </select>

          {mediums.length > 0 && (
            <select
              value={mediumFilter}
              onChange={(e) => setMediumFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-[#333] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Mediums</option>
              {mediums.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          <Button
            variant={showConverted ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowConverted(!showConverted)}
          >
            <UserCheck className="w-4 h-4 mr-1" />
            Converted Only
          </Button>
        </div>

        {/* Sources View */}
        {view === 'sources' && (
          <Card className="p-0 overflow-x-auto">
            <div className="min-w-[600px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#333]">
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Source</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Visitors</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Converted</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Conv. Rate</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr
                      key={source.name}
                      className="border-b border-[#333] hover:bg-[#1F1F1F] cursor-pointer transition-colors"
                      onClick={() => setSourceFilter(source.name === 'direct' ? 'direct' : source.name)}
                    >
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <Badge className={`${getSourceBadgeColor(source.name === 'direct' ? null : source.name)} px-2 py-1 text-xs`}>
                          {source.name}
                        </Badge>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4 text-sm text-white font-medium">
                        {source.visitors}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4 text-sm text-primary-500">
                        {source.converted}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[#333] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${source.conversionRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-neutral-300">{source.conversionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4 text-sm text-neutral-400">
                        {totals.visitors > 0
                          ? Math.round((source.visitors / totals.visitors) * 100)
                          : 0}%
                      </td>
                    </tr>
                  ))}
                  {sources.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-neutral-400 text-sm">
                        No source data for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Visitors View */}
        {view === 'visitors' && (
          <>
            {visitors.length === 0 ? (
              <Card className="text-center p-8 md:p-12">
                <p className="text-sm md:text-base text-neutral-400">No visitors found for this period</p>
              </Card>
            ) : (
              <Card className="p-0 overflow-x-auto">
                <div className="min-w-[900px]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#333]">
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Visitor</th>
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Source</th>
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Medium</th>
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">Landing Page</th>
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Sessions</th>
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Pages</th>
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Status</th>
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">First Seen</th>
                        <th className="text-center py-3 md:py-4 px-2 text-neutral-400 font-medium text-xs md:text-sm w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((visitor) => (
                        <tr
                          key={visitor.id}
                          className="border-b border-[#333] hover:bg-[#1F1F1F] cursor-pointer transition-colors"
                          onClick={() => router.push(`/admin/crm/attribution/${visitor.id}`)}
                        >
                          <td className="py-3 md:py-4 px-3 md:px-4">
                            {visitor.converted ? (
                              <div>
                                <div className="font-medium text-xs md:text-sm text-white truncate max-w-[160px]">
                                  {visitor.user_name || 'Unnamed User'}
                                </div>
                                <div className="text-xs text-neutral-500 truncate max-w-[160px]">
                                  {visitor.user_email}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs md:text-sm text-neutral-400 font-mono truncate max-w-[160px]">
                                {visitor.id.slice(0, 8)}...
                              </div>
                            )}
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4">
                            <Badge className={`${getSourceBadgeColor(visitor.first_utm_source)} px-2 py-1 text-xs`}>
                              {visitor.first_utm_source || 'direct'}
                            </Badge>
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden md:table-cell">
                            {visitor.first_utm_medium || '-'}
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs hidden lg:table-cell">
                            <span title={visitor.first_landing_page || ''}>
                              {truncatePath(visitor.first_landing_page, 30)}
                            </span>
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4 text-white text-xs md:text-sm font-medium">
                            {visitor.session_count}
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden md:table-cell">
                            {visitor.total_pageviews}
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4">
                            {visitor.converted ? (
                              <Badge className="bg-primary-500 text-black px-2 py-1 text-xs">Signed Up</Badge>
                            ) : (
                              <Badge className="bg-[#555] text-white px-2 py-1 text-xs">Anonymous</Badge>
                            )}
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs hidden md:table-cell">
                            {formatDate(visitor.first_seen_at)}
                          </td>
                          <td className="py-3 md:py-4 px-2 text-center">
                            <Eye className="w-4 h-4 text-neutral-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
