'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Clock, Mic, RotateCcw, X } from 'lucide-react'
import { Button, Card } from '@/lib/design-system/components'
import {
  formatTranscriptParagraphs,
  transcriptLooksCollapsed,
} from '@/lib/audio/format-transcript-paragraphs'
import {
  dismissRecoverableFingerprint,
  getDismissedRecoverableFingerprints,
  recordingFingerprint,
} from '@/lib/journal/recoverable-transcripts-client'

export interface RecoverableTranscriptItem {
  sidecarKey: string
  audioKey: string
  audioUrl: string
  transcript: string
  transcriptPreview: string
  transcribedAt: string
  duration: number | null
  submitted: boolean
  matchedJournalEntryId: string | null
}

interface RecoverableTranscriptsBannerProps {
  onRestore: (item: RecoverableTranscriptItem) => void
  className?: string
}

function formatRecordedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function RecoverableTranscriptsBanner({
  onRestore,
  className = '',
}: RecoverableTranscriptsBannerProps) {
  const [items, setItems] = useState<RecoverableTranscriptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoredFingerprints, setRestoredFingerprints] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/journal/recoverable-transcripts')
      if (!response.ok) {
        throw new Error('Could not check for unsaved voice notes')
      }
      const data = await response.json()
      const dismissed = getDismissedRecoverableFingerprints()
      const visible = (data.items ?? []).filter(
        (item: RecoverableTranscriptItem) =>
          !dismissed.includes(recordingFingerprint(item.audioKey))
      )
      setItems(visible)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading || items.length === 0) {
    if (error) {
      return (
        <p className={`text-sm text-neutral-500 ${className}`}>
          {error}
        </p>
      )
    }
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const fp = recordingFingerprint(item.audioKey)
        const wasRestored = restoredFingerprints.has(fp)
        return (
        <Card
          key={item.sidecarKey}
          variant="outlined"
          className="border-[#39FF14]/30 bg-[#39FF14]/5 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#39FF14]/15">
              <Mic className="h-4 w-4 text-[#39FF14]" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">
                  Unsaved voice journal note
                </p>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                  <AlertCircle className="h-3 w-3" />
                  Not submitted
                </span>
              </div>
              <p className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                <Clock className="h-3.5 w-3.5" />
                Recorded {formatRecordedAt(item.transcribedAt)}
                {formatDuration(item.duration) && (
                  <span>({formatDuration(item.duration)})</span>
                )}
              </p>
              <p className="text-sm text-neutral-300 line-clamp-2">
                {item.transcriptPreview}
              </p>
              {wasRestored && (
                <p className="text-xs text-[#39FF14]">
                  Text added to your entry — save the journal entry to finish, or restore again if needed.
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    let transcript = item.transcript
                    if (transcriptLooksCollapsed(transcript)) {
                      try {
                        const res = await fetch('/api/transcribe-from-s3/check', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ s3Key: item.audioKey }),
                        })
                        if (res.ok) {
                          const data = await res.json()
                          if (data.found && data.transcript) {
                            transcript = data.transcript
                          }
                        }
                      } catch {
                        /* use list payload */
                      }
                    } else {
                      transcript =
                        formatTranscriptParagraphs(transcript) || transcript
                    }
                    onRestore({ ...item, transcript })
                    setRestoredFingerprints((prev) => new Set(prev).add(fp))
                  }}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  {wasRestored ? 'Restore again' : 'Restore to this entry'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    dismissRecoverableFingerprint(item.audioKey)
                    setItems((prev) =>
                      prev.filter((i) => recordingFingerprint(i.audioKey) !== fp)
                    )
                    setRestoredFingerprints((prev) => {
                      const next = new Set(prev)
                      next.delete(fp)
                      return next
                    })
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                dismissRecoverableFingerprint(item.audioKey)
                setItems((prev) =>
                  prev.filter((i) => recordingFingerprint(i.audioKey) !== fp)
                )
                setRestoredFingerprints((prev) => {
                  const next = new Set(prev)
                  next.delete(fp)
                  return next
                })
              }}
              className="shrink-0 rounded-full p-1 text-neutral-500 transition-colors hover:text-neutral-300"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
        )
      })}
    </div>
  )
}
