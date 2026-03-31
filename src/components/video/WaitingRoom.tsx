'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from 'lucide-react'
import { Card } from '@/lib/design-system/components'

interface WaitingRoomProps {
  sessionId: string
  sessionTitle?: string
  hostName?: string
  scheduledAt?: string
  onSessionLive: () => void
  onCancel?: () => void
}

const POLL_INTERVAL_MS = 5_000

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Starting now'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function WaitingRoom({
  sessionId,
  sessionTitle,
  hostName,
  scheduledAt,
  onSessionLive,
}: WaitingRoomProps) {
  const calledRef = useRef(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Countdown timer
  useEffect(() => {
    if (!scheduledAt) return
    const update = () => setCountdown(new Date(scheduledAt).getTime() - Date.now())
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [scheduledAt])

  // Poll session status
  useEffect(() => {
    let active = true

    const poll = async () => {
      try {
        const res = await fetch(`/api/video/sessions/${sessionId}/public`)
        if (!res.ok) return
        const data = await res.json()
        if (data.session?.status === 'live' && active && !calledRef.current) {
          calledRef.current = true
          onSessionLive()
        }
      } catch { /* ignore network blips */ }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => { active = false; clearInterval(interval) }
  }, [sessionId, onSessionLive])

  const isPast = countdown !== null && countdown <= 0

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-700 p-8">
        <div className="text-center space-y-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://media.vibrationfit.com/site-assets/brand/logo/logo-icon.svg"
            alt="VibrationFit"
            className="h-12 w-12 mx-auto"
            style={{
              filter: 'brightness(0) saturate(100%) invert(58%) sepia(95%) saturate(1352%) hue-rotate(75deg) brightness(101%) contrast(101%)',
            }}
          />

          {sessionTitle && (
            <h1 className="text-xl font-bold text-white">{sessionTitle}</h1>
          )}

          {hostName && (
            <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm">
              <User className="w-4 h-4" />
              <span>Hosted by <span className="text-white font-medium">{hostName}</span></span>
            </div>
          )}

          {countdown !== null && (
            <div className="pt-1">
              {isPast ? (
                <p className="text-primary-500 text-sm font-medium">Session time has started</p>
              ) : (
                <>
                  <p className="text-primary-500 text-xs uppercase tracking-wide font-medium mb-1">Starts in</p>
                  <p className="text-2xl font-bold text-white tabular-nums">{formatCountdown(countdown)}</p>
                </>
              )}
            </div>
          )}

          <p className="text-neutral-400 text-sm">
            Waiting for host to start the session
          </p>

          <p className="text-primary-500 text-xs">
            You'll be connected automatically
          </p>
        </div>
      </Card>
    </div>
  )
}

export default WaitingRoom
