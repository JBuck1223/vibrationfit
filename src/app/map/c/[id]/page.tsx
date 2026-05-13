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
  Check,
  X,
  SkipForward,
  Edit2,
  Pause,
  Play,
  Trash2,
  Target,
} from 'lucide-react'
import type { Commitment, CommitmentOccurrence, OccurrenceStatus } from '@/lib/map/types'

const STATUS_COLORS: Record<string, string> = {
  yes: 'bg-primary-500/20 text-primary-400',
  no: 'bg-red-500/10 text-red-400',
  skipped: 'bg-neutral-800 text-neutral-500',
  pending: 'bg-neutral-900 text-neutral-400 border border-neutral-700',
}

const STATUS_LABELS: Record<string, string> = {
  yes: 'Done',
  no: 'Missed',
  skipped: 'Skipped',
  pending: 'Pending',
}

export default function CommitmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [commitment, setCommitment] = useState<Commitment | null>(null)
  const [occurrences, setOccurrences] = useState<CommitmentOccurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [commitmentRes, occurrencesRes] = await Promise.all([
        fetch(`/api/map/commitments/${id}`),
        fetch(`/api/map/occurrences?commitment_id=${id}`),
      ])

      if (!commitmentRes.ok) { router.push('/map/portfolio'); return }

      const commitmentData = await commitmentRes.json()
      setCommitment(commitmentData.commitment)
      setEditTitle(commitmentData.commitment?.title || '')
      setEditDescription(commitmentData.commitment?.description || '')

      if (occurrencesRes.ok) {
        const occData = await occurrencesRes.json()
        setOccurrences(occData.occurrences || [])
      }
    } catch {
      router.push('/map/portfolio')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!commitment) return
    setSaving(true)
    try {
      await fetch(`/api/map/commitments/${commitment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
        }),
      })
      setEditing(false)
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleStatusToggle = async (status: 'active' | 'paused') => {
    if (!commitment) return
    setSaving(true)
    try {
      await fetch(`/api/map/commitments/${commitment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!commitment) return
    setDeleting(true)
    try {
      await fetch(`/api/map/commitments/${commitment.id}`, { method: 'DELETE' })
      router.push('/map/portfolio')
    } finally {
      setDeleting(false)
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

  if (!commitment) return null

  const cadenceLabel = commitment.cadence
    ? commitment.cadence.kind === 'daily'
      ? 'Daily'
      : `${(commitment.cadence as any).count}x per week`
    : commitment.type === 'project' ? 'Project' : ''

  const yesCount = occurrences.filter(o => o.status === 'yes').length
  const totalCount = occurrences.filter(o => o.status !== 'pending').length
  const streakCount = computeStreak(occurrences)

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header / Edit */}
        {editing ? (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Stack gap="sm">
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50"
                placeholder="Commitment title"
              />
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-primary-500/50"
                placeholder="Description (optional)"
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !editTitle.trim()}>
                  {saving ? <Spinner size="sm" /> : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </Stack>
          </Card>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">{commitment.title}</h1>
                {commitment.description && (
                  <p className="text-sm text-neutral-400 mt-1">{commitment.description}</p>
                )}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-neutral-600 hover:text-white transition-colors flex-shrink-0"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {cadenceLabel && <Badge variant="neutral" className="text-xs">{cadenceLabel}</Badge>}
              <Badge variant="neutral" className="text-xs capitalize">{commitment.status}</Badge>
              <Badge variant="neutral" className="text-xs capitalize">{commitment.type}</Badge>
            </div>
            {commitment.vision_target_id && (
              <Link
                href={`/map/t/${commitment.vision_target_id}`}
                className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 mt-2"
              >
                <Target className="w-3.5 h-3.5" />
                View Target
              </Link>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Verified" value={yesCount} sub={`of ${totalCount}`} color="text-primary-400" />
          <StatCard label="Hit Rate" value={totalCount > 0 ? `${Math.round((yesCount / totalCount) * 100)}%` : '—'} color="text-white" />
          <StatCard label="Streak" value={streakCount} sub="days" color="text-amber-400" />
        </div>

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {commitment.status === 'active' && (
            <Button variant="secondary" size="sm" onClick={() => handleStatusToggle('paused')} disabled={saving}>
              <Pause className="w-4 h-4 mr-1" /> Pause
            </Button>
          )}
          {commitment.status === 'paused' && (
            <Button variant="secondary" size="sm" onClick={() => handleStatusToggle('active')} disabled={saving}>
              <Play className="w-4 h-4 mr-1" /> Resume
            </Button>
          )}
          {!confirmDelete ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-red-400">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="text-red-400">
                {deleting ? <Spinner size="sm" /> : 'Confirm Delete'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          )}
        </div>

        {/* History */}
        {occurrences.length > 0 && (
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
              History ({occurrences.length})
            </p>
            <div className="space-y-1.5">
              {occurrences
                .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))
                .map(occ => (
                  <div key={occ.id} className="flex items-center gap-3 py-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${STATUS_COLORS[occ.status]}`}>
                      {occ.status === 'yes' && <Check className="w-3.5 h-3.5" />}
                      {occ.status === 'no' && <X className="w-3.5 h-3.5" />}
                      {occ.status === 'skipped' && <SkipForward className="w-3 h-3" />}
                      {occ.status === 'pending' && '?'}
                    </div>
                    <span className="text-sm text-neutral-400">
                      {new Date(occ.occurred_on + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-xs text-neutral-600">{STATUS_LABELS[occ.status]}</span>
                    {occ.note && (
                      <span className="text-xs text-neutral-500 truncate flex-1">{occ.note}</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </Stack>
    </Container>
  )
}

function StatCard({ label, value, sub, color = 'text-white' }: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-3">
      <p className={`text-xl font-bold ${color}`}>
        {value}
        {sub && <span className="text-xs text-neutral-600 ml-1">{sub}</span>}
      </p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </Card>
  )
}

function computeStreak(occurrences: CommitmentOccurrence[]): number {
  const sorted = [...occurrences]
    .filter(o => o.status !== 'pending')
    .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))

  let streak = 0
  for (const occ of sorted) {
    if (occ.status === 'yes') streak++
    else break
  }
  return streak
}
