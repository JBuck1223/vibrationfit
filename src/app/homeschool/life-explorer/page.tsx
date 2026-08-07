'use client'

import { useCallback, useEffect, useState, startTransition } from 'react'
import Link from 'next/link'
import {
  Container,
  Stack,
  Button,
  Spinner,
} from '@/lib/design-system/components'
import type { LeExpedition, LeLesson, LeStudent, LessonPayload } from '@/lib/life-explorer/types'

interface TodayResponse {
  student: LeStudent | null
  expedition: LeExpedition | null
  lesson: LeLesson | null
  needs_seed?: boolean
  error?: string
}

export default function LifeExplorerTodayPage() {
  const [data, setData] = useState<TodayResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/lessons/today')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      startTransition(() => setData(json))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function seedAndGenerate() {
    setBusy('seed')
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate_lesson: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Seed failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seed failed')
    } finally {
      setBusy(null)
    }
  }

  async function generateLesson() {
    setBusy('generate')
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: data?.student?.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Generate failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generate failed')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  const lesson = data?.lesson
  const payload = (lesson?.payload || null) as LessonPayload | null
  const time = payload?.time_summary

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <p className="text-sm text-neutral-400 mb-2">Today</p>
          {data?.expedition ? (
            <>
              <p className="text-[#00FFFF] text-sm mb-1 capitalize">
                {data.expedition.life_category} · {data.expedition.title}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {lesson?.title || 'Ready for a new lesson'}
              </h2>
              {lesson?.essential_question && (
                <p className="mt-3 text-neutral-300 text-lg">{lesson.essential_question}</p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Start Life Explorer
              </h2>
              <p className="mt-3 text-neutral-300">
                Seed Oliver’s first expedition: Travel → Antarctica. Ocean Adventures stays as a finished static unit.
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!data?.expedition && (
          <Button onClick={seedAndGenerate} disabled={busy !== null} variant="primary" size="lg">
            {busy === 'seed' ? 'Setting up…' : 'Start Antarctica Expedition'}
          </Button>
        )}

        {data?.expedition && !lesson && (
          <Button onClick={generateLesson} disabled={busy !== null} variant="primary" size="lg">
            {busy === 'generate' ? 'Generating…' : 'Generate Today’s Lesson'}
          </Button>
        )}

        {lesson && time && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <SummaryChip label="Prep" value={`${time.prep_minutes} min`} />
            <SummaryChip label="Lesson" value={`${time.lesson_minutes} min`} />
            <SummaryChip label="Reading" value={`${time.reading_minutes} min`} />
            <SummaryChip label="Foundational" value={`${time.foundational_minutes} min`} />
            <SummaryChip label="Experiment" value={time.has_experiment ? 'Yes' : 'No'} />
            <SummaryChip label="Journal" value={time.has_journal ? 'Yes' : 'No'} />
          </div>
        )}

        {lesson && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <ButtonLink href={`/homeschool/life-explorer/lesson/${lesson.id}`} primary>
              Start Lesson
            </ButtonLink>
            <ButtonLink href="/homeschool/life-explorer/resources">
              Open Resources
            </ButtonLink>
            <ButtonLink href={`/homeschool/life-explorer/record?lesson_id=${lesson.id}`}>
              Record What Happened
            </ButtonLink>
            <ButtonLink href="/homeschool/life-explorer/change">Change Direction</ButtonLink>
            <ButtonLink href="/homeschool/life-explorer/wonder">Wonder Wall</ButtonLink>
          </div>
        )}

        {data?.student && (
          <p className="text-xs text-neutral-500">
            Learning with {data.student.name}
            {data.student.grade_level ? ` · Grade ${data.student.grade_level}` : ''}
            {data.student.current_age ? ` · Age ${data.student.current_age}` : ''}
          </p>
        )}
      </Stack>
    </Container>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#121212] px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-white font-medium mt-1">{value}</p>
    </div>
  )
}

function ButtonLink({
  href,
  children,
  primary,
}: {
  href: string
  children: React.ReactNode
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? 'inline-flex items-center justify-center rounded-xl bg-[#39FF14] px-5 py-3 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors'
          : 'inline-flex items-center justify-center rounded-xl border border-[#333] px-5 py-3 text-sm font-medium text-neutral-200 hover:border-[#39FF14]/40 hover:text-white transition-colors'
      }
    >
      {children}
    </Link>
  )
}
