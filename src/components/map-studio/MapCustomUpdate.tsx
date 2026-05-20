'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Stack,
  Card,
  Button,
  Spinner,
  Select,
} from '@/lib/design-system/components'
import { Plus, Pause, Play, Trash2 } from 'lucide-react'
import { useMapStudio } from './MapStudioContext'
import { LIFE_CATEGORY_KEYS, getVisionCategory } from '@/lib/design-system/vision-categories'

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
  const { customCommitments, refreshAll } = useMapStudio()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [cadenceJson, setCadenceJson] = useState(CADENCE_OPTIONS[0].value)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

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

  const handleStatus = async (id: string, status: 'active' | 'paused' | 'archived') => {
    setUpdating(id)
    try {
      await fetch(`/api/map/commitments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await refreshAll()
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (id: string) => {
    setUpdating(id)
    try {
      await fetch(`/api/map/commitments/${id}`, { method: 'DELETE' })
      await refreshAll()
    } finally {
      setUpdating(null)
    }
  }

  const grouped = customCommitments.reduce<Record<string, typeof customCommitments>>((acc, c) => {
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
            Personal commitments tagged to your life categories.
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
          <p className="text-sm text-neutral-500">No custom actions yet. Add your first personal commitment.</p>
        </Card>
      ) : (
        Object.entries(grouped).map(([catKey, items]) => {
          const cat = getVisionCategory(catKey as Parameters<typeof getVisionCategory>[0])
          return (
            <div key={catKey}>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">{cat?.label || catKey}</p>
              <div className="space-y-2">
                {items.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.title}</p>
                      <p className="text-xs text-neutral-600 capitalize">{c.status}</p>
                    </div>
                    {c.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleStatus(c.id, 'paused')}
                        disabled={updating === c.id}
                        className="p-1.5 text-neutral-500 hover:text-amber-400"
                        aria-label="Pause"
                      >
                        {updating === c.id ? <Spinner size="sm" /> : <Pause className="w-4 h-4" />}
                      </button>
                    )}
                    {c.status === 'paused' && (
                      <button
                        type="button"
                        onClick={() => handleStatus(c.id, 'active')}
                        disabled={updating === c.id}
                        className="p-1.5 text-neutral-500 hover:text-primary-400"
                        aria-label="Resume"
                      >
                        {updating === c.id ? <Spinner size="sm" /> : <Play className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={updating === c.id}
                      className="p-1.5 text-neutral-500 hover:text-red-400"
                      aria-label="Delete"
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
    </Stack>
  )
}
