'use client'

import { useEffect, useState } from 'react'
import { Card, Button, Badge } from '@/lib/design-system/components'
import {
  Clock,
  User,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Headphones,
  Wifi,
  Sun,
  MessageCircle,
} from 'lucide-react'

interface SessionLobbyProps {
  title: string
  description?: string
  hostName?: string
  scheduledAt?: string
  durationMinutes?: number
  sessionType?: string
  onReady: () => void
  onCancel?: () => void
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Starting now'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

function formatSessionTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

const PREP_ITEMS = [
  {
    icon: Wifi,
    title: 'Check your connection',
    detail: 'A stable internet connection ensures the best experience.',
  },
  {
    icon: Headphones,
    title: 'Use headphones',
    detail: 'Reduces echo and helps you hear clearly.',
  },
  {
    icon: Sun,
    title: 'Find good lighting',
    detail: 'Face a light source so your coach can see you.',
  },
  {
    icon: MessageCircle,
    title: 'Come with an open mind',
    detail: 'Think about where you want your life to go. Your coach will help clarify.',
  },
]

export function SessionLobby({
  title,
  description,
  hostName,
  scheduledAt,
  durationMinutes,
  sessionType,
  onReady,
  onCancel,
}: SessionLobbyProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!scheduledAt) return

    const update = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now()
      setCountdown(diff)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [scheduledAt])

  const toggleItem = (index: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const isStartingSoon = countdown !== null && countdown <= 10 * 60 * 1000
  const hasStarted = countdown !== null && countdown <= 0

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">

        {/* Session Header */}
        <div className="text-center space-y-3">
          <Badge variant="secondary" className="inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3" />
            {sessionType === 'one_on_one' ? '1-on-1 Session' : 'Live Session'}
          </Badge>

          <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>

          {description && (
            <p className="text-neutral-400 text-sm md:text-base max-w-md mx-auto">{description}</p>
          )}

          {hostName && (
            <div className="flex items-center justify-center gap-2 text-neutral-300">
              <User className="w-4 h-4 text-teal-400" />
              <span className="text-sm">with <span className="font-medium text-white">{hostName}</span></span>
            </div>
          )}
        </div>

        {/* Time & Countdown Card */}
        {scheduledAt && (
          <Card className="p-5 bg-neutral-900 border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Scheduled</p>
                <p className="text-sm text-neutral-300">{formatSessionTime(scheduledAt)}</p>
                {durationMinutes && (
                  <p className="text-xs text-neutral-500">{durationMinutes} minutes</p>
                )}
              </div>

              {countdown !== null && (
                <div className="text-right">
                  {hasStarted ? (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                      </span>
                      <span className="text-green-400 font-medium text-sm">Ready to start</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Starts in</p>
                      <p className={`text-lg font-bold tabular-nums ${isStartingSoon ? 'text-green-400' : 'text-white'}`}>
                        {formatCountdown(countdown)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Preparation Checklist */}
        <Card className="p-5 bg-neutral-900 border-neutral-700">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            While you wait, prepare for your session
          </h2>

          <div className="space-y-3">
            {PREP_ITEMS.map((item, i) => {
              const checked = checkedItems.has(i)
              const Icon = item.icon
              return (
                <button
                  key={i}
                  onClick={() => toggleItem(i)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                    checked
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    checked
                      ? 'border-green-500 bg-green-500'
                      : 'border-neutral-600'
                  }`}>
                    {checked && <CheckCircle className="w-3 h-3 text-black" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${checked ? 'text-green-400' : 'text-neutral-500'}`} />
                      <p className={`text-sm font-medium ${checked ? 'text-green-300' : 'text-neutral-200'}`}>
                        {item.title}
                      </p>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 ml-5.5">{item.detail}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button variant="primary" onClick={onReady} className="flex-1">
            Set Up Camera & Mic
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <p className="text-center text-xs text-neutral-600">
          You'll check your camera and microphone on the next screen
        </p>
      </div>
    </div>
  )
}
