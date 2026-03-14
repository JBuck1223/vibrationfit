'use client'

import { useEffect, useState, useCallback } from 'react'
import { Container, Card, Button, Badge, Spinner, Stack } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Bell,
  BellOff,
  CheckCheck,
  DollarSign,
  Trophy,
  UserPlus,
  MessageSquare,
  ExternalLink,
  Filter,
  Settings,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AdminNotificationType } from '@/lib/admin/notifications'

interface AdminNotification {
  id: string
  type: AdminNotificationType
  title: string
  body: string | null
  metadata: Record<string, unknown>
  link: string | null
  is_read: boolean
  created_at: string
  read_at: string | null
}

const TYPE_CONFIG: Record<AdminNotificationType, { label: string; icon: typeof DollarSign; color: string }> = {
  purchase: { label: 'Purchase', icon: DollarSign, color: '#39FF14' },
  intensive_completed: { label: 'Intensive Completed', icon: Trophy, color: '#FFFF00' },
  lead_created: { label: 'New Lead', icon: UserPlus, color: '#00FFFF' },
  support_ticket: { label: 'Support Ticket', icon: MessageSquare, color: '#BF00FF' },
}

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'intensive_completed', label: 'Intensive Completed' },
  { value: 'lead_created', label: 'New Leads' },
  { value: 'support_ticket', label: 'Support Tickets' },
]

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [markingAll, setMarkingAll] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 30

  const fetchNotifications = useCallback(async (currentOffset = 0) => {
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(currentOffset) })
      if (filter === 'unread') params.set('unread', 'true')
      else if (filter !== 'all') params.set('type', filter)

      const res = await fetch(`/api/admin/notifications?${params}`)
      if (!res.ok) return

      const data = await res.json()
      if (currentOffset === 0) {
        setNotifications(data.notifications)
      } else {
        setNotifications(prev => [...prev, ...data.notifications])
      }
      setTotal(data.total)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    setOffset(0)
    fetchNotifications(0)
  }, [fetchNotifications])

  const markAsRead = async (ids: string[]) => {
    await fetch('/api/admin/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setNotifications(prev =>
      prev.map(n => ids.includes(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    )
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    await fetch('/api/admin/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
    setMarkingAll(false)
  }

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      await markAsRead([notification.id])
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const loadMore = () => {
    const newOffset = offset + limit
    setOffset(newOffset)
    fetchNotifications(newOffset)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AdminWrapper>
      <Container size="lg">
        <Stack gap="lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Bell className="w-6 h-6 text-[#39FF14]" />
                Notifications
              </h1>
              <p className="text-neutral-400 mt-1">
                {total} total{unreadCount > 0 ? ` \u00b7 ${unreadCount} unread` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={markAllAsRead}
                  disabled={markingAll}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  {markingAll ? 'Marking...' : 'Mark all as read'}
                </Button>
              )}
              <Link href="/admin/notification-settings">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-neutral-500" />
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  filter === opt.value
                    ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/40'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white hover:border-neutral-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : notifications.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <BellOff className="w-12 h-12 text-neutral-600 mb-4" />
              <p className="text-neutral-400 text-lg">No notifications</p>
              <p className="text-neutral-500 text-sm mt-1">
                {filter !== 'all' ? 'Try a different filter' : 'You\'re all caught up'}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map(notification => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.purchase
                const Icon = config.icon

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg ${
                      notification.is_read
                        ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                        : 'bg-neutral-900 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Unread indicator + Icon */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: config.color }} />
                        </div>
                        {!notification.is_read && (
                          <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-[#FF0040] border-2 border-neutral-900" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm font-semibold ${notification.is_read ? 'text-neutral-300' : 'text-white'}`}>
                            {notification.title}
                          </span>
                          <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                            {config.label}
                          </Badge>
                        </div>
                        {notification.body && (
                          <p className="text-sm text-neutral-400 truncate">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-xs text-neutral-500 mt-1">
                          {timeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Link indicator */}
                      {notification.link && (
                        <ExternalLink className="w-4 h-4 text-neutral-600 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                )
              })}

              {/* Load more */}
              {notifications.length < total && (
                <div className="flex justify-center pt-4">
                  <Button variant="ghost" onClick={loadMore}>
                    Load more ({total - notifications.length} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
