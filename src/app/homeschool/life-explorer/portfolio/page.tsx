'use client'

import { useEffect, useState } from 'react'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import type { LeLearningEvidence, EvidenceType } from '@/lib/life-explorer/types'

const FILTERS: Array<{ key: EvidenceType | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'photo', label: 'Photos' },
  { key: 'writing', label: 'Writing' },
  { key: 'experiment_record', label: 'Experiments' },
  { key: 'build', label: 'Builds' },
  { key: 'presentation', label: 'Presentations' },
  { key: 'drawing', label: 'Drawings' },
  { key: 'journal', label: 'Journal' },
]

export default function PortfolioPage() {
  const [filter, setFilter] = useState<EvidenceType | 'all'>('all')
  const [items, setItems] = useState<LeLearningEvidence[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const today = await fetch('/api/life-explorer/lessons/today').then((r) => r.json())
        if (!today.student?.id) {
          setItems([])
          return
        }
        setStudentId(today.student.id)
        const url =
          filter === 'all'
            ? `/api/life-explorer/evidence?student_id=${today.student.id}`
            : `/api/life-explorer/evidence?student_id=${today.student.id}&type=${filter}`
        const res = await fetch(url)
        const json = await res.json()
        setItems(json.evidence || [])
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    void load()
  }, [filter])

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <h2 className="text-3xl font-bold text-white">Portfolio</h2>
          <p className="text-neutral-400 mt-2">Evidence of learning — not grades.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-sm border ${
                filter === f.key
                  ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                  : 'border-[#333] text-neutral-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!studentId && (
          <p className="text-amber-200 text-sm">No student yet. Start from Today.</p>
        )}

        <ul className="space-y-3">
          {items.length === 0 && (
            <li className="text-neutral-500 text-sm">No artifacts yet. Record a lesson check-in.</li>
          )}
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-[#222] bg-[#111] p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500 capitalize">
                {item.type.replace(/_/g, ' ')}
              </p>
              <p className="text-white font-medium mt-1">{item.title}</p>
              {item.student_explanation && (
                <p className="text-neutral-300 text-sm mt-2">{item.student_explanation}</p>
              )}
              {item.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photo_url}
                  alt={item.title}
                  className="mt-3 max-h-56 rounded-lg object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      </Stack>
    </Container>
  )
}
