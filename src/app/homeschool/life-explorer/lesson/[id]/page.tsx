'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Container, Stack, Spinner, Button } from '@/lib/design-system/components'
import type {
  CoreResource,
  HandsOnActivity,
  LessonBundle,
  LessonPayload,
} from '@/lib/life-explorer/types'
import { LessonChecklist, LessonJournal } from './LessonWorkbench'
import { normalizeLessonPayload } from '@/lib/life-explorer/normalize-payload'
import { LessonVisualBoard } from '@/components/life-explorer/LessonVisuals'

/** Display name of the hands-on activity, whatever shape the payload uses. */
function handsOnTitle(handsOn: LessonPayload['hands_on']): string | null {
  if (!handsOn || typeof handsOn === 'string') return null
  const t = handsOn.title || handsOn.activity
  return typeof t === 'string' && t.trim() ? t : null
}

/**
 * One deduplicated media list in play order: resource_queue leads, then
 * core_resource and parent-prep links only if they are not already queued.
 * (Older payloads repeat the same resource across all three fields.)
 */
function buildPlayQueue(p: LessonPayload): CoreResource[] {
  const out: CoreResource[] = []
  const seen = new Set<string>()
  const add = (r?: CoreResource | null) => {
    if (!r || (!r.title && !r.url)) return
    const keys = [r.url?.trim().toLowerCase(), r.title?.trim().toLowerCase()].filter(
      (k): k is string => Boolean(k)
    )
    if (keys.some((k) => seen.has(k))) return
    keys.forEach((k) => seen.add(k))
    out.push(r)
  }
  ;(p.resource_queue || []).forEach(add)
  add(p.core_resource)
  ;(p.parent_prep?.links || []).forEach(add)
  return out
}

type LessonStepDef = {
  id: string
  title: string
  summary: string
  defaultOpen: boolean
  body: ReactNode
}

export default function LessonPage() {
  const params = useParams<{ id: string }>()
  const [bundle, setBundle] = useState<LessonBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lowBattery, setLowBattery] = useState(false)

  const updateBundle = useCallback((fn: (b: LessonBundle) => LessonBundle) => {
    setBundle((prev) => (prev ? fn(prev) : prev))
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/life-explorer/lessons/${params.id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        let lesson = json.lesson
        // Opening a fresh lesson starts the clock (never re-stamps).
        if (lesson.status === 'ready' || lesson.status === 'in_progress') {
          const recRes = await fetch(`/api/life-explorer/lessons/${params.id}/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'in_progress' }),
          })
          const recJson = await recRes.json().catch(() => null)
          if (recRes.ok && recJson?.lesson) lesson = recJson.lesson
        }
        setBundle({
          lesson,
          items: json.items || [],
          notes: json.notes || [],
          links: json.links || [],
          media: json.media || [],
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [params.id])

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  if (error || !bundle) {
    return (
      <Container size="md" className="py-16">
        <p className="text-red-300 mb-4">{error || 'Lesson not found'}</p>
        <Link href="/homeschool/life-explorer" className="text-[#39FF14] underline">
          Back to Today
        </Link>
      </Container>
    )
  }

  const lesson = bundle.lesson
  const p = normalizeLessonPayload(lesson.payload)
  const playQueue = buildPlayQueue(p)
  const hasPrep =
    (p.parent_prep?.materials?.length || 0) +
      (p.parent_prep?.beforehand?.length || 0) +
      (p.parent_prep?.safety?.length || 0) >
      0 ||
    Boolean(p.parent_prep?.cleanup) ||
    (p.block_minutes || []).length > 0
  const hasFlashback = Boolean(p.flashback && p.flashback.items.length > 0)
  const paperVisuals = (p.visuals || []).filter((v) => v.kind === 'exercise')
  const chapterLines =
    p.book_chapter &&
    (p.visuals || []).find((v) => v.kind === 'passage' && v.title?.includes(p.book_chapter!.title))
  const hasCrew = Boolean(p.book_chapter || p.crew?.length || chapterLines)
  const lookVisuals = (p.visuals || []).filter((v) => {
    if (v.kind === 'exercise') return false
    if (chapterLines && v === chapterLines) return false
    return true
  })

  const steps: LessonStepDef[] = lowBattery && p.low_battery_mode
    ? [
        {
          id: 'short',
          title: 'Short version',
          summary: `${p.low_battery_mode.total_minutes} minutes — still counts`,
          defaultOpen: true,
          body: (
            <>
              <BulletList items={p.low_battery_mode.steps} />
              <p className="text-sm text-[#39FF14] mt-3">
                This still counts. Log it on the calendar when you&apos;re done.
              </p>
            </>
          ),
        },
      ]
    : [
        ...(hasPrep
          ? [
              {
                id: 'set-out',
                title: 'Set out',
                  summary: p.parent_prep?.prep_minutes
                  ? `${p.parent_prep.prep_minutes} min to gather`
                  : "Materials and the day's rhythm",
                defaultOpen: true,
                body: (
                  <>
                    <BulletList items={p.parent_prep?.materials || []} label="Materials" />
                    <BulletList items={p.parent_prep?.beforehand || []} label="Set out first" />
                    <BulletList items={p.parent_prep?.safety || []} label="Safety" />
                    {p.parent_prep?.cleanup && (
                      <p className="text-sm text-neutral-300 mt-2">Cleanup: {p.parent_prep.cleanup}</p>
                    )}
                    {(p.block_minutes || []).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#222]">
                        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                          Today&apos;s rhythm
                        </p>
                        <ul className="space-y-1.5">
                          {p.block_minutes!.map((b, i) => (
                            <li key={i} className="flex items-center justify-between text-sm">
                              <span className={b.optional ? 'text-neutral-500' : 'text-neutral-200'}>
                                {b.block}
                                {b.optional && (
                                  <span className="ml-2 text-xs text-neutral-600">(optional)</span>
                                )}
                              </span>
                              <span className="text-[#00FFFF]">{b.minutes} min</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ),
              } satisfies LessonStepDef,
            ]
          : []),
        ...(hasFlashback
          ? [
              {
                id: 'flashback',
                title: 'Flashback',
                summary: p.flashback!.game,
                defaultOpen: false,
                body: (
                  <>
                    <p className="text-sm text-[#00FFFF] mb-2">{p.flashback!.game}</p>
                    <BulletList items={p.flashback!.items.map((f) => f.prompt)} />
                    <p className="text-xs text-neutral-500 mt-2">
                      Easy recalls come back later. Stumbles come back tomorrow.
                    </p>
                  </>
                ),
              } satisfies LessonStepDef,
            ]
          : []),
        ...(paperVisuals.length > 0
          ? [
              {
                id: 'paper',
                title: 'Do this on paper',
                summary: 'Pencil pages — math and words he finishes',
                defaultOpen: true,
                body: (
                  <>
                    <p className="text-sm text-neutral-400 mb-3">
                      Print these or write on the screen. The pictures below are tools; these pages are the work.
                    </p>
                    <LessonVisualBoard visuals={paperVisuals} embedded />
                  </>
                ),
              } satisfies LessonStepDef,
            ]
          : []),
        ...(lookVisuals.length > 0
          ? [
              {
                id: 'look',
                title: 'Look at this',
                summary: "Today's mats, maps, and cards",
                defaultOpen: paperVisuals.length === 0,
                body: <LessonVisualBoard visuals={lookVisuals} embedded />,
              } satisfies LessonStepDef,
            ]
          : []),
        ...(hasCrew
          ? [
              {
                id: 'crew',
                title: 'Read with the crew',
                summary: p.book_chapter
                  ? `${p.book_chapter.title}${p.crew?.length ? ` — ${p.crew.join(', ')}` : ''}`
                  : (p.crew || []).join(', ') || 'Today’s chapter',
                defaultOpen: true,
                body: (
                  <>
                    {p.crew && p.crew.length > 0 && (
                      <p className="text-sm text-[#00FFFF] mb-2">On duty: {p.crew.join(', ')}</p>
                    )}
                    {p.book_id && p.book_chapter ? (
                      <p className="text-sm text-neutral-300 mb-3">
                        <Link
                          href={`/homeschool/life-explorer/books/${p.book_id}?page=${p.book_chapter.start_page}`}
                          className="text-[#39FF14] hover:underline"
                        >
                          Open {p.book_chapter.title}
                        </Link>
                        <span className="text-neutral-500">
                          {' '}
                          — pages {p.book_chapter.start_page}–{p.book_chapter.end_page}. Read-aloud is the diction practice.
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-400 mb-3">
                        The crew book is still being painted. Read today&apos;s chapter here.
                      </p>
                    )}
                    {chapterLines && <LessonVisualBoard visuals={[chapterLines]} embedded />}
                  </>
                ),
              } satisfies LessonStepDef,
            ]
          : []),
        {
          id: 'teach',
          title: 'Teach',
          summary: 'Hook, mystery, hands-on, then the core idea',
          defaultOpen: true,
          body: (
            <>
              {p.fun_contract?.hook && (
                <ScriptBlock label="Hook — do this first" text={p.fun_contract.hook} />
              )}
              <ScriptBlock label="Say this — opening" text={p.teacher_script?.opening} />
              <ScriptBlock label="Mystery / question" text={p.teacher_script?.mystery_or_question} />
              {p.hands_on && (
                <div id="hands-on" className="mt-4 pt-4 border-t border-[#222]">
                  <p className="text-xs uppercase tracking-wide text-[#39FF14]/80 mb-2">
                    Do this — {handsOnTitle(p.hands_on) || 'hands-on'}
                  </p>
                  <HandsOnBlock handsOn={p.hands_on} />
                </div>
              )}
              {(p.teacher_script?.transitions || []).map((t, i) => (
                <ScriptBlock key={i} label={`Then say — ${i + 1}`} text={t} />
              ))}
              <ScriptBlock label="Core idea" text={p.teacher_script?.core_concept} />
              {p.foundational_skills?.activity && (
                <div className="mt-4 pt-4 border-t border-[#222]">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Foundational — {p.foundational_skills.subject}
                  </p>
                  <p className="text-neutral-200 text-sm leading-relaxed">
                    {p.foundational_skills.activity}
                  </p>
                </div>
              )}
              {(p.wonder_wall?.know_prompt || (p.wonder_wall?.wonder_prompts || []).length > 0) && (
                <div className="mt-4 pt-4 border-t border-[#222]">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Wonder Wall</p>
                  {p.wonder_wall.know_prompt && (
                    <p className="text-sm text-neutral-300 mb-2">{p.wonder_wall.know_prompt}</p>
                  )}
                  <BulletList items={p.wonder_wall.wonder_prompts || []} />
                </div>
              )}
            </>
          ),
        },
        {
          id: 'close',
          title: 'Make and close',
          summary: p.child_output?.type
            ? `Make the ${p.child_output.type}, then close`
            : 'Artifact, choice, and a clean stop',
          defaultOpen: false,
          body: (
            <>
              {p.child_output?.description && (
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Make this — {p.child_output.type}
                  </p>
                  <p className="text-neutral-200 text-sm leading-relaxed">
                    {p.child_output.description}
                  </p>
                </div>
              )}
              <ScriptBlock label="Close with this" text={p.teacher_script?.closing} />
              {p.fun_contract?.choice_point && (
                <p className="text-sm text-[#FFFF00] mt-3">
                  Child&apos;s choice: {p.fun_contract.choice_point}
                </p>
              )}
              {p.fun_contract?.celebration_close && (
                <p className="text-sm text-neutral-200 mt-3">{p.fun_contract.celebration_close}</p>
              )}
              <p className="text-sm text-[#39FF14] mt-4">
                Good stopping point: {p.good_stopping_point || 'After the artifact is made'}
              </p>
              {(p.reflection || []).length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#222]">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Reflection</p>
                  <BulletList items={p.reflection} />
                </div>
              )}
            </>
          ),
        },
        ...(playQueue.length > 0
          ? [
              {
                id: 'play',
                title: playQueue.length > 1 ? 'Play queue' : 'Play',
                summary: playQueue[0]?.title || 'One resource',
                defaultOpen: false,
                body: <PlayQueueList queue={playQueue} />,
              } satisfies LessonStepDef,
            ]
          : []),
      ]

  steps.push(
    {
      id: 'check',
      title: 'Check off',
      summary: `${bundle.items.filter((i) => i.is_complete).length}/${bundle.items.length} done`,
      defaultOpen: false,
      body: <LessonChecklist bundle={bundle} updateBundle={updateBundle} embedded />,
    },
    {
      id: 'record',
      title: 'Record',
      summary: 'Ask VIVA, then keep photos and notes with this lesson',
      defaultOpen: false,
      body: (
        <div className="space-y-5">
          <VivaSidekick lessonId={lesson.id} />
          <LessonJournal bundle={bundle} updateBundle={updateBundle} embedded />
        </div>
      ),
    }
  )

  return (
    <div data-lesson-page className="w-full px-3 pt-2 pb-6 md:px-4 md:pt-3">
      <Stack gap="sm">
        <div className="flex items-center justify-between gap-3">
          <Link href="/homeschool/life-explorer" className="text-sm text-neutral-400 hover:text-white">
            ← Today
          </Link>
          <Link
            href="/homeschool/life-explorer/lessons"
            className="text-sm text-neutral-400 hover:text-white"
          >
            Lesson Log →
          </Link>
        </div>

        {lesson.status === 'skipped' && (
          <RestoreVersionCard bundle={bundle} updateBundle={updateBundle} />
        )}

        <section className="rounded-2xl border border-[#2a2a2a] bg-[#111] p-4">
          <LessonTimingChips
            plannedFor={lesson.planned_for}
            startedAt={lesson.started_at || null}
            completedAt={lesson.completed_at || null}
            status={lesson.status}
          />
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-2 leading-tight">{lesson.title}</h1>
          {lesson.essential_question && (
            <p className="text-neutral-200 mt-2 text-base md:text-lg leading-snug">{lesson.essential_question}</p>
          )}
          {p.fun_contract?.story_mission && (
            <p className="mt-2 text-sm text-[#00FFFF] leading-relaxed">{p.fun_contract.story_mission}</p>
          )}
          {p.identity?.why_this_matters && (
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{p.identity.why_this_matters}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={`/api/life-explorer/print/lesson?id=${lesson.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-[#333] px-4 py-2 text-sm text-neutral-200 hover:border-[#39FF14]/40 hover:text-white transition-colors"
            >
              Print today&apos;s pages
            </a>
            {p.low_battery_mode && (
              <button
                type="button"
                onClick={() => setLowBattery(!lowBattery)}
                className={`rounded-xl px-4 py-2 text-sm border transition-colors ${
                  lowBattery
                    ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                    : 'border-[#333] text-neutral-300 hover:border-amber-400/40'
                }`}
              >
                {lowBattery ? 'Back to full lesson' : `Short version · ${p.low_battery_mode.total_minutes} min`}
              </button>
            )}
          </div>
        </section>

        <LessonPath key={lowBattery ? 'short' : 'full'} steps={steps} />

        <div className="pt-1">
          <FinishLessonButton bundle={bundle} updateBundle={updateBundle} />
        </div>
      </Stack>
    </div>
  )
}

function VivaSidekick({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState<'ask' | 'another_way' | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(mode: 'ask' | 'another_way') {
    setBusy(true)
    setError(null)
    setAnswer(null)
    try {
      const res = await fetch('/api/life-explorer/viva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          mode,
          question: question.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'VIVA could not answer')
      setAnswer(json.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'VIVA could not answer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
      <p className="text-sm text-white font-medium">Ask VIVA</p>
      <p className="text-xs text-neutral-500 mt-0.5">
        A second explanation in kid language when something isn&apos;t landing. The answer key
        below works offline.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen('ask')
            setAnswer(null)
          }}
          className="rounded-full border border-[#39FF14]/40 px-3 py-1.5 text-xs text-[#39FF14]"
        >
          Ask VIVA
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen('another_way')
            void run('another_way')
          }}
          disabled={busy}
          className="rounded-full border border-[#00FFFF]/40 px-3 py-1.5 text-xs text-[#00FFFF] disabled:opacity-60"
        >
          {busy && open === 'another_way' ? 'VIVA is thinking…' : 'Another way'}
        </button>
      </div>
      {open === 'ask' && (
        <div className="mt-3 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What did they just ask?"
            className="flex-1 rounded-xl border border-[#333] bg-[#0a0a0a] text-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void run('ask')}
            disabled={busy}
            className="rounded-xl bg-[#39FF14] px-3 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {busy ? '…' : 'Ask'}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
      {answer && (
        <p className="text-sm text-neutral-200 mt-3 leading-relaxed whitespace-pre-wrap">{answer}</p>
      )}
    </div>
  )
}

function FinishLessonButton({
  bundle,
  updateBundle,
}: {
  bundle: LessonBundle
  updateBundle: (fn: (b: LessonBundle) => LessonBundle) => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const lesson = bundle.lesson

  if (lesson.status === 'completed') {
    return (
      <div className="rounded-2xl border border-[#39FF14]/25 bg-[#39FF14]/5 px-5 py-4">
        <p className="text-[#39FF14] font-medium">Lesson complete</p>
        <p className="text-sm text-neutral-400 mt-1">
          This page is the permanent record — checklist, documents, notes, and links stay
          right here.{' '}
          <Link href="/homeschool/life-explorer/lessons" className="text-[#39FF14] underline">
            See the full Lesson Log
          </Link>
        </p>
      </div>
    )
  }

  async function finish() {
    setBusy(true)
    try {
      const res = await fetch(`/api/life-explorer/lessons/${lesson.id}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.lesson) {
        updateBundle((b) => ({ ...b, lesson: json.lesson }))
      }
    } catch {
      // Still take them to the calendar — logging is what matters.
    }
    const title = encodeURIComponent(`Lesson: ${lesson.title}`)
    router.push(`/homeschool/life-explorer/calendar?new=1&title=${title}`)
  }

  const open = bundle.items.filter((i) => !i.is_complete).length
  return (
    <div>
      {open > 0 && (
        <p className="text-xs text-neutral-500 mb-2">
          {open} checklist item{open === 1 ? '' : 's'} still open — unchecked items stay on
          the record as skipped.
        </p>
      )}
      <Button variant="primary" size="lg" onClick={() => void finish()} disabled={busy}>
        {busy ? 'Finishing…' : 'Done — Log on Calendar'}
      </Button>
    </div>
  )
}

/**
 * Shown on lessons that were set aside (usually by "Regenerate today").
 * Restoring swaps it back to the active slot; the replacement version is
 * set aside the same way — nothing is ever deleted.
 */
function RestoreVersionCard({
  bundle,
  updateBundle,
}: {
  bundle: LessonBundle
  updateBundle: (fn: (b: LessonBundle) => LessonBundle) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function restore() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/life-explorer/lessons/${bundle.lesson.id}/restore`, {
        method: 'POST',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Failed to restore lesson')
      if (json?.lesson) updateBundle((b) => ({ ...b, lesson: json.lesson }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore lesson')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#00FFFF]/25 bg-[#00FFFF]/5 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-white font-medium">This version was set aside</p>
          <p className="text-sm text-neutral-400 mt-0.5">
            It was saved when the lesson was regenerated. Restore it and the newer version is
            set aside the same way — nothing is deleted.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void restore()}
          disabled={busy}
          className="rounded-full border border-[#00FFFF]/40 px-4 py-2 text-sm text-[#00FFFF] hover:border-[#00FFFF] transition-colors disabled:opacity-60"
        >
          {busy ? 'Restoring…' : "Restore as today's lesson"}
        </button>
      </div>
      {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
    </div>
  )
}

function LessonTimingChips({
  plannedFor,
  startedAt,
  completedAt,
  status,
}: {
  plannedFor: string
  startedAt: string | null
  completedAt: string | null
  status: string
}) {
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const chips: string[] = []
  chips.push(
    new Date(`${plannedFor}T00:00:00`).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  )
  if (startedAt) chips.push(`Started ${fmtTime(startedAt)}`)
  if (completedAt) chips.push(`Finished ${fmtTime(completedAt)}`)
  if (startedAt && completedAt) {
    const mins = Math.max(1, Math.round((+new Date(completedAt) - +new Date(startedAt)) / 60000))
    chips.push(mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c, i) => (
        <span
          key={i}
          className="rounded-full border border-[#2a2a2a] bg-[#141414] px-3 py-1 text-xs text-neutral-300"
        >
          {c}
        </span>
      ))}
      {status === 'completed' && (
        <span className="rounded-full bg-[#39FF14]/10 px-3 py-1 text-xs font-medium text-[#39FF14]">
          Completed
        </span>
      )}
    </div>
  )
}

function LessonPath({ steps }: { steps: LessonStepDef[] }) {
  const [open, setOpen] = useState<string[]>(() => steps.filter((s) => s.defaultOpen).map((s) => s.id))
  const refs = useRef<Record<string, HTMLElement | null>>({})

  function isOpen(id: string) {
    return open.includes(id)
  }

  function toggle(id: string) {
    setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  function goTo(id: string) {
    setOpen((cur) => (cur.includes(id) ? cur : [...cur, id]))
    requestAnimationFrame(() => {
      refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function goNext(id: string) {
    const i = steps.findIndex((s) => s.id === id)
    const next = steps[i + 1]
    if (next) goTo(next.id)
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {steps.map((step, i) => (
          <button
            key={step.id}
            type="button"
            onClick={() => goTo(step.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              isOpen(step.id)
                ? 'border-[#39FF14]/50 text-[#39FF14] bg-[#39FF14]/5'
                : 'border-[#2a2a2a] text-neutral-400 hover:text-white'
            }`}
          >
            {i + 1} {step.title}
          </button>
        ))}
      </div>
      <div className="mt-2 space-y-2">
        {steps.map((step, i) => {
          const openNow = isOpen(step.id)
          const next = steps[i + 1]
          return (
            <section
              key={step.id}
              ref={(el) => {
                refs.current[step.id] = el
              }}
              className="rounded-2xl border border-[#222] bg-[#111] overflow-hidden scroll-mt-20"
            >
              <button
                type="button"
                onClick={() => toggle(step.id)}
                aria-expanded={openNow}
                className="w-full flex items-center gap-3 px-4 py-3.5 md:px-5 text-left"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#333] text-xs font-semibold text-[#39FF14]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-white font-semibold">{step.title}</span>
                  <span className="block text-xs text-neutral-500 mt-0.5 truncate">{step.summary}</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${
                    openNow ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openNow && (
                <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-[#1c1c1c] pt-4">
                  {step.body}
                  {next && (
                    <button
                      type="button"
                      onClick={() => goNext(step.id)}
                      className="mt-5 text-sm text-[#00FFFF] hover:text-white"
                    >
                      Next — {next.title}
                    </button>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function BulletList({ items, label }: { items: string[]; label?: string }) {
  if (!items?.length) return null
  return (
    <div className="mb-2">
      {label && <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">{label}</p>}
      <ul className="list-disc pl-5 space-y-1 text-neutral-300 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function ScriptBlock({ label, text }: { label: string; text?: string }) {
  if (!text) return null
  return (
    <div className="mb-3">
      <p className="text-xs uppercase tracking-wide text-[#00FFFF]/80 mb-1">{label}</p>
      <p className="text-neutral-200 text-sm leading-relaxed">&ldquo;{text}&rdquo;</p>
    </div>
  )
}

/** Single ordered, deduplicated media list — the parent never hunts mid-lesson. */
function PlayQueueList({ queue }: { queue: CoreResource[] }) {
  if (queue.length === 0) return null
  return (
    <div className="space-y-2">
      {queue.map((r, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-[#2a2a2a] p-3">
          <span className="text-[#39FF14] font-bold">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium">{r.title || 'Resource'}</p>
            <p className="text-xs text-neutral-500 capitalize mt-0.5">
              {[r.resource_type, r.runtime].filter(Boolean).join(' · ')}
            </p>
            {r.why_selected && (
              <p className="text-sm text-neutral-400 mt-1">{r.why_selected}</p>
            )}
            {!r.url && r.needs_parent_link && (
              <p className="text-sm text-amber-300 mt-1">
                Needs a parent-chosen link — not invented by the system.
              </p>
            )}
          </div>
          {r.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-[#39FF14] px-4 py-1.5 text-xs font-semibold text-black"
            >
              Play
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

/** Hands-on keys rendered with dedicated treatment, in teaching order. */
const HANDS_ON_STRING_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'learning_goal', label: 'Learning goal' },
  { key: 'parent_setup', label: 'Parent setup' },
  { key: 'prediction_prompt', label: 'Prediction' },
  { key: 'expected_result', label: 'Expected result' },
  { key: 'why_it_works', label: 'Why it works' },
  { key: 'troubleshooting', label: 'Troubleshooting' },
  { key: 'cleanup', label: 'Cleanup' },
  { key: 'safety', label: 'Safety' },
  { key: 'extension', label: 'Extension' },
  { key: 'documentation_prompt', label: 'Document it' },
]

const HANDS_ON_HANDLED_KEYS = new Set([
  'title',
  'activity',
  'name',
  'description',
  'summary',
  'materials',
  'steps',
  'procedure',
  'instructions',
  'observation_questions',
  ...HANDS_ON_STRING_FIELDS.map((f) => f.key),
])

function humanizeKey(key: string): string {
  const label = key.replace(/[_-]+/g, ' ').trim()
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Structured activity card — never a raw JSON dump, whatever the payload shape. */
function HandsOnBlock({ handsOn }: { handsOn: HandsOnActivity | string }) {
  if (typeof handsOn === 'string') {
    return <p className="text-sm text-neutral-300 leading-relaxed">{handsOn}</p>
  }

  const str = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() ? v.trim() : null
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : []

  const title = str(handsOn.title) || str(handsOn.activity) || str((handsOn as Record<string, unknown>).name)
  const description = str(handsOn.description) || str((handsOn as Record<string, unknown>).summary)
  const materials = list(handsOn.materials)
  const steps = list(handsOn.steps).length
    ? list(handsOn.steps)
    : list((handsOn as Record<string, unknown>).procedure).length
      ? list((handsOn as Record<string, unknown>).procedure)
      : list((handsOn as Record<string, unknown>).instructions)
  const observations = list(handsOn.observation_questions)

  // Anything the contract doesn't name still renders readably.
  const extraEntries = Object.entries(handsOn).filter(
    ([key, value]) =>
      !HANDS_ON_HANDLED_KEYS.has(key) &&
      (str(value) !== null || list(value).length > 0)
  )

  return (
    <div className="space-y-3">
      {title && <p className="text-white font-medium">{title}</p>}
      {description && <p className="text-sm text-neutral-300 leading-relaxed">{description}</p>}
      <BulletList items={materials} label="Materials" />
      {steps.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Steps</p>
          <ol className="list-decimal pl-5 space-y-1.5 text-neutral-300 text-sm">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
      {HANDS_ON_STRING_FIELDS.map(({ key, label }) => {
        const value = str(handsOn[key])
        if (!value) return null
        return (
          <div key={key}>
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">{label}</p>
            <p className="text-sm text-neutral-300 leading-relaxed">{value}</p>
          </div>
        )
      })}
      <BulletList items={observations} label="What to notice" />
      {extraEntries.map(([key, value]) => (
        <div key={key}>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
            {humanizeKey(key)}
          </p>
          {str(value) ? (
            <p className="text-sm text-neutral-300 leading-relaxed">{str(value)}</p>
          ) : (
            <BulletList items={list(value)} />
          )}
        </div>
      ))}
    </div>
  )
}
