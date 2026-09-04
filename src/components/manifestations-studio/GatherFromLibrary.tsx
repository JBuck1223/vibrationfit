'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox, Spinner } from '@/lib/design-system'
import {
  DESTINATION_META,
  SLOT_DESTINATIONS,
  SLOT_LABELS,
  type KitSlot,
  type SlotDestination,
} from '@/lib/manifestations/types'
import type { LibraryCandidate } from '@/lib/manifestations/library-candidates'

export interface GatherPinResult {
  pinned: number
  failed: number
  destinations: SlotDestination[]
}

interface GatherFromLibraryProps {
  kitId: string
  categories: string[]
  query?: string
  onPinned: (result: GatherPinResult) => void
}

const DESTINATION_ORDER: SlotDestination[] = ['essence', 'journey', 'living', 'action']

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function GatherFromLibrary({ kitId, categories, query = '', onPinned }: GatherFromLibraryProps) {
  const [candidates, setCandidates] = useState<LibraryCandidate[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({
      kitId,
      categories: categories.join(','),
      q: query,
    })
    fetch(`/api/manifestations/candidates?${params}`)
      .then(res => res.ok ? res.json() : { candidates: [] })
      .then(data => {
        if (cancelled) return
        const list: LibraryCandidate[] = data.candidates || []
        setCandidates(list)
        setSelected(new Set(list.map(c => c.entity_id)))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [kitId, categories, query])

  const grouped = useMemo(() => {
    const map = new Map<SlotDestination, LibraryCandidate[]>()
    for (const dest of DESTINATION_ORDER) map.set(dest, [])
    for (const c of candidates) {
      const dest = SLOT_DESTINATIONS[c.slot as KitSlot] || 'living'
      map.get(dest)?.push(c)
    }
    return DESTINATION_ORDER
      .map(dest => ({ dest, items: map.get(dest) || [] }))
      .filter(group => group.items.length > 0)
  }, [candidates])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pinSelected = async () => {
    const chosen = candidates.filter(c => selected.has(c.entity_id))
    if (chosen.length === 0) return
    setSaving(true)
    try {
      const res = await fetch(`/api/manifestations/${kitId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: chosen.map(c => ({
            slot: c.slot,
            entity_type: c.entity_type,
            entity_id: c.entity_id,
            layer: c.layer,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      const pinnedCount = Array.isArray(data.pinned) ? data.pinned.length : (res.ok ? chosen.length : 0)
      const failedRows = Array.isArray(data.failed) ? data.failed as Array<{ entity_id: string }> : []
      const failedCount = failedRows.length || (res.ok ? 0 : chosen.length)

      if (pinnedCount === 0) {
        toast.error(data.error || 'Could not add those to this manifestation. Try again.')
        return
      }

      const failedIds = new Set(failedRows.map(f => f.entity_id))
      const destinations = Array.from(new Set(
        chosen
          .filter(c => !failedIds.has(c.entity_id))
          .map(c => SLOT_DESTINATIONS[c.slot as KitSlot] || 'living'),
      )) as SlotDestination[]

      onPinned({ pinned: pinnedCount, failed: failedCount, destinations })
    } catch {
      toast.error('Could not add those to this manifestation. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Spinner /></div>
  }

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center">
        Nothing in your library matches this desire yet. Write a journal entry, a story, or keep building in VIVA — then gather again.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-300 text-center max-w-xl mx-auto">
        These already live in your world and belong to this desire. Add them and they land on this page — not in a hidden pile.
      </p>
      {grouped.map(({ dest, items }) => {
        const meta = DESTINATION_META[dest]
        return (
          <div key={dest} className="space-y-2">
            <div className="text-center space-y-0.5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#D46BFF]">
                Goes to {meta.title}
              </p>
              <p className="text-xs text-neutral-500">{meta.hint}</p>
            </div>
            <div className="space-y-2">
              {items.map(c => {
                const dateLabel = formatDate(c.date)
                return (
                  <div
                    key={`${c.slot}-${c.entity_id}`}
                    className="rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-3"
                  >
                    <Checkbox
                      checked={selected.has(c.entity_id)}
                      onCheckedChange={() => toggle(c.entity_id)}
                      label={c.label}
                      labelClassName="truncate"
                    />
                    <p className="pl-9 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      {SLOT_LABELS[c.slot as KitSlot] || c.slot}
                      {dateLabel ? ` · ${dateLabel}` : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <div className="flex flex-col items-center gap-2">
        <Button variant="primary" type="button" onClick={pinSelected} disabled={saving || selected.size === 0}>
          {saving
            ? 'Adding…'
            : `Add ${selected.size} to this manifestation`}
        </Button>
        <p className="text-xs text-neutral-500 text-center">
          Journal and wins go to The Journey. Stories and songs show under Living it. Life Vision feeds The Essence.
        </p>
      </div>
    </div>
  )
}
