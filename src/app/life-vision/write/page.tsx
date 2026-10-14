'use client'

/**
 * /life-vision/write
 *
 * The moment the vision arrives. One area on screen at a time, in life
 * order, typed in as each section lands from the single compose stream.
 * Now / imagination stay on /life-vision/start.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Container, Spinner, VIVALoadingOverlay } from '@/lib/design-system/components'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'
import { useLifeVisionStudioAreaChrome } from '@/components/life-vision-studio/useLifeVisionStudioAreaChrome'
import { VisionCategoryCard } from '@/app/life-vision/components/VisionCategoryCard'
import {
  LIFE_CATEGORY_KEYS,
  VISION_CATEGORIES,
  isLifeCategoryKey,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'

type VisionMap = Partial<Record<LifeCategoryKey, string>>
type Phase = 'loading' | 'ceremony' | 'reading' | 'idle'

interface WriteRun {
  vision: VisionMap
  forward: string
  conclusion: string
  error: string | null
  done: boolean
  listeners: Set<() => void>
}

const runs = new Map<string, WriteRun>()

function flagKey(draftId: string) {
  return `vf_write_${draftId}`
}

function notify(run: WriteRun) {
  for (const listener of run.listeners) listener()
}

async function consumeStream(draftId: string, run: WriteRun) {
  try {
    const res = await fetch('/api/vision/draft/compose-first', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId }),
    })
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}))
      run.error = typeof data?.error === 'string' ? data.error : 'Could not write your vision'
      notify(run)
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    const handle = (line: string) => {
      if (!line.trim()) return
      let evt: Record<string, unknown>
      try { evt = JSON.parse(line) } catch { return }
      if (evt.type === 'stage' && evt.stage === 'vision' && typeof evt.category === 'string' && typeof evt.text === 'string' && isLifeCategoryKey(evt.category)) {
        run.vision = { ...run.vision, [evt.category]: evt.text }
      } else if (evt.type === 'bookends') {
        if (typeof evt.forward === 'string') run.forward = evt.forward
        if (typeof evt.conclusion === 'string') run.conclusion = evt.conclusion
      } else if (evt.type === 'error') {
        run.error = typeof evt.message === 'string' ? evt.message : 'Compose failed'
      } else if (evt.type === 'done') {
        run.done = true
      }
      notify(run)
    }
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) handle(line)
    }
    if (buffer.trim()) handle(buffer)
    run.done = true
    notify(run)
  } catch (err) {
    run.error = err instanceof Error ? err.message : 'Could not write your vision'
    notify(run)
  }
}

function ensureRun(draftId: string, nonce: string): WriteRun {
  const key = `${draftId}:${nonce}`
  const existing = runs.get(key)
  if (existing) return existing
  const run: WriteRun = {
    vision: {},
    forward: '',
    conclusion: '',
    error: null,
    done: false,
    listeners: new Set(),
  }
  runs.set(key, run)
  void consumeStream(draftId, run)
  return run
}

function textsFromDraft(draft: Record<string, unknown>): { vision: VisionMap; forward: string; conclusion: string } {
  const vision: VisionMap = {}
  for (const key of LIFE_CATEGORY_KEYS) {
    const value = draft[key]
    if (typeof value === 'string' && value.trim()) vision[key] = value
  }
  return {
    vision,
    forward: typeof draft.forward === 'string' ? draft.forward : '',
    conclusion: typeof draft.conclusion === 'string' ? draft.conclusion : '',
  }
}

export default function WriteVisionPage() {
  const router = useRouter()
  const { refreshVisions } = useLifeVisionStudio()
  useLifeVisionStudioAreaChrome(useMemo(() => ({}), []))

  const [phase, setPhase] = useState<Phase>('loading')
  const [vision, setVision] = useState<VisionMap>({})
  const [forward, setForward] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [streamDone, setStreamDone] = useState(false)
  const baselineRef = useRef<VisionMap>({})
  const bootedRef = useRef(false)

  const subscribe = useCallback((run: WriteRun, id: string) => {
    const pull = () => {
      setVision({ ...run.vision })
      if (run.forward) setForward(run.forward)
      if (run.conclusion) setConclusion(run.conclusion)
      if (run.error) {
        setError(run.error)
        try { sessionStorage.setItem(flagKey(id), 'error') } catch { /* noop */ }
      }
      if (run.done) {
        setStreamDone(true)
        try { sessionStorage.setItem(flagKey(id), 'done') } catch { /* noop */ }
        refreshVisions().catch(() => {})
      }
    }
    pull()
    run.listeners.add(pull)
    return () => { run.listeners.delete(pull) }
  }, [refreshVisions])

  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    let unsubscribe = () => {}
    let poll: number | undefined

    const applyFresh = (id: string, raw: string | null) => {
      if (!raw || raw === 'error') {
        if (raw === 'error') setError('The write stopped. Your notes are still on Start Fresh.')
        setPhase('idle')
        return
      }
      if (raw === 'done') {
        setPhase('reading')
        setStreamDone(true)
        return
      }
      const [state, nonce] = raw.split(':')
      if (!nonce) {
        setPhase('idle')
        return
      }
      setPhase('ceremony')
      if (state === 'go' || runs.has(`${id}:${nonce}`)) {
        try { sessionStorage.setItem(flagKey(id), `streaming:${nonce}`) } catch { /* noop */ }
        unsubscribe = subscribe(ensureRun(id, nonce), id)
        return
      }
      // Refresh mid-write: the server is still saving. Pick up sections that
      // changed from the text that was already in the draft.
      const baseline = baselineRef.current
      poll = window.setInterval(() => {
        fetch('/api/vision/draft/start', { method: 'POST' })
          .then((res) => res.json())
          .then((data: { draft?: Record<string, unknown> }) => {
            if (!data.draft) return
            const next = textsFromDraft(data.draft)
            setVision((prev) => {
              const merged = { ...prev }
              for (const key of LIFE_CATEGORY_KEYS) {
                const text = next.vision[key]
                if (text && text !== baseline[key]) merged[key] = text
              }
              return merged
            })
            if (next.forward && next.forward !== (baseline as { forward?: string }).forward) setForward(next.forward)
            if (next.conclusion && next.conclusion !== (baseline as { conclusion?: string }).conclusion) setConclusion(next.conclusion)
            const landed = LIFE_CATEGORY_KEYS.every((key) => {
              const text = next.vision[key]
              return Boolean(text && text !== baseline[key])
            })
            if (landed) {
              if (next.forward) setForward(next.forward)
              if (next.conclusion) setConclusion(next.conclusion)
              setStreamDone(true)
              try { sessionStorage.setItem(flagKey(id), 'done') } catch { /* noop */ }
              if (poll) window.clearInterval(poll)
            }
          })
          .catch(() => {})
      }, 4000)
    }

    fetch('/api/vision/draft/start', { method: 'POST' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.draft?.id) throw new Error(data?.error || 'Could not open your draft')
        const id = String(data.draft.id)
        const saved = textsFromDraft(data.draft as Record<string, unknown>)
        baselineRef.current = saved.vision
        const raw = (() => { try { return sessionStorage.getItem(flagKey(id)) } catch { return null } })()
        const writing = Boolean(raw && raw !== 'done' && raw !== 'error')
        if (!writing) {
          setForward(saved.forward)
          setConclusion(saved.conclusion)
        }
        if (!raw) {
          const any = LIFE_CATEGORY_KEYS.some((key) => saved.vision[key])
          if (any) {
            setVision(saved.vision)
            setPhase('reading')
            setStreamDone(true)
          } else {
            setPhase('idle')
          }
          return
        }
        if (raw === 'done') {
          setVision(saved.vision)
          setForward(saved.forward)
          setConclusion(saved.conclusion)
          setStreamDone(true)
          setPhase('reading')
          return
        }
        applyFresh(id, raw)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not open your draft')
        setPhase('idle')
      })

    return () => {
      unsubscribe()
      if (poll) window.clearInterval(poll)
    }
  }, [subscribe])

  if (phase === 'loading') {
    return (
      <Container size="xl" className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  const sectionText = (key: string) => {
    if (key === 'forward') return forward
    if (key === 'conclusion') return conclusion
    return isLifeCategoryKey(key) ? (vision[key] || '') : ''
  }
  const arrivedCount = VISION_CATEGORIES.filter((section) => sectionText(section.key).trim()).length
  const generating = phase === 'ceremony'
  const complete = arrivedCount === VISION_CATEGORIES.length && (phase === 'reading' || streamDone)

  const progressBar = (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${VISION_CATEGORIES.length}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {VISION_CATEGORIES.map((section) => {
        const done = Boolean(sectionText(section.key).trim())
        return (
          <span
            key={section.key}
            title={section.label}
            className={`h-1.5 rounded-full transition-colors ${done ? 'bg-[#39FF14]' : 'bg-[#2a2a2a]'}`}
          />
        )
      })}
    </div>
  )

  const completeBlock = () => complete ? (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <p className="text-lg font-semibold text-white">Your Vision is complete!</p>
      <Button variant="primary" size="sm" onClick={() => router.push('/life-vision/update')}>
        Edit With VIVA
      </Button>
    </div>
  ) : null

  return (
    <Container size="xl">
      <div className="space-y-4 pb-24">
        {error && (
          <div className="rounded-xl border border-[#FF0040]/40 bg-[#FF0040]/10 px-4 py-3 text-sm text-[#ff8ba7]">
            {error}
          </div>
        )}

        {(generating || phase === 'reading') && (
          <>
            {progressBar}
            {generating && !complete && (
              <p className="text-sm text-neutral-400">
                {arrivedCount} of {VISION_CATEGORIES.length} written
              </p>
            )}
            {completeBlock()}
            {VISION_CATEGORIES.map((section) => {
              const text = sectionText(section.key)
              const waiting = generating && !text.trim()
              return (
                <div key={section.key} className={`relative ${waiting ? 'min-h-[280px]' : ''}`}>
                  <VisionCategoryCard
                    category={section}
                    content={text}
                    editable={false}
                  />
                  <VIVALoadingOverlay
                    isVisible={waiting}
                    size="md"
                    messages={[
                      `Writing ${section.label}...`,
                      'Staying with your words...',
                      'Bringing this section to life...',
                    ]}
                    estimatedTime=""
                    estimatedDuration={40000}
                  />
                </div>
              )
            })}
            {completeBlock()}
            {generating && !complete && (
              <div className="pt-2 text-center">
                <Link href="/life-vision/start" className="text-sm text-neutral-400 hover:text-white">
                  Your words
                </Link>
              </div>
            )}
          </>
        )}

        {phase === 'idle' && (
          <div className="py-16">
            <h1 className="text-2xl font-semibold text-white">Your Life Vision</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
              This is where it comes together. Your notes are on Start Fresh.
            </p>
            <Link href="/life-vision/start" className="mt-6 inline-block text-sm text-[#39FF14] hover:underline">
              Back to your words
            </Link>
          </div>
        )}
      </div>
    </Container>
  )
}
