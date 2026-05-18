'use client'

import { useState, useEffect } from 'react'
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
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Headphones,
  BookOpen,
  Heart,
  Video,
} from 'lucide-react'
import { useMapStudio, type CommitmentStats } from '@/components/map-studio'
import { getActivityDefinition } from '@/lib/map/activities'
import type { Commitment, CommitmentOccurrence, MapCategory } from '@/lib/map/types'

const PILLAR_ORDER: MapCategory[] = ['activations', 'creations', 'connections', 'sessions']

const PILLAR_META: Record<string, {
  label: string
  color: string
  gradient: string
  example: string
  exampleIcon: typeof Headphones
}> = {
  activations: {
    label: 'Activate',
    color: '#39FF14',
    gradient: 'from-[#39FF14]/10 to-transparent',
    example: 'Listen to Life Vision audio',
    exampleIcon: Headphones,
  },
  creations: {
    label: 'Create',
    color: '#FFFF00',
    gradient: 'from-[#FFFF00]/10 to-transparent',
    example: 'Journal entry or Daily Paper',
    exampleIcon: BookOpen,
  },
  connections: {
    label: 'Connect',
    color: '#BF00FF',
    gradient: 'from-[#BF00FF]/10 to-transparent',
    example: 'Engage with the Vibe Tribe',
    exampleIcon: Heart,
  },
  sessions: {
    label: 'Attend',
    color: '#00FFFF',
    gradient: 'from-[#00FFFF]/10 to-transparent',
    example: 'Alignment Gym session',
    exampleIcon: Video,
  },
}

export default function MapCurrentPage() {
  const { commitments, todayOccurrences, commitmentStats, loading } = useMapStudio()
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

  // 1 primary commitment per pillar, extras are supplements
  const pillarCommitment = new Map<string, Commitment>()
  const supplementCommitments = new Map<string, Commitment[]>()
  for (const c of activeCommitments) {
    if (!pillarCommitment.has(c.category)) {
      pillarCommitment.set(c.category, c)
    } else {
      const existing = supplementCommitments.get(c.category) || []
      existing.push(c)
      supplementCommitments.set(c.category, existing)
    }
  }

  const occurrenceMap = new Map<string, CommitmentOccurrence>()
  for (const occ of todayOccurrences) {
    occurrenceMap.set(occ.commitment_id, occ)
  }

  // Overall stats
  const allStats = Array.from(commitmentStats.values())
  const overallHitRate = allStats.length > 0
    ? Math.round(allStats.reduce((sum, s) => sum + s.hitRate, 0) / allStats.length)
    : 0
  const todayCompleted = todayOccurrences.filter(o => o.status === 'yes').length
  const todayTotal = todayOccurrences.length

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">MAP</h1>
            {mapVersion && (
              <Badge variant="neutral" className="text-primary-400 border-primary-500/30 text-xs">
                v{mapVersion}
              </Badge>
            )}
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">My Alignment Plan</p>

          {/* Today summary bar */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Today</span>
              <div className="flex gap-1">
                {todayOccurrences.map(occ => (
                  <div
                    key={occ.id}
                    className={`w-2.5 h-2.5 rounded-full ${
                      occ.status === 'yes' ? 'bg-primary-400' : 'bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-neutral-400">
                {todayCompleted}/{todayTotal}
              </span>
            </div>
            {overallHitRate > 0 && (
              <span className="text-xs text-neutral-600">
                30-day hit rate: <span className={`font-medium ${overallHitRate >= 70 ? 'text-primary-400' : overallHitRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{overallHitRate}%</span>
              </span>
            )}
          </div>
        </div>

        {/* 4 Area Cards */}
        <div className="space-y-3">
          {PILLAR_ORDER.map(pillar => {
            const meta = PILLAR_META[pillar]
            const commitment = pillarCommitment.get(pillar)
            const supplements = supplementCommitments.get(pillar) || []

            if (!commitment) {
              return <AreaEmptyCard key={pillar} meta={meta} />
            }

            return (
              <AreaCard
                key={pillar}
                meta={meta}
                commitment={commitment}
                supplements={supplements}
                stats={commitmentStats.get(commitment.id)}
                todayOccurrence={occurrenceMap.get(commitment.id)}
                supplementOccurrences={supplements.map(s => occurrenceMap.get(s.id)).filter(Boolean) as CommitmentOccurrence[]}
                supplementStats={supplements.map(s => commitmentStats.get(s.id)).filter(Boolean) as CommitmentStats[]}
              />
            )
          })}
        </div>

        {/* Reset hint */}
        <div className="text-center pt-2">
          <p className="text-xs text-neutral-600">
            Want to change your actions? <Link href="/map/history" className="text-primary-400 hover:text-primary-300">View history</Link> or reset your MAP.
          </p>
        </div>
      </Stack>
    </Container>
  )
}

function AreaCard({
  meta,
  commitment,
  supplements,
  stats,
  todayOccurrence,
  supplementOccurrences,
  supplementStats,
}: {
  meta: typeof PILLAR_META[string]
  commitment: Commitment
  supplements: Commitment[]
  stats?: CommitmentStats
  todayOccurrence?: CommitmentOccurrence
  supplementOccurrences: CommitmentOccurrence[]
  supplementStats: CommitmentStats[]
}) {
  const activity = commitment.activity_type
    ? getActivityDefinition(commitment.activity_type)
    : null
  const Icon = activity?.icon
  const deepLink = activity?.defaultDeepLink || '/map'

  const cadenceLabel = commitment.cadence
    ? commitment.cadence.kind === 'daily'
      ? 'Every day'
      : `${(commitment.cadence as any).count}x per week`
    : ''

  const isVerifiedToday = todayOccurrence?.status === 'yes'
  const isPendingToday = !todayOccurrence || todayOccurrence.status === 'pending'

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: isVerifiedToday ? `${meta.color}40` : '#1A1A1A',
        backgroundColor: '#0A0A0A',
      }}
    >
      {/* Colored top accent */}
      <div className="h-0.5" style={{ backgroundColor: meta.color }} />

      <div className="p-4">
        {/* Area label + status */}
        <div className="flex items-center justify-between mb-2.5">
          <span
            className="text-[11px] uppercase tracking-[0.2em] font-bold"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          {isVerifiedToday ? (
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-[11px] font-medium text-primary-400">Done</span>
            </div>
          ) : isPendingToday ? (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-[11px] text-neutral-500">Not yet</span>
            </div>
          ) : null}
        </div>

        {/* Action link */}
        <Link href={deepLink} className="block group">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${meta.color}10` }}
            >
              {Icon ? (
                <Icon className="w-5 h-5" style={{ color: meta.color }} />
              ) : (
                <Sparkles className="w-5 h-5" style={{ color: meta.color }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-white group-hover:text-primary-300 transition-colors">
                {commitment.title}
              </p>
              <p className="text-xs text-neutral-500">{cadenceLabel}</p>
            </div>

            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-800/60 group-hover:bg-primary-500/20 transition-colors">
              <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-primary-400 transition-colors" />
            </div>
          </div>
        </Link>

        {/* Stats */}
        {stats && stats.last30Total > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-[#151515]">
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-neutral-600" />
              <span className="text-[11px] text-neutral-500">
                <span className="text-neutral-300 font-medium">{stats.thisWeekCompleted}</span>/{stats.thisWeekTotal} this week
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-neutral-600" />
              <span className={`text-[11px] font-medium ${stats.hitRate >= 70 ? 'text-primary-400' : stats.hitRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {stats.hitRate}%
              </span>
            </div>
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-[11px] text-orange-400 font-medium">{stats.currentStreak}d</span>
              </div>
            )}
          </div>
        )}

        {/* Supplements */}
        {supplements.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-[#151515] space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-600">Supplements</span>
            {supplements.map((supp, i) => {
              const suppActivity = supp.activity_type ? getActivityDefinition(supp.activity_type) : null
              const suppDeepLink = suppActivity?.defaultDeepLink || '/map'
              const suppOcc = supplementOccurrences[i]
              const suppStat = supplementStats[i]
              const suppCadence = supp.cadence
                ? supp.cadence.kind === 'daily' ? 'Daily' : `${(supp.cadence as any).count}x/wk`
                : ''

              return (
                <Link key={supp.id} href={suppDeepLink} className="block group">
                  <div className="flex items-center gap-2 py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${meta.color}50` }} />
                    <span className="text-[13px] text-neutral-400 group-hover:text-white transition-colors flex-1 truncate">
                      {supp.title}
                    </span>
                    <span className="text-[10px] text-neutral-600">{suppCadence}</span>
                    {suppStat && (
                      <span className={`text-[10px] font-medium ${suppStat.hitRate >= 70 ? 'text-primary-400' : 'text-neutral-500'}`}>
                        {suppStat.hitRate}%
                      </span>
                    )}
                    {suppOcc?.status === 'yes' && <Check className="w-3 h-3 text-primary-400" />}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function AreaEmptyCard({ meta }: { meta: typeof PILLAR_META[string] }) {
  const ExIcon = meta.exampleIcon
  return (
    <div
      className="rounded-2xl border border-dashed overflow-hidden"
      style={{ borderColor: `${meta.color}20`, backgroundColor: '#0A0A0A' }}
    >
      <div className="h-0.5" style={{ backgroundColor: `${meta.color}30` }} />
      <div className="p-4 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.color}08` }}
        >
          <ExIcon className="w-5 h-5" style={{ color: `${meta.color}40` }} />
        </div>
        <div className="flex-1">
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: `${meta.color}50` }}>
            {meta.label}
          </span>
          <p className="text-xs text-neutral-600 mt-0.5">{meta.example}</p>
        </div>
        <span className="text-[10px] text-neutral-700">Not set</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="space-y-6">
      <div className="text-center pt-4">
        <h1 className="text-2xl font-bold text-white">MAP</h1>
        <p className="text-sm text-neutral-500 mt-1">My Alignment Plan</p>
      </div>

      <Card variant="outlined" className="bg-[#0A0A0A] border-[#1A1A1A] py-10 px-6">
        <div className="text-center max-w-md mx-auto">
          <p className="text-base text-neutral-300 mb-6">
            Your MAP is your daily intention — one aligned action in each area.
          </p>

          <div className="space-y-3 text-left mb-8">
            {PILLAR_ORDER.map(p => {
              const m = PILLAR_META[p]
              const ExIcon = m.exampleIcon
              return (
                <div key={p} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${m.color}10` }}
                  >
                    <ExIcon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: m.color }}>
                      {m.label}
                    </span>
                    <p className="text-xs text-neutral-500">{m.example}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-sm text-neutral-500 mb-6">
            Pick the action that feels most aligned and the cadence you can commit to. We track your progress automatically when you do it on the platform.
          </p>

          <p className="text-xs text-neutral-600">
            Your MAP will be built during the Activation Intensive.
          </p>
        </div>
      </Card>
    </div>
  )
}
