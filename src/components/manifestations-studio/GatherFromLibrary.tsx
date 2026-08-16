'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Spinner } from '@/lib/design-system'
import { SLOT_LABELS } from '@/lib/manifestations/types'
import type { LibraryCandidate } from '@/lib/manifestations/library-candidates'

interface GatherFromLibraryProps {
  kitId: string
  categories: string[]
  query?: string
  onPinned: () => void
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
    const map = new Map<string, LibraryCandidate[]>()
    for (const c of candidates) {
      const list = map.get(c.slot) || []
      list.push(c)
      map.set(c.slot, list)
    }
    return map
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
    for (const c of chosen) {
      await fetch(`/api/manifestations/${kitId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot: c.slot,
          entity_type: c.entity_type,
          entity_id: c.entity_id,
          layer: c.layer,
        }),
      })
    }
    setSaving(false)
    onPinned()
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Spinner /></div>
  }

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center">
        No journal, stories, or board items in these categories yet. You can still add from the manifestation, or keep building in those studios.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {Array.from(grouped.entries()).map(([slot, items]) => (
        <div key={slot} className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 text-center">
            {SLOT_LABELS[slot as keyof typeof SLOT_LABELS] || slot}
          </p>
          <div className="space-y-2">
            {items.map(c => (
              <div
                key={c.entity_id}
                className="rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-3"
              >
                <Checkbox
                  checked={selected.has(c.entity_id)}
                  onCheckedChange={() => toggle(c.entity_id)}
                  label={c.label}
                  labelClassName="truncate"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-center">
        <Button variant="primary" onClick={pinSelected} disabled={saving || selected.size === 0}>
          {saving ? 'Pinning…' : `Pin ${selected.size} to this manifestation`}
        </Button>
      </div>
    </div>
  )
}
