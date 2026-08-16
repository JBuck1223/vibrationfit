'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Spinner, Button } from '@/lib/design-system/components'
import type {
  CoreResource,
  HandsOnActivity,
  LessonBundle,
  LessonPayload,
} from '@/lib/life-explorer/types'
import { LessonChecklist, LessonJournal } from './LessonWorkbench'

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
  const p = (lesson.payload || {}) as LessonPayload

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
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
          <h2 className="text-3xl font-bold text-white mt-3">{lesson.title}</h2>
          {lesson.essential_question && (
            <p className="text-neutral-300 mt-2 text-lg">{lesson.essential_question}</p>
          )}
          <LessonTimingChips
            plannedFor={lesson.planned_for}
            startedAt={lesson.started_at || null}
            completedAt={lesson.completed_at || null}
            status={lesson.status}
          />
          {p.fun_contract?.story_mission && (
            <p className="mt-3 text-sm text-[#00FFFF]">{p.fun_contract.story_mission}</p>
          )}
          {p.printable && (
            <a
              href={`/api/life-explorer/print/lesson?id=${lesson.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#333] px-4 py-2 text-sm text-neutral-200 hover:border-[#39FF14]/40 hover:text-white transition-colors"
            >
              Print today&apos;s sheet — {p.printable.title}
            </a>
          )}
        </div>

        {/* A regenerated-over version — nothing is lost, one tap brings it back */}
        {lesson.status === 'skipped' && (
          <RestoreVersionCard bundle={bundle} updateBundle={updateBundle} />
        )}

        {/* Low-Battery Mode — sick day, meltdown day, errand day */}
        {p.low_battery_mode && (
          <LowBatteryCard mode={p.low_battery_mode} lowBattery={lowBattery} setLowBattery={setLowBattery} />
        )}

        {/* Expedition Flashback — 2-minute retrieval warm-up */}
        {p.flashback && p.flashback.items.length > 0 && (
          <Section title="Expedition Flashback (2 min)">
            <p className="text-sm text-[#00FFFF] mb-2">{p.flashback.game}</p>
            <BulletList items={p.flashback.items.map((f) => f.prompt)} />
            <p className="text-xs text-neutral-500 mt-2">
              Mark what they remembered — easy recalls come back later, stumbles come back
              tomorrow. You&apos;ll capture the day on the calendar when you finish.
            </p>
          </Section>
        )}

        {/* Everything this lesson prescribes, as a checkable list that lives
            inside the lesson bucket. */}
        <LessonChecklist bundle={bundle} updateBundle={updateBundle} />

        {lowBattery && p.low_battery_mode ? (
          <Section title={`Low-Battery Lesson (${p.low_battery_mode.total_minutes} min)`}>
            <BulletList items={p.low_battery_mode.steps} />
            <p className="text-sm text-[#39FF14] mt-3">
              This still counts. Log it on the calendar when you&apos;re done.
            </p>
          </Section>
        ) : (
          <>
        {p.fun_contract?.hook && (
          <Section title="The Hook">
            <p className="text-neutral-200 leading-relaxed">&ldquo;{p.fun_contract.hook}&rdquo;</p>
          </Section>
        )}

        <Section title="Parent Prep">
          <p className="text-sm text-neutral-400 mb-3">
            Prep time: {p.parent_prep?.prep_minutes ?? '—'} minutes
          </p>
          <BulletList items={p.parent_prep?.materials || []} label="Materials" />
          <BulletList items={p.parent_prep?.beforehand || []} label="Beforehand" />
          <BulletList items={p.parent_prep?.safety || []} label="Safety" />
          {p.parent_prep?.cleanup && (
            <p className="text-sm text-neutral-300 mt-2">Cleanup: {p.parent_prep.cleanup}</p>
          )}
          {p.hands_on && (
            <p className="text-sm text-neutral-300 mt-3 pt-3 border-t border-[#222]">
              These materials set up{' '}
              <span className="text-white font-medium">
                {handsOnTitle(p.hands_on) || 'the hands-on activity'}
              </span>{' '}
              —{' '}
              <a href="#hands-on" className="text-[#39FF14] underline">
                full instructions below
              </a>
            </p>
          )}
        </Section>

        {(p.block_minutes || []).length > 0 && (
          <Section title="Today's Rhythm">
            <ul className="space-y-1.5">
              {p.block_minutes!.map((b, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className={b.optional ? 'text-neutral-500' : 'text-neutral-200'}>
                    {b.block}
                    {b.optional && <span className="ml-2 text-xs text-neutral-600">(optional)</span>}
                  </span>
                  <span className="text-[#00FFFF]">{b.minutes} min</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Teacher Script">
          <ScriptBlock label="Opening" text={p.teacher_script?.opening} />
          <ScriptBlock label="Mystery / Question" text={p.teacher_script?.mystery_or_question} />
          <ScriptBlock label="Core Concept" text={p.teacher_script?.core_concept} />
          {(p.teacher_script?.transitions || []).map((t, i) => (
            <ScriptBlock key={i} label={`Transition ${i + 1}`} text={t} />
          ))}
          <ScriptBlock label="Closing" text={p.teacher_script?.closing} />
        </Section>

        <Section title="Core Activities">
          <BulletList items={p.core_activities || []} />
          {p.fun_contract?.choice_point && (
            <p className="text-sm text-[#FFFF00] mt-3">
              Child&apos;s choice: {p.fun_contract.choice_point}
            </p>
          )}
          <p className="text-sm text-[#39FF14] mt-3">
            Good stopping point: {p.good_stopping_point || 'After core activities'}
          </p>
        </Section>

        {p.hands_on && (
          <Section id="hands-on" title="Hands-On">
            <HandsOnBlock handsOn={p.hands_on} />
          </Section>
        )}

        <PlayQueueSection queue={buildPlayQueue(p)} />

        {(p.sibling_tag_along || []).length > 0 && (
          <Section title="Little Sibling Tag-Along">
            <ul className="space-y-2">
              {p.sibling_tag_along!.map((t, i) => (
                <li key={i} className="text-sm">
                  <span className="text-white font-medium">{t.activity}: </span>
                  <span className="text-neutral-300">{t.adaptation}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Foundational Skills">
          <p className="text-white font-medium capitalize">{p.foundational_skills?.subject}</p>
          <p className="text-neutral-300 mt-1">{p.foundational_skills?.activity}</p>
        </Section>

        {p.parent_answer_key && (
          <Section title="Parent Answer Key">
            <p className="text-xs text-neutral-500 mb-3">
              You are never the one being tested. Kid-language answers for the likely questions:
            </p>
            <div className="space-y-3">
              {p.parent_answer_key.likely_questions.map((q, i) => (
                <div key={i}>
                  <p className="text-white text-sm font-medium">&ldquo;{q.question}&rdquo;</p>
                  <p className="text-neutral-300 text-sm mt-0.5">{q.kid_answer}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[#00FFFF]/80 mb-1">
                When you don&apos;t know
              </p>
              <p className="text-sm text-neutral-200">&ldquo;{p.parent_answer_key.unknown_script}&rdquo;</p>
            </div>
          </Section>
        )}

        <Section title="Child Output">
          <p className="text-neutral-300">
            <span className="text-white font-medium capitalize">{p.child_output?.type}: </span>
            {p.child_output?.description}
          </p>
        </Section>

        <Section title="Reflection">
          <BulletList items={p.reflection || []} />
        </Section>

        {(p.optional_extensions || []).length > 0 && (
          <Section title="Optional Extensions">
            <BulletList items={p.optional_extensions} />
          </Section>
        )}

        {p.fun_contract?.celebration_close && (
          <Section title="Celebration Close">
            <p className="text-neutral-200">{p.fun_contract.celebration_close}</p>
          </Section>
        )}
          </>
        )}

        {/* The lesson's permanent record — documents, photos, notes, links. */}
        <LessonJournal bundle={bundle} updateBundle={updateBundle} />

        <div className="pt-2">
          <FinishLessonButton bundle={bundle} updateBundle={updateBundle} />
        </div>
      </Stack>
    </Container>
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
    <div className="mt-3 flex flex-wrap items-center gap-2">
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

function LowBatteryCard({
  mode,
  lowBattery,
  setLowBattery,
}: {
  mode: { total_minutes: number; steps: string[] }
  lowBattery: boolean
  setLowBattery: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#222] bg-[#111] px-5 py-4">
      <div>
        <p className="text-white font-medium">Rough morning?</p>
        <p className="text-sm text-neutral-500 mt-0.5">
          The {mode.total_minutes}-minute version still teaches something real — and still counts.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setLowBattery(!lowBattery)}
        className={`rounded-full px-4 py-2 text-sm border transition-colors ${
          lowBattery
            ? 'border-amber-400 text-amber-300 bg-amber-400/10'
            : 'border-[#333] text-neutral-300 hover:border-amber-400/40'
        }`}
      >
        {lowBattery ? 'Back to full lesson' : 'Switch to short version'}
      </button>
    </div>
  )
}

function Section({
  title,
  children,
  id,
}: {
  title: string
  children: React.ReactNode
  id?: string
}) {
  return (
    <section id={id} className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      {children}
    </section>
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
function PlayQueueSection({ queue }: { queue: CoreResource[] }) {
  if (queue.length === 0) return null
  return (
    <Section id="resources" title={queue.length > 1 ? 'Play Queue (in order)' : 'Play Queue'}>
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
    </Section>
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
