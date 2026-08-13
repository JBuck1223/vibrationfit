'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Spinner, Button } from '@/lib/design-system/components'
import type { LessonBundle, LessonPayload } from '@/lib/life-explorer/types'
import { LessonChecklist, LessonJournal } from './LessonWorkbench'

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
        </Section>

        <Section title="Teacher Script">
          <ScriptBlock label="Opening" text={p.teacher_script?.opening} />
          <ScriptBlock label="Mystery / Question" text={p.teacher_script?.mystery_or_question} />
          <ScriptBlock label="Core Concept" text={p.teacher_script?.core_concept} />
          {(p.teacher_script?.transitions || []).map((t, i) => (
            <ScriptBlock key={i} label={`Transition ${i + 1}`} text={t} />
          ))}
          <ScriptBlock label="Closing" text={p.teacher_script?.closing} />
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

        {p.hands_on && (
          <Section title="Hands-On">
            <pre className="whitespace-pre-wrap text-sm text-neutral-300 font-sans">
              {typeof p.hands_on === 'string'
                ? p.hands_on
                : JSON.stringify(p.hands_on, null, 2)}
            </pre>
          </Section>
        )}

        <Section id="resources" title={p.resource_queue?.length ? 'Play Queue (in order)' : 'Resources'}>
          {(p.resource_queue || []).length > 0 && (
            <div className="mb-3 space-y-2">
              {p.resource_queue!.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-[#2a2a2a] p-3">
                  <span className="text-[#39FF14] font-bold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-neutral-500 capitalize">{r.resource_type}</p>
                  </div>
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-[#39FF14] px-4 py-1.5 text-xs font-semibold text-black"
                    >
                      Play
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          <ResourceBlock resource={p.core_resource} />
          {(p.parent_prep?.links || []).map((link, i) => (
            <ResourceBlock key={i} resource={link} />
          ))}
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

function ResourceBlock({
  resource,
}: {
  resource?: {
    title?: string
    url?: string | null
    resource_type?: string
    why_selected?: string
    needs_parent_link?: boolean
  } | null
}) {
  if (!resource?.title && !resource?.url) return null
  return (
    <div className="mb-3 rounded-xl border border-[#2a2a2a] p-3">
      <p className="text-white font-medium">{resource.title || 'Resource'}</p>
      {resource.resource_type && (
        <p className="text-xs text-neutral-500 capitalize mt-0.5">{resource.resource_type}</p>
      )}
      {resource.url ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#39FF14] text-sm underline mt-1 inline-block"
        >
          Open link
        </a>
      ) : resource.needs_parent_link ? (
        <p className="text-sm text-amber-300 mt-1">
          Needs a parent-chosen link — not invented by the system.
        </p>
      ) : null}
      {resource.why_selected && (
        <p className="text-sm text-neutral-400 mt-1">{resource.why_selected}</p>
      )}
    </div>
  )
}
