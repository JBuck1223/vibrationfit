'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, X } from 'lucide-react'

export const VISION_UPDATE_TOUR_STORAGE_KEY = 'vf-vision-update-tour'

export type VisionUpdateTourStepId = 'chat' | 'draft' | 'proposal' | 'views' | 'commit'

export interface VisionUpdateTourHandle {
  next: () => void
  skip: () => void
}

const STEPS: Array<{ id: VisionUpdateTourStepId; title: string; body: string }> = [
  {
    id: 'chat',
    title: 'Talk it out',
    body: 'Tell VIVA what\'s changed — type or speak. She proposes the wording. Nothing touches your draft until you accept.',
  },
  {
    id: 'draft',
    title: 'Your draft',
    body: 'Every category lives here. Purple is a VIVA proposal waiting for you. Yellow means this section is already updated in your draft.',
  },
  {
    id: 'proposal',
    title: 'You choose every word',
    body: 'Accept saves into your draft. Discard throws it away. You can still edit after you accept.',
  },
  {
    id: 'views',
    title: 'Edits, Draft, and Active',
    body: 'Edits highlights what changed — green for what is new, red strike for what came out. Draft is the text you are working on. Active is your live vision, read-only.',
  },
  {
    id: 'commit',
    title: 'Make it live when it feels right',
    body: 'When it feels right, Commit as Active creates a new version and makes it your living vision — earlier versions stay intact. VIVA will offer a cleanse first — skip it anytime.',
  },
]

export function hasSeenVisionUpdateTour(): boolean {
  try {
    return localStorage.getItem(VISION_UPDATE_TOUR_STORAGE_KEY) === 'seen'
  } catch {
    return true
  }
}

export function markVisionUpdateTourSeen(): void {
  try {
    localStorage.setItem(VISION_UPDATE_TOUR_STORAGE_KEY, 'seen')
  } catch {
    /* private mode / blocked storage */
  }
}

const HOLE_PAD = 8
const TOOLTIP_WIDTH = 360
const TOOLTIP_GAP = 12

function queryTourTarget(id: VisionUpdateTourStepId): HTMLElement | null {
  return document.querySelector(`[data-tour="${id}"]`)
}

interface Hole {
  top: number
  left: number
  width: number
  height: number
}

interface VisionUpdateTourProps {
  active: boolean
  onClose: () => void
  onStepChange?: (id: VisionUpdateTourStepId | null) => void
}

export const VisionUpdateTour = forwardRef<VisionUpdateTourHandle, VisionUpdateTourProps>(
  function VisionUpdateTour({ active, onClose, onStepChange }, ref) {
    const [stepIndex, setStepIndex] = useState(0)
    const [hole, setHole] = useState<Hole | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const onStepChangeRef = useRef(onStepChange)
    onStepChangeRef.current = onStepChange

    const step = STEPS[stepIndex]
    const isLast = stepIndex === STEPS.length - 1

    const measure = useCallback(() => {
      if (!active) return
      const el = queryTourTarget(STEPS[stepIndex].id)
      if (!el) {
        setHole(null)
        return
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      const r = el.getBoundingClientRect()
      const nextHole: Hole = {
        top: r.top - HOLE_PAD,
        left: r.left - HOLE_PAD,
        width: r.width + HOLE_PAD * 2,
        height: r.height + HOLE_PAD * 2,
      }
      setHole(nextHole)

      const tip = tooltipRef.current
      const tipH = tip?.offsetHeight ?? 180
      const maxLeft = Math.max(12, window.innerWidth - TOOLTIP_WIDTH - 12)
      const holeIsLarge = nextHole.height > window.innerHeight * 0.45
      let top: number
      if (holeIsLarge) {
        top = nextHole.top + nextHole.height - tipH - 16
      } else {
        const spaceBelow = window.innerHeight - (nextHole.top + nextHole.height) - TOOLTIP_GAP
        const placeBelow = spaceBelow >= tipH + 8 || spaceBelow >= nextHole.top
        top = placeBelow
          ? nextHole.top + nextHole.height + TOOLTIP_GAP
          : nextHole.top - tipH - TOOLTIP_GAP
      }
      setTooltipPos({
        top: Math.min(Math.max(12, top), window.innerHeight - tipH - 12),
        left: Math.min(Math.max(12, nextHole.left + (holeIsLarge ? 16 : 0)), maxLeft),
      })
    }, [active, stepIndex])

    const skip = useCallback(() => {
      onStepChangeRef.current?.(null)
      onClose()
    }, [onClose])

    const goTo = useCallback(
      (index: number) => {
        const next = Math.max(0, Math.min(STEPS.length - 1, index))
        setStepIndex(next)
        onStepChangeRef.current?.(STEPS[next].id)
      },
      [],
    )

    const next = useCallback(() => {
      if (stepIndex >= STEPS.length - 1) {
        skip()
        return
      }
      goTo(stepIndex + 1)
    }, [goTo, skip, stepIndex])

    useImperativeHandle(ref, () => ({ next, skip }), [next, skip])

    useEffect(() => {
      if (!active) {
        setStepIndex(0)
        setHole(null)
        setTooltipPos(null)
        onStepChangeRef.current?.(null)
        return
      }
      setStepIndex(0)
      onStepChangeRef.current?.(STEPS[0].id)
    }, [active])

    useLayoutEffect(() => {
      if (!active) return
      const t1 = window.setTimeout(measure, 80)
      const t2 = window.setTimeout(measure, 280)
      window.addEventListener('resize', measure)
      window.addEventListener('scroll', measure, true)
      return () => {
        window.clearTimeout(t1)
        window.clearTimeout(t2)
        window.removeEventListener('resize', measure)
        window.removeEventListener('scroll', measure, true)
      }
    }, [active, stepIndex, measure])

    useEffect(() => {
      if (!active) return
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          skip()
        }
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [active, skip])

    useEffect(() => {
      if (!active) return
      const node = tooltipRef.current
      const focusable = node?.querySelector<HTMLElement>('button')
      focusable?.focus()
    }, [active, stepIndex])

    useEffect(() => {
      if (!active) return
      const node = tooltipRef.current
      if (!node) return
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return
        const list = Array.from(
          node.querySelectorAll<HTMLElement>('button:not([disabled])'),
        )
        if (list.length === 0) return
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
      node.addEventListener('keydown', onKeyDown)
      return () => node.removeEventListener('keydown', onKeyDown)
    }, [active, stepIndex])

    if (!active) return null

    return (
      <div className="pointer-events-none fixed inset-0 z-[25]">
        {hole ? (
          <>
            <div
              className="pointer-events-auto absolute left-0 right-0 top-0 bg-black/65"
              style={{ height: Math.max(0, hole.top) }}
            />
            <div
              className="pointer-events-auto absolute left-0 bg-black/65"
              style={{ top: hole.top, width: Math.max(0, hole.left), height: hole.height }}
            />
            <div
              className="pointer-events-auto absolute right-0 bg-black/65"
              style={{
                top: hole.top,
                left: hole.left + hole.width,
                height: hole.height,
              }}
            />
            <div
              className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-black/65"
              style={{ top: hole.top + hole.height }}
            />
            <div
              className="pointer-events-none absolute rounded-2xl border-2 border-[#00FFFF]/70"
              style={{
                top: hole.top,
                left: hole.left,
                width: hole.width,
                height: hole.height,
              }}
            />
          </>
        ) : (
          <div className="pointer-events-auto absolute inset-0 bg-black/65" />
        )}

        <div
          ref={tooltipRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vision-update-tour-title"
          className="pointer-events-auto absolute z-[26] w-[min(360px,calc(100vw-1.5rem))] rounded-2xl border border-[#00FFFF]/25 bg-[#111] p-4 shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
          style={
            tooltipPos
              ? { top: tooltipPos.top, left: tooltipPos.left }
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00FFFF]">
              Walkthrough {stepIndex + 1} of {STEPS.length}
            </p>
            <button
              type="button"
              onClick={skip}
              className="rounded-md p-0.5 text-neutral-500 transition-colors hover:text-white"
              aria-label="Skip walkthrough"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 id="vision-update-tour-title" className="mb-1 text-base font-bold text-white">
            {step.title}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-neutral-400">{step.body}</p>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => goTo(stepIndex - 1)}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-0.5 rounded-full border border-[#00FFFF]/30 bg-[#00FFFF]/10 px-2.5 py-1 text-[11px] font-medium text-[#00FFFF] transition-colors hover:bg-[#00FFFF]/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIndex ? 'w-5 bg-[#00FFFF]' : 'w-1.5 bg-neutral-600'
                  }`}
                />
              ))}
            </div>
            {isLast ? (
              <button
                type="button"
                onClick={skip}
                className="inline-flex items-center gap-1 rounded-full bg-[#00FFFF] px-2.5 py-1 text-[11px] font-semibold text-black transition-opacity hover:opacity-90"
              >
                Finish
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-0.5 rounded-full bg-[#00FFFF] px-2.5 py-1 text-[11px] font-semibold text-black transition-opacity hover:opacity-90"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={skip}
            className="mt-3 w-full text-center text-[11px] text-neutral-500 transition-colors hover:text-neutral-300"
          >
            Skip
          </button>
        </div>
      </div>
    )
  },
)

VisionUpdateTour.displayName = 'VisionUpdateTour'
