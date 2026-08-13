'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Link2, Paperclip, StickyNote } from 'lucide-react'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import type { LeExpedition, LessonStatus } from '@/lib/life-explorer/types'

interface LessonLogRow {
  id: string
  lesson_number: number
  title: string
  essential_question: string | null
  status: LessonStatus
  estimated_total_minutes: number | null
  planned_for: string
  started_at: string | null
  completed_at: string | null
  items_total: number
  items_done: number
  media: number
  notes: number
  links: number
}

const STATUS_STYLES: Record<LessonStatus, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-[#00FFFF]/10 text-[#00FFFF]' },
  in_progress: { label: 'In progress', className: 'bg-[#FFFF00]/10 text-[#FFFF00]' },
  completed: { label: 'Completed', className: 'bg-[#39FF14]/10 text-[#39FF14]' },
  skipped: { label: 'Skipped', className: 'bg-neutral-500/10 text-neutral-400' },
}

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function durationLabel(row: LessonLogRow): string | null {
  if (row.started_at && row.completed_at) {
    const mins = Math.max(
      1,
      Math.round((+new Date(row.completed_at) - +new Date(row.started_at)) / 60000)
    )
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`
  }
  if (row.estimated_total_minutes) return `~${row.estimated_total_minutes} min planned`
  return null
}

export default function LessonLogPage() {
  const [expedition, setExpedition] = useState<LeExpedition | null>(null)
  const [lessons, setLessons] = useState<LessonLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/life-explorer/lessons')
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load lessons')
        setExpedition(json.expedition)
        setLessons(json.lessons || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lessons')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  const totalMinutes = lessons.reduce((sum, l) => {
    if (l.started_at && l.completed_at) {
      return sum + Math.round((+new Date(l.completed_at) - +new Date(l.started_at)) / 60000)
    }
    return sum
  }, 0)
  const completedCount = lessons.filter((l) => l.status === 'completed').length

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <Link href="/homeschool/life-explorer" className="text-sm text-neutral-400 hover:text-white">
            ← Today
          </Link>
          <h2 className="text-3xl font-bold text-white mt-3">Lesson Log</h2>
          {expedition && (
            <p className="text-neutral-300 mt-2">
              <span className="capitalize text-[#00FFFF]">{expedition.life_category}</span>
              {' · '}
              {expedition.title}
            </p>
          )}
          {lessons.length > 0 && (
            <p className="text-sm text-neutral-500 mt-2">
              {completedCount} of {lessons.length} lesson{lessons.length === 1 ? '' : 's'} completed
              {totalMinutes > 0 && (
                <>
                  {' · '}
                  {totalMinutes >= 60
                    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                    : `${totalMinutes} min`}{' '}
                  on the clock
                </>
              )}
            </p>
          )}
        </div>

        {error && <p className="text-red-300">{error}</p>}

        {lessons.length === 0 && !error && (
          <div className="rounded-2xl border border-[#222] bg-[#111] p-8 text-center">
            <p className="text-neutral-400">
              No lessons yet — generate your first one from{' '}
              <Link href="/homeschool/life-explorer" className="text-[#39FF14] underline">
                Today
              </Link>
              .
            </p>
          </div>
        )}

        <div className="space-y-3">
          {lessons.map((row) => {
            const badge = STATUS_STYLES[row.status] || STATUS_STYLES.ready
            const duration = durationLabel(row)
            return (
              <Link
                key={row.id}
                href={`/homeschool/life-explorer/lesson/${row.id}`}
                className="block rounded-2xl border border-[#222] bg-[#111] p-5 transition-colors hover:border-[#39FF14]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Lesson {row.lesson_number}
                    </p>
                    <p className="text-white font-semibold mt-0.5">{row.title}</p>
                    {row.essential_question && (
                      <p className="text-sm text-neutral-400 mt-1">{row.essential_question}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-400">
                  <span>{fmtDate(row.planned_for)}</span>
                  {row.started_at && <span>Started {fmtTime(row.started_at)}</span>}
                  {row.completed_at && <span>Finished {fmtTime(row.completed_at)}</span>}
                  {duration && <span className="text-[#00FFFF]">{duration}</span>}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-500">
                  {row.items_total > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <CheckSquare className="h-3.5 w-3.5" />
                      {row.items_done}/{row.items_total} items
                    </span>
                  )}
                  {row.media > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" />
                      {row.media} file{row.media === 1 ? '' : 's'}
                    </span>
                  )}
                  {row.notes > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <StickyNote className="h-3.5 w-3.5" />
                      {row.notes} note{row.notes === 1 ? '' : 's'}
                    </span>
                  )}
                  {row.links > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5" />
                      {row.links} link{row.links === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </Stack>
    </Container>
  )
}
