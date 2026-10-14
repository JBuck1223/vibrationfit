'use client'

/**
 * Talk it out — VIVA-directed long-form intake on /life-vision/start.
 *
 * One prompt card (VIVA's invitation, with the areas it aims at), one tall
 * capture box with the mic as the primary control, a word meter that speaks
 * to volume, and a "Done talking" button. Each turn posts to
 * /api/vision/draft/turn; the reply is tagged across areas, and the next card
 * comes back. In-progress text is kept in localStorage so a reload mid-ramble
 * loses nothing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import {
  getVisionCategoryIcon,
  getVisionCategoryLabel,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import { countWords } from '@/lib/life-vision/draft-session'
import { CORE_FOUR_ANCHORS } from '@/lib/viva/prompts/vision-director-prompts'

export interface DirectedPromptCard {
  targets: LifeCategoryKey[]
  prompt: string
  anchored: boolean
  anchorIndex: number | null
}

interface DirectedCaptureProps {
  draftId: string
  turnCount: number
  /** Null while loading; `done: true` once every area is cleared. */
  card: DirectedPromptCard | null
  loadingCard: boolean
  done: boolean
  /** Resolves with the next card (or null when done). */
  onSubmit: (text: string, card: DirectedPromptCard) => Promise<void>
  disabled?: boolean
  error?: string | null
}

const WORDS_ENOUGH = 60
const WORDS_PLENTY = 200
const MIN_WORDS = 3

function storageKey(draftId: string, turnCount: number) {
  return `vf_directed_draft_${draftId}_${turnCount}`
}

function WordMeter({ words }: { words: number }) {
  if (words === 0) return <span className="text-[11px] text-neutral-600">Tap the mic and talk, or type.</span>
  if (words < WORDS_ENOUGH) {
    return <span className="text-[11px] text-neutral-500">{words} {words === 1 ? 'word' : 'words'} · keep going</span>
  }
  if (words < WORDS_PLENTY) {
    return <span className="text-[11px] text-[#39FF14]">{words} words · That&apos;s real material. Keep going if there&apos;s more.</span>
  }
  return <span className="text-[11px] text-[#39FF14]">{words} words · VIVA has plenty here.</span>
}

export function DirectedCapture({
  draftId,
  turnCount,
  card,
  loadingCard,
  done,
  onSubmit,
  disabled,
  error,
}: DirectedCaptureProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Restore / persist the in-progress ramble per turn.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(draftId, turnCount))
      setText(saved || '')
    } catch {
      setText('')
    }
  }, [draftId, turnCount])

  useEffect(() => {
    try {
      const key = storageKey(draftId, turnCount)
      if (text.trim()) localStorage.setItem(key, text)
      else localStorage.removeItem(key)
    } catch {
      /* storage unavailable */
    }
  }, [text, draftId, turnCount])

  const words = countWords(text)
  const canSubmit = !!card && !done && !submitting && !disabled && words >= MIN_WORDS

  const handleSubmit = useCallback(async () => {
    if (!card || !canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit(text, card)
      try { localStorage.removeItem(storageKey(draftId, turnCount)) } catch { /* noop */ }
      setText('')
      window.setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
    } finally {
      setSubmitting(false)
    }
  }, [card, canSubmit, onSubmit, text, draftId, turnCount])

  const targetChips = useMemo(() => {
    if (!card) return []
    return card.targets.map((key) => ({ key, label: getVisionCategoryLabel(key), Icon: getVisionCategoryIcon(key) }))
  }, [card])

  const stageLabel = card?.anchored && card.anchorIndex != null
    ? `${card.anchorIndex + 1} of ${CORE_FOUR_ANCHORS.length}`
    : card
      ? 'filling in the rest'
      : null

  return (
    <div ref={cardRef} className="scroll-mt-24 space-y-3">
      {/* Prompt card */}
      <div className="rounded-2xl border border-[#BF00FF]/50 bg-[#161616] shadow-[0_0_20px_rgba(191,0,255,0.10)]">
        <div className="flex items-start gap-3 px-4 py-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#BF00FF]" />
          <div className="min-w-0 flex-1 space-y-3">
            {done ? (
              <p className="text-sm leading-relaxed text-neutral-200">
                I have all 12. <span className="font-semibold text-white">Write My Life Vision</span> is lit above.
              </p>
            ) : loadingCard || !card ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {turnCount === 0 ? 'VIVA is getting ready.' : 'VIVA is sorting that into your areas.'}
              </div>
            ) : (
              <>
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-200">{card.prompt}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {targetChips.map(({ key, label, Icon }) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 rounded-full border border-[#BF00FF]/40 bg-[#BF00FF]/10 px-2 py-0.5 text-[11px] text-[#d580ff]"
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </span>
                  ))}
                  {stageLabel && (
                    <span className="ml-1 text-[11px] text-neutral-500">{stageLabel}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Capture */}
      {!done && (
        <div className="overflow-hidden rounded-2xl border border-[#2e2e2e] bg-[#1c1c1c]">
          <div className="px-3 pt-3">
            <RecordingTextarea
              value={text}
              onChange={setText}
              placeholder="...or type here."
              rows={10}
              className="min-h-[55vh] text-base leading-relaxed md:min-h-[380px]"
              storageFolder="lifeVision"
              recordingPurpose="quick"
              category="directed"
              instanceId={`directed-${draftId}-${turnCount}`}
              hideClear
              micEmphasis
              disabled={disabled || submitting || loadingCard || !card}
            />
          </div>
          <div className="sticky bottom-0 z-10 mt-2 border-t border-white/5 bg-[#1c1c1c]/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <WordMeter words={words} />
              <button
                type="button"
                onClick={() => { void handleSubmit() }}
                disabled={!canSubmit}
                className="inline-flex items-center gap-1 rounded-full bg-[#39FF14] px-3 py-1.5 text-xs font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.25)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Sorting
                  </>
                ) : (
                  <>
                    Done talking
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
            {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
