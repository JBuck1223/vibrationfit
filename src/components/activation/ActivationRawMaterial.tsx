'use client'

/**
 * Free Activation intake — the Start Fresh capture for one life area.
 *
 * Two beats ("What's going on now" / "Unleash your imagination") in the same
 * tabbed panel as /life-vision/start, a recording textarea, a word meter, and
 * a footer button that walks now → imagination → Create My Activation.
 *
 * Persists straight to the activations row: now → current_state,
 * imagination → dream_response.want. Autosave on blur, tab switch, and after
 * 10 s idle. Create unlocks when both beats clear ACTIVATION_VISION_SOURCE_MIN.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Spinner } from '@/lib/design-system/components'
import {
  getVisionCategoryIcon,
  getVisionCategoryLabel,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import { AREA_EXPLAINER, BEAT_LABEL } from '@/components/life-vision/scratch/ScratchAreaRow'
import type { AreaBeat } from '@/lib/life-vision/draft-session'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import {
  ACTIVATION_VISION_SOURCE_MIN,
  countWords,
  describeIntakeSubstance,
} from '@/lib/activation/intake-markers'

const IDLE_SAVE_MS = 10_000

const BEAT_FLOOR: Record<AreaBeat, number> = {
  now: ACTIVATION_VISION_SOURCE_MIN.currentStateWords,
  dream: ACTIVATION_VISION_SOURCE_MIN.wantWords,
}

export interface ActivationRawMaterialFields {
  current_state: string | null
  dream_response: Record<string, string> | null
  intake_ready_at: string | null
}

interface ActivationRawMaterialProps {
  activationId: string
  category: LifeCategoryKey
  initialNow?: string | null
  initialDream?: string | null
  /** Fires after each successful save with the row's fields. */
  onFieldsChange?: (fields: ActivationRawMaterialFields) => void
  onCreate: () => void
  creating?: boolean
  error?: string | null
  /** Admin inspector: render with sample text, no persistence. */
  readOnly?: boolean
}

function WordMeter({ words, floor }: { words: number; floor: number }) {
  const copy = ACTIVATION_COPY.rawMaterial
  if (words === 0) return <span className="text-[11px] text-neutral-600">{copy.meterEmpty}</span>
  if (words < floor) {
    return (
      <span className="text-[11px] text-neutral-500">
        {words} {words === 1 ? 'word' : 'words'} · {copy.meterKeepGoing}
      </span>
    )
  }
  return <span className="text-[11px] text-[#39FF14]">{words} words · {copy.meterEnough}</span>
}

function HowThisWorks({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const copy = ACTIVATION_COPY.rawMaterial
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#161616] transition-all hover:border-[#3a3a3a]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-[#BF00FF]" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{copy.howTitle}</span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />}
      </button>
      {open && (
        <div className="space-y-3 border-t border-white/5 px-4 pb-4 pt-4 text-sm leading-relaxed text-neutral-300">
          <h2 className="text-base font-semibold text-white">{copy.explainerTitle}</h2>
          <p>{copy.explainerIntro}</p>
          <p>
            <span className="font-semibold text-white">{copy.nowTitle}</span>
            <br />
            {copy.nowBody}
          </p>
          <p>
            <span className="font-semibold text-white">{copy.dreamTitle}</span>
            <br />
            {copy.dreamBody}
          </p>
          <p>
            <span className="font-semibold text-white">{copy.flowTitle}</span>
            <br />
            {copy.flowBody}
          </p>
        </div>
      )}
    </div>
  )
}

export function ActivationRawMaterial({
  activationId,
  category,
  initialNow,
  initialDream,
  onFieldsChange,
  onCreate,
  creating,
  error,
  readOnly,
}: ActivationRawMaterialProps) {
  const copy = ACTIVATION_COPY.rawMaterial
  const Icon = getVisionCategoryIcon(category)
  const label = getVisionCategoryLabel(category)

  const [text, setText] = useState<Record<AreaBeat, string>>({
    now: initialNow || '',
    dream: initialDream || '',
  })
  const nowDone = text.now.trim().length > 0
  const dreamDone = text.dream.trim().length > 0

  const [beat, setBeat] = useState<AreaBeat>(nowDone && !dreamDone ? 'dream' : 'now')
  const [howOpen, setHowOpen] = useState(!nowDone && !dreamDone)
  const [saving, setSaving] = useState<AreaBeat | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const lastSavedRef = useRef<Record<AreaBeat, string>>({ now: text.now, dream: text.dream })
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textRef = useRef(text)
  textRef.current = text
  const onFieldsChangeRef = useRef(onFieldsChange)
  onFieldsChangeRef.current = onFieldsChange

  const substance = describeIntakeSubstance({
    category,
    current_state: text.now,
    dream_response: { want: text.dream },
  })
  const ready = substance.ready

  const saveBeat = useCallback(async (which: AreaBeat) => {
    if (readOnly) return
    const value = textRef.current[which]
    if (value.trim() === lastSavedRef.current[which].trim()) return
    setSaving(which)
    setSaveError(null)
    try {
      const body = which === 'now'
        ? { current_state: value }
        : { dream_response: { want: value, why: '', feel: '', become: '' } }
      const res = await fetch(`/api/activation/${activationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')
      lastSavedRef.current[which] = value
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 1200)
      const row = data.activation
      onFieldsChangeRef.current?.({
        current_state: row?.current_state ?? null,
        dream_response: row?.dream_response ?? null,
        intake_ready_at: row?.intake_ready_at ?? null,
      })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving((prev) => (prev === which ? null : prev))
    }
  }, [activationId, readOnly])

  // Idle autosave for the open beat.
  const currentText = text[beat]
  useEffect(() => {
    if (readOnly) return
    if (currentText.trim() === lastSavedRef.current[beat].trim()) return
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => { void saveBeat(beat) }, IDLE_SAVE_MS)
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [currentText, beat, readOnly, saveBeat])

  // Flush on unmount.
  useEffect(() => () => {
    void saveBeat('now')
    void saveBeat('dream')
  }, [saveBeat])

  const switchBeat = (next: AreaBeat) => {
    if (next === beat) return
    void saveBeat(beat)
    setBeat(next)
  }

  const handleNext = async () => {
    if (beat === 'now') {
      void saveBeat('now')
      setBeat('dream')
      return
    }
    await Promise.all([saveBeat('now'), saveBeat('dream')])
    onCreate()
  }

  const nowShort = Math.max(0, BEAT_FLOOR.now - substance.currentWords)
  const dreamShort = Math.max(0, BEAT_FLOOR.dream - substance.wantWords)
  const hint = beat === 'dream' && !ready
    ? nowShort > 0 ? copy.moreNow(nowShort) : copy.moreDream(dreamShort)
    : null

  const busy = !!creating

  return (
    <div className="space-y-3 pb-24">
      <HowThisWorks open={howOpen} onToggle={() => setHowOpen((o) => !o)} />

      <div className="rounded-2xl border border-[#BF00FF]/50 bg-[#161616] shadow-[0_0_20px_rgba(191,0,255,0.10)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Icon className="h-4 w-4 shrink-0 text-[#BF00FF]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{label}</span>
            <span title={AREA_EXPLAINER[category]} className="block truncate text-xs font-normal text-neutral-500">
              {AREA_EXPLAINER[category]}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span title={BEAT_LABEL.now} className={`h-2 w-2 rounded-full ${nowDone ? 'bg-[#39FF14]' : 'bg-[#3a3a3a]'}`} />
            <span title={BEAT_LABEL.dream} className={`h-2 w-2 rounded-full ${dreamDone ? 'bg-[#39FF14]' : 'bg-[#3a3a3a]'}`} />
          </span>
        </div>

        <div className="mx-3 mb-3 overflow-hidden rounded-xl border border-[#2e2e2e]">
          <div role="tablist" aria-label={`${label} beats`} className="grid grid-cols-2 bg-[#101010]">
            {(['now', 'dream'] as AreaBeat[]).map((b) => {
              const active = beat === b
              const done = b === 'now' ? nowDone : dreamDone
              return (
                <button
                  key={b}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchBeat(b)}
                  className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#1c1c1c] text-white shadow-[inset_0_-2px_0_#39FF14]'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-[#39FF14]' : 'bg-[#3a3a3a]'}`} />
                  {BEAT_LABEL[b]}
                </button>
              )
            })}
          </div>

          <div className="bg-[#1c1c1c]">
            <div className="px-3 pt-3" onBlurCapture={() => { void saveBeat(beat) }}>
              <RecordingTextarea
                value={text[beat]}
                onChange={(value) => setText((prev) => ({ ...prev, [beat]: value }))}
                placeholder={`${label} · ${BEAT_LABEL[beat].toLowerCase()}`}
                rows={8}
                className="min-h-[45vh] text-base leading-relaxed md:min-h-[320px]"
                storageFolder="lifeVision"
                recordingPurpose="quick"
                category={category}
                instanceId={`activation-${activationId}-${beat}`}
                hideClear
                disabled={busy || readOnly}
              />
            </div>

            <div className="sticky bottom-0 z-10 mt-2 border-t border-white/5 bg-[#1c1c1c]/95 px-4 py-3 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <WordMeter words={countWords(text[beat])} floor={BEAT_FLOOR[beat]} />
                  {saving && <Loader2 className="h-3 w-3 animate-spin text-neutral-500" />}
                  {!saving && savedFlash && <span className="text-[11px] text-neutral-500">{copy.saved}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => { void handleNext() }}
                  disabled={busy || readOnly || (beat === 'dream' && !ready)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#39FF14] px-3 py-1.5 text-xs font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.25)] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {beat === 'now' ? (
                    <>
                      {copy.nextBeat}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : busy ? (
                    <>
                      <Spinner variant="primary" size="sm" className="h-3.5 w-3.5" />
                      {copy.creating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      {copy.create}
                    </>
                  )}
                </button>
              </div>
              {hint && <p className="mt-2 text-[11px] text-neutral-500">{hint}</p>}
              {(saveError || error) && (
                <p className="mt-2 text-[11px] text-red-400">{saveError || error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
