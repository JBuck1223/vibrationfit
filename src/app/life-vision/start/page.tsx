'use client'

/**
 * Start From Scratch — /life-vision/start
 *
 * The member writes two beats per life area, in their own words: "What's
 * going on now" and "Unleash your imagination". That raw material is stored
 * on a `scratch` draft session. When all 12 areas are ready, Write My Life
 * Vision runs compose-first (overwriting whatever the one personal draft
 * held) and hands off to /life-vision/update for VIVA-led edits.
 *
 * Single column, one explainer, accordion rows in the update-page chrome.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Container, Spinner } from '@/lib/design-system/components'
import { WarningConfirmationDialog } from '@/lib/design-system/components/overlays'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'
import { useLifeVisionStudioAreaChrome } from '@/components/life-vision-studio/useLifeVisionStudioAreaChrome'
import { LIFE_CATEGORY_KEYS, isLifeCategoryKey, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import {
  draftHasAnyVisionText,
  type AreaBeat,
  type DraftSessionPayload,
} from '@/lib/life-vision/draft-session'
import type { VisionData } from '@/lib/life-vision/draft-helpers'
import { keys } from '@/lib/query/keys'
import { ScratchExplainer } from '@/components/life-vision/scratch/ScratchExplainer'
import { ScratchProgress } from '@/components/life-vision/scratch/ScratchProgress'
import {
  ScratchAreaRow,
  areaIsReady,
  type ScratchAreaState,
} from '@/components/life-vision/scratch/ScratchAreaRow'

type AreaMap = Record<LifeCategoryKey, ScratchAreaState>

interface StartResponse {
  draft: VisionData & { id: string }
  session: DraftSessionPayload
  existed: boolean
}

function emptyAreas(): AreaMap {
  const out = {} as AreaMap
  for (const key of LIFE_CATEGORY_KEYS) out[key] = { now: '', dream: '', unknown: false }
  return out
}

function areasFromSession(session: DraftSessionPayload): AreaMap {
  const out = emptyAreas()
  for (const row of session.categoryText || []) {
    if (!isLifeCategoryKey(row.category)) continue
    out[row.category] = {
      now: row.now_text || '',
      dream: row.dream_text || '',
      unknown: Boolean(row.unknown_at),
    }
  }
  return out
}

function anyBeatWritten(areas: AreaMap): boolean {
  return LIFE_CATEGORY_KEYS.some((k) => areas[k].now.trim() || areas[k].dream.trim())
}

function StartFromScratch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { refreshVisions } = useLifeVisionStudio()

  const [draftId, setDraftId] = useState<string | null>(null)
  /** The open draft already holds vision text; Write will overwrite it. */
  const [draftHasText, setDraftHasText] = useState(false)
  const [areas, setAreas] = useState<AreaMap>(emptyAreas)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedKey, setExpandedKey] = useState<LifeCategoryKey | null>(null)
  const [explainerOpen, setExplainerOpen] = useState(true)
  const [confirmWrite, setConfirmWrite] = useState(false)
  const [composing, setComposing] = useState<{ pending: string[]; done: string[] } | null>(null)
  const [written, setWritten] = useState<Record<string, string>>({})
  const bootedRef = useRef(false)

  useLifeVisionStudioAreaChrome(useMemo(() => ({}), []))

  const requestedArea = searchParams.get('area')

  const pickInitialExpanded = useCallback((map: AreaMap): LifeCategoryKey => {
    if (requestedArea && isLifeCategoryKey(requestedArea)) return requestedArea
    const firstOpen = LIFE_CATEGORY_KEYS.find((k) => !areaIsReady(map[k]))
    return firstOpen ?? LIFE_CATEGORY_KEYS[0]
  }, [requestedArea])

  const applySession = useCallback((data: StartResponse) => {
    const map = areasFromSession(data.session)
    setDraftId(data.draft.id)
    setDraftHasText(draftHasAnyVisionText(data.draft))
    setAreas(map)
    setExpandedKey(pickInitialExpanded(map))
    setExplainerOpen(!anyBeatWritten(map))
    queryClient.setQueryData([...keys.visionDraftSession, data.draft.id], data.session)
    refreshVisions().catch(() => {})
  }, [pickInitialExpanded, queryClient, refreshVisions])

  // One personal draft exists; the scratch beats attach to it. Nothing in the
  // draft is touched until Write My Life Vision.
  const boot = useCallback(async () => {
    try {
      const res = await fetch('/api/vision/draft/start', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Could not start your Life Vision')
      }
      applySession((await res.json()) as StartResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start your Life Vision')
    } finally {
      setLoading(false)
    }
  }, [applySession])

  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    void boot()
  }, [boot])

  // ------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------
  const saveBeat = useCallback(async (category: LifeCategoryKey, beat: AreaBeat, text: string) => {
    if (!draftId) return
    const res = await fetch('/api/vision/draft/area-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId, category, beat, text }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || 'Could not save')
    }
    if (text.trim()) {
      setAreas((prev) => (prev[category].unknown ? { ...prev, [category]: { ...prev[category], unknown: false } } : prev))
    }
    queryClient.invalidateQueries({ queryKey: [...keys.visionDraftSession, draftId] })
  }, [draftId, queryClient])

  const markUnknown = useCallback(async (category: LifeCategoryKey) => {
    if (!draftId) return
    setAreas((prev) => ({ ...prev, [category]: { ...prev[category], unknown: true } }))
    await fetch('/api/vision/draft/area-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId, category, unknown: true }),
    }).catch(() => {})
    queryClient.invalidateQueries({ queryKey: [...keys.visionDraftSession, draftId] })
  }, [draftId, queryClient])

  const handleChange = useCallback((category: LifeCategoryKey, beat: AreaBeat, text: string) => {
    setAreas((prev) => ({ ...prev, [category]: { ...prev[category], [beat]: text } }))
    setExplainerOpen((open) => (open && text.trim() ? false : open))
  }, [])

  const areasRef = useRef(areas)
  areasRef.current = areas

  const goToNextArea = useCallback((from: LifeCategoryKey) => {
    const current = areasRef.current
    const idx = LIFE_CATEGORY_KEYS.indexOf(from)
    const after = LIFE_CATEGORY_KEYS.slice(idx + 1)
    const before = LIFE_CATEGORY_KEYS.slice(0, idx)
    const nextOpen = [...after, ...before].find((k) => !areaIsReady(current[k]))
    const next = nextOpen ?? after[0] ?? null
    setExpandedKey(next)
    if (!next) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // ------------------------------------------------------------------
  // Compose: all 12 through compose-first, then hand off to VIVA edits.
  // ------------------------------------------------------------------
  const readyKeys = useMemo(
    () => new Set(LIFE_CATEGORY_KEYS.filter((k) => areaIsReady(areas[k]))),
    [areas],
  )

  const runCompose = useCallback(async () => {
    if (!draftId || composing) return
    setError(null)
    setComposing({ pending: [...LIFE_CATEGORY_KEYS], done: [] })
    setExpandedKey(null)
    try {
      const res = await fetch('/api/vision/draft/compose-first', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Could not write your vision')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const handle = (line: string) => {
        if (!line.trim()) return
        let evt: Record<string, unknown>
        try { evt = JSON.parse(line) } catch { return }
        if (evt.type === 'stage' && evt.stage === 'vision' && typeof evt.category === 'string' && typeof evt.text === 'string') {
          const category = evt.category
          const text = evt.text
          setWritten((prev) => ({ ...prev, [category]: text }))
          setComposing((prev) => prev
            ? { pending: prev.pending.filter((k) => k !== category), done: [...prev.done, category] }
            : prev)
          if (isLifeCategoryKey(category)) setExpandedKey(category)
        } else if (evt.type === 'error') {
          throw new Error(typeof evt.message === 'string' ? evt.message : 'Compose failed')
        }
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

      queryClient.invalidateQueries({ queryKey: [...keys.visionDraftSession, draftId] })
      await refreshVisions().catch(() => {})
      router.push('/life-vision/update')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not write your vision')
      setComposing(null)
    }
  }, [draftId, composing, queryClient, refreshVisions, router])

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  const lastKey = LIFE_CATEGORY_KEYS[LIFE_CATEGORY_KEYS.length - 1]

  return (
    <Container size="xl">
      <div className="space-y-3 pb-24">
        <ScratchProgress
          readyKeys={readyKeys}
          total={LIFE_CATEGORY_KEYS.length}
          composing={Boolean(composing)}
          composedCount={composing?.done.length ?? 0}
          onWrite={() => {
            if (draftHasText) setConfirmWrite(true)
            else void runCompose()
          }}
          disabled={!draftId}
        />

        {error && (
          <div className="rounded-xl border border-[#FF0040]/40 bg-[#FF0040]/10 px-4 py-3 text-sm text-[#ff8ba7]">
            {error}
          </div>
        )}

        <ScratchExplainer open={explainerOpen} onToggle={() => setExplainerOpen((o) => !o)} />

        {LIFE_CATEGORY_KEYS.map((key) => (
          <ScratchAreaRow
            key={key}
            category={key}
            state={areas[key]}
            expanded={expandedKey === key}
            onToggle={() => setExpandedKey((prev) => (prev === key ? null : key))}
            onChange={(beat, text) => handleChange(key, beat, text)}
            onSave={(beat, text) => saveBeat(key, beat, text)}
            onUnknown={() => markUnknown(key)}
            onNextArea={() => goToNextArea(key)}
            isLast={key === lastKey}
            writing={composing?.pending.includes(key)}
            writtenText={written[key] ?? null}
            disabled={Boolean(composing)}
          />
        ))}
      </div>

      <WarningConfirmationDialog
        isOpen={confirmWrite}
        onClose={() => setConfirmWrite(false)}
        onConfirm={() => {
          setConfirmWrite(false)
          void runCompose()
        }}
        type="draft"
        title="Write over your current draft?"
        message="VIVA writes all 12 areas from what you wrote here. The text in your current draft is replaced."
        confirmText="Write My Life Vision"
        cancelText="Not yet"
      />
    </Container>
  )
}

export default function StartFromScratchPage() {
  return (
    <Suspense
      fallback={(
        <Container size="xl" className="flex min-h-[50vh] items-center justify-center">
          <Spinner size="lg" />
        </Container>
      )}
    >
      <StartFromScratch />
    </Suspense>
  )
}
