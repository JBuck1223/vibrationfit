'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Container,
  Stack,
  Spinner,
  Button,
  Textarea,
  Input,
} from '@/lib/design-system/components'
import type { Direction } from '@/lib/life-explorer/types'

function RecordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const lessonIdParam = searchParams.get('lesson_id')

  const [lessonId, setLessonId] = useState<string | null>(lessonIdParam)
  const [lessonTitle, setLessonTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const [enjoyedMost, setEnjoyedMost] = useState('')
  const [createdSaid, setCreatedSaid] = useState('')
  const [easyOrDifficult, setEasyOrDifficult] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [direction, setDirection] = useState<Direction>('continue')
  const [photoUrl, setPhotoUrl] = useState('')
  const [parentNotes, setParentNotes] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/life-explorer/lessons/today')
        const json = await res.json()
        const id = lessonIdParam || json.lesson?.id
        setLessonId(id || null)
        if (id && json.lesson?.id === id) {
          setLessonTitle(json.lesson.title)
        } else if (id) {
          const lessonRes = await fetch(`/api/life-explorer/lessons/${id}`)
          const lessonJson = await lessonRes.json()
          setLessonTitle(lessonJson.lesson?.title || '')
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [lessonIdParam])

  async function submit() {
    if (!lessonId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          enjoyed_most: enjoyedMost,
          created_said_demonstrated: createdSaid,
          easy_or_difficult: easyOrDifficult,
          new_question: newQuestion,
          direction,
          photo_url: photoUrl || undefined,
          parent_notes: parentNotes || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Check-in failed')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  if (done) {
    return (
      <Container size="md" className="py-16">
        <Stack gap="md">
          <h2 className="text-3xl font-bold text-white">Saved</h2>
          <p className="text-neutral-300">
            Wonder Wall, evidence, and skills updated. Generate tomorrow&apos;s lesson when you&apos;re ready.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => router.push('/homeschool/life-explorer')}>
              Back to Today
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await fetch('/api/life-explorer/lessons/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: '{}',
                })
                router.push('/homeschool/life-explorer')
              }}
            >
              Generate Next Lesson
            </Button>
          </div>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <Link href="/homeschool/life-explorer" className="text-sm text-neutral-400 hover:text-white">
            ← Today
          </Link>
          <h2 className="text-3xl font-bold text-white mt-3">Two-Minute Check-In</h2>
          <p className="text-neutral-400 mt-2">{lessonTitle || 'Today’s lesson'}</p>
        </div>

        {!lessonId && (
          <p className="text-amber-200 text-sm">No lesson to record. Generate one from Today first.</p>
        )}

        {error && <p className="text-red-300 text-sm">{error}</p>}

        <Field label="1. What did Oliver enjoy most?">
          <Textarea value={enjoyedMost} onChange={(e) => setEnjoyedMost(e.target.value)} rows={2} />
        </Field>
        <Field label="2. What did he create, say, or demonstrate?">
          <Textarea value={createdSaid} onChange={(e) => setCreatedSaid(e.target.value)} rows={2} />
        </Field>
        <Field label="3. What felt too easy or too difficult?">
          <Textarea
            value={easyOrDifficult}
            onChange={(e) => setEasyOrDifficult(e.target.value)}
            rows={2}
          />
        </Field>
        <Field label="4. What new question did he ask?">
          <Textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} rows={2} />
        </Field>
        <Field label="5. Should we continue this topic tomorrow?">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['continue', 'Continue'],
                ['deepen', 'Deepen'],
                ['change', 'Change direction'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDirection(value)}
                className={`rounded-full px-4 py-2 text-sm border ${
                  direction === value
                    ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                    : 'border-[#333] text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Optional photo URL">
          <Input
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://…"
          />
        </Field>
        <Field label="Optional notes">
          <Textarea value={parentNotes} onChange={(e) => setParentNotes(e.target.value)} rows={2} />
        </Field>

        <Button variant="primary" size="lg" onClick={submit} disabled={!lessonId || saving}>
          {saving ? 'Saving…' : 'Save Check-In'}
        </Button>
      </Stack>
    </Container>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-neutral-300 mb-2">{label}</span>
      {children}
    </label>
  )
}

export default function RecordPage() {
  return (
    <Suspense
      fallback={
        <Container size="md" className="py-20 flex justify-center">
          <Spinner />
        </Container>
      }
    >
      <RecordForm />
    </Suspense>
  )
}
