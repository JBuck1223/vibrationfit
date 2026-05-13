'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Container,
  Stack,
  Card,
  Button,
  Badge,
  Spinner,
} from '@/lib/design-system/components'
import {
  Plus,
  Target,
  ChevronRight,
  Trophy,
  Pause,
  Play,
  Archive,
} from 'lucide-react'
import { useMapStudio } from '@/components/map-studio'
import type { VisionTarget, Commitment, CommitmentStatus } from '@/lib/map/types'

const CATEGORY_COLORS: Record<string, string> = {
  activations: '#39FF14',
  creations: '#FFFF00',
  connections: '#BF00FF',
  sessions: '#00FFFF',
  money: '#39FF14', health: '#39FF14', family: '#BF00FF', love: '#FF0040',
  social: '#BF00FF', work: '#00FFFF', fun: '#FFFF00', travel: '#00FFFF',
  home: '#FFFF00', stuff: '#FFFF00', giving: '#BF00FF', spirituality: '#39FF14',
}

const CADENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  days_per_week: '/week',
}

export default function MapPortfolioPage() {
  const { targets, commitments, loading, refreshAll } = useMapStudio()
  const [updating, setUpdating] = useState<string | null>(null)

  const handleCommitmentStatus = async (id: string, status: CommitmentStatus) => {
    setUpdating(id)
    try {
      await fetch(`/api/map/commitments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await refreshAll()
    } catch (e) {
      console.error('Error updating commitment:', e)
    } finally {
      setUpdating(null)
    }
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

  const activeTargets = targets.filter(t => t.status === 'active')
  const achievedTargets = targets.filter(t => t.status === 'achieved')
  const orphanCommitments = commitments.filter(c => !c.vision_target_id)

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Portfolio</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {activeTargets.length} active target{activeTargets.length !== 1 ? 's' : ''}
              {' / '}
              {commitments.filter(c => c.status === 'active').length} commitments
            </p>
          </div>
          <Button variant="primary" size="sm" asChild>
            <Link href="/map/new">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Link>
          </Button>
        </div>

        {/* Active Targets */}
        {activeTargets.map(target => (
          <TargetCard
            key={target.id}
            target={target}
            commitments={commitments.filter(c => c.vision_target_id === target.id)}
            updating={updating}
            onStatusChange={handleCommitmentStatus}
          />
        ))}

        {/* Orphan Commitments */}
        {orphanCommitments.length > 0 && (
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
              Standalone Commitments
            </p>
            <div className="space-y-2">
              {orphanCommitments.map(c => (
                <CommitmentRow
                  key={c.id}
                  commitment={c}
                  updating={updating}
                  onStatusChange={handleCommitmentStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeTargets.length === 0 && orphanCommitments.length === 0 && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-12">
            <Target className="w-12 h-12 text-primary-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Vision Targets Yet</h2>
            <p className="text-sm text-neutral-400 mb-6 max-w-md mx-auto">
              Create a vision target to start breaking your Life Vision into actionable commitments.
            </p>
            <Button variant="primary" asChild>
              <Link href="/map/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Target
              </Link>
            </Button>
          </Card>
        )}

        {/* Achieved Targets */}
        {achievedTargets.length > 0 && (
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5" />
              Achieved
            </p>
            <div className="space-y-2">
              {achievedTargets.map(target => (
                <Card
                  key={target.id}
                  variant="outlined"
                  className="bg-[#101010] border-primary-500/20 bg-primary-500/5"
                >
                  <Link href={`/map/t/${target.id}`} className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-primary-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-400">{target.title}</p>
                      <p className="text-xs text-neutral-500">
                        {target.category} / Achieved {target.achieved_at ? new Date(target.achieved_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Stack>
    </Container>
  )
}

function TargetCard({
  target,
  commitments,
  updating,
  onStatusChange,
}: {
  target: VisionTarget
  commitments: Commitment[]
  updating: string | null
  onStatusChange: (id: string, status: CommitmentStatus) => void
}) {
  const color = CATEGORY_COLORS[target.category] || '#666'
  const activeCount = commitments.filter(c => c.status === 'active').length

  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
      <Stack gap="sm">
        <Link href={`/map/t/${target.id}`} className="flex items-center gap-3 group">
          <div
            className="w-2 h-8 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors">
              {target.title}
            </p>
            <p className="text-xs text-neutral-500 capitalize">
              {target.category} / {activeCount} active commitment{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
        </Link>

        {commitments.length > 0 && (
          <div className="space-y-1.5 pl-5">
            {commitments.map(c => (
              <CommitmentRow
                key={c.id}
                commitment={c}
                updating={updating}
                onStatusChange={onStatusChange}
                compact
              />
            ))}
          </div>
        )}
      </Stack>
    </Card>
  )
}

function CommitmentRow({
  commitment,
  updating,
  onStatusChange,
  compact = false,
}: {
  commitment: Commitment
  updating: string | null
  onStatusChange: (id: string, status: CommitmentStatus) => void
  compact?: boolean
}) {
  const isUpdating = updating === commitment.id
  const cadence = commitment.cadence
  const cadenceLabel = cadence
    ? cadence.kind === 'daily'
      ? 'Daily'
      : cadence.kind === 'days_per_week'
        ? `${(cadence as any).count}x/week`
        : ''
    : commitment.type === 'project' ? 'Project' : ''

  return (
    <div className={`flex items-center gap-2 ${compact ? 'py-1' : 'p-3 rounded-xl bg-neutral-900/50 border border-neutral-800'}`}>
      <div className="flex-1 min-w-0">
        <Link
          href={`/map/c/${commitment.id}`}
          className="text-sm text-neutral-300 hover:text-white transition-colors truncate block"
        >
          {commitment.title}
        </Link>
      </div>
      {cadenceLabel && (
        <span className="text-xs text-neutral-600 flex-shrink-0">{cadenceLabel}</span>
      )}
      {commitment.status === 'active' && (
        <button
          onClick={() => onStatusChange(commitment.id, 'paused')}
          disabled={isUpdating}
          className="p-1 text-neutral-600 hover:text-amber-400 transition-colors flex-shrink-0"
          aria-label="Pause"
        >
          {isUpdating ? <Spinner size="sm" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      )}
      {commitment.status === 'paused' && (
        <button
          onClick={() => onStatusChange(commitment.id, 'active')}
          disabled={isUpdating}
          className="p-1 text-neutral-600 hover:text-primary-400 transition-colors flex-shrink-0"
          aria-label="Resume"
        >
          {isUpdating ? <Spinner size="sm" /> : <Play className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  )
}
