'use client'

import { useEffect, useState } from 'react'
import { Modal, Button, Input, Spinner } from '@/lib/design-system'
import { SLOT_LABELS, type KitSlot } from '@/lib/manifestations/types'
import type { LibraryCandidate } from '@/lib/manifestations/library-candidates'

const PICKABLE_SLOTS: KitSlot[] = [
  'story', 'incantation', 'spark_query', 'journal', 'vision_board',
  'song', 'abundance', 'project', 'daily_paper', 'dream_destination',
]

interface AddExistingToKitModalProps {
  isOpen: boolean
  onClose: () => void
  kitId: string
  defaultSlot?: KitSlot
  onPinned: () => void
}

export function AddExistingToKitModal({
  isOpen,
  onClose,
  kitId,
  defaultSlot = 'journal',
  onPinned,
}: AddExistingToKitModalProps) {
  const [slot, setSlot] = useState<KitSlot>(defaultSlot)
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<LibraryCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [pinning, setPinning] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) setSlot(defaultSlot)
  }, [isOpen, defaultSlot])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({
      kitId,
      slots: slot,
      q: query,
    })
    fetch(`/api/manifestations/candidates?${params}`)
      .then(res => res.ok ? res.json() : { candidates: [] })
      .then(data => {
        if (!cancelled) setCandidates(data.candidates || [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [isOpen, kitId, slot, query])

  const pin = async (candidate: LibraryCandidate) => {
    setPinning(candidate.entity_id)
    const res = await fetch(`/api/manifestations/${kitId}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot: candidate.slot,
        entity_type: candidate.entity_type,
        entity_id: candidate.entity_id,
        layer: candidate.layer,
      }),
    })
    setPinning(null)
    if (res.ok) {
      onPinned()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to this manifestation">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PICKABLE_SLOTS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                slot === s
                  ? 'bg-[#39FF14]/20 text-white border-[#39FF14]/30'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white hover:border-neutral-500'
              }`}
            >
              {SLOT_LABELS[s]}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search what you already have"
        />
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4 text-center">Nothing matching that yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {candidates.map(c => (
              <div
                key={c.entity_id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{c.label}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{SLOT_LABELS[c.slot]}</p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => pin(c)}
                  disabled={pinning === c.entity_id}
                >
                  {pinning === c.entity_id ? 'Adding…' : 'Add'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
