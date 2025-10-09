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
}

export function SavedRecordings({
  recordings,
  onDelete,
  categoryFilter,
  className = ''
}: SavedRecordingsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)

  const filteredRecordings = categoryFilter
    ? recordings.filter(r => r.category === categoryFilter)
    : recordings

  if (!filteredRecordings || filteredRecordings.length === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
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
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-primary-500 rounded-full" />
        <h4 className="text-sm font-semibold text-white">Saved Recordings</h4>
        <span className="text-xs text-neutral-500">({filteredRecordings.length})</span>
      </div>

      {filteredRecordings.map((recording, index) => (
        <div
          key={index}
          className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:border-neutral-600 transition-colors"
        >
          {/* Recording Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {recording.type === 'video' ? (
                <Video className="w-4 h-4 text-secondary-500" />
              ) : (
                <Mic className="w-4 h-4 text-primary-500" />
              )}
              <span className="text-sm font-medium text-white capitalize">
                {recording.type} Recording
              </span>
              {recording.duration && (
                <span className="text-xs text-neutral-500">
                  {formatDuration(recording.duration)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="text-neutral-400 hover:text-white transition-colors"
                title="View transcript"
              >
                <Eye className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(index)}
                  className="text-neutral-400 hover:text-red-400 transition-colors"
                  title="Delete recording"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Recording Date */}
          <div className="flex items-center gap-1 text-xs text-neutral-500 mb-3">
            <Calendar className="w-3 h-3" />
            {formatDate(recording.created_at)}
          </div>

          {/* Media Player */}
          {playingIndex === index ? (
            <div className="mb-3">
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
                onClick={() => setPlayingIndex(null)}
                className="mt-2 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Close player
              </button>
            </div>
          ) : (
            <Button
              onClick={() => setPlayingIndex(index)}
              variant="ghost"
              size="sm"
              className="gap-2 mb-3"
            >
              <Play className="w-3 h-3" />
              Play {recording.type === 'video' ? 'Video' : 'Audio'}
            </Button>
          )}

          {/* Transcript Preview/Expanded */}
          {expandedIndex === index ? (
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-neutral-400">Full Transcript:</p>
                <button
                  onClick={() => setExpandedIndex(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm text-white whitespace-pre-wrap">
                {recording.transcript}
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-400 line-clamp-2">
              {recording.transcript}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

