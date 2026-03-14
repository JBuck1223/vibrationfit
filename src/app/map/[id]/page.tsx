'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Container,
  Stack,
  PageHero,
  Card,
  Button,
  Text,
  Inline,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import {
  ArrowLeft,
  Zap,
  Archive,
  Bell,
  BellOff,
  RefreshCw,
  Edit,
  ExternalLink,
  Copy,
} from 'lucide-react'
import type { UserMap, UserMapItem, MapCategory } from '@/lib/map/types'
import { DAY_LABELS, DAY_LABELS_FULL, CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/map/types'
import { getActivityDefinition } from '@/lib/map/activities'

const CATEGORY_COLORS: Record<MapCategory, string> = {
  activations: '#39FF14',
  connections: '#BF00FF',
  sessions: '#00FFFF',
  creations: '#FFFF00',
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  draft: { label: 'Draft', className: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
  archived: { label: 'Archived', className: 'bg-neutral-800 text-neutral-500 border-neutral-700' },
}

function formatTime(t: string | null) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${dh}:${String(m).padStart(2, '0')} ${period}`
}

export default function MapViewPage() {
  const router = useRouter()
  const params = useParams()
  const mapId = params.id as string

  const [map, setMap] = useState<UserMap | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchMap()
  }, [mapId])

  const fetchMap = async () => {
    try {
      const res = await fetch(`/api/map/${mapId}`)
      if (!res.ok) {
        router.push('/map')
        return
      }
      const data = await res.json()
      setMap(data.map)
    } catch {
      router.push('/map')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    setActionLoading('activate')
    try {
      const res = await fetch(`/api/map/${mapId}/activate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      const data = await res.json()
      setMap(data.map)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate')
    } finally {
      setActionLoading(null)
    }
  }

  const handleArchive = async () => {
    setActionLoading('archive')
    try {
      const res = await fetch(`/api/map/${mapId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      await fetchMap()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefreshNotifications = async () => {
    setActionLoading('refresh')
    try {
      const res = await fetch(`/api/map/${mapId}/schedule`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`Notifications refreshed: ${data.scheduled} messages scheduled.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to refresh notifications')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async () => {
    if (!map?.items) return
    setActionLoading('duplicate')
    try {
      const res = await fetch('/api/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${map.title} (copy)`,
          timezone: map.timezone,
          items: map.items.map(item => ({
            category: item.category,
            activity_type: item.activity_type,
            label: item.label,
            days_of_week: item.days_of_week,
            time_of_day: item.time_of_day,
            notify_sms: item.notify_sms,
            deep_link: item.deep_link,
            sort_order: item.sort_order,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/map/${data.map.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!map) return null

  const items = (map.items ?? []) as UserMapItem[]
  const statusStyle = STATUS_STYLES[map.status] || STATUS_STYLES.draft

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          eyebrow={`MAP V${map.version_number}`}
          title={map.title}
          subtitle={`${items.length} activities across your week`}
        >
          <Inline gap="sm" className="justify-center">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle.className}`}
            >
              {statusStyle.label}
            </span>
            {items.some(i => i.notify_sms) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30">
                <Bell className="w-3 h-3" />
                SMS Reminders
              </span>
            )}
          </Inline>
        </PageHero>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/map')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            All MAPs
          </Button>
          <div className="flex-1" />
          {map.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleActivate}
              disabled={!!actionLoading}
            >
              {actionLoading === 'activate' ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Zap className="w-4 h-4 mr-1" />
              )}
              Activate
            </Button>
          )}
          {map.status === 'active' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshNotifications}
                disabled={!!actionLoading}
              >
                {actionLoading === 'refresh' ? (
                  <Spinner size="sm" className="mr-1" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Refresh Notifications
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchive}
                disabled={!!actionLoading}
              >
                {actionLoading === 'archive' ? (
                  <Spinner size="sm" className="mr-1" />
                ) : (
                  <Archive className="w-4 h-4 mr-1" />
                )}
                Archive
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={!!actionLoading}
          >
            {actionLoading === 'duplicate' ? (
              <Spinner size="sm" className="mr-1" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            Duplicate
          </Button>
        </div>

        {/* Weekly Calendar View */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Weekly Schedule
            </Text>
            <WeekCalendar items={items} />
          </Stack>
        </Card>

        {/* Activities by Category */}
        {CATEGORY_ORDER.map(category => {
          const catItems = items.filter(i => i.category === category)
          if (catItems.length === 0) return null
          const color = CATEGORY_COLORS[category]

          return (
            <Card
              key={category}
              variant="outlined"
              className="bg-[#101010] border-[#1F1F1F]"
            >
              <Stack gap="md">
                <Inline gap="sm" className="items-center">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
                    {CATEGORY_LABELS[category]}
                  </Text>
                </Inline>

                {catItems.map(item => {
                  const def = getActivityDefinition(item.activity_type)
                  const Icon = def?.icon
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Inline gap="sm" className="items-center mb-1">
                            {Icon && (
                              <Icon
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color }}
                              />
                            )}
                            <Text size="sm" className="text-white font-semibold">
                              {item.label}
                            </Text>
                          </Inline>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.days_of_week.map(d => (
                              <span
                                key={d}
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-black"
                                style={{ backgroundColor: color }}
                              >
                                {DAY_LABELS[d]}
                              </span>
                            ))}
                            {item.time_of_day && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-300">
                                {formatTime(item.time_of_day)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.notify_sms ? (
                            <Bell className="w-4 h-4 text-[#39FF14]" />
                          ) : (
                            <BellOff className="w-4 h-4 text-neutral-600" />
                          )}
                          {item.deep_link && (
                            <Link
                              href={item.deep_link}
                              className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 text-neutral-400" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </Stack>
            </Card>
          )
        })}

        {/* Bottom actions */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center">
          <div className="py-4">
            <p className="text-neutral-400 text-sm mb-4">
              Want to build a new MAP for next week?
            </p>
            <Inline gap="sm" className="justify-center">
              <Button variant="outline" size="sm" onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate This MAP
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/map/new">
                  <Edit className="w-4 h-4 mr-2" />
                  Build Fresh
                </Link>
              </Button>
            </Inline>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}

// ─── Week Calendar Component ───

function WeekCalendar({ items }: { items: UserMapItem[] }) {
  const dayData = useMemo(() => {
    const result: Record<number, UserMapItem[]> = {}
    for (let d = 0; d < 7; d++) result[d] = []

    for (const item of items) {
      for (const day of item.days_of_week) {
        result[day].push(item)
      }
    }

    for (const d of Object.keys(result)) {
      result[Number(d)].sort((a, b) => {
        if (!a.time_of_day) return 1
        if (!b.time_of_day) return -1
        return a.time_of_day.localeCompare(b.time_of_day)
      })
    }

    return result
  }, [items])

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {DAY_LABELS.map((label, idx) => (
        <div key={idx} className="min-w-0">
          <Text
            size="xs"
            className="text-neutral-500 text-center font-semibold mb-2"
          >
            {label}
          </Text>
          <div className="space-y-1">
            {dayData[idx].length === 0 ? (
              <div className="h-8 rounded-lg bg-neutral-900/30 border border-neutral-800/30" />
            ) : (
              dayData[idx].map((item, i) => {
                const color = CATEGORY_COLORS[item.category]
                const def = getActivityDefinition(item.activity_type)
                return (
                  <div
                    key={`${item.id}-${i}`}
                    className="rounded-lg px-1.5 py-1 border-l-2"
                    style={{
                      backgroundColor: color + '10',
                      borderLeftColor: color,
                    }}
                    title={`${item.label}${item.time_of_day ? ` at ${formatTime(item.time_of_day)}` : ''}`}
                  >
                    <span
                      className="text-[9px] leading-tight block truncate font-medium"
                      style={{ color }}
                    >
                      {formatTime(item.time_of_day)}
                    </span>
                    <span className="text-[8px] leading-tight block truncate text-neutral-500">
                      {item.label.split(' ')[0]}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
