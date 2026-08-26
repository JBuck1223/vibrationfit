'use client'

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { ensureJpegCompatible } from '@/lib/life-explorer/ensure-jpeg'
import type {
  LeExpedition,
  LeLesson,
  LeLessonRecord,
  LeStudent,
  LeWonderItem,
  LessonPayload,
  SteerDirection,
} from '@/lib/life-explorer/types'
import type { ExpeditionSequence } from '@/lib/life-explorer/sequence'
import { ExpeditionDashboard } from '@/components/life-explorer/ExpeditionDashboard'
import { FacilitatorGuide } from '@/components/life-explorer/FacilitatorGuide'

interface Chapter {
  id: string
  title: string
  essential_question: string | null
  lesson_number: number
  planned_for: string
  status: string
}

interface TodayResponse {
  student: LeStudent | null
  expedition: LeExpedition | null
  lesson: LeLesson | null
  wonder_wall?: { know: LeWonderItem[]; wonder: LeWonderItem[]; learned: LeWonderItem[] }
  latest_record?: LeLessonRecord | null
  chapters?: Chapter[]
  sequence?: ExpeditionSequence | null
  activity_logged_today?: boolean
  needs_seed?: boolean
  error?: string
}

interface Forecast {
  expedition_title: string | null
  plan_ahead: string[]
  pantry: string[]
  tonight: string[]
}

type Spotlight =
  | { kind: 'choose' }
  | { kind: 'build_wall' }
  | { kind: 'start_adventure' }
  | { kind: 'resume_lesson'; lesson: LeLesson }
  | { kind: 'log_calendar'; lessonTitle?: string }
  | { kind: 'done' }

export default function ExpeditionHomePage() {
  const [data, setData] = useState<TodayResponse | null>(null)
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [showForecast, setShowForecast] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/lessons/today')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      startTransition(() => setData(json))
      void fetch('/api/life-explorer/forecast')
        .then((r) => r.json())
        .then((f) => setForecast(f.forecast || null))
        .catch(() => null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function post(url: string, body: Record<string, unknown>, busyKey: string) {
    setBusy(busyKey)
    setError(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Request failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(null)
    }
  }

  const expedition = data?.expedition || null
  const wall = data?.wonder_wall
  const chapters = useMemo(() => data?.chapters || [], [data])
  const completedChapters = useMemo(
    () => chapters.filter((c) => c.status === 'completed'),
    [chapters]
  )
  const skippedChapters = useMemo(
    () => chapters.filter((c) => c.status === 'skipped'),
    [chapters]
  )
  const openWonders = useMemo(
    () => (wall?.wonder || []).filter((w) => w.status !== 'answered'),
    [wall]
  )

  const spotlight: Spotlight = useMemo(() => {
    if (!expedition) return { kind: 'choose' }
    const wallEmpty = (wall?.know.length || 0) === 0 && (wall?.wonder.length || 0) === 0
    if (wallEmpty) return { kind: 'build_wall' }
    if (data?.lesson) return { kind: 'resume_lesson', lesson: data.lesson }
    const today = new Date().toISOString().slice(0, 10)
    const doneToday = chapters.find((c) => c.planned_for === today && c.status === 'completed')
    if (data?.activity_logged_today) return { kind: 'done' }
    if (doneToday) return { kind: 'log_calendar', lessonTitle: doneToday.title }
    // Lesson may still be in progress/skipped elsewhere — nudge logging if the day has learning without a log.
    if (chapters.some((c) => c.planned_for === today)) {
      return { kind: 'log_calendar' }
    }
    return { kind: 'start_adventure' }
  }, [expedition, wall, data, chapters])

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  return (
    <Container size="lg" className="py-10 md:py-14">
      <Stack gap="lg">
        {expedition && data?.sequence && data.sequence.total_days > 0 ? (
          <ExpeditionDashboard
            studentName={data.student?.name}
            expeditionTitle={expedition.title}
            expeditionId={expedition.id}
            why={expedition.why_this_matters}
            sequence={data.sequence}
            primaryHref={
              data.lesson
                ? `/homeschool/life-explorer/lesson/${data.lesson.id}`
                : `/homeschool/life-explorer/expeditions/${expedition.id}?day=${data.sequence.current_day}`
            }
            primaryLabel={data.lesson ? "Open today's adventure" : 'View this expedition'}
          />
        ) : (
          <div>
            {expedition ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#39FF14]/80 mb-1.5">
                  Current expedition
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  {expedition.title}
                </h2>
              </>
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  Start Life Explorer
                </h2>
                <p className="mt-3 text-neutral-300">
                  Every expedition starts with curiosity. Choose where to explore first.
                </p>
              </>
            )}
          </div>
        )}

        {data?.sequence?.guide && <FacilitatorGuide guide={data.sequence.guide} />}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* The vision is the root of every composed day — nudge until it exists. */}
        {data?.student && !data.student.life_i_choose && (
          <div className="rounded-2xl border border-[#00FFFF]/30 bg-[#00FFFF]/5 px-4 py-3">
            <p className="text-sm text-neutral-200">
              {data.student.name}&apos;s Life I Choose isn&apos;t written yet. Fill out the
              current-state profile and VIVA will draft it — then he makes it his.{' '}
              <Link
                href="/homeschool/life-explorer/vision"
                className="text-[#00FFFF] hover:underline"
              >
                Start here
              </Link>
            </p>
          </div>
        )}

        {/* Next-step spotlight — always answers "what do we do right now?" */}
        <SpotlightCard
          spotlight={spotlight}
          busy={busy}
          onSeed={() => post('/api/life-explorer/seed', { generate_lesson: true }, 'seed')}
          onGenerate={() =>
            post('/api/life-explorer/lessons/generate', { student_id: data?.student?.id }, 'generate')
          }
        />

        {/* Morning Appreciation — the kids' version of the VF practice */}
        {expedition && data?.student && (
          <MorningAppreciationCard
            studentId={data.student.id}
            studentName={data.student.name}
          />
        )}

        {/* Steer the expedition — the lead explorer's console */}
        {expedition && (wall?.know.length || 0) + (wall?.wonder.length || 0) > 0 && (
          <SteerPanel
            expedition={expedition}
            openWonders={openWonders}
            hasReadyLesson={!!data?.lesson}
            busy={busy}
            onQueueChange={(queue) =>
              post('/api/life-explorer/steer', { expedition_id: expedition.id, queue }, 'queue')
            }
            onDirection={(direction) =>
              post('/api/life-explorer/steer', { expedition_id: expedition.id, direction }, 'direction')
            }
            onRegenerate={() =>
              post('/api/life-explorer/lessons/regenerate', { student_id: data?.student?.id }, 'regenerate')
            }
          />
        )}

        {/* Story so far — chapters, not numbered days */}
        {(completedChapters.length > 0 || skippedChapters.length > 0) && (
          <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              This expedition
            </p>
            <p className="text-white font-semibold mb-1">The story so far</p>
            <p className="text-sm text-neutral-500 mb-4">
              Tap a chapter to revisit the lesson and what happened
              {expedition && (
                <>
                  {' — or open the '}
                  <Link
                    href={`/homeschool/life-explorer/expeditions/${expedition.id}`}
                    className="text-[#00FFFF] hover:underline"
                  >
                    full expedition record
                  </Link>
                </>
              )}
              .
            </p>
            <ol className="space-y-2">
              {completedChapters.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/homeschool/life-explorer/lesson/${c.id}`}
                    className="flex items-start gap-3 rounded-xl border border-[#2a2a2a] px-4 py-3 hover:border-[#39FF14]/40 transition-colors"
                  >
                    <span className="mt-0.5 text-[#39FF14]">●</span>
                    <span className="min-w-0">
                      <span className="block text-white text-sm font-medium">{c.title}</span>
                      {c.essential_question && (
                        <span className="block text-xs text-neutral-500 mt-0.5">
                          {c.essential_question}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            {skippedChapters.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                  Saved for another day
                </p>
                <ul className="space-y-2">
                  {skippedChapters.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/homeschool/life-explorer/lesson/${c.id}`}
                        className="flex items-start gap-3 rounded-xl border border-dashed border-[#2a2a2a] px-4 py-3 hover:border-[#39FF14]/40 transition-colors"
                      >
                        <span className="mt-0.5 text-neutral-600">○</span>
                        <span className="text-sm text-neutral-300">{c.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Weekly Materials Forecast + weekly packet */}
        {forecast && (forecast.plan_ahead.length > 0 || forecast.tonight.length > 0) && (
          <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">This week</p>
            <button
              type="button"
              onClick={() => setShowForecast((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="text-white font-semibold">This Week&apos;s Materials</p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Gather once on Sunday — no 8am ambushes.
                </p>
              </div>
              <span className="text-neutral-400 text-sm">{showForecast ? 'Hide' : 'Show'}</span>
            </button>
            {forecast.tonight.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-amber-300 mb-1">Tonight</p>
                <ul className="text-sm text-amber-100 space-y-1">
                  {forecast.tonight.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {showForecast && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Gather / buy ahead
                  </p>
                  <ul className="text-neutral-300 space-y-1 list-disc pl-5">
                    {forecast.plan_ahead.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Pantry staples this expedition uses
                  </p>
                  <ul className="text-neutral-400 space-y-1 list-disc pl-5">
                    {forecast.pantry.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/api/life-explorer/print/week"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-[#333] px-4 py-2 text-xs font-medium text-neutral-200 hover:border-[#39FF14]/40 hover:text-white transition-colors"
              >
                Print this week&apos;s packet
              </a>
              <a
                href="/api/life-explorer/print/kit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-[#333] px-4 py-2 text-xs font-medium text-neutral-400 hover:border-[#39FF14]/40 hover:text-white transition-colors"
              >
                Expedition Kit
              </a>
            </div>
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

/* ————— Next-step spotlight ————— */

function SpotlightCard({
  spotlight,
  busy,
  onSeed,
  onGenerate,
}: {
  spotlight: Spotlight
  busy: string | null
  onSeed: () => void
  onGenerate: () => void
}) {
  const base =
    'rounded-2xl border-2 border-[#39FF14]/60 bg-gradient-to-br from-[#0d1a0d] to-[#111] p-6 md:p-8'

  if (spotlight.kind === 'choose') {
    return (
      <div className={base}>
        <p className="text-xs uppercase tracking-wide text-[#39FF14] mb-2">Next step</p>
        <h3 className="text-2xl font-bold text-white">Choose an expedition</h3>
        <p className="mt-2 text-neutral-300">
          First stop: Antarctica. The coldest place on Earth needs explorers.
        </p>
        <button
          onClick={onSeed}
          disabled={busy !== null}
          className="mt-5 inline-flex items-center rounded-xl bg-[#39FF14] px-6 py-3 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors disabled:opacity-60"
        >
          {busy === 'seed' ? 'Setting up…' : 'Start Antarctica Expedition'}
        </button>
      </div>
    )
  }

  if (spotlight.kind === 'build_wall') {
    return (
      <div className={base}>
        <p className="text-xs uppercase tracking-wide text-[#39FF14] mb-2">Next step</p>
        <h3 className="text-2xl font-bold text-white">Build the Wonder Wall</h3>
        <p className="mt-2 text-neutral-300">
          Read the launch story together, then capture what your explorer already knows and
          wonders — sticky notes on a real wall, their exact words. Snap a photo when it&apos;s up.
        </p>
        <Link
          href="/homeschool/life-explorer/wonder"
          className="mt-5 inline-flex items-center rounded-xl bg-[#39FF14] px-6 py-3 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors"
        >
          Open the Wonder Wall
        </Link>
      </div>
    )
  }

  if (spotlight.kind === 'start_adventure') {
    return (
      <div className={base}>
        <p className="text-xs uppercase tracking-wide text-[#39FF14] mb-2">Next step</p>
        <h3 className="text-2xl font-bold text-white">Start today&apos;s adventure</h3>
        <p className="mt-2 text-neutral-300">
          A fresh lesson, composed right now from the Wonder Wall and your steer below.
        </p>
        <button
          onClick={onGenerate}
          disabled={busy !== null}
          className="mt-5 inline-flex items-center rounded-xl bg-[#39FF14] px-6 py-3 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors disabled:opacity-60"
        >
          {busy === 'generate' ? 'Composing…' : 'Generate Today’s Lesson'}
        </button>
      </div>
    )
  }

  if (spotlight.kind === 'resume_lesson') {
    const lesson = spotlight.lesson
    const payload = (lesson.payload || null) as LessonPayload | null
    const time = payload?.time_summary
    return (
      <div className={base}>
        <p className="text-xs uppercase tracking-wide text-[#39FF14] mb-2">
          Today&apos;s adventure
        </p>
        <h3 className="text-2xl font-bold text-white">{lesson.title}</h3>
        {lesson.essential_question && (
          <p className="mt-2 text-neutral-300">{lesson.essential_question}</p>
        )}
        {time && (
          <p className="mt-3 text-xs text-neutral-500">
            {time.prep_minutes} min prep · {time.lesson_minutes} min lesson
            {time.has_experiment ? ' · experiment' : ''}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/homeschool/life-explorer/lesson/${lesson.id}`}
            className="inline-flex items-center rounded-xl bg-[#39FF14] px-6 py-3 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors"
          >
            {lesson.status === 'in_progress' ? 'Resume Lesson' : 'Start Lesson'}
          </Link>
          <Link
            href="/homeschool/life-explorer/calendar?new=1"
            className="inline-flex items-center rounded-xl border border-[#333] px-5 py-3 text-sm font-medium text-neutral-200 hover:border-[#39FF14]/40 hover:text-white transition-colors"
          >
            Log on Calendar
          </Link>
        </div>
      </div>
    )
  }

  if (spotlight.kind === 'log_calendar') {
    return (
      <div className={base}>
        <p className="text-xs uppercase tracking-wide text-[#39FF14] mb-2">Next step</p>
        <h3 className="text-2xl font-bold text-white">Log today on the calendar</h3>
        <p className="mt-2 text-neutral-300">
          {spotlight.lessonTitle
            ? `${spotlight.lessonTitle} is ready to record — tap the day, write what you did, and attach photos. That calendar entry is your learning log.`
            : 'Tap today, write what you did, how long you schooled, and add photos. The calendar is the record — not a separate check-in.'}
        </p>
        <Link
          href="/homeschool/life-explorer/calendar?new=1"
          className="mt-5 inline-flex items-center rounded-xl bg-[#39FF14] px-6 py-3 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors"
        >
          Open Calendar
        </Link>
      </div>
    )
  }

  return (
    <div className={base}>
      <p className="text-xs uppercase tracking-wide text-[#39FF14] mb-2">Done for today</p>
      <h3 className="text-2xl font-bold text-white">Logged on the calendar</h3>
      <p className="mt-2 text-neutral-300">
        Today&apos;s learning is on the calendar. Shape what comes next below — or just close the
        laptop.
      </p>
      <Link
        href="/homeschool/life-explorer/calendar"
        className="mt-5 inline-flex items-center rounded-xl border border-[#333] px-5 py-3 text-sm font-medium text-neutral-200 hover:border-[#39FF14]/40 hover:text-white transition-colors"
      >
        View Calendar
      </Link>
    </div>
  )
}

/* ————— Morning Appreciation ————— */

interface AppreciationEntry {
  id: string
  title: string
  photo_url: string | null
  student_explanation: string | null
}

function MorningAppreciationCard({
  studentId,
  studentName,
}: {
  studentId: string
  studentName: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [entry, setEntry] = useState<AppreciationEntry | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [whatTheyWrote, setWhatTheyWrote] = useState('')
  const [busy, setBusy] = useState<'uploading' | 'saving' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/life-explorer/appreciation?student_id=${studentId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setEntry(json.entry || null)
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [studentId])

  async function handlePhoto(file: File) {
    setError(null)
    setBusy('uploading')
    try {
      const jpeg = await ensureJpegCompatible(file)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in — refresh and try again')
      const { url } = await uploadUserFile('lifeExplorer', jpeg, user.id)
      setPhotoUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(null)
    }
  }

  async function save() {
    if (!photoUrl) return
    setBusy('saving')
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/appreciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          photo_url: photoUrl,
          what_they_wrote: whatTheyWrote.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setEntry(json.entry)
      setPhotoUrl(null)
      setWhatTheyWrote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setBusy(null)
    }
  }

  if (!loaded) return null

  // Captured state — today's page is in the feed and portfolio.
  if (entry) {
    return (
      <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">Daily ritual</p>
        <div className="flex items-start gap-4">
          {entry.photo_url && (
            <Image
              src={entry.photo_url}
              alt="Morning Appreciation journal page"
              width={72}
              height={72}
              unoptimized
              className="h-[72px] w-[72px] rounded-xl border border-[#2a2a2a] object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold">
              Morning Appreciation <span className="text-[#39FF14]">✓</span>
            </p>
            {entry.student_explanation ? (
              <p className="text-sm text-neutral-300 mt-1 italic">
                &ldquo;{entry.student_explanation}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-neutral-500 mt-1">
                Captured — it&apos;s in the Journey Feed and the portfolio.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handlePhoto(f)
          e.target.value = ''
        }}
      />
      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">Daily ritual</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-white font-semibold">Morning Appreciation</p>
          <p className="text-sm text-neutral-500 mt-0.5">
            Snap {studentName}&apos;s journal page — drawing on top, a couple of sentences below.
          </p>
        </div>
        {!photoUrl && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-[#333] px-4 py-2 text-sm font-medium text-neutral-200 hover:border-[#39FF14]/40 hover:text-white transition-colors disabled:opacity-60"
          >
            {busy === 'uploading' ? 'Uploading…' : 'Snap the page'}
          </button>
        )}
      </div>

      {photoUrl && (
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <Image
            src={photoUrl}
            alt="Journal page preview"
            width={112}
            height={112}
            unoptimized
            className="h-28 w-28 rounded-xl border border-[#2a2a2a] object-cover"
          />
          <div className="min-w-0 flex-1">
            <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-1">
              What they wrote (optional — exact words, invented spelling welcome)
            </label>
            <input
              value={whatTheyWrote}
              onChange={(e) => setWhatTheyWrote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void save()
              }}
              placeholder="I love my dog becus he is fluffy"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-[#39FF14]/50 focus:outline-none"
            />
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void save()}
                className="rounded-xl bg-[#39FF14] px-5 py-2 text-sm font-semibold text-black hover:bg-[#5FFF3E] transition-colors disabled:opacity-60"
              >
                {busy === 'saving' ? 'Saving…' : 'Save to the feed'}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  setPhotoUrl(null)
                  setWhatTheyWrote('')
                }}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Retake
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  )
}

/* ————— Steer the expedition ————— */

function SteerPanel({
  expedition,
  openWonders,
  hasReadyLesson,
  busy,
  onQueueChange,
  onDirection,
  onRegenerate,
}: {
  expedition: LeExpedition
  openWonders: LeWonderItem[]
  hasReadyLesson: boolean
  busy: string | null
  onQueueChange: (queue: string[]) => void
  onDirection: (direction: SteerDirection) => void
  onRegenerate: () => void
}) {
  const queued = openWonders
    .filter((w) => w.priority != null)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
  const unqueued = openWonders.filter((w) => w.priority == null)
  const direction = expedition.steer?.direction || 'continue'
  const [dragId, setDragId] = useState<string | null>(null)

  function move(id: string, delta: number) {
    const ids = queued.map((w) => w.id)
    const idx = ids.indexOf(id)
    const next = idx + delta
    if (idx < 0 || next < 0 || next >= ids.length) return
    ids.splice(idx, 1)
    ids.splice(next, 0, id)
    onQueueChange(ids)
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) return
    const ids = queued.map((w) => w.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(from, 1)
    ids.splice(to, 0, dragId)
    setDragId(null)
    onQueueChange(ids)
  }

  return (
    <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
        Shape what&apos;s next
      </p>
      <p className="text-white font-semibold">Steer the expedition</p>
      <p className="text-sm text-neutral-500 mt-0.5 mb-4">
        Star the wonders to explore next. The next lesson is built around the top of the queue —
        composed fresh, never pre-canned.
      </p>

      {/* Up Next queue */}
      {queued.length > 0 && (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-[#00FFFF] mb-2">Up next</p>
          <ol className="space-y-2">
            {queued.map((w, i) => (
              <li
                key={w.id}
                draggable
                onDragStart={() => setDragId(w.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropOn(w.id)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-grab active:cursor-grabbing ${
                  i === 0 ? 'border-[#39FF14]/60 bg-[#39FF14]/5' : 'border-[#2a2a2a]'
                }`}
              >
                <span className={`text-sm font-bold ${i === 0 ? 'text-[#39FF14]' : 'text-neutral-500'}`}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm text-white">
                  {w.statement}
                  {i === 0 && (
                    <span className="block text-[11px] text-[#39FF14]/80 mt-0.5">
                      Next lesson builds on this
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <QueueButton label="Move up" disabled={i === 0 || busy !== null} onClick={() => move(w.id, -1)}>
                    ↑
                  </QueueButton>
                  <QueueButton
                    label="Move down"
                    disabled={i === queued.length - 1 || busy !== null}
                    onClick={() => move(w.id, 1)}
                  >
                    ↓
                  </QueueButton>
                  <QueueButton
                    label="Remove from queue"
                    disabled={busy !== null}
                    onClick={() => onQueueChange(queued.filter((q) => q.id !== w.id).map((q) => q.id))}
                  >
                    ✕
                  </QueueButton>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Open wonders — tap to queue */}
      {unqueued.length > 0 && (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
            Open wonders — tap to add to the queue
          </p>
          <div className="flex flex-wrap gap-2">
            {unqueued.map((w) => (
              <button
                key={w.id}
                type="button"
                disabled={busy !== null}
                onClick={() => onQueueChange([...queued.map((q) => q.id), w.id])}
                className="rounded-full border border-[#333] px-3 py-1.5 text-sm text-neutral-200 hover:border-[#39FF14]/50 hover:text-white transition-colors disabled:opacity-60"
              >
                ☆ {w.statement}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Direction + regenerate */}
      <div className="flex flex-wrap items-center gap-2 border-t border-[#222] pt-4">
        {(
          [
            { key: 'continue', label: 'Continue the journey' },
            { key: 'deepen', label: 'Go deeper on today’s topic' },
            { key: 'wrap_up', label: 'Wrap up this expedition' },
          ] as Array<{ key: SteerDirection; label: string }>
        ).map((d) => (
          <button
            key={d.key}
            type="button"
            disabled={busy !== null}
            onClick={() => onDirection(d.key)}
            className={`rounded-full px-4 py-2 text-sm border transition-colors disabled:opacity-60 ${
              direction === d.key
                ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                : 'border-[#333] text-neutral-300 hover:border-[#39FF14]/40'
            }`}
          >
            {d.label}
          </button>
        ))}
        {hasReadyLesson && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={onRegenerate}
            className="ml-auto rounded-full border border-amber-400/40 px-4 py-2 text-sm text-amber-200 hover:border-amber-300 transition-colors disabled:opacity-60"
          >
            {busy === 'regenerate' ? 'Recomposing…' : 'Regenerate today'}
          </button>
        )}
      </div>
      {direction === 'wrap_up' && (
        <p className="mt-3 text-xs text-amber-300/90">
          The next lesson will be the finale: harvest the Learned board, build the Expedition
          Report, present to family, and award the certificate.
        </p>
      )}
    </div>
  )
}

function QueueButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="h-7 w-7 rounded-lg border border-[#333] text-xs text-neutral-400 hover:border-[#39FF14]/40 hover:text-white transition-colors disabled:opacity-40"
    >
      {children}
    </button>
  )
}
