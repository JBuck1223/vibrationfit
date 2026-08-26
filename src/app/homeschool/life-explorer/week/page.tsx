'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Container, Stack, Spinner, Button } from '@/lib/design-system/components'
import type { LeWeekArc, WeekArcDay } from '@/lib/life-explorer/types'

export default function WeekArcPage() {
  const [week, setWeek] = useState<LeWeekArc | null>(null)
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [studentName, setStudentName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  async function load() {
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/week')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load week')
      setWeek(json.week)
      setWeekStart(json.week_start)
      setStudentName(json.student?.name || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function compose() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'VIVA could not compose this week')
      setWeek(json.week)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compose failed')
    } finally {
      setBusy(false)
    }
  }

  async function generateToday() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Generate failed')
      window.location.href = '/homeschool/life-explorer'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generate failed')
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  const days = (week?.days || []) as WeekArcDay[]
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <Link href="/homeschool/life-explorer" className="text-sm text-neutral-400 hover:text-white">
            ← Today
          </Link>
          <h2 className="text-3xl font-bold text-white mt-3">Coming week</h2>
          <p className="text-neutral-400 mt-2">
            Five days sketched ahead by VIVA, from the Life I Choose, the World Map, and where the
            skills stand. Each morning&apos;s Generate fills in the full lesson.
          </p>
          {weekStart && (
            <p className="text-xs text-neutral-500 mt-2">Week of {weekStart}</p>
          )}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => void compose()} disabled={busy}>
            {busy ? 'VIVA is composing…' : week ? 'Recompose this week' : 'Compose this week'}
          </Button>
          {week && (
            <Button variant="secondary" onClick={() => void generateToday()} disabled={generating}>
              {generating ? 'Generating…' : "Generate today's lesson"}
            </Button>
          )}
        </div>

        {days.length === 0 && (
          <p className="text-neutral-500 text-sm">
            No week yet. Compose five unique days for {studentName || 'your explorer'}.
          </p>
        )}

        <div className="space-y-3">
          {days.map((d) => {
            const isToday = d.date === today
            return (
              <div
                key={d.weekday}
                className={`rounded-2xl border p-5 ${
                  isToday ? 'border-[#39FF14]/50 bg-[#39FF14]/5' : 'border-[#222] bg-[#111]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white font-semibold capitalize">
                    {d.weekday}
                    {d.date ? ` · ${d.date}` : ''}
                  </p>
                  {isToday && (
                    <span className="text-[10px] uppercase tracking-wide text-[#39FF14] border border-[#39FF14]/40 rounded-full px-2 py-0.5">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#00FFFF] mt-2">{d.why}</p>
                <p className="text-sm text-neutral-300 mt-2">{d.story_chapter}</p>
                <p className="text-xs text-neutral-500 mt-2">
                  {d.world_taste}
                  {d.mix_next_grade ? ' · next-grade mix earned' : ''}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Hook seed: {d.hook_seed} · Artifact: {d.artifact_seed}
                </p>
              </div>
            )
          })}
        </div>

        {week?.materials && (
          <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
            <p className="text-white font-semibold mb-2">Materials forecast</p>
            <MaterialList label="Plan ahead" items={week.materials.plan_ahead} />
            <MaterialList label="Pantry" items={week.materials.pantry} />
            <MaterialList label="Tonight" items={week.materials.tonight} />
          </div>
        )}
      </Stack>
    </Container>
  )
}

function MaterialList({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null
  return (
    <div className="mb-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">{label}</p>
      <ul className="list-disc pl-5 text-sm text-neutral-300 space-y-1">
        {items.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  )
}
