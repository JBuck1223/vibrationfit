'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { ExpeditionDashboard } from '@/components/life-explorer/ExpeditionDashboard'
import { ExpeditionPath } from '@/components/life-explorer/ExpeditionPath'
import type { ExpeditionStatus } from '@/lib/life-explorer/types'
import type { ExpeditionSequence } from '@/lib/life-explorer/sequence'

interface ExpeditionRow {
  id: string
  title: string
  status: ExpeditionStatus
  start_date: string
  why_this_matters: string | null
  lessons_total: number
  lessons_completed: number
  last_activity: string | null
  media_count: number
  sequence?: ExpeditionSequence
}

const STATUS: Record<ExpeditionStatus, { label: string; className: string }> = {
  active: { label: 'Now', className: 'bg-[#39FF14]/10 text-[#39FF14]' },
  paused: { label: 'Paused', className: 'bg-[#FFFF00]/10 text-[#FFFF00]' },
  completed: { label: 'Completed', className: 'bg-[#00FFFF]/10 text-[#00FFFF]' },
}

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ExpeditionsPage() {
  const [expeditions, setExpeditions] = useState<ExpeditionRow[]>([])
  const [studentName, setStudentName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [expRes, todayRes] = await Promise.all([
          fetch('/api/life-explorer/expeditions'),
          fetch('/api/life-explorer/lessons/today'),
        ])
        const expJson = await expRes.json()
        const todayJson = await todayRes.json().catch(() => ({}))
        if (!expRes.ok) throw new Error(expJson.error || 'Failed to load expeditions')
        setExpeditions(expJson.expeditions || [])
        setStudentName(todayJson.student?.name || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expeditions')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const ordered = useMemo(() => {
    const active = expeditions.filter((e) => e.status === 'active')
    const rest = expeditions.filter((e) => e.status !== 'active')
    return [...active, ...rest]
  }, [expeditions])
  const current = ordered.find((e) => e.status === 'active') || null
  const earlier = ordered.filter((e) => e.id !== current?.id)

  if (loading) {
    return (
      <Container size="lg" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  return (
    <Container size="lg" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#39FF14]/80 mb-2">Expeditions</p>
          <h2 className="text-3xl font-bold text-white">The path so far</h2>
          <p className="text-neutral-400 mt-2 max-w-2xl">
            One world at a time. Read it top to bottom: where you are now, then every world already
            lived. Tap a day to open it.
          </p>
        </div>

        {error && <p className="text-red-300">{error}</p>}

        {expeditions.length === 0 && !error && (
          <div className="rounded-2xl border border-[#222] bg-[#111] p-8 text-center">
            <p className="text-neutral-400">
              No expeditions yet — start the first one from{' '}
              <Link href="/homeschool/life-explorer" className="text-[#39FF14] underline">
                Today
              </Link>
              .
            </p>
          </div>
        )}

        {current?.sequence && (
          <ExpeditionDashboard
            studentName={studentName}
            expeditionTitle={current.title}
            expeditionId={current.id}
            why={current.why_this_matters}
            sequence={current.sequence}
            primaryHref={`/homeschool/life-explorer/expeditions/${current.id}?day=${current.sequence.current_day}`}
            primaryLabel="Open this expedition"
          />
        )}

        {earlier.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              Earlier worlds
            </p>
            <ol className="relative space-y-4 border-l border-[#2a2a2a] pl-6">
              {earlier.map((e) => {
                const badge = STATUS[e.status] || STATUS.paused
                return (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-[#444] bg-[#0a0a0a]" />
                    <Link
                      href={`/homeschool/life-explorer/expeditions/${e.id}`}
                      className="block rounded-2xl border border-[#222] bg-[#111] p-5 transition-colors hover:border-[#39FF14]/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Compass className="h-4 w-4 shrink-0 text-neutral-500" />
                            <p className="truncate font-semibold text-white">{e.title}</p>
                          </div>
                          {e.why_this_matters && (
                            <p className="mt-1.5 text-sm text-neutral-400">{e.why_this_matters}</p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      {e.sequence && e.sequence.steps.length > 0 && (
                        <div className="mt-4">
                          <ExpeditionPath sequence={e.sequence} expeditionId={e.id} size="sm" />
                        </div>
                      )}
                      <p className="mt-3 text-xs text-neutral-500">
                        Started {fmtDate(e.start_date)}
                        {e.sequence
                          ? ` · Day ${e.sequence.current_day} of ${e.sequence.total_days}`
                          : e.lessons_total === 0
                            ? ' · No days yet'
                            : ` · ${e.lessons_completed} of ${e.lessons_total} days`}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </Stack>
    </Container>
  )
}
