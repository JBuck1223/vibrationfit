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
  Plus,
  ChevronRight,
  Check,
  Clock,
  Sparkles,
  History,
  ExternalLink,
} from 'lucide-react'
import { useMapStudio } from '@/components/map-studio'
import { getActivityDefinition, type ActivityDefinition } from '@/lib/map/activities'
import type { Commitment, CommitmentOccurrence } from '@/lib/map/types'

const PILLAR_ORDER = ['activations', 'creations', 'connections', 'sessions'] as const

const PILLAR_META: Record<string, { label: string; color: string; description: string }> = {
  activations: { label: 'Activations', color: '#39FF14', description: 'Engage the tools you\'ve built' },
  creations: { label: 'Creations', color: '#FFFF00', description: 'Make and capture' },
  connections: { label: 'Connections', color: '#BF00FF', description: 'Community and support' },
  sessions: { label: 'Sessions', color: '#00FFFF', description: 'Live coaching and replays' },
}

export default function MapCurrentPage() {
  const { commitments, todayOccurrences, loading, refreshAll } = useMapStudio()
  const [mapVersion, setMapVersion] = useState<number | null>(null)

  useEffect(() => {
    if (!loading) {
      loadMapVersion()
    }
  }, [loading])

  const loadMapVersion = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data } = await supabase
      .from('user_maps')
      .select('version_number')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (data) setMapVersion(data.version_number)
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const activeCommitments = commitments.filter(c => c.status === 'active')

  if (activeCommitments.length === 0) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <EmptyState />
        </Stack>
      </Container>
    )
  }

  const commitmentsByPillar = groupByPillar(activeCommitments)
  const occurrenceMap = buildOccurrenceMap(todayOccurrences)

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Activation Plan</h1>
            <div className="flex items-center gap-2 mt-1">
              {mapVersion && (
                <Badge variant="neutral" className="text-primary-400 border-primary-500/30 text-xs">
                  MAP v{mapVersion}
                </Badge>
              )}
              <span className="text-sm text-neutral-500">
                {activeCommitments.length} active commitment{activeCommitments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/map/history">
                <History className="w-4 h-4 mr-1" />
                History
              </Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/map/new">
                <Plus className="w-4 h-4 mr-1" />
                New MAP
              </Link>
            </Button>
          </div>
        </div>

        {/* Pillar Cards */}
        {PILLAR_ORDER.map(pillar => {
          const meta = PILLAR_META[pillar]
          const pillarCommitments = commitmentsByPillar[pillar] || []

          if (pillarCommitments.length === 0) return null

          return (
            <div key={pillar}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <span
                  className="text-xs uppercase tracking-[0.2em] font-medium"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </span>
                <span className="text-xs text-neutral-600">{meta.description}</span>
              </div>

              <div className="space-y-2">
                {pillarCommitments.map(commitment => (
                  <ActionCard
                    key={commitment.id}
                    commitment={commitment}
                    pillarColor={meta.color}
                    todayOccurrence={occurrenceMap.get(commitment.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Today's Progress */}
        <TodayProgress occurrences={todayOccurrences} />
      </Stack>
    </Container>
  )
}

function ActionCard({
  commitment,
  pillarColor,
  todayOccurrence,
}: {
  commitment: Commitment
  pillarColor: string
  todayOccurrence?: CommitmentOccurrence
}) {
  const activity = commitment.activity_type
    ? getActivityDefinition(commitment.activity_type)
    : null
  const Icon = activity?.icon
  const deepLink = activity?.defaultDeepLink || '/map'

  const cadenceLabel = commitment.cadence
    ? commitment.cadence.kind === 'daily'
      ? 'Daily'
      : `${(commitment.cadence as any).count}x/week`
    : ''

  const isVerified = todayOccurrence?.status === 'yes'
  const isPending = !todayOccurrence || todayOccurrence.status === 'pending'

  return (
    <Link href={deepLink}>
      <Card
        variant="outlined"
        className={`bg-[#101010] border-[#1F1F1F] hover:border-neutral-600 transition-all cursor-pointer ${
          isVerified ? 'border-primary-500/30 bg-primary-500/5' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${pillarColor}15`, borderColor: `${pillarColor}30` }}
          >
            {Icon ? (
              <Icon className="w-5 h-5" style={{ color: pillarColor }} />
            ) : (
              <Sparkles className="w-5 h-5" style={{ color: pillarColor }} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white truncate">
                {commitment.title}
              </p>
              {cadenceLabel && (
                <span className="text-xs text-neutral-600 flex-shrink-0">{cadenceLabel}</span>
              )}
            </div>
            {commitment.description && (
              <p className="text-xs text-neutral-500 truncate mt-0.5">{commitment.description}</p>
            )}
          </div>

          {/* Status + Action */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isVerified && (
              <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-400" />
              </div>
            )}
            {isPending && (
              <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
              </div>
            )}
            <ExternalLink className="w-4 h-4 text-neutral-600" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

function TodayProgress({ occurrences }: { occurrences: CommitmentOccurrence[] }) {
  if (occurrences.length === 0) return null

  const verified = occurrences.filter(o => o.status === 'yes').length
  const total = occurrences.length
  const percentage = total > 0 ? Math.round((verified / total) * 100) : 0

  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500 uppercase tracking-wider">Today&apos;s Progress</span>
        <span className="text-sm font-bold text-primary-400">{verified}/{total}</span>
      </div>
      <div className="w-full bg-neutral-800 rounded-full h-2">
        <div
          className="bg-primary-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {verified === total && total > 0 && (
        <p className="text-xs text-primary-400 mt-2 text-center">All done today!</p>
      )}
    </Card>
  )
}

function EmptyState() {
  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-12">
      <Sparkles className="w-12 h-12 text-primary-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">No Active MAP</h2>
      <p className="text-sm text-neutral-400 mb-6 max-w-md mx-auto">
        Create your Activation Plan to start building habits that move you above the Green Line.
      </p>
      <Button variant="primary" asChild>
        <Link href="/map/new">
          <Plus className="w-4 h-4 mr-2" />
          Create My MAP
        </Link>
      </Button>
    </Card>
  )
}

function groupByPillar(commitments: Commitment[]): Record<string, Commitment[]> {
  const groups: Record<string, Commitment[]> = {}
  for (const c of commitments) {
    const pillar = c.category
    if (!groups[pillar]) groups[pillar] = []
    groups[pillar].push(c)
  }
  return groups
}

function buildOccurrenceMap(occurrences: CommitmentOccurrence[]): Map<string, CommitmentOccurrence> {
  const map = new Map<string, CommitmentOccurrence>()
  for (const occ of occurrences) {
    map.set(occ.commitment_id, occ)
  }
  return map
}
