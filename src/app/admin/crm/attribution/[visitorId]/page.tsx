'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import {
  ArrowLeft, Globe, Monitor, Smartphone, Tablet, Clock,
  MousePointerClick, FileText, ExternalLink, ChevronDown, ChevronRight,
  UserCheck, MapPin, Tag,
} from 'lucide-react'
import { toast } from 'sonner'

interface PageView {
  id: string
  page_path: string
  page_title: string | null
  view_order: number
  time_on_page_seconds: number | null
  created_at: string
}

interface Session {
  id: string
  landing_page: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  gclid: string | null
  fbclid: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  pageview_count: number
  converted: boolean
  conversion_type: string | null
  started_at: string
  last_activity_at: string
  pages: PageView[]
}

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
  first_msclkid: string | null
  first_ttclid: string | null
  session_count: number
  total_pageviews: number
  user_id: string | null
  first_seen_at: string
  last_seen_at: string
}

interface UserAccount {
  id: string
  email: string
  full_name: string
  first_name: string | null
  last_name: string | null
}

interface JourneyEvent {
  id: string
  event_type: string
  event_data: Record<string, unknown>
  created_at: string
}

export default function VisitorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const visitorId = params.visitorId as string

  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/admin/attribution/${visitorId}`)
        if (!response.ok) throw new Error('Failed to fetch visitor')

        const data = await response.json()
        setVisitor(data.visitor)
        setUserAccount(data.userAccount)
        setSessions(data.sessions)
        setJourneyEvents(data.journeyEvents)

        if (data.sessions.length > 0) {
          setExpandedSessions(new Set([data.sessions[0].id]))
        }
      } catch (error) {
        console.error('Error fetching visitor detail:', error)
        toast.error('Failed to load visitor details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [visitorId])

  function toggleSession(sessionId: string) {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  function getDeviceIcon(deviceType: string | null) {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />
      case 'tablet': return <Tablet className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
  }

  function getEventLabel(eventType: string) {
    switch (eventType) {
      case 'email_captured': return 'Email Captured'
      case 'cart_created': return 'Cart Created'
      case 'checkout_started': return 'Checkout Started'
      case 'purchase_completed': return 'Purchase Completed'
      default: return eventType.replace(/_/g, ' ')
    }
  }

  function getEventColor(eventType: string) {
    switch (eventType) {
      case 'email_captured': return 'bg-secondary-500 text-black'
      case 'cart_created': return 'bg-[#FFB701] text-black'
      case 'checkout_started': return 'bg-accent-500 text-white'
      case 'purchase_completed': return 'bg-primary-500 text-black'
      default: return 'bg-[#555] text-white'
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!visitor) {
    return (
      <Container size="xl">
        <Card className="text-center p-8 md:p-12">
          <p className="text-neutral-400">Visitor not found</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/admin/crm/attribution')}>
            Back to Attribution
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Back button + header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/crm/attribution')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Attribution
          </Button>
          <PageHero
            title={userAccount?.full_name || `Visitor ${visitor.id.slice(0, 8)}...`}
            subtitle={userAccount?.email || 'Anonymous visitor'}
          />
        </div>

        {/* Visitor overview cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-xs text-neutral-400 mb-1">First Seen</div>
            <div className="text-sm text-white">{formatDateTime(visitor.first_seen_at)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-neutral-400 mb-1">Last Seen</div>
            <div className="text-sm text-white">{formatDateTime(visitor.last_seen_at)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-neutral-400 mb-1">Total Sessions</div>
            <div className="text-2xl font-bold text-secondary-500">{visitor.session_count}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-neutral-400 mb-1">Total Pageviews</div>
            <div className="text-2xl font-bold text-accent-500">{visitor.total_pageviews}</div>
          </Card>
        </div>

        {/* First-touch attribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-secondary-500" />
            First-Touch Attribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-400 mb-1">Source</div>
              <div className="text-sm text-white">{visitor.first_utm_source || 'Direct'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Medium</div>
              <div className="text-sm text-white">{visitor.first_utm_medium || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Campaign</div>
              <div className="text-sm text-white">{visitor.first_utm_campaign || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Content</div>
              <div className="text-sm text-white">{visitor.first_utm_content || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Term</div>
              <div className="text-sm text-white">{visitor.first_utm_term || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Landing Page</div>
              <div className="text-sm text-white break-all">{visitor.first_landing_page || '-'}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-neutral-400 mb-1">Referrer</div>
              <div className="text-sm text-white break-all">{visitor.first_referrer || 'None (Direct)'}</div>
            </div>
            {(visitor.first_gclid || visitor.first_fbclid || visitor.first_msclkid || visitor.first_ttclid) && (
              <div className="md:col-span-2 flex flex-wrap gap-2">
                {visitor.first_gclid && <Badge className="bg-blue-600 text-white px-2 py-1 text-xs">Google Ads (gclid)</Badge>}
                {visitor.first_fbclid && <Badge className="bg-blue-800 text-white px-2 py-1 text-xs">Meta Ads (fbclid)</Badge>}
                {visitor.first_msclkid && <Badge className="bg-cyan-600 text-white px-2 py-1 text-xs">Microsoft Ads (msclkid)</Badge>}
                {visitor.first_ttclid && <Badge className="bg-[#333] text-white px-2 py-1 text-xs">TikTok Ads (ttclid)</Badge>}
              </div>
            )}
          </div>
        </Card>

        {/* Journey events */}
        {journeyEvents.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-500" />
              Conversion Journey
            </h3>
            <div className="space-y-3">
              {journeyEvents.map((event, i) => (
                <div key={event.id} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${getEventColor(event.event_type).split(' ')[0]}`} />
                    {i < journeyEvents.length - 1 && (
                      <div className="w-px h-6 bg-[#333]" />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <Badge className={`${getEventColor(event.event_type)} px-2 py-1 text-xs`}>
                      {getEventLabel(event.event_type)}
                    </Badge>
                    <span className="text-xs text-neutral-500">{formatDateTime(event.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Sessions */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-secondary-500" />
            Sessions ({sessions.length})
          </h3>

          {sessions.length === 0 ? (
            <Card className="text-center p-8">
              <p className="text-sm text-neutral-400">No sessions recorded</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const isExpanded = expandedSessions.has(session.id)
                const sessionDuration = session.last_activity_at && session.started_at
                  ? Math.round((new Date(session.last_activity_at).getTime() - new Date(session.started_at).getTime()) / 1000)
                  : null

                return (
                  <Card key={session.id} className="p-0 overflow-hidden">
                    {/* Session header */}
                    <button
                      className="w-full p-4 flex items-center gap-3 hover:bg-[#1F1F1F] transition-colors text-left"
                      onClick={() => toggleSession(session.id)}
                    >
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      }

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">
                            {formatDateTime(session.started_at)}
                          </span>
                          {session.converted && (
                            <Badge className="bg-primary-500 text-black px-2 py-0.5 text-xs">
                              <UserCheck className="w-3 h-3 mr-1 inline" />
                              {session.conversion_type || 'Converted'}
                            </Badge>
                          )}
                          {session.utm_source && (
                            <Badge className="bg-[#333] text-neutral-300 px-2 py-0.5 text-xs">
                              <Tag className="w-3 h-3 mr-1 inline" />
                              {session.utm_source}
                              {session.utm_medium ? ` / ${session.utm_medium}` : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            {getDeviceIcon(session.device_type)}
                            {session.browser || 'Unknown'} on {session.os || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {session.pageview_count} page{session.pageview_count !== 1 ? 's' : ''}
                          </span>
                          {sessionDuration !== null && sessionDuration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(sessionDuration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Session detail */}
                    {isExpanded && (
                      <div className="border-t border-[#333] p-4 bg-[#0F0F0F]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-xs text-neutral-400">Landing Page</span>
                            <div className="text-sm text-white break-all">{session.landing_page || '-'}</div>
                          </div>
                          <div>
                            <span className="text-xs text-neutral-400">Referrer</span>
                            <div className="text-sm text-white break-all">{session.referrer || 'Direct'}</div>
                          </div>
                          {session.utm_campaign && (
                            <div>
                              <span className="text-xs text-neutral-400">Campaign</span>
                              <div className="text-sm text-white">{session.utm_campaign}</div>
                            </div>
                          )}
                          {session.utm_content && (
                            <div>
                              <span className="text-xs text-neutral-400">Content</span>
                              <div className="text-sm text-white">{session.utm_content}</div>
                            </div>
                          )}
                          {session.utm_term && (
                            <div>
                              <span className="text-xs text-neutral-400">Term</span>
                              <div className="text-sm text-white">{session.utm_term}</div>
                            </div>
                          )}
                          {(session.gclid || session.fbclid) && (
                            <div className="flex gap-2">
                              {session.gclid && <Badge className="bg-blue-600 text-white px-2 py-1 text-xs">gclid</Badge>}
                              {session.fbclid && <Badge className="bg-blue-800 text-white px-2 py-1 text-xs">fbclid</Badge>}
                            </div>
                          )}
                        </div>

                        {/* Page flow */}
                        {session.pages.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                              Page Flow
                            </h4>
                            <div className="space-y-1">
                              {session.pages.map((page, i) => (
                                <div key={page.id} className="flex items-center gap-2 text-sm">
                                  <span className="text-xs text-neutral-600 w-5 text-right flex-shrink-0">{i + 1}.</span>
                                  <span className="text-neutral-300 break-all">{page.page_path}</span>
                                  {page.page_title && (
                                    <span className="text-neutral-600 text-xs hidden md:inline">
                                      ({page.page_title})
                                    </span>
                                  )}
                                  {page.time_on_page_seconds != null && page.time_on_page_seconds > 0 && (
                                    <span className="text-neutral-600 text-xs flex-shrink-0">
                                      {formatDuration(page.time_on_page_seconds)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {session.pages.length === 0 && (
                          <p className="text-xs text-neutral-500">No pageview details recorded for this session</p>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </Stack>
    </Container>
  )
}
