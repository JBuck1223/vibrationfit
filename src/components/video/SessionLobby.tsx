'use client'

import { useEffect, useState } from 'react'
import { Card, Button, Badge, Input } from '@/lib/design-system/components'
import {
  Clock,
  User,
  Sparkles,
  ArrowRight,
  Mail,
} from 'lucide-react'

interface SessionLobbyProps {
  title: string
  description?: string
  hostName?: string
  scheduledAt?: string
  durationMinutes?: number
  sessionType?: string
  isGuest?: boolean
  initialName?: string
  initialEmail?: string
  onReady: (guestInfo?: { name: string; email: string }) => void
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

export function SessionLobby({
  title,
  description,
  hostName,
  scheduledAt,
  durationMinutes,
  sessionType,
  isGuest,
  initialName,
  initialEmail,
  onReady,
  onCancel,
}: SessionLobbyProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [guestName, setGuestName] = useState(initialName || '')
  const [guestEmail, setGuestEmail] = useState(initialEmail || '')
  const [emailError, setEmailError] = useState('')

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

  const isStartingSoon = countdown !== null && countdown <= 10 * 60 * 1000
  const hasStarted = countdown !== null && countdown <= 0

  const handleReady = () => {
    if (isGuest) {
      const trimmedEmail = guestEmail.trim()
      if (!trimmedEmail) {
        setEmailError('Please enter your email so we know who joined')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setEmailError('Please enter a valid email address')
        return
      }
      setEmailError('')
      onReady({ name: guestName.trim() || 'Guest', email: trimmedEmail })
    } else {
      onReady()
    }
  }

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

        {/* Guest Identification */}
        {isGuest && (
          <Card className="p-5 bg-neutral-900 border-neutral-700">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-400" />
              How should we identify you?
            </h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="guest-name" className="block text-xs text-neutral-400 mb-1.5">
                  Your name
                </label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="First name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="guest-email" className="block text-xs text-neutral-400 mb-1.5">
                  Your email <span className="text-neutral-600">(required)</span>
                </label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => { setGuestEmail(e.target.value); setEmailError('') }}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {emailError && (
                  <p className="text-red-400 text-xs mt-1">{emailError}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Quick Tips (compact, non-interactive) */}
        <div className="flex flex-wrap gap-2 justify-center text-xs text-neutral-500">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800">
            <Clock className="w-3 h-3" /> Stable connection
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800">
            Headphones recommended
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800">
            Good lighting
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button variant="primary" onClick={handleReady} className="flex-1">
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
