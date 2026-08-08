'use client'

/**
 * My Constraints — the member's vibrational constraint ledger.
 *
 * Shows beliefs uncovered in VIVA coaching and their status arc:
 * uncovered → witnessed → flipped → integrated.
 * Quiet, minimal presentation designed for the VIVA drawer.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query/keys'
import { Sparkles, ArrowRight } from 'lucide-react'

interface Constraint {
  id: string
  statement: string
  origin: string | null
  evidence_against: string | null
  flipped_statement: string | null
  category: string | null
  status: 'uncovered' | 'witnessed' | 'flipped' | 'integrated'
  updated_at: string
}

const STATUS_ORDER = ['uncovered', 'witnessed', 'flipped', 'integrated'] as const

const STATUS_LABELS: Record<string, string> = {
  uncovered: 'Uncovered',
  witnessed: 'Witnessed',
  flipped: 'Flipped',
  integrated: 'Integrated',
}

const STATUS_STYLES: Record<string, string> = {
  uncovered: 'text-neutral-400 border-neutral-700',
  witnessed: 'text-cyan-400 border-cyan-900',
  flipped: 'text-[#39FF14] border-green-900',
  integrated: 'text-[#39FF14] border-[#39FF14]/40',
}

async function fetchConstraints(): Promise<Constraint[]> {
  const res = await fetch('/api/viva/constraints')
  if (!res.ok) return []
  const data = await res.json()
  return data.constraints || []
}

export function ConstraintsPanel() {
  const queryClient = useQueryClient()

  const { data: constraints = [], isLoading } = useQuery({
    queryKey: keys.vivaConstraints,
    queryFn: fetchConstraints,
  })

  const advanceStatus = async (constraint: Constraint) => {
    const idx = STATUS_ORDER.indexOf(constraint.status)
    if (idx >= STATUS_ORDER.length - 1) return
    const next = STATUS_ORDER[idx + 1]
    await fetch('/api/viva/constraints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: constraint.id, status: next }),
    })
    queryClient.invalidateQueries({ queryKey: keys.vivaConstraints })
  }

  if (isLoading) {
    return <p className="text-sm text-neutral-500 px-1">Loading your constraints...</p>
  }

  if (constraints.length === 0) {
    return (
      <div className="px-1 py-4">
        <p className="text-sm text-neutral-400">
          No constraints uncovered yet. As you talk with VIVA, limiting beliefs
          that surface will be tracked here — and you&apos;ll watch them dissolve.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {constraints.map(constraint => (
        <div
          key={constraint.id}
          className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-neutral-200 leading-relaxed">
              &ldquo;{constraint.statement}&rdquo;
            </p>
            <span
              className={`shrink-0 text-[11px] uppercase tracking-wide border rounded-full px-2 py-0.5 ${STATUS_STYLES[constraint.status]}`}
            >
              {STATUS_LABELS[constraint.status]}
            </span>
          </div>

          {constraint.flipped_statement && (
            <div className="mt-3 flex items-start gap-2 text-sm text-[#39FF14]/90">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p className="leading-relaxed">&ldquo;{constraint.flipped_statement}&rdquo;</p>
            </div>
          )}

          {constraint.evidence_against && (
            <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
              Evidence: {constraint.evidence_against}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-neutral-600">
              {constraint.category || ''}
            </span>
            {constraint.status !== 'integrated' && (
              <button
                onClick={() => advanceStatus(constraint)}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors duration-300"
              >
                Mark {STATUS_LABELS[STATUS_ORDER[STATUS_ORDER.indexOf(constraint.status) + 1]].toLowerCase()}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
