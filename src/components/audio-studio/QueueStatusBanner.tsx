'use client'

import React from 'react'
import { Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAudioStudio } from './AudioStudioContext'

export function QueueStatusBanner() {
  const { activeBatches, visionId } = useAudioStudio()

  const active = activeBatches.filter(b => ['pending', 'processing'].includes(b.status))
  if (active.length === 0) return null

  const totalCompleted = active.reduce((sum, b) => sum + b.tracks_completed, 0)
  const totalExpected = active.reduce((sum, b) => sum + b.total_tracks_expected, 0)
  const overallProgress = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {active.length} {active.length === 1 ? 'generation' : 'generations'} in progress
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {totalCompleted} of {totalExpected} tracks complete ({overallProgress}%)
            </p>
            {/* Progress bar */}
            <div className="w-full max-w-xs bg-neutral-800 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {active.length === 1 && visionId && (
          <Link
            href={`/life-vision/${visionId}/audio/queue/${active[0].id}`}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}
