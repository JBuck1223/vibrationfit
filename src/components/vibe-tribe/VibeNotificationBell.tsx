'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { AtSign, Bell, Heart, MessageCircle, PenLine, Reply } from 'lucide-react'
import { keys } from '@/lib/query/keys'
import type { VibeNotification, VibeNotificationType } from '@/lib/vibe-tribe/types'

interface NotificationFeed {
  notifications: VibeNotification[]
  unreadCount: number
}

async function fetchNotifications(): Promise<NotificationFeed> {
  const response = await fetch('/api/vibe-tribe/notifications')
  if (!response.ok) throw new Error('Failed to load notifications')
  return response.json()
}

function actionLabel(notification: VibeNotification): string {
  switch (notification.type) {
    case 'comment':
      return 'commented on your post'
    case 'reply':
      return notification.context === 'comment'
        ? 'replied to your comment'
        : 'replied on your post'
    case 'mention':
      return notification.context === 'comment'
        ? 'mentioned you in a comment'
        : 'mentioned you in a post'
    case 'heart':
      return notification.context === 'comment'
        ? 'sent a heart on your comment'
        : 'sent a heart on your post'
    case 'post':
      return 'posted in Vibe Tribe'
    default:
      return 'responded in Vibe Tribe'
  }
}

function ActionIcon({ type }: { type: VibeNotificationType }) {
  const className = 'w-3.5 h-3.5'
  switch (type) {
    case 'reply':
      return <Reply className={className} />
    case 'mention':
      return <AtSign className={className} />
    case 'heart':
      return <Heart className={className} />
    case 'post':
      return <PenLine className={className} />
    default:
      return <MessageCircle className={className} />
  }
}

function iconColor(type: VibeNotificationType): string {
  switch (type) {
    case 'heart':
      return '#BF00FF'
    case 'mention':
      return '#39FF14'
    case 'reply':
      return '#00FFFF'
    default:
      return '#FFFF00'
  }
}

interface VibeNotificationBellProps {
  variant?: 'inline' | 'mobile'
  className?: string
}

export function VibeNotificationBell({ variant = 'inline', className = '' }: VibeNotificationBellProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const queryKey = [...keys.vibeNotifications, 'feed'] as const
  const { data } = useQuery({
    queryKey,
    queryFn: fetchNotifications,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  useEffect(() => {
    setMounted(true)
  }, [])

  const placePanel = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(352, window.innerWidth - 16)
    const margin = 8
    let left = rect.right + margin
    if (left + width > window.innerWidth - margin) {
      left = rect.right - width
    }
    if (left < margin) left = margin
    const maxHeight = Math.min(420, window.innerHeight - 24)
    let top = rect.bottom + margin
    if (top + maxHeight > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - margin - maxHeight)
    }
    setPanelStyle({ position: 'fixed', top, left, width, maxHeight, zIndex: 80 })
  }

  useEffect(() => {
    if (!open) return
    placePanel()
    void queryClient.invalidateQueries({ queryKey: keys.vibeNotifications })

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onReflow = () => placePanel()

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReflow)
    window.addEventListener('scroll', onReflow, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReflow)
      window.removeEventListener('scroll', onReflow, true)
    }
  }, [open, queryClient])

  const applyReadLocally = (ids: string[] | 'all') => {
    queryClient.setQueryData<NotificationFeed>(queryKey, current => {
      if (!current) return current
      const now = new Date().toISOString()
      let unread = current.unreadCount
      const next = current.notifications.map(notification => {
        const shouldMark = ids === 'all' || ids.includes(notification.id)
        if (!shouldMark || notification.read_at) return notification
        unread = Math.max(0, unread - 1)
        return { ...notification, read_at: now }
      })
      return {
        notifications: next,
        unreadCount: ids === 'all' ? 0 : unread,
      }
    })
  }

  const markRead = async (ids: string[] | 'all') => {
    applyReadLocally(ids)
    try {
      await fetch('/api/vibe-tribe/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids === 'all' ? { all: true } : { ids }),
      })
    } catch (error) {
      console.error('Error marking notifications read:', error)
    } finally {
      void queryClient.invalidateQueries({ queryKey: keys.vibeNotifications })
    }
  }

  const openNotification = (notification: VibeNotification) => {
    if (!notification.read_at) void markRead([notification.id])
    setOpen(false)
    const comment = notification.comment_id ? `?comment=${notification.comment_id}` : ''
    router.push(`/vibe-tribe/posts/${notification.post_id}${comment}`)
  }

  const button = (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setOpen(current => !current)}
      className={
        variant === 'mobile'
          ? 'md:hidden fixed top-[max(0.75rem,env(safe-area-inset-top))] right-4 z-40 w-10 h-10 flex items-center justify-center bg-neutral-800 rounded-lg border-2 border-neutral-700 hover:border-neutral-600'
          : `relative p-1.5 rounded-full hover:bg-white/10 transition-colors ${className}`
      }
      aria-label={unreadCount > 0 ? `Vibe Tribe notifications, ${unreadCount} unread` : 'Vibe Tribe notifications'}
      aria-expanded={open}
      title="Vibe Tribe notifications"
    >
      <Bell className={variant === 'mobile' ? 'w-5 h-5 text-white' : 'w-4 h-4 text-neutral-400'} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#FF0040] text-[10px] font-bold text-white px-1 leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )

  const panel = open && mounted
    ? createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="flex flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-800">
            <p className="text-sm font-semibold text-white">Vibe Tribe</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markRead('all')}
                className="text-xs font-medium text-[#39FF14] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-neutral-400 text-center">
                No notifications yet. New posts, comments, replies, mentions, and hearts will show up here.
              </p>
            ) : (
              notifications.map(notification => {
                const name = notification.actor?.full_name || 'A member'
                const unread = !notification.read_at
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-white/10 hover:bg-white/10 transition-colors ${
                      unread ? 'bg-[#39FF14]/5' : ''
                    }`}
                  >
                    {notification.actor?.profile_picture_url ? (
                      <img
                        src={notification.actor.profile_picture_url}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-neutral-700 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-neutral-300">{name[0] || '?'}</span>
                      </div>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white">
                        <span className="font-semibold">{name}</span>{' '}
                        <span className="text-neutral-300">{actionLabel(notification)}</span>
                      </span>
                      {notification.excerpt && (
                        <span className="block text-xs text-neutral-500 truncate mt-0.5">
                          {notification.excerpt}
                        </span>
                      )}
                      <span className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <span style={{ color: iconColor(notification.type) }}>
                          <ActionIcon type={notification.type} />
                        </span>
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </span>
                    {unread && <span className="mt-1.5 h-2 w-2 rounded-full bg-[#39FF14] shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      {button}
      {panel}
    </>
  )
}
