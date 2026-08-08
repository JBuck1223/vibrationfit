'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Spinner, Button } from '@/lib/design-system/components'
import type { LeLesson, LessonPayload } from '@/lib/life-explorer/types'

export default function LessonPage() {
  const params = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<LeLesson | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/life-explorer/lessons/${params.id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        setLesson(json.lesson)
        await fetch(`/api/life-explorer/lessons/${params.id}/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' }),
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

  if (error || !lesson) {
    return (
      <Container size="md" className="py-16">
        <p className="text-red-300 mb-4">{error || 'Lesson not found'}</p>
        <Link href="/homeschool/life-explorer" className="text-[#39FF14] underline">
          Back to Today
        </Link>
      </Container>
    )
  }

  const p = (lesson.payload || {}) as LessonPayload

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <Link href="/homeschool/life-explorer" className="text-sm text-neutral-400 hover:text-white">
            ← Today
          </Link>
          <h2 className="text-3xl font-bold text-white mt-3">{lesson.title}</h2>
          {lesson.essential_question && (
            <p className="text-neutral-300 mt-2 text-lg">{lesson.essential_question}</p>
          )}
        </div>

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

        <Section title="Core Activities">
          <BulletList items={p.core_activities || []} />
          <p className="text-sm text-[#39FF14] mt-3">
            Good stopping point: {p.good_stopping_point || 'After core activities'}
          </p>
        </Section>

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

        <Section id="resources" title="Resources">
          <ResourceBlock resource={p.core_resource} />
          {(p.parent_prep?.links || []).map((link, i) => (
            <ResourceBlock key={i} resource={link} />
          ))}
        </Section>

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

        <div className="pt-2">
          <Link href={`/homeschool/life-explorer/record?lesson_id=${lesson.id}`}>
            <Button variant="primary" size="lg">
              Record What Happened
            </Button>
          </Link>
        </div>
      </Stack>
    </Container>
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
