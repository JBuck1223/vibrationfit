'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Container,
  Stack,
  Card,
  Badge,
  Spinner,
  Button,
} from '@/lib/design-system/components'
import {
  History,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Minus,
  Plus,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { getActivityDefinition } from '@/lib/map/activities'
import type { Commitment, CommitmentOccurrence } from '@/lib/map/types'

interface MapVersionGroup {
  versionNumber: number
  startDate: string
  endDate: string | null
  commitments: Commitment[]
  stats: VersionStats
}

interface VersionStats {
  totalDays: number
  totalOccurrences: number
  completedOccurrences: number
  hitRate: number
  perCommitment: Record<string, { completed: number; total: number; rate: number }>
}

const PILLAR_COLORS: Record<string, string> = {
  activations: '#39FF14',
  creations: '#FFFF00',
  connections: '#BF00FF',
  sessions: '#00FFFF',
}

export default function MapHistoryPage() {
  const [versions, setVersions] = useState<MapVersionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null)

  const loadHistory = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setLoading(false); return }

    const userId = session.user.id

    // Get all user_maps ordered by version
    const { data: maps } = await supabase
      .from('user_maps')
      .select('*')
      .eq('user_id', userId)
      .order('version_number', { ascending: false })

    if (!maps || maps.length === 0) { setLoading(false); return }

    // Get all commitments (both active and archived)
    const { data: allCommitments } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!allCommitments) { setLoading(false); return }

    // Get all occurrences for stats
    const commitmentIds = allCommitments.map(c => c.id)
    let allOccurrences: CommitmentOccurrence[] = []

    if (commitmentIds.length > 0) {
      const { data: occs } = await supabase
        .from('commitment_occurrences')
        .select('*')
        .in('commitment_id', commitmentIds)

      if (occs) allOccurrences = occs
    }

    // Group commitments into MAP versions based on creation dates
    const versionGroups = buildVersionGroups(maps, allCommitments, allOccurrences)
    setVersions(versionGroups)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (versions.length === 0) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <h1 className="text-2xl font-bold text-white">History</h1>
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-12">
            <History className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No History Yet</h2>
            <p className="text-sm text-neutral-400 mb-6 max-w-md mx-auto">
              Your MAP history will appear here as you create and evolve your plans.
            </p>
            <Button variant="primary" asChild>
              <Link href="/map">
                <Sparkles className="w-4 h-4 mr-2" />
                View Current MAP
              </Link>
            </Button>
          </Card>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">History</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {versions.length} version{versions.length !== 1 ? 's' : ''} of your Activation Plan
            </p>
          </div>
          <Button variant="primary" size="sm" asChild>
            <Link href="/map/update/custom">
              <Plus className="w-4 h-4 mr-1" />
              Reset MAP
            </Link>
          </Button>
        </div>

        {versions.map(version => {
          const isExpanded = expandedVersion === version.versionNumber
          const isCurrent = version.endDate === null

          return (
            <Card
              key={version.versionNumber}
              variant="outlined"
              className={`bg-[#101010] border-[#1F1F1F] ${isCurrent ? 'border-primary-500/30' : ''}`}
            >
              {/* Version Header */}
              <button
                onClick={() => setExpandedVersion(isExpanded ? null : version.versionNumber)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={isCurrent ? 'primary' : 'neutral'}
                      className={isCurrent ? 'bg-primary-500/20 text-primary-400' : ''}
                    >
                      MAP v{version.versionNumber}
                    </Badge>
                    {isCurrent && (
                      <span className="text-xs text-primary-400">Current</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">
                        {version.stats.hitRate}%
                      </div>
                      <div className="text-xs text-neutral-500">hit rate</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                </div>

                {/* Date Range + Quick Stats */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(version.startDate)}
                    {' — '}
                    {version.endDate ? formatDate(version.endDate) : 'Present'}
                  </div>
                  <span className="text-xs text-neutral-600">
                    {version.stats.totalDays} day{version.stats.totalDays !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {version.stats.completedOccurrences}/{version.stats.totalOccurrences} completed
                  </span>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#1F1F1F] space-y-3">
                  {version.commitments.map(commitment => {
                    const activity = commitment.activity_type
                      ? getActivityDefinition(commitment.activity_type)
                      : null
                    const Icon = activity?.icon
                    const pillarColor = PILLAR_COLORS[commitment.category] || '#888'
                    const stats = version.stats.perCommitment[commitment.id]

                    return (
                      <div
                        key={commitment.id}
                        className="flex items-center gap-3 py-2"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${pillarColor}15` }}
                        >
                          {Icon ? (
                            <Icon className="w-4 h-4" style={{ color: pillarColor }} />
                          ) : (
                            <Sparkles className="w-4 h-4" style={{ color: pillarColor }} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{commitment.title}</p>
                          <span className="text-xs text-neutral-600 capitalize">{commitment.category}</span>
                        </div>

                        {stats && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-primary-400" />
                              <span className="text-xs text-neutral-400">{stats.completed}</span>
                            </div>
                            <span className="text-xs text-neutral-600">/</span>
                            <span className="text-xs text-neutral-500">{stats.total}</span>
                            <Badge variant="neutral" className="text-xs ml-1">
                              {stats.rate}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </Stack>
    </Container>
  )
}

function buildVersionGroups(
  maps: any[],
  commitments: Commitment[],
  occurrences: CommitmentOccurrence[],
): MapVersionGroup[] {
  const occByCommitment = new Map<string, CommitmentOccurrence[]>()
  for (const occ of occurrences) {
    const existing = occByCommitment.get(occ.commitment_id) || []
    existing.push(occ)
    occByCommitment.set(occ.commitment_id, existing)
  }

  return maps.map((map, idx) => {
    const nextMap = maps[idx - 1]
    const mapCreated = new Date(map.created_at)

    // Assign commitments to this MAP version by matching creation date windows
    const versionCommitments = commitments.filter(c => {
      const cDate = new Date(c.created_at)
      if (cDate < mapCreated) return false
      if (nextMap && cDate >= new Date(nextMap.created_at)) return false
      return true
    })

    // If no commitments matched by date, try matching active/archived status
    const finalCommitments = versionCommitments.length > 0
      ? versionCommitments
      : map.is_active
        ? commitments.filter(c => c.status === 'active')
        : []

    const stats = computeStats(finalCommitments, occByCommitment, map)

    const endDate = nextMap ? nextMap.created_at.split('T')[0] : null

    return {
      versionNumber: map.version_number,
      startDate: map.created_at.split('T')[0],
      endDate,
      commitments: finalCommitments,
      stats,
    }
  })
}

function computeStats(
  commitments: Commitment[],
  occByCommitment: Map<string, CommitmentOccurrence[]>,
  map: any,
): VersionStats {
  let totalOccurrences = 0
  let completedOccurrences = 0
  const perCommitment: Record<string, { completed: number; total: number; rate: number }> = {}

  const startDate = new Date(map.created_at)
  const now = new Date()
  const totalDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

  for (const c of commitments) {
    const occs = occByCommitment.get(c.id) || []
    const completed = occs.filter(o => o.status === 'yes').length
    const total = occs.length

    perCommitment[c.id] = {
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }

    totalOccurrences += total
    completedOccurrences += completed
  }

  const hitRate = totalOccurrences > 0
    ? Math.round((completedOccurrences / totalOccurrences) * 100)
    : 0

  return {
    totalDays,
    totalOccurrences,
    completedOccurrences,
    hitRate,
    perCommitment,
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
