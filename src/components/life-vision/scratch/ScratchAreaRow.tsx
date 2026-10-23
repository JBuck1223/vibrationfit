'use client'

/**
 * One life area in Start From Scratch. Same accordion chrome as the update
 * page rows. Inside: two beats ("What's going on now" / "Unleash your
 * imagination"), a recording textarea, a word meter that never goes red, and
 * a footer with Next.
 *
 * Autosave: on blur and after 10 s idle, only when the text changed since the
 * last save. The parent owns persistence.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { useInShell } from '@/lib/app-shell/shell-context'
import {
  getVisionCategoryIcon,
  getVisionCategoryLabel,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import { countWords, type AreaBeat } from '@/lib/life-vision/draft-session'

export interface ScratchAreaState {
  now: string
  dream: string
  unknown: boolean
}

export const BEAT_LABEL: Record<AreaBeat, string> = {
  now: "What's going on now",
  dream: 'Unleash your imagination',
}

/** Phone-width labels for the beat switch, where the full ones don't fit. */
const BEAT_SHORT_LABEL: Record<AreaBeat, string> = {
  now: 'Right now',
  dream: 'Imagination',
}

export const AREA_EXPLAINER: Record<LifeCategoryKey, string> = {
  fun: 'Play, hobbies, entertainment, and the things you do simply because you enjoy them.',
  health: 'Your physical and mental well-being, including energy, fitness, nutrition, rest, and caring for yourself.',
  travel: 'Trips, getaways, and exploring places—from local discoveries to adventures around the world.',
  love: 'Romance, intimacy, and partnership, including the connection you share with a partner and your experience of romantic love.',
  family: 'Your relationships with family, including parenting, extended family, chosen family, and the life you share.',
  social: 'Friendships, community, and belonging—the people you spend time with and the connections you build.',
  home: 'Where you live and how it feels, including your surroundings, living spaces, and the atmosphere of everyday life.',
  work: 'Your career, business, or vocation—the work you do, what you contribute, and how it fits into your life.',
  money: 'Your financial life, including income, savings, spending, investments, and your sense of security and freedom.',
  stuff: 'The things you own and use—from everyday favorites to special purchases that bring enjoyment, convenience, or comfort.',
  giving: 'Your contribution to others through generosity, service, support, and the causes you care about.',
  spirituality: 'Your connection to meaning, purpose, and something greater than yourself, including beliefs, faith, and personal practices.',
}

/** Words in one beat before the meter turns lime. */
const BEAT_ENOUGH_WORDS = 60
const IDLE_SAVE_MS = 10_000

export function areaIsReady(state: ScratchAreaState): boolean {
  if (state.unknown) return true
  return state.now.trim().length > 0 && state.dream.trim().length > 0
}

interface ScratchAreaRowProps {
  category: LifeCategoryKey
  state: ScratchAreaState
  expanded: boolean
  onToggle: () => void
  onChange: (beat: AreaBeat, text: string) => void
  /** Persist one beat. Resolves when the server has it. */
  onSave: (beat: AreaBeat, text: string) => Promise<void>
  onNextArea: () => void
  isLast: boolean
  /** Compose state for this row. */
  writing?: boolean
  writtenText?: string | null
  disabled?: boolean
  /** Depth-gate words for this area. Falls back to beat words. */
  memberWords?: number
  /** Depth gate cleared / unknown for this area; falls back to both beats written. */
  ready?: boolean
}

function WordMeter({ words }: { words: number }) {
  if (words === 0) return <span className="text-[11px] text-neutral-600">Speak it or type it.</span>
  if (words < BEAT_ENOUGH_WORDS) {
    return <span className="text-[11px] text-neutral-500">{words} {words === 1 ? 'word' : 'words'} · keep going</span>
  }
  return (
    <span className="text-[11px] text-[#39FF14]">
      {words} words · Enough to write from. Keep going if there&apos;s more.
    </span>
  )
}

function BeatDot({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      title={`${label}${done ? ' · written' : ''}`}
      className={`h-2 w-2 rounded-full transition-colors ${done ? 'bg-[#39FF14]' : 'bg-[#3a3a3a]'}`}
    />
  )
}

export function ScratchAreaRow({
  category,
  state,
  expanded,
  onToggle,
  onChange,
  onSave,
  onNextArea,
  isLast,
  writing,
  writtenText,
  disabled,
  memberWords,
  ready: readyProp,
}: ScratchAreaRowProps) {
  const Icon = getVisionCategoryIcon(category)
  const label = getVisionCategoryLabel(category)
  // App shell: a glass card with a tinted icon bubble, a Ready tag, and a
  // pill switch between the two things VIVA needs.
  const inShell = useInShell()

  const nowDone = state.now.trim().length > 0
  const dreamDone = state.dream.trim().length > 0
  const ready = readyProp ?? areaIsReady(state)
  const totalWords = memberWords ?? countWords(state.now) + countWords(state.dream)

  const [beat, setBeat] = useState<AreaBeat>(nowDone && !dreamDone ? 'dream' : 'now')
  const [saving, setSaving] = useState<AreaBeat | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  // Last text the server has, per beat.
  const lastSavedRef = useRef<Record<AreaBeat, string>>({ now: state.now, dream: state.dream })
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const flushBeat = useCallback(async (which: AreaBeat) => {
    const text = stateRef.current[which]
    if (text.trim() === lastSavedRef.current[which].trim()) return
    setSaving(which)
    try {
      await onSave(which, text)
      lastSavedRef.current[which] = text
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 1200)
    } finally {
      setSaving((prev) => (prev === which ? null : prev))
    }
  }, [onSave])

  // Idle autosave for the open beat.
  const currentText = state[beat]
  useEffect(() => {
    if (!expanded) return
    if (currentText.trim() === lastSavedRef.current[beat].trim()) return
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      void flushBeat(beat)
    }, IDLE_SAVE_MS)
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [currentText, beat, expanded, flushBeat])

  // Flush on collapse / unmount.
  useEffect(() => {
    if (expanded) return
    void flushBeat('now')
    void flushBeat('dream')
  }, [expanded, flushBeat])
  useEffect(() => () => {
    void flushBeat('now')
    void flushBeat('dream')
  }, [flushBeat])

  const switchBeat = (next: AreaBeat) => {
    if (next === beat) return
    void flushBeat(beat)
    setBeat(next)
  }

  const handleNext = async () => {
    await flushBeat(beat)
    if (beat === 'now') {
      setBeat('dream')
      return
    }
    onNextArea()
  }

  const borderClass = writtenText
    ? 'border-[#39FF14]/50'
    : expanded
      ? 'border-[#BF00FF]/50 shadow-[0_0_20px_rgba(191,0,255,0.10)]'
      : ready
        ? 'border-[#39FF14]/30 hover:border-[#39FF14]/50'
        : 'border-[#2a2a2a] hover:border-[#3a3a3a]'

  return (
    <div
      id={`scratch-area-${category}`}
      className={`scroll-mt-24 transition-all ${inShell ? 'rounded-[20px] border bg-[linear-gradient(180deg,rgba(44,36,60,0.50)_0%,rgba(24,20,34,0.58)_100%)] shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-2xl' : 'rounded-2xl border bg-[#161616]'} ${
        inShell && !writtenText && !expanded && !ready ? 'border-white/[0.12] hover:border-white/25' : borderClass
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {inShell ? (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              writtenText || ready
                ? 'bg-[rgba(57,255,20,0.14)] text-[#39FF14]'
                : expanded
                  ? 'bg-[rgba(191,0,255,0.18)] text-[#d68bff]'
                  : 'bg-white/[0.06] text-white/60'
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        ) : (
        <Icon className={`h-4 w-4 shrink-0 ${
          writtenText ? 'text-[#39FF14]' : expanded ? 'text-[#BF00FF]' : ready ? 'text-[#39FF14]/80' : 'text-neutral-500'
        }`} />
        )}
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-white ${inShell ? 'text-[15px] font-semibold' : 'text-sm font-medium'}`}>{label}</span>
          <span title={AREA_EXPLAINER[category]} className={`block truncate text-xs font-normal ${inShell ? 'text-white/50' : 'text-neutral-500'}`}>{AREA_EXPLAINER[category]}</span>
        </span>
        {writing && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#d580ff]">
            <Loader2 className="h-3 w-3 animate-spin" />Writing
          </span>
        )}
        {!writing && !writtenText && (
          <span className="flex items-center gap-2">
            {state.unknown && !nowDone && !dreamDone ? (
              <span className="text-[11px] text-neutral-500">Don&apos;t know yet</span>
            ) : (
              <>
                {totalWords > 0 && (
                  <span className="hidden text-[11px] text-neutral-500 sm:inline">{totalWords} words</span>
                )}
                {inShell && ready ? (
                  <span className="rounded-full bg-[rgba(57,255,20,0.14)] px-2.5 py-0.5 text-[11px] font-semibold text-[#39FF14]">Ready</span>
                ) : (
                <span className="flex items-center gap-1">
                  <BeatDot done={nowDone} label={BEAT_LABEL.now} />
                  <BeatDot done={dreamDone || state.unknown} label={BEAT_LABEL.dream} />
                </span>
                )}
              </>
            )}
          </span>
        )}
        {writtenText && <Check className="h-4 w-4 text-[#39FF14]" />}
        {expanded
          ? <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />}
      </button>

      {expanded && writtenText && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">{writtenText}</p>
        </div>
      )}

      {expanded && !writtenText && (
        <div className={inShell ? 'px-2.5 pb-2.5 sm:px-3 sm:pb-3' : 'mx-3 mb-3 overflow-hidden rounded-xl border border-[#2e2e2e]'}>
          <div
            role="tablist"
            aria-label={`${label} beats`}
            className={inShell ? 'mb-3 grid grid-cols-2 gap-0.5 rounded-full border border-white/15 bg-white/[0.05] p-1' : 'grid grid-cols-2 bg-[#101010]'}
          >
            {(['now', 'dream'] as AreaBeat[]).map((b) => {
              const active = beat === b
              const done = b === 'now' ? nowDone : dreamDone
              return (
                <button
                  key={b}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={BEAT_LABEL[b]}
                  onClick={() => switchBeat(b)}
                  className={
                    inShell
                      ? `flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                          active ? 'bg-white/[0.16] text-white' : 'text-white/60 hover:text-white'
                        }`
                      : `flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                          active
                            ? 'bg-[#1c1c1c] text-white shadow-[inset_0_-2px_0_#39FF14]'
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`
                  }
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${done ? 'bg-[#39FF14]' : 'bg-[#3a3a3a]'}`} />
                  {inShell ? (
                    <>
                      <span className="whitespace-nowrap sm:hidden">{BEAT_SHORT_LABEL[b]}</span>
                      <span className="hidden whitespace-nowrap sm:inline">{BEAT_LABEL[b]}</span>
                    </>
                  ) : (
                    BEAT_LABEL[b]
                  )}
                </button>
              )
            })}
          </div>

          <div className={inShell ? 'overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] [&_textarea]:!border-0 [&_textarea]:!bg-transparent [&_textarea]:!shadow-none [&_textarea]:focus:!ring-0 [&_textarea]:!text-white [&_textarea]:placeholder:!text-white/35 [&_textarea]:!px-3.5' : 'bg-[#1c1c1c]'}>
          {/* Shell: one layer of side padding, on the text itself. */}
          <div className={inShell ? 'pt-1' : 'px-3 pt-3'} onBlurCapture={() => { void flushBeat(beat) }}>
            <RecordingTextarea
              value={state[beat]}
              onChange={(text) => onChange(beat, text)}
              placeholder={`${label} · ${BEAT_LABEL[beat].toLowerCase()}`}
              rows={6}
              className="min-h-[45vh] text-base leading-relaxed md:min-h-[300px]"
              storageFolder="lifeVision"
              recordingPurpose="quick"
              category={category}
              instanceId={`${category}-${beat}`}
              hideClear
              disabled={disabled}
            />
          </div>

          {/* Shell: a plain footer under the text, so it never covers what you wrote. */}
          <div className={`flex items-center justify-between gap-3 border-t border-white/5 px-4 py-3 ${
            inShell ? 'mt-1 px-3.5' : 'sticky bottom-0 z-10 mt-2 bg-[#1c1c1c]/95 backdrop-blur'
          }`}>
            <div className="flex min-w-0 items-center gap-2">
              <WordMeter words={countWords(state[beat])} />
              {saving && <Loader2 className="h-3 w-3 animate-spin text-neutral-500" />}
              {!saving && savedFlash && <span className="text-[11px] text-neutral-500">Saved</span>}
            </div>
            <button
                type="button"
                onClick={() => { void handleNext() }}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full bg-[#39FF14] px-3 py-1.5 text-xs font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.25)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {beat === 'now' ? 'Next: imagination' : isLast ? 'Done' : 'Next category'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}
