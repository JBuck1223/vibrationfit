'use client'

/**
 * Waiting Room Component
 * 
 * Shown when a participant is waiting to be admitted to the call.
 * Features a calming, branded experience.
 */

import { useState, useEffect } from 'react'
import { Clock, User, Sparkles } from 'lucide-react'
import { Card, Spinner } from '@/lib/design-system/components'

interface WaitingRoomProps {
  sessionTitle?: string
  hostName?: string
  scheduledTime?: Date
  onCancel?: () => void
}

export function WaitingRoom({
  sessionTitle,
  hostName,
  scheduledTime,
  onCancel,
}: WaitingRoomProps) {
  const [dots, setDots] = useState('')

  // Animate waiting dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black flex items-center justify-center p-4">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="relative w-full max-w-lg bg-neutral-900/80 backdrop-blur border-neutral-700 p-8">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-t-2xl" />

        <div className="text-center space-y-6">
          {/* Animated icon */}
          <div className="relative inline-flex">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary-500 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-primary-500/30 animate-ping" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Waiting Room
            </h1>
            <p className="text-neutral-400">
              Waiting for host to let you in{dots}
            </p>
          </div>

          {/* Session info */}
          {sessionTitle && (
            <div className="bg-neutral-800/50 rounded-xl p-4 space-y-3">
              <h2 className="text-lg font-medium text-white">
                {sessionTitle}
              </h2>
              
              {hostName && (
                <div className="flex items-center justify-center gap-2 text-neutral-400">
                  <User className="w-4 h-4" />
                  <span>Hosted by {hostName}</span>
                </div>
              )}
              
              {scheduledTime && (
                <div className="flex items-center justify-center gap-2 text-neutral-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    {scheduledTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Preparation tips */}
          <div className="text-left bg-neutral-800/30 rounded-xl p-4">
            <p className="text-sm font-medium text-neutral-300 mb-3">
              While you wait:
            </p>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">1.</span>
                <span>Find a quiet, comfortable space</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">2.</span>
                <span>Take a few deep breaths</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">3.</span>
                <span>Set your intention for this session</span>
              </li>
            </ul>
          </div>

          {/* Loading indicator */}
          <div className="flex items-center justify-center gap-3">
            <Spinner size="sm" />
            <span className="text-sm text-neutral-500">
              The host will let you in shortly
            </span>
          </div>

          {/* Cancel button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-neutral-400 hover:text-white text-sm transition-colors"
            >
              Leave waiting room
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default WaitingRoom

