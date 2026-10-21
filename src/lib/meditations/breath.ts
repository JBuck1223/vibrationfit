export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'holdOut'

export const BREATH_PHASE_ORDER: readonly BreathPhase[] = ['inhale', 'hold', 'exhale', 'holdOut']

/** A breath cycle. `hold` sits at full lungs after the in-breath, `holdOut` at empty after the out-breath. */
export interface BreathRhythm {
  inhale: number
  exhale: number
  hold?: number
  holdOut?: number
}

export function cardRhythm(card: {
  inhaleSeconds: number
  exhaleSeconds: number
  holdSeconds: number
  holdOutSeconds: number
}): Required<BreathRhythm> {
  return { inhale: card.inhaleSeconds, exhale: card.exhaleSeconds, hold: card.holdSeconds, holdOut: card.holdOutSeconds }
}

export function cycleLength({ inhale, exhale, hold = 0, holdOut = 0 }: BreathRhythm) {
  return inhale + hold + exhale + holdOut
}

/** Which part of the breath `cycleTime` falls in, and seconds left in it. */
export function breathPhase(cycleTime: number, { inhale, exhale, hold = 0, holdOut = 0 }: BreathRhythm) {
  if (cycleTime < inhale) return { phase: 'inhale' as const, left: inhale - cycleTime }
  if (cycleTime < inhale + hold) return { phase: 'hold' as const, left: inhale + hold - cycleTime }
  if (cycleTime < inhale + hold + exhale) return { phase: 'exhale' as const, left: inhale + hold + exhale - cycleTime }
  return { phase: 'holdOut' as const, left: inhale + hold + exhale + holdOut - cycleTime }
}

/** 0 at empty lungs, 1 at full, eased so the turn at each end feels soft. */
export function breathHeight(cycleTime: number, { inhale, exhale, hold = 0 }: BreathRhythm) {
  const ease = (progress: number) => 0.5 - 0.5 * Math.cos(Math.min(1, Math.max(0, progress)) * Math.PI)
  if (cycleTime < inhale) return ease(cycleTime / inhale)
  if (cycleTime < inhale + hold) return 1
  if (cycleTime < inhale + hold + exhale) return 1 - ease((cycleTime - inhale - hold) / exhale)
  return 0
}

/** Seconds into a cycle at which each phase that has any length begins. */
export function phaseStarts(rhythm: BreathRhythm) {
  const { inhale, exhale, hold = 0, holdOut = 0 } = rhythm
  const lengths: Record<BreathPhase, number> = { inhale, hold, exhale, holdOut }
  const starts: Array<{ phase: BreathPhase; offset: number }> = []
  let offset = 0
  for (const phase of BREATH_PHASE_ORDER) {
    if (lengths[phase] > 0) starts.push({ phase, offset })
    offset += lengths[phase]
  }
  return starts
}

/** SVG path for `cycles` breaths across `width`, between `top` (full) and `bottom` (empty). */
export function breathPath(
  rhythm: BreathRhythm,
  { width = 1000, top = 28, bottom = 172, cycles = 2, steps = 120 } = {},
) {
  const cycle = cycleLength(rhythm)
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    const time = progress * cycle * cycles
    const cycleTime = i === steps ? cycle : time % cycle
    const height = cycleTime >= cycle ? 0 : breathHeight(cycleTime, rhythm)
    const x = progress * width
    const y = bottom - height * (bottom - top)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `
  }
  return d.trim()
}

export function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.ceil(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function breathCount(rhythm: BreathRhythm, durationMinutes: number) {
  const cycle = cycleLength(rhythm)
  return cycle > 0 ? Math.floor((durationMinutes * 60) / cycle) : 0
}

/** "4s in · 4s hold · 4s out · 4s hold", leaving out holds that aren't there. */
export function rhythmLabel({ inhale, exhale, hold = 0, holdOut = 0 }: BreathRhythm) {
  return [
    `${inhale}s in`,
    hold > 0 ? `${hold}s hold` : null,
    `${exhale}s out`,
    holdOut > 0 ? `${holdOut}s hold` : null,
  ].filter(Boolean).join(' · ')
}

/** Compact "4 · 7 · 8" form for rhythm tiles. */
export function rhythmDigits({ inhale, exhale, hold = 0, holdOut = 0 }: BreathRhythm) {
  return [inhale, hold || null, exhale, holdOut || null].filter((value) => value != null).join(' · ')
}
