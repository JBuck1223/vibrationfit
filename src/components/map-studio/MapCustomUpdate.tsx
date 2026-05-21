'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Stack,
  Card,
  Button,
  Spinner,
  Select,
} from '@/lib/design-system/components'
import { Plus, Archive, Trash2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useMapStudio } from './MapStudioContext'
import { isCustomCommitment } from '@/lib/map/commitment-classification'
import { LIFE_CATEGORY_KEYS, getVisionCategory } from '@/lib/design-system/vision-categories'
import type { Commitment } from '@/lib/map/types'

const CADENCE_OPTIONS = [
  { value: JSON.stringify({ kind: 'daily' }), label: 'Every day' },
  { value: JSON.stringify({ kind: 'days_per_week', count: 5 }), label: '5x per week' },
  { value: JSON.stringify({ kind: 'days_per_week', count: 3 }), label: '3x per week' },
  { value: JSON.stringify({ kind: 'days_per_week', count: 2 }), label: '2x per week' },
  { value: JSON.stringify({ kind: 'days_per_week', count: 1 }), label: '1x per week' },
]

const PICKER_CATEGORIES = LIFE_CATEGORY_KEYS

export function MapCustomUpdate() {
  const router = useRouter()
  const { customActiveCommitments, refreshAll } = useMapStudio()
  const [archivedCommitments, setArchivedCommitments] = useState<Commitment[]>([])
  const [archivedLoading, setArchivedLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [cadenceJson, setCadenceJson] = useState(CADENCE_OPTIONS[0].value)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const loadArchived = useCallback(async () => {
    setArchivedLoading(true)
    try {
      const res = await fetch('/api/map/commitments?status=archived')
      if (!res.ok) return
      const data = await res.json()
      const all = (data.commitments || []) as Commitment[]
      setArchivedCommitments(all.filter(isCustomCommitment))
    } finally {
      setArchivedLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadArchived()
  }, [loadArchived, customActiveCommitments])

  const handleCreate = async () => {
    if (!title.trim() || !category) return
    setSaving(true)
    try {
      const res = await fetch('/api/map/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          type: 'recurring',
          title: title.trim(),
          description: description.trim() || null,
          cadence: JSON.parse(cadenceJson),
        }),
      })
      if (res.ok) {
        await fetch('/api/map/generate-occurrences', { method: 'POST' })
        await refreshAll()
        await loadArchived()
        setTitle('')
        setDescription('')
        setCategory('')
        setShowForm(false)
        router.push('/map')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id: string) => {
    setUpdating(id)
    try {
      await fetch(`/api/map/commitments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      await refreshAll()
      await loadArchived()
    } finally {
      setUpdating(null)
    }
  }

  const handleRestore = async (id: string) => {
    setUpdating(id)
    try {
      await fetch(`/api/map/commitments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      await fetch('/api/map/generate-occurrences', { method: 'POST' })
      await refreshAll()
      await loadArchived()
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (id: string) => {
    setUpdating(id)
    try {
      await fetch(`/api/map/commitments/${id}`, { method: 'DELETE' })
      await refreshAll()
      await loadArchived()
      setDeleteConfirmId(null)
    } finally {
      setUpdating(null)
    }
  }

  const grouped = customActiveCommitments.reduce<Record<string, typeof customActiveCommitments>>((acc, c) => {
    const key = c.category || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const archivedGrouped = archivedCommitments.reduce<Record<string, Commitment[]>>((acc, c) => {
    const key = c.category || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <Stack gap="lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Actions</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Personal commitments on your MAP. Archive removes them from Day view; restore anytime.
          </p>
        </div>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </div>

      {showForm && (
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-2">Life category</label>
              <div className="flex flex-wrap gap-2">
                {PICKER_CATEGORIES.map(key => {
                  const cat = getVisionCategory(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        category === key
                          ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/50'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {cat?.label || key}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50"
                placeholder="e.g., Hit 190g protein"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Cadence</label>
              <Select options={CADENCE_OPTIONS} value={cadenceJson} onChange={setCadenceJson} />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Note (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-primary-500/50"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleCreate} disabled={saving || !title.trim() || !category}>
                {saving ? <Spinner size="sm" /> : 'Save commitment'}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </Stack>
        </Card>
      )}

      {Object.keys(grouped).length === 0 && !showForm ? (
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-10">
          <p className="text-sm text-neutral-500">No active custom actions. Add your first personal commitment.</p>
        </Card>
      ) : (
        Object.entries(grouped).map(([catKey, items]) => {
          const cat = getVisionCategory(catKey as Parameters<typeof getVisionCategory>[0])
          return (
            <div key={catKey}>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">{cat?.label || catKey}</p>
              <div className="space-y-2">
                {items.map(c => (
                  <CommitmentRow
                    key={c.id}
                    commitment={c}
                    updating={updating === c.id}
                    deleteConfirmId={deleteConfirmId}
                    onArchive={() => handleArchive(c.id)}
                    onDeleteRequest={() => setDeleteConfirmId(c.id)}
                    onDeleteConfirm={() => handleDelete(c.id)}
                    onDeleteCancel={() => setDeleteConfirmId(null)}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}

      <div className="border-t border-neutral-800 pt-4">
        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white"
        >
          {showArchived ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Archived ({archivedLoading ? '...' : archivedCommitments.length})
        </button>
        {showArchived && (
          <div className="mt-4 space-y-4">
            {archivedLoading ? (
              <Spinner size="sm" />
            ) : archivedCommitments.length === 0 ? (
              <p className="text-sm text-neutral-600">No archived custom actions.</p>
            ) : (
              Object.entries(archivedGrouped).map(([catKey, items]) => {
                const cat = getVisionCategory(catKey as Parameters<typeof getVisionCategory>[0])
                return (
                  <div key={catKey}>
                    <p className="text-xs text-neutral-600 uppercase tracking-wider mb-2">{cat?.label || catKey}</p>
                    <div className="space-y-2">
                      {items.map(c => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/30 border border-neutral-800/80"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-400 truncate">{c.title}</p>
                            <p className="text-xs text-neutral-600">Archived — not on MAP</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestore(c.id)}
                            disabled={updating === c.id}
                            className="p-1.5 text-neutral-500 hover:text-primary-400"
                            aria-label="Restore"
                          >
                            {updating === c.id ? <Spinner size="sm" /> : <RotateCcw className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            disabled={updating === c.id}
                            className="p-1.5 text-neutral-500 hover:text-red-400"
                            aria-label="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </Stack>
  )
}

function CommitmentRow({
  commitment,
  updating,
  deleteConfirmId,
  onArchive,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  commitment: Commitment
  updating: boolean
  deleteConfirmId: string | null
  onArchive: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}) {
  const isDeleting = deleteConfirmId === commitment.id

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{commitment.title}</p>
        <p className="text-xs text-neutral-600">On your MAP</p>
      </div>
      {isDeleting ? (
        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" onClick={onDeleteConfirm} disabled={updating}>
            {updating ? <Spinner size="sm" /> : 'Delete'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDeleteCancel}>Cancel</Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onArchive}
            disabled={updating}
            className="p-1.5 text-neutral-500 hover:text-amber-400"
            aria-label="Archive"
          >
            {updating ? <Spinner size="sm" /> : <Archive className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onDeleteRequest}
            disabled={updating}
            className="p-1.5 text-neutral-500 hover:text-red-400"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  )
}
