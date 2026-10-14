'use client'

/**
 * Start From Scratch — /life-vision/start
 *
 * The member writes two beats per life area, in their own words: "What's
 * going on now" and "Unleash your imagination". That raw material is stored
 * on a `scratch` draft session. When all 12 areas are ready, Write My Life
 * Vision opens /life-vision/write, where the vision streams in one area at a
 * time. These notes stay here, so they can add more and write again.
 *
 * The VIVA-directed "Talk it out" intake writes into the same session and is
 * admin-only for now at /admin/talk-it-out.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Container, Spinner } from '@/lib/design-system/components'
import { WarningConfirmationDialog } from '@/lib/design-system/components/overlays'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'
import { useLifeVisionStudioAreaChrome } from '@/components/life-vision-studio/useLifeVisionStudioAreaChrome'
import {
  LIFE_CATEGORY_KEYS,
  getVisionCategoryLabel,
  isLifeCategoryKey,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import {
  draftHasAnyVisionText,
  type AreaBeat,
  type DepthSummary,
  type DraftSessionPayload,
} from '@/lib/life-vision/draft-session'
import type { AreaSummary } from '@/lib/life-vision/vision-director'
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
  depth: DepthSummary
  areas: AreaSummary[]
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
  const bootedRef = useRef(false)

  // Server coverage: depth gate + tagged passages per area (shared with the
  // admin Talk it out flow, which writes into the same session).
  const [depth, setDepth] = useState<DepthSummary | null>(null)
  const [coverage, setCoverage] = useState<AreaSummary[]>([])

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
    setDepth(data.depth)
    setCoverage(data.areas)
    setExplainerOpen(!anyBeatWritten(map))
    setExpandedKey(pickInitialExpanded(map))
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
    const data = (await res.json().catch(() => null)) as { depth?: DepthSummary; areas?: AreaSummary[] } | null
    if (data?.depth) setDepth(data.depth)
    if (data?.areas) setCoverage(data.areas)
    if (text.trim()) {
      setAreas((prev) => (prev[category].unknown ? { ...prev, [category]: { ...prev[category], unknown: false } } : prev))
    }
    queryClient.invalidateQueries({ queryKey: [...keys.visionDraftSession, draftId] })
  }, [draftId, queryClient])

  const handleChange = useCallback((category: LifeCategoryKey, beat: AreaBeat, text: string) => {
    setAreas((prev) => ({ ...prev, [category]: { ...prev[category], [beat]: text } }))
    setExplainerOpen((open) => (open && text.trim() ? false : open))
  }, [])

  const areasRef = useRef(areas)
  areasRef.current = areas
  const readyKeysRef = useRef<Set<LifeCategoryKey>>(new Set())

  const goToNextArea = useCallback((from: LifeCategoryKey) => {
    const current = areasRef.current
    const idx = LIFE_CATEGORY_KEYS.indexOf(from)
    const after = LIFE_CATEGORY_KEYS.slice(idx + 1)
    const before = LIFE_CATEGORY_KEYS.slice(0, idx)
    const nextOpen = [...after, ...before].find((k) => !readyKeysRef.current.has(k) && !areaIsReady(current[k]))
    const next = nextOpen ?? after[0] ?? null
    setExpandedKey(next)
    window.setTimeout(() => {
      if (!next) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      document.getElementById(`scratch-area-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }, [])

  const goWrite = useCallback(() => {
    if (!draftId) return
    try { sessionStorage.setItem(`vf_write_${draftId}`, `go:${Date.now()}`) } catch { /* storage unavailable */ }
    router.push('/life-vision/write')
  }, [draftId, router])

  // Progress: the server depth gate when we have it,
  // the local "both beats written" check until the first response lands.
  const readyKeys = useMemo(() => {
    if (depth) return new Set<LifeCategoryKey>([...depth.cleared, ...depth.unknown])
    return new Set(LIFE_CATEGORY_KEYS.filter((k) => areaIsReady(areas[k])))
  }, [depth, areas])
  readyKeysRef.current = readyKeys

  const pendingLabels = useMemo(
    () => LIFE_CATEGORY_KEYS.filter((k) => !readyKeys.has(k)).map((k) => getVisionCategoryLabel(k)),
    [readyKeys],
  )

  const coverageByKey = useMemo(() => {
    const map = new Map<LifeCategoryKey, AreaSummary>()
    for (const a of coverage) if (isLifeCategoryKey(a.category)) map.set(a.category, a)
    return map
  }, [coverage])

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
        <ScratchExplainer open={explainerOpen} onToggle={() => setExplainerOpen((o) => !o)} />

        <ScratchProgress
          readyKeys={readyKeys}
          total={LIFE_CATEGORY_KEYS.length}
          onWrite={() => {
            if (draftHasText) setConfirmWrite(true)
            else goWrite()
          }}
          disabled={!draftId}
          pendingLabels={pendingLabels}
        />

        {error && (
          <div className="rounded-xl border border-[#FF0040]/40 bg-[#FF0040]/10 px-4 py-3 text-sm text-[#ff8ba7]">
            {error}
          </div>
        )}

        {LIFE_CATEGORY_KEYS.map((key) => {
          const summary = coverageByKey.get(key)
          return (
            <ScratchAreaRow
              key={key}
              category={key}
              state={areas[key]}
              expanded={expandedKey === key}
              onToggle={() => setExpandedKey((prev) => (prev === key ? null : key))}
              onChange={(beat, text) => handleChange(key, beat, text)}
              onSave={(beat, text) => saveBeat(key, beat, text)}
              onNextArea={() => goToNextArea(key)}
              isLast={key === lastKey}
              memberWords={summary?.memberWords}
              ready={depth ? readyKeys.has(key) : undefined}
            />
          )
        })}
      </div>

      <WarningConfirmationDialog
        isOpen={confirmWrite}
        onClose={() => setConfirmWrite(false)}
        onConfirm={() => {
          setConfirmWrite(false)
          goWrite()
        }}
        type="draft"
        title="Write over your current draft?"
        message="VIVA writes all 12 areas from what you wrote here, and you watch each one come in. The text in your current draft is replaced. Your notes stay on this page, so you can add more and write again."
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
