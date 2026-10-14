'use client'

/**
 * Admin test bench for the VIVA-directed Life Vision intake ("Talk it out").
 *
 * Runs against the admin's own personal draft session, the same one
 * /life-vision/start writes into, so anything said here lands in the rows
 * there and counts toward the same depth gate. Not linked from member chrome.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Container, Text } from '@/lib/design-system/components'
import {
  LIFE_CATEGORY_KEYS,
  getVisionCategoryLabel,
  isLifeCategoryKey,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import type { DepthSummary, DraftSessionPayload } from '@/lib/life-vision/draft-session'
import type { AreaSummary } from '@/lib/life-vision/vision-director'
import {
  DirectedCapture,
  type DirectedPromptCard,
} from '@/components/life-vision/scratch/DirectedCapture'

interface StartResponse {
  draft: { id: string }
  session: DraftSessionPayload
  depth: DepthSummary
  areas: AreaSummary[]
}

interface TurnResponse {
  ok: boolean
  turnCount: number
  depth: DepthSummary
  areas: AreaSummary[]
  nextPrompt: DirectedPromptCard | null
}

const DEPTH_TONE: Record<AreaSummary['depth'], string> = {
  cleared: 'text-[#39FF14]',
  thin: 'text-[#FFB701]',
  empty: 'text-neutral-500',
  unknown: 'text-neutral-400',
}

export default function AdminTalkItOutPage() {
  const [draftId, setDraftId] = useState<string | null>(null)
  const [depth, setDepth] = useState<DepthSummary | null>(null)
  const [coverage, setCoverage] = useState<AreaSummary[]>([])
  const [turnCount, setTurnCount] = useState(0)
  const [card, setCard] = useState<DirectedPromptCard | null>(null)
  const [cardLoading, setCardLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openArea, setOpenArea] = useState<LifeCategoryKey | null>(null)
  const bootedRef = useRef(false)
  const cardForTurnRef = useRef(-1)

  const readyToCompose = depth?.readyToCompose ?? false

  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    fetch('/api/vision/draft/start', { method: 'POST' })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as Partial<StartResponse> & { error?: string }
        if (!res.ok || !data.draft) throw new Error(data?.error || 'Could not load your draft')
        setDraftId(data.draft.id)
        if (data.depth) setDepth(data.depth)
        if (data.areas) setCoverage(data.areas)
        setTurnCount(data.session?.turns?.length ?? 0)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your draft'))
  }, [])

  // Current card for this turn (fixed opener on turn 1, director after).
  useEffect(() => {
    if (!draftId || readyToCompose || cardForTurnRef.current === turnCount) return
    let cancelled = false
    cardForTurnRef.current = turnCount
    setCardLoading(true)
    setError(null)
    fetch('/api/vision/draft/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId, peek: true }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as Partial<TurnResponse> & { error?: string }
        if (!res.ok) throw new Error(data?.error || 'Could not load the next prompt')
        if (cancelled) return
        if (data.depth) setDepth(data.depth)
        if (data.areas) setCoverage(data.areas)
        setCard(data.nextPrompt ?? null)
      })
      .catch((err) => {
        if (cancelled) return
        cardForTurnRef.current = -1
        setError(err instanceof Error ? err.message : 'Could not load the next prompt')
      })
      .finally(() => { if (!cancelled) setCardLoading(false) })
    return () => { cancelled = true }
  }, [draftId, turnCount, readyToCompose])

  const submitTurn = useCallback(async (text: string, current: DirectedPromptCard) => {
    if (!draftId) return
    setError(null)
    setCardLoading(true)
    try {
      const res = await fetch('/api/vision/draft/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, promptText: current.prompt, targetCategories: current.targets, text }),
      })
      const data = (await res.json().catch(() => ({}))) as Partial<TurnResponse> & { error?: string }
      if (!res.ok) throw new Error(data?.error || 'Could not save what you said')
      if (data.depth) setDepth(data.depth)
      if (data.areas) setCoverage(data.areas)
      const next = data.turnCount ?? turnCount + 1
      cardForTurnRef.current = next
      setTurnCount(next)
      setCard(data.nextPrompt ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save what you said')
      throw err
    } finally {
      setCardLoading(false)
    }
  }, [draftId, turnCount])

  const byKey = new Map<LifeCategoryKey, AreaSummary>()
  for (const a of coverage) if (isLifeCategoryKey(a.category)) byKey.set(a.category, a)

  return (
    <Container size="xl">
      <div className="space-y-4 pb-24">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Text className="max-w-2xl text-sm text-neutral-400">
            VIVA-directed intake, running against your own Life Vision draft. Turns land in the same
            session as{' '}
            <Link href="/life-vision/start" className="inline-flex items-center gap-1 text-[#39FF14] hover:underline">
              Start Fresh <ExternalLink className="h-3 w-3" />
            </Link>
            , so what you say here shows up in those rows.
          </Text>
          <Text className="text-xs text-neutral-500">
            Turns: {turnCount}
            {depth && (
              <>
                {' '}· cleared {depth.cleared.length} · thin {depth.thin.length} · empty {depth.empty.length} · unknown{' '}
                {depth.unknown.length} · {depth.totalMemberWords} words
              </>
            )}
          </Text>
        </div>

        {draftId ? (
          <DirectedCapture
            draftId={draftId}
            turnCount={turnCount}
            card={card}
            loadingCard={cardLoading}
            done={readyToCompose}
            onSubmit={submitTurn}
            error={error}
          />
        ) : error ? (
          <div className="rounded-xl border border-[#FF0040]/40 bg-[#FF0040]/10 px-4 py-3 text-sm text-[#ff8ba7]">
            {error}
          </div>
        ) : (
          <Text className="text-sm text-neutral-500">Loading your draft.</Text>
        )}

        <div className="rounded-xl border border-[#2e2e2e] bg-[#101010]">
          <p className="border-b border-[#2e2e2e] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Where the words landed
          </p>
          <ul className="divide-y divide-[#1f1f1f]">
            {LIFE_CATEGORY_KEYS.map((key) => {
              const a = byKey.get(key)
              const count = (a?.contrast.length ?? 0) + (a?.clarity.length ?? 0) + (a?.unknown.length ?? 0)
              const open = openArea === key
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenArea(open ? null : key)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#161616]"
                    aria-expanded={open}
                  >
                    <span className="text-neutral-200">{getVisionCategoryLabel(key)}</span>
                    <span className="flex items-center gap-3 text-xs">
                      <span className="text-neutral-500">{a?.memberWords ?? 0} words</span>
                      <span className="text-neutral-500">{count} passages</span>
                      {a?.nowDone || a?.dreamDone ? <span className="text-neutral-500">row</span> : null}
                      <span className={`w-14 text-right font-medium ${DEPTH_TONE[a?.depth ?? 'empty']}`}>
                        {a?.depth ?? 'empty'}
                      </span>
                    </span>
                  </button>
                  {open && a && count > 0 && (
                    <div className="space-y-2 px-4 pb-3 text-sm">
                      {a.contrast.map((p, i) => (
                        <p key={`c${i}`} className="border-l-2 border-[#FFB701]/60 pl-3 text-neutral-300">{p}</p>
                      ))}
                      {a.clarity.map((p, i) => (
                        <p key={`k${i}`} className="border-l-2 border-[#39FF14]/60 pl-3 text-neutral-300">{p}</p>
                      ))}
                      {a.unknown.map((p, i) => (
                        <p key={`u${i}`} className="border-l-2 border-neutral-600 pl-3 text-neutral-400">{p}</p>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Container>
  )
}
