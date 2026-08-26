'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import type { RungWeather } from '@/lib/life-explorer/ladders'
import {
  checklistState,
  SKILL_GROUP_LABEL,
  SKILL_GROUP_ORDER,
  type CatalogSkill,
  type ChecklistState,
  type SkillGroup,
} from '@/lib/life-explorer/skill-catalog'
import type { SkillStatus } from '@/lib/life-explorer/types'

interface CatalogRow extends CatalogSkill {
  status: SkillStatus | null
  last_observed: string | null
  notes: string | null
}

interface ProgressResponse {
  summary: {
    student_name: string
    expedition_title: string | null
    why_this_matters: string | null
    lessons_this_week: number
    strongest_interest: string | null
    semester: { semester: 1 | 2; aim: string; school_year: string }
    strong: RungWeather[]
    wobbly: RungWeather[]
    math: RungWeather[]
    reading: RungWeather[]
    writing: RungWeather[]
    math_mix: { mix_next_grade: boolean; reason: string }
    reading_mix: { mix_next_grade: boolean; reason: string }
    life_learning: Array<{
      resource: { key: string; name: string; job: string }
      rung: { key: string; label: string }
      band: 'strong' | 'wobbly' | 'untouched'
      secured_count: number
      total_rungs: number
    }>
  } | null
  catalog?: CatalogRow[]
  ledger: {
    state_name: string
    statute: string
    grade_label: string
    areas: Array<{
      label: string
      family: string
      level: 'green' | 'thin' | 'untouched'
      weather: string
    }>
    sequentially_progressive: boolean
  } | null
  readiness?: {
    grade: number
    subjects: Array<{
      key: string
      label: string
      total_codes: number
      secure_codes: number
      touched_codes: number
    }>
  } | null
  evaluation?: { anniversary: string; days_remaining: number } | null
}

function nextStatus(state: ChecklistState): SkillStatus {
  if (state === 'empty') return 'secure'
  if (state === 'needs_more') return 'developing'
  return 'needs_support'
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressResponse | null>(null)
  const [catalog, setCatalog] = useState<CatalogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/life-explorer/progress')
        const json = await res.json()
        setData(json)
        setCatalog(json.catalog || [])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function toggleSkill(row: CatalogRow) {
    const state = checklistState(row.status)
    const status = nextStatus(state)
    setBusyKey(row.key)
    setCatalog((prev) =>
      prev.map((item) =>
        item.key === row.key
          ? { ...item, status, last_observed: new Date().toISOString().slice(0, 10) }
          : item
      )
    )
    try {
      const res = await fetch('/api/life-explorer/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: row.key, status }),
      })
      if (!res.ok) {
        setCatalog((prev) => prev.map((item) => (item.key === row.key ? row : item)))
      }
    } catch {
      setCatalog((prev) => prev.map((item) => (item.key === row.key ? row : item)))
    } finally {
      setBusyKey(null)
    }
  }

  const grouped = useMemo(() => {
    const byGroup = new Map<SkillGroup, CatalogRow[]>()
    for (const group of SKILL_GROUP_ORDER) byGroup.set(group, [])
    for (const row of catalog) {
      const list = byGroup.get(row.group) || []
      list.push(row)
      byGroup.set(row.group, list)
    }
    return SKILL_GROUP_ORDER.map((group) => ({
      group,
      label: SKILL_GROUP_LABEL[group],
      rows: byGroup.get(group) || [],
    })).filter((block) => block.rows.length > 0)
  }, [catalog])

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  const s = data?.summary
  if (!s) {
    return (
      <Container size="md" className="py-16">
        <p className="text-neutral-400">No explorer yet. Start from Today.</p>
      </Container>
    )
  }

  return (
    <Container size="lg" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#39FF14]/80 mb-2">Progress</p>
          <h2 className="text-3xl font-bold text-white">{s.student_name}</h2>
          <p className="text-neutral-400 mt-2">
            The master list. Finishing a day marks skills practiced. Tap a box to mark it won,
            or to say it still needs more.
          </p>
          {s.why_this_matters && (
            <p className="text-sm text-[#00FFFF] mt-3">{s.why_this_matters}</p>
          )}
        </div>

        <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
            {s.semester.school_year} · Semester {s.semester.semester}
          </p>
          <p className="text-neutral-200">{s.semester.aim}</p>
          <p className="text-xs text-neutral-500 mt-2">
            Math — {s.math_mix.reason} Reading — {s.reading_mix.reason}
          </p>
        </div>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Master list</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Empty box is unpracticed. Half-mark is practiced from a finished day. Green is won.
                Amber means it still needs more. You can override any box.
              </p>
            </div>
            <Legend />
          </div>
          <div className="space-y-8">
            {grouped.map((block) => (
              <div key={block.group}>
                <h4 className="text-xs uppercase tracking-[0.16em] text-neutral-500 mb-2">
                  {block.label}
                </h4>
                <ul className="divide-y divide-[#1d1d1d] rounded-2xl border border-[#222] bg-[#111]">
                  {block.rows.map((row) => (
                    <SkillRow
                      key={row.key}
                      row={row}
                      busy={busyKey === row.key}
                      onToggle={() => void toggleSkill(row)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {data?.readiness && (
          <section className="rounded-2xl border border-[#222] bg-[#111] p-5">
            <h3 className="text-lg font-semibold text-white mb-1">Evaluation readiness</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Grade-{data.readiness.grade} Florida benchmarks, derived from lived lessons, the
              master list, and mastery checks. You can override any skill above.
              {data.evaluation && (
                <>
                  {' '}
                  Annual evaluation lands around{' '}
                  <span className="text-neutral-300">{data.evaluation.anniversary}</span> —{' '}
                  {data.evaluation.days_remaining} days from now.
                </>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.readiness.subjects.map((sub) => {
                const pct =
                  sub.total_codes > 0
                    ? Math.round((sub.touched_codes / sub.total_codes) * 100)
                    : 0
                return (
                  <div key={sub.key} className="rounded-xl border border-[#2a2a2a] p-3">
                    <p className="text-white text-sm font-medium">{sub.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {sub.secure_codes} solid · {sub.touched_codes} of {sub.total_codes} touched
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-[#222] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#39FF14]/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {data?.ledger && (
          <section className="rounded-2xl border border-[#222] bg-[#111] p-5">
            <h3 className="text-lg font-semibold text-white mb-1">Florida ledger</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Built from lessons, evidence, the activity log, and the master list.{' '}
              {data.ledger.sequentially_progressive
                ? 'The record shows sequential progress year over year.'
                : 'The record will show sequential progress as skills become solid.'}{' '}
              <Link href="/homeschool/life-explorer/map?tab=reports" className="text-[#00FFFF] hover:underline">
                Reports
              </Link>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.ledger.areas.map((a) => (
                <div key={a.label} className="rounded-xl border border-[#2a2a2a] p-3">
                  <p className="text-white text-sm font-medium">{a.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{a.family}</p>
                  <p
                    className={`text-xs mt-2 ${
                      a.level === 'green'
                        ? 'text-[#39FF14]'
                        : a.level === 'thin'
                          ? 'text-amber-300'
                          : 'text-neutral-500'
                    }`}
                  >
                    {a.weather}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-600 mt-4">
              {data.ledger.state_name} · {data.ledger.statute}
            </p>
          </section>
        )}

        <p className="text-sm text-neutral-500">
          {s.lessons_this_week} lesson{s.lessons_this_week === 1 ? '' : 's'} logged this week
          {s.strongest_interest ? ` · strongest pull: “${s.strongest_interest}”` : ''}
        </p>
      </Stack>
    </Container>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-neutral-500">
      <span className="inline-flex items-center gap-1.5">
        <Box state="empty" /> Empty
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Box state="practiced" /> Practiced
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Box state="won" /> Won
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Box state="needs_more" /> Needs more
      </span>
    </div>
  )
}

function SkillRow({
  row,
  busy,
  onToggle,
}: {
  row: CatalogRow
  busy: boolean
  onToggle: () => void
}) {
  const state = checklistState(row.status)
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03] disabled:opacity-60"
      >
        <Box state={state} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-neutral-100">{row.label}</span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            {state === 'empty' && 'Tap to mark won'}
            {state === 'practiced' && 'Practiced from a finished day — tap if it still needs more'}
            {state === 'won' && 'Won — tap if it still needs more'}
            {state === 'needs_more' && 'Needs more — tap to mark practiced again'}
            {row.last_observed ? ` · ${row.last_observed}` : ''}
            {row.notes ? ` · ${row.notes}` : ''}
          </span>
        </span>
      </button>
    </li>
  )
}

function Box({ state }: { state: ChecklistState }) {
  const mark =
    state === 'won' ? (
      <span className="block h-2 w-2 rounded-[1px] bg-[#39FF14]" />
    ) : state === 'practiced' ? (
      <span className="block h-2 w-2 rounded-[1px] bg-[#39FF14]/40" />
    ) : state === 'needs_more' ? (
      <span className="block h-0.5 w-2.5 bg-amber-300" />
    ) : null

  return (
    <span
      aria-hidden
      className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border ${
        state === 'won'
          ? 'border-[#39FF14] bg-[#39FF14]/15'
          : state === 'practiced'
            ? 'border-[#39FF14]/50'
            : state === 'needs_more'
              ? 'border-amber-300/70'
              : 'border-neutral-500'
      }`}
    >
      {mark}
    </span>
  )
}
