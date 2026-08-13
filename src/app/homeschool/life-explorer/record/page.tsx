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
import type { Direction, FlashbackItem } from '@/lib/life-explorer/types'

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
  const [lowBattery, setLowBattery] = useState(false)
  const [flashbackItems, setFlashbackItems] = useState<FlashbackItem[]>([])
  const [flashbackRecall, setFlashbackRecall] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/life-explorer/lessons/today')
        const json = await res.json()
        const id = lessonIdParam || json.lesson?.id
        setLessonId(id || null)
        let lessonData = id && json.lesson?.id === id ? json.lesson : null
        if (id && !lessonData) {
          const lessonRes = await fetch(`/api/life-explorer/lessons/${id}`)
          const lessonJson = await lessonRes.json()
          lessonData = lessonJson.lesson || null
        }
        if (lessonData) {
          setLessonTitle(lessonData.title || '')
          const items: FlashbackItem[] = lessonData.payload?.flashback?.items || []
          setFlashbackItems(items.filter((i) => i.wonder_item_id))
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
          low_battery: lowBattery || undefined,
          flashback_results:
            flashbackItems.length > 0
              ? flashbackItems
                  .filter((f) => f.wonder_item_id && f.wonder_item_id in flashbackRecall)
                  .map((f) => ({
                    wonder_item_id: f.wonder_item_id as string,
                    recalled: flashbackRecall[f.wonder_item_id as string],
                  }))
              : undefined,
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

        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
          Days are now tracked on the{' '}
          <Link href="/homeschool/life-explorer/calendar" className="underline underline-offset-2 hover:text-white">
            Calendar
          </Link>{' '}
          — logging there is all that&apos;s required. This detailed check-in still works and
          feeds tomorrow&apos;s lesson steering, but it&apos;s optional.
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
        {flashbackItems.length > 0 && (
          <Field label="Expedition Flashback — did they remember?">
            <div className="space-y-2">
              {flashbackItems.map((f) => (
                <div
                  key={f.wonder_item_id}
                  className="rounded-xl border border-[#222] bg-[#111] px-4 py-3"
                >
                  <p className="text-sm text-neutral-200">{f.learned_statement}</p>
                  <div className="mt-2 flex gap-2">
                    {(
                      [
                        [true, 'Remembered it'],
                        [false, 'Needs another visit'],
                      ] as const
                    ).map(([recalled, label]) => (
                      <button
                        key={String(recalled)}
                        type="button"
                        onClick={() =>
                          setFlashbackRecall((prev) => ({
                            ...prev,
                            [f.wonder_item_id as string]: recalled,
                          }))
                        }
                        className={`rounded-full px-3 py-1 text-xs border ${
                          flashbackRecall[f.wonder_item_id as string] === recalled
                            ? recalled
                              ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                              : 'border-amber-400 text-amber-300 bg-amber-400/10'
                            : 'border-[#333] text-neutral-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Field>
        )}

        <Field label="How was today taught?">
          <div className="flex flex-wrap gap-2">
            {(
              [
                [false, 'Full lesson'],
                [true, 'Low-battery (15-min) version'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setLowBattery(value)}
                className={`rounded-full px-4 py-2 text-sm border ${
                  lowBattery === value
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
