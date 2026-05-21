'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Stack,
  Card,
  Button,
  Spinner,
  Select,
} from '@/lib/design-system/components'
import { Plus, Archive, Trash2, RotateCcw, ChevronDown, ChevronUp, GripVertical, Pencil } from 'lucide-react'
import { useMapStudio } from './MapStudioContext'
import { ToggleSection } from './MapSystemBuilder'
import { isCustomCommitment } from '@/lib/map/commitment-classification'
import { formatCadenceLabel } from '@/lib/map/map-builder-cadence'
import { LIFE_CATEGORY_KEYS, getVisionCategory } from '@/lib/design-system/vision-categories'
import type { Cadence, Commitment } from '@/lib/map/types'

const CADENCE_OPTIONS = [
  { value: JSON.stringify({ kind: 'daily' }), label: 'Every day' },
  { value: JSON.stringify({ kind: 'days_per_week', count: 5 }), label: '5x per week' },
  { value: JSON.stringify({ kind: 'days_per_week', count: 3 }), label: '3x per week' },
  { value: JSON.stringify({ kind: 'days_per_week', count: 2 }), label: '2x per week' },
  { value: JSON.stringify({ kind: 'days_per_week', count: 1 }), label: '1x per week' },
]

const PICKER_CATEGORIES = LIFE_CATEGORY_KEYS

function formatCommitmentCadence(cadence: Cadence | null): string {
  if (!cadence) return ''
  return formatCadenceLabel(JSON.stringify(cadence))
}

function cadenceToSelectValue(cadence: Cadence | null): string {
  if (!cadence) return CADENCE_OPTIONS[0].value
  const json = JSON.stringify(cadence)
  const exact = CADENCE_OPTIONS.find(o => o.value === json)
  if (exact) return exact.value
  if (cadence.kind === 'daily') return CADENCE_OPTIONS[0].value
  if (cadence.kind === 'days_per_week') {
    const match = CADENCE_OPTIONS.find(o => {
      try {
        const p = JSON.parse(o.value) as { kind?: string; count?: number }
        return p.kind === 'days_per_week' && p.count === cadence.count
      } catch {
        return false
      }
    })
    return match?.value ?? CADENCE_OPTIONS[0].value
  }
  return CADENCE_OPTIONS[0].value
}

export function MapCustomUpdate({
  showHeader = true,
  embeddedInPlan = false,
}: {
  showHeader?: boolean
  /** Renders inside alignment plan grid with title + Add in card header */
  embeddedInPlan?: boolean
} = {}) {
  const router = useRouter()
  const { customActiveCommitments, refreshAll, refreshCommitments } = useMapStudio()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const [orderedItems, setOrderedItems] = useState<Commitment[]>([])

  useEffect(() => {
    setOrderedItems(customActiveCommitments)
  }, [customActiveCommitments])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = orderedItems.findIndex(c => c.id === active.id)
    const newIndex = orderedItems.findIndex(c => c.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(orderedItems, oldIndex, newIndex)
    const previous = orderedItems
    setOrderedItems(reordered)

    const order = reordered.map((c, i) => ({ id: c.id, sort_order: i }))
    const res = await fetch('/api/map/commitments/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    })
    if (res.ok) {
      await refreshCommitments()
    } else {
      setOrderedItems(previous)
    }
  }, [orderedItems, refreshCommitments])
  const [archivedCommitments, setArchivedCommitments] = useState<Commitment[]>([])
  const [archivedLoading, setArchivedLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [cadenceJson, setCadenceJson] = useState(CADENCE_OPTIONS[0].value)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const resetFormFields = useCallback(() => {
    setShowForm(false)
    setEditingId(null)
    setTitle('')
    setCategory('')
    setCadenceJson(CADENCE_OPTIONS[0].value)
    setDescription('')
  }, [])

  const startCreate = useCallback(() => {
    resetFormFields()
    setShowForm(true)
  }, [resetFormFields])

  const startEdit = useCallback((c: Commitment) => {
    setShowForm(false)
    setEditingId(c.id)
    setTitle(c.title)
    setCategory(c.category)
    setCadenceJson(cadenceToSelectValue(c.cadence))
    setDescription(c.description ?? '')
  }, [])

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
        resetFormFields()
        router.push('/map')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !title.trim() || !category) return
    setSaving(true)
    try {
      const res = await fetch(`/api/map/commitments/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim() || null,
          cadence: JSON.parse(cadenceJson),
        }),
      })
      if (res.ok) {
        await fetch('/api/map/generate-occurrences', { method: 'POST' })
        await refreshAll()
        resetFormFields()
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

  const archivedGrouped = archivedCommitments.reduce<Record<string, Commitment[]>>((acc, c) => {
    const key = c.category || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const formOpen = showForm || editingId != null

  const addButton = !formOpen ? (
    <Button
      variant="primary"
      size="sm"
      onClick={startCreate}
      className="!px-3 !py-1.5 !text-xs !font-bold shrink-0"
    >
      <Plus className="w-3.5 h-3.5" /> Add
    </Button>
  ) : null

  const content = (
    <Stack gap="lg">
      {showHeader ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Custom Actions</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Personal commitments on your MAP. Archive removes them from Day view; restore anytime.
            </p>
          </div>
          {addButton}
        </div>
      ) : null}

      {showForm && (
        <CustomCommitmentFormCard
          heading="New commitment"
          title={title}
          category={category}
          cadenceJson={cadenceJson}
          description={description}
          saving={saving}
          onTitleChange={setTitle}
          onCategoryChange={setCategory}
          onCadenceChange={setCadenceJson}
          onDescriptionChange={setDescription}
          onSave={handleCreate}
          onCancel={resetFormFields}
          saveLabel="Save commitment"
        />
      )}

      {customActiveCommitments.length === 0 && !formOpen ? (
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-10">
          <p className="text-sm text-neutral-500">No active custom actions. Add your first personal commitment.</p>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={orderedItems.filter(c => c.id !== editingId).map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="rounded-lg bg-black/20 p-2 space-y-2">
              {orderedItems.map((c, index) => {
                const prev = orderedItems[index - 1]
                const catKey = c.category || 'other'
                const showCategoryHeader =
                  index === 0 ||
                  (prev?.category || 'other') !== catKey
                const cat = getVisionCategory(catKey as Parameters<typeof getVisionCategory>[0])
                const categoryHeader = showCategoryHeader ? (cat?.label || catKey) : undefined

                if (editingId === c.id) {
                  return (
                    <div key={c.id}>
                      {categoryHeader && (
                        <p className="text-[10px] text-neutral-600 px-2 py-1">{categoryHeader}</p>
                      )}
                      <CustomCommitmentFormCard
                        heading="Edit commitment"
                        title={title}
                        category={category}
                        cadenceJson={cadenceJson}
                        description={description}
                        saving={saving}
                        onTitleChange={setTitle}
                        onCategoryChange={setCategory}
                        onCadenceChange={setCadenceJson}
                        onDescriptionChange={setDescription}
                        onSave={handleUpdate}
                        onCancel={resetFormFields}
                        saveLabel="Save changes"
                      />
                    </div>
                  )
                }

                return (
                  <SortableCommitmentRow
                    key={c.id}
                    commitment={c}
                    categoryHeader={categoryHeader}
                    hideCategoryLabel
                    updating={updating === c.id}
                    deleteConfirmId={deleteConfirmId}
                    onEdit={() => startEdit(c)}
                    onArchive={() => handleArchive(c.id)}
                    onDeleteRequest={() => setDeleteConfirmId(c.id)}
                    onDeleteConfirm={() => handleDelete(c.id)}
                    onDeleteCancel={() => setDeleteConfirmId(null)}
                  />
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
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
                            <p className="text-sm text-neutral-400">{c.title}</p>
                            <p className="text-[10px] text-neutral-600 truncate">
                              {[formatCommitmentCadence(c.cadence), 'Archived'].filter(Boolean).join(' · ')}
                            </p>
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

  if (embeddedInPlan) {
    return (
      <ToggleSection
        label="Custom"
        color="#FF0080"
        className="lg:col-span-2"
        headerAction={addButton}
      >
        <div className="px-3 pb-3">{content}</div>
      </ToggleSection>
    )
  }

  return content
}

function CustomCommitmentFormCard({
  heading,
  title,
  category,
  cadenceJson,
  description,
  saving,
  onTitleChange,
  onCategoryChange,
  onCadenceChange,
  onDescriptionChange,
  onSave,
  onCancel,
  saveLabel,
}: {
  heading: string
  title: string
  category: string
  cadenceJson: string
  description: string
  saving: boolean
  onTitleChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onCadenceChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  saveLabel: string
}) {
  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
      <Stack gap="md">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{heading}</p>
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-2">Life category</label>
          <div className="flex flex-wrap gap-2">
            {PICKER_CATEGORIES.map(key => {
              const cat = getVisionCategory(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onCategoryChange(key)}
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
            onChange={e => onTitleChange(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50"
            placeholder="e.g., Hit 190g protein"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Cadence</label>
          <Select options={CADENCE_OPTIONS} value={cadenceJson} onChange={onCadenceChange} />
        </div>
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Note (optional)</label>
          <textarea
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-primary-500/50"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving || !title.trim() || !category}>
            {saving ? <Spinner size="sm" /> : saveLabel}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </Stack>
    </Card>
  )
}

interface CommitmentRowProps {
  commitment: Commitment
  updating: boolean
  deleteConfirmId: string | null
  categoryHeader?: string
  hideCategoryLabel?: boolean
  onEdit: () => void
  onArchive: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

function SortableCommitmentRow(props: CommitmentRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.commitment.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      {props.categoryHeader && (
        <p className="text-[10px] text-neutral-600 px-2 py-1">{props.categoryHeader}</p>
      )}
      <CommitmentRow
        {...props}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

function CommitmentRow({
  commitment,
  updating,
  deleteConfirmId,
  hideCategoryLabel = false,
  onEdit,
  onArchive,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  dragHandleProps,
  dragHandleRef,
}: CommitmentRowProps & {
  dragHandleProps?: Record<string, unknown>
  dragHandleRef?: (element: HTMLButtonElement | null) => void
}) {
  const isDeleting = deleteConfirmId === commitment.id
  const cat = getVisionCategory(commitment.category as Parameters<typeof getVisionCategory>[0])
  const cadenceLabel = formatCommitmentCadence(commitment.cadence)
  const metaLine = [
    cadenceLabel,
    !hideCategoryLabel && cat?.label,
  ].filter(Boolean).join(' · ')

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/80">
      {dragHandleProps && (
        <button
          ref={dragHandleRef}
          type="button"
          className="p-0.5 text-neutral-600 hover:text-neutral-400 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{commitment.title}</p>
        {metaLine ? (
          <p className="text-[10px] text-neutral-600 truncate">{metaLine}</p>
        ) : null}
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
            onClick={onEdit}
            disabled={updating}
            className="p-1.5 text-neutral-500 hover:text-primary-400"
            aria-label="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
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
