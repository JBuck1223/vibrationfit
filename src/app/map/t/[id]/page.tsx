'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  ArrowLeft,
  Plus,
  Trophy,
  CheckCircle2,
  ChevronRight,
  Pause,
  Play,
  Edit2,
} from 'lucide-react'
import type {
  VisionTarget,
  Commitment,
  CommitmentOccurrence,
  CommitmentStatus,
} from '@/lib/map/types'

export default function TargetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [target, setTarget] = useState<VisionTarget | null>(null)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showAchieve, setShowAchieve] = useState(false)
  const [achievementNote, setAchievementNote] = useState('')
  const [achieving, setAchieving] = useState(false)

  const loadTarget = useCallback(async () => {
    try {
      const res = await fetch(`/api/map/targets/${id}`)
      if (!res.ok) { router.push('/map/portfolio'); return }
      const data = await res.json()
      setTarget(data.target)
      setCommitments(data.target?.commitments ?? [])
    } catch {
      router.push('/map/portfolio')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { loadTarget() }, [loadTarget])

  const handleCommitmentStatus = async (commitmentId: string, status: CommitmentStatus) => {
    setUpdating(commitmentId)
    try {
      await fetch(`/api/map/commitments/${commitmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await loadTarget()
    } finally {
      setUpdating(null)
    }
  }

  const handleAchieve = async () => {
    if (!target) return
    setAchieving(true)
    try {
      await fetch(`/api/map/targets/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'achieved',
          achievement_note: achievementNote || null,
        }),
      })
      await loadTarget()
      setShowAchieve(false)
    } finally {
      setAchieving(false)
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

  if (!target) return null

  const activeCommitments = commitments.filter(c => c.status === 'active')
  const pausedCommitments = commitments.filter(c => c.status === 'paused')
  const completedCommitments = commitments.filter(c => c.status === 'completed' || c.status === 'archived')
  const isAchieved = target.status === 'achieved'

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Back */}
        <button
          onClick={() => router.push('/map/portfolio')}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Portfolio
        </button>

        {/* Header */}
        <div>
          <div className="flex items-start gap-3">
            {isAchieved && <Trophy className="w-6 h-6 text-primary-400 flex-shrink-0 mt-0.5" />}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{target.title}</h1>
              {target.description && (
                <p className="text-sm text-neutral-400 mt-1">{target.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="neutral" className="capitalize text-xs">
                  {target.category}
                </Badge>
                <Badge variant={isAchieved ? 'success' : 'neutral'} className="text-xs">
                  {target.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Achieve CTA */}
        {!isAchieved && (
          <>
            {!showAchieve ? (
              <Button
                variant="secondary"
                onClick={() => setShowAchieve(true)}
                className="border-primary-500/30 text-primary-400"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Mark Target as Achieved
              </Button>
            ) : (
              <Card variant="outlined" className="bg-[#101010] border-primary-500/20">
                <Stack gap="sm">
                  <p className="text-sm text-white font-medium">
                    Celebrate this achievement!
                  </p>
                  <textarea
                    value={achievementNote}
                    onChange={e => setAchievementNote(e.target.value)}
                    placeholder="Add a note about what this accomplishment means to you..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-primary-500/50"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAchieve}
                      disabled={achieving}
                    >
                      {achieving ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Confirm Achievement
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowAchieve(false); setAchievementNote('') }}
                    >
                      Cancel
                    </Button>
                  </div>
                </Stack>
              </Card>
            )}
          </>
        )}

        {/* Achievement Note */}
        {isAchieved && target.achievement_note && (
          <Card variant="outlined" className="bg-primary-500/5 border-primary-500/20">
            <p className="text-sm text-neutral-300 italic">&ldquo;{target.achievement_note}&rdquo;</p>
            {target.achieved_at && (
              <p className="text-xs text-neutral-500 mt-2">
                Achieved {new Date(target.achieved_at).toLocaleDateString()}
              </p>
            )}
          </Card>
        )}

        {/* Active Commitments */}
        {activeCommitments.length > 0 && (
          <Section title="Active Commitments" count={activeCommitments.length}>
            {activeCommitments.map(c => (
              <CommitmentCard
                key={c.id}
                commitment={c}
                updating={updating}
                onStatusChange={handleCommitmentStatus}
              />
            ))}
          </Section>
        )}

        {/* Add Commitment */}
        {!isAchieved && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/map/new?target=${target.id}`}>
              <Plus className="w-4 h-4 mr-1" />
              Add Commitment
            </Link>
          </Button>
        )}

        {/* Paused */}
        {pausedCommitments.length > 0 && (
          <Section title="Paused" count={pausedCommitments.length}>
            {pausedCommitments.map(c => (
              <CommitmentCard
                key={c.id}
                commitment={c}
                updating={updating}
                onStatusChange={handleCommitmentStatus}
              />
            ))}
          </Section>
        )}

        {/* Completed */}
        {completedCommitments.length > 0 && (
          <Section title="Completed" count={completedCommitments.length}>
            {completedCommitments.map(c => (
              <CommitmentCard
                key={c.id}
                commitment={c}
                updating={updating}
                onStatusChange={handleCommitmentStatus}
              />
            ))}
          </Section>
        )}
      </Stack>
    </Container>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
        {title} ({count})
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CommitmentCard({
  commitment,
  updating,
  onStatusChange,
}: {
  commitment: Commitment
  updating: string | null
  onStatusChange: (id: string, status: CommitmentStatus) => void
}) {
  const cadenceLabel = commitment.cadence
    ? commitment.cadence.kind === 'daily'
      ? 'Daily'
      : `${(commitment.cadence as any).count}x/week`
    : commitment.type === 'project' ? 'Project' : ''

  const isUpdating = updating === commitment.id

  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/map/c/${commitment.id}`}
            className="text-sm font-medium text-white hover:text-primary-400 transition-colors"
          >
            {commitment.title}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            {cadenceLabel && <span className="text-xs text-neutral-600">{cadenceLabel}</span>}
            <span className="text-xs text-neutral-600 capitalize">{commitment.status}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {commitment.status === 'active' && (
            <button
              onClick={() => onStatusChange(commitment.id, 'paused')}
              disabled={isUpdating}
              className="p-1.5 text-neutral-600 hover:text-amber-400 transition-colors"
            >
              {isUpdating ? <Spinner size="sm" /> : <Pause className="w-4 h-4" />}
            </button>
          )}
          {commitment.status === 'paused' && (
            <button
              onClick={() => onStatusChange(commitment.id, 'active')}
              disabled={isUpdating}
              className="p-1.5 text-neutral-600 hover:text-primary-400 transition-colors"
            >
              {isUpdating ? <Spinner size="sm" /> : <Play className="w-4 h-4" />}
            </button>
          )}
          <Link
            href={`/map/c/${commitment.id}`}
            className="p-1.5 text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Card>
  )
}
