'use client'

import { useEffect, useState } from 'react'
import { X, Layers, Plus, Check, Loader2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input } from '@/lib/design-system'
import { keys } from '@/lib/query/keys'
import type { KitLayer, KitSlot, ManifestationListItem } from '@/lib/manifestations/types'

interface AddToKitSheetProps {
  isOpen: boolean
  onClose: () => void
  slot: KitSlot
  entityType: string
  entityId: string
  label?: string
  layer?: KitLayer
  /** When pinning from a manifestation itself, exclude it from the picker. */
  excludeId?: string
}

async function fetchManifestations(): Promise<ManifestationListItem[]> {
  const res = await fetch('/api/manifestations')
  if (!res.ok) return []
  const data = await res.json()
  return (data.manifestations || []).filter((m: ManifestationListItem) => m.status === 'active')
}

export function AddToKitSheet({
  isOpen,
  onClose,
  slot,
  entityType,
  entityId,
  label,
  layer,
  excludeId,
}: AddToKitSheetProps) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const { data: allManifestations = [], isLoading } = useQuery({
    queryKey: keys.manifestationKits,
    queryFn: fetchManifestations,
    enabled: isOpen,
  })
  const kits = allManifestations.filter(m => m.id !== excludeId && m.id !== entityId)

  useEffect(() => {
    if (isOpen) {
      setAdded(new Set())
      setShowCreate(false)
      setNewTitle('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const pin = async (kitId: string) => {
    if (adding) return
    setAdding(kitId)
    const res = await fetch(`/api/manifestations/${kitId}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot, entity_type: entityType, entity_id: entityId, layer }),
    })
    if (res.ok) {
      setAdded(prev => new Set(prev).add(kitId))
      void queryClient.invalidateQueries({ queryKey: keys.manifestationKits })
      void queryClient.invalidateQueries({ queryKey: keys.manifestationKit(kitId) })
    }
    setAdding(null)
  }

  const createAndPin = async () => {
    if (!newTitle.trim() || creating) return
    setCreating(true)
    const res = await fetch('/api/manifestations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTitle.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      await pin(data.manifestation.id)
      setShowCreate(false)
    }
    setCreating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      <div className="relative w-full sm:max-w-md bg-[#101010] border border-[#1F1F1F] rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-white">Add to a manifestation</p>
            {label && <p className="text-xs text-neutral-500 mt-0.5 truncate">{label}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>
        ) : (
          <div className="space-y-2">
            {kits.map(kit => (
              <button
                key={kit.id}
                type="button"
                onClick={() => pin(kit.id)}
                disabled={adding === kit.id || added.has(kit.id)}
                className="w-full flex items-center gap-3 rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-3 text-left hover:border-neutral-600"
              >
                <Layers className="w-4 h-4 text-[#39FF14] shrink-0" />
                <span className="flex-1 min-w-0 text-sm text-white truncate">{kit.name}</span>
                {added.has(kit.id) ? (
                  <Check className="w-4 h-4 text-[#39FF14]" />
                ) : adding === kit.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                ) : null}
              </button>
            ))}
          </div>
        )}

        {showCreate ? (
          <div className="mt-4 flex gap-2 items-center">
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Title"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={createAndPin}
              disabled={creating || !newTitle.trim()}
            >
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-4 flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
          >
            <Plus className="w-4 h-4" />
            New manifestation
          </button>
        )}
      </div>
    </div>
  )
}
