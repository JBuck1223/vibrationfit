'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import {
  Check,
  X,
  SkipForward,
  ChevronRight,
  Target,
  CalendarDays,
  Sparkles,
} from 'lucide-react'
import { useMapStudio } from '@/components/map-studio'
import type { CommitmentOccurrence, OccurrenceStatus } from '@/lib/map/types'

const CATEGORY_COLORS: Record<string, string> = {
  activations: '#39FF14',
  creations: '#FFFF00',
  connections: '#BF00FF',
  sessions: '#00FFFF',
}

const CATEGORY_LABELS: Record<string, string> = {
  activations: 'Activations',
  creations: 'Creations',
  connections: 'Connections',
  sessions: 'Sessions',
}

export default function MapTodayPage() {
  const { todayOccurrences, commitments, loading, refreshOccurrences } = useMapStudio()
  const [verifying, setVerifying] = useState<string | null>(null)
  const [generatingOccurrences, setGeneratingOccurrences] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const ensureOccurrences = useCallback(async () => {
    if (hasGenerated || loading || commitments.length === 0) return
    setGeneratingOccurrences(true)
    try {
      await fetch('/api/map/generate-occurrences', { method: 'POST' })
      await refreshOccurrences()
    } catch (e) {
      console.error('Error generating occurrences:', e)
    } finally {
      setGeneratingOccurrences(false)
      setHasGenerated(true)
    }
  }, [hasGenerated, loading, commitments.length, refreshOccurrences])

  useEffect(() => {
    if (!loading && commitments.length > 0 && todayOccurrences.length === 0 && !hasGenerated) {
      ensureOccurrences()
    }
  }, [loading, commitments.length, todayOccurrences.length, hasGenerated, ensureOccurrences])

  const handleVerify = async (occurrenceId: string, status: OccurrenceStatus) => {
    setVerifying(occurrenceId)
    try {
      await fetch('/api/map/occurrences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: occurrenceId, status }),
      })
      await refreshOccurrences()
    } catch (e) {
      console.error('Error verifying:', e)
    } finally {
      setVerifying(null)
    }
  }

  if (loading || generatingOccurrences) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const grouped = groupByCategory(todayOccurrences)
  const pendingCount = todayOccurrences.filter(o => o.status === 'pending').length
  const completedCount = todayOccurrences.filter(o => o.status === 'yes').length
  const totalCount = todayOccurrences.length

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Date + Summary */}
        <div>
          <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1">{dateStr}</p>
          {totalCount > 0 ? (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {pendingCount === 0
                  ? 'All done today'
                  : `${pendingCount} commitment${pendingCount === 1 ? '' : 's'} remaining`}
              </h1>
              {totalCount > 0 && (
                <Badge variant="neutral" className="text-primary-400 border-primary-500/30">
                  {completedCount}/{totalCount}
                </Badge>
              )}
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-white">No commitments today</h1>
          )}
        </div>

        {/* Empty State */}
        {commitments.length === 0 && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-12">
            <Sparkles className="w-12 h-12 text-primary-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Start Living The Vision</h2>
            <p className="text-sm text-neutral-400 mb-6 max-w-md mx-auto">
              Create your first vision target and add commitments to start tracking your alignment journey.
            </p>
            <Button variant="primary" asChild>
              <Link href="/map/portfolio">
                <Target className="w-4 h-4 mr-2" />
                Go to Portfolio
              </Link>
            </Button>
          </Card>
        )}

        {totalCount === 0 && commitments.length > 0 && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-8">
            <CalendarDays className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
            <p className="text-sm text-neutral-400">
              No occurrences scheduled for today. Check your week view for upcoming commitments.
            </p>
          </Card>
        )}

        {/* Occurrences by Category */}
        {Object.entries(grouped).map(([category, occurrences]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category] || '#666' }}
              />
              <span
                className="text-xs uppercase tracking-[0.2em] font-medium"
                style={{ color: CATEGORY_COLORS[category] || '#999' }}
              >
                {CATEGORY_LABELS[category] || category}
              </span>
            </div>

            <div className="space-y-2">
              {occurrences.map(occ => {
                const commitment = occ.commitment
                const isPending = occ.status === 'pending'
                const isYes = occ.status === 'yes'
                const isNo = occ.status === 'no'
                const isSkipped = occ.status === 'skipped'
                const isLoading = verifying === occ.id

                return (
                  <Card
                    key={occ.id}
                    variant="outlined"
                    className={`bg-[#101010] border-[#1F1F1F] transition-all duration-200 ${
                      isYes ? 'border-primary-500/30 bg-primary-500/5' : ''
                    } ${isNo ? 'opacity-50' : ''} ${isSkipped ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isYes ? 'text-primary-400' : 'text-white'} ${(isNo || isSkipped) ? 'line-through' : ''}`}>
                          {commitment?.title || 'Untitled'}
                        </p>
                        {occ.note && (
                          <p className="text-xs text-neutral-500 mt-0.5 truncate">{occ.note}</p>
                        )}
                      </div>

                      {isPending && !isLoading && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleVerify(occ.id, 'yes')}
                            className="w-10 h-10 rounded-full bg-primary-500/20 hover:bg-primary-500/30 flex items-center justify-center transition-colors"
                            aria-label="Yes"
                          >
                            <Check className="w-5 h-5 text-primary-400" />
                          </button>
                          <button
                            onClick={() => handleVerify(occ.id, 'no')}
                            className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                            aria-label="No"
                          >
                            <X className="w-5 h-5 text-red-400" />
                          </button>
                          <button
                            onClick={() => handleVerify(occ.id, 'skipped')}
                            className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
                            aria-label="Skip"
                          >
                            <SkipForward className="w-4 h-4 text-neutral-400" />
                          </button>
                        </div>
                      )}

                      {isLoading && (
                        <Spinner size="sm" />
                      )}

                      {!isPending && !isLoading && (
                        <button
                          onClick={() => handleVerify(occ.id, 'pending')}
                          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1"
                        >
                          Undo
                        </button>
                      )}

                      {commitment && (
                        <Link
                          href={`/map/c/${commitment.id}`}
                          className="flex-shrink-0 p-1 text-neutral-600 hover:text-neutral-400 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </Stack>
    </Container>
  )
}

function groupByCategory(occurrences: CommitmentOccurrence[]): Record<string, CommitmentOccurrence[]> {
  const groups: Record<string, CommitmentOccurrence[]> = {}
  for (const occ of occurrences) {
    const category = (occ.commitment as any)?.category || 'other'
    if (!groups[category]) groups[category] = []
    groups[category].push(occ)
  }
  return groups
}
