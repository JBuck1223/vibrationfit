'use client'

import React, { useState } from 'react'
import { Mic, Video, Calendar, Trash2, Play, Eye, X } from 'lucide-react'
import { Button } from '@/lib/design-system/components'

interface Recording {
  url: string
  transcript: string
  type: 'audio' | 'video'
  category: string
  duration?: number
  created_at: string
}

interface SavedRecordingsProps {
  recordings: Recording[]
  onDelete?: (index: number) => void
  categoryFilter?: string
  className?: string
  /** Tighter layout for inline / feed contexts (e.g. abundance expanded card) */
  compact?: boolean
}

export function SavedRecordings({
  recordings,
  onDelete,
  categoryFilter,
  className = '',
  compact = false,
}: SavedRecordingsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch for date formatting
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const safeRecordings = Array.isArray(recordings) ? recordings : []
  const filteredRecordings = categoryFilter
    ? safeRecordings.filter(r => r.category === categoryFilter)
    : safeRecordings

  if (!filteredRecordings || filteredRecordings.length === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
    if (!mounted) return '' // Return empty string during SSR
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-3'} ${className}`}>
      {compact ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          Recordings ({filteredRecordings.length})
        </p>
      ) : (
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-primary-500" />
          <h4 className="text-sm font-semibold text-white">Saved Recordings</h4>
          <span className="text-xs text-neutral-500">({filteredRecordings.length})</span>
        </div>
      )}

      {filteredRecordings.map((recording, index) => (
        <div
          key={index}
          className={`rounded-lg border border-neutral-700 bg-neutral-800 transition-colors hover:border-neutral-600 ${
            compact ? 'p-2.5' : 'p-4'
          }`}
        >
          {/* Recording Header */}
          <div className={`flex items-center justify-between ${compact ? 'mb-1' : 'mb-2'}`}>
            <div className="flex min-w-0 items-center gap-1.5">
              {recording.type === 'video' ? (
                <Video className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0 text-secondary-500`} />
              ) : (
                <Mic className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0 text-primary-500`} />
              )}
              <span className={`font-medium capitalize text-white ${compact ? 'text-xs' : 'text-sm'}`}>
                {compact ? recording.type : `${recording.type} Recording`}
              </span>
              {recording.duration && (
                <span className={`text-neutral-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                  {formatDuration(recording.duration)}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!compact && (
                <button
                  type="button"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="text-neutral-400 transition-colors hover:text-white"
                  title="View transcript"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDelete(index)
                  }}
                  className="text-neutral-400 transition-colors hover:text-red-400"
                  title="Delete recording"
                >
                  <Trash2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                </button>
              )}
            </div>
          </div>

          {/* Recording Date */}
          <div
            className={`flex items-center gap-1 text-neutral-500 ${compact ? 'mb-1.5 text-[10px]' : 'mb-3 text-xs'}`}
          >
            <Calendar className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
            {formatDate(recording.created_at)}
          </div>

          {/* Media Player */}
          {playingIndex === index ? (
            <div className={compact ? 'mb-2' : 'mb-3'}>
              {recording.type === 'video' ? (
                <video
                  src={recording.url}
                  controls
                  autoPlay
                  className="w-full rounded-lg bg-black"
                  onEnded={() => setPlayingIndex(null)}
                />
              ) : (
                <audio
                  src={recording.url}
                  controls
                  autoPlay
                  className="w-full"
                  onEnded={() => setPlayingIndex(null)}
                />
              )}
              <button
                type="button"
                onClick={() => setPlayingIndex(null)}
                className={`mt-2 text-neutral-400 transition-colors hover:text-white ${compact ? 'text-[10px]' : 'text-xs'}`}
              >
                Close player
              </button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setPlayingIndex(index)}
              variant="ghost"
              size="sm"
              className={`gap-2 ${compact ? 'mb-2 h-8 text-xs' : 'mb-3'}`}
            >
              <Play className="w-3 h-3" />
              Play {recording.type === 'video' ? 'Video' : 'Audio'}
            </Button>
          )}

          {/* Transcript Preview/Expanded */}
          {compact ? (
            <div className="max-h-16 overflow-y-auto text-[11px] leading-snug text-neutral-400">
              <p className="whitespace-pre-wrap">{recording.transcript}</p>
            </div>
          ) : expandedIndex === index ? (
            <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-neutral-400">Full Transcript:</p>
                <button
                  type="button"
                  onClick={() => setExpandedIndex(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-white">{recording.transcript}</p>
            </div>
          ) : (
            <p className="line-clamp-2 text-sm text-neutral-400">{recording.transcript}</p>
          )}
        </div>
      ))}
    </div>
  )
}

