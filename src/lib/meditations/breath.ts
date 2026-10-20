export type BreathPhase = 'inhale' | 'hold' | 'exhale'

/** Which part of the breath `cycleTime` falls in, and seconds left in it. Hold sits at full lungs. */
export function breathPhase(cycleTime: number, inhale: number, exhale: number, hold = 0) {
  if (cycleTime < inhale) return { phase: 'inhale' as const, left: inhale - cycleTime }
  if (cycleTime < inhale + hold) return { phase: 'hold' as const, left: inhale + hold - cycleTime }
  return { phase: 'exhale' as const, left: inhale + hold + exhale - cycleTime }
}

/** 0 at empty lungs, 1 at full, eased so the turn at each end feels soft. */
export function breathHeight(cycleTime: number, inhale: number, exhale: number, hold = 0) {
  const ease = (progress: number) => 0.5 - 0.5 * Math.cos(Math.min(1, Math.max(0, progress)) * Math.PI)
  if (cycleTime < inhale) return ease(cycleTime / inhale)
  if (cycleTime < inhale + hold) return 1
  return 1 - ease((cycleTime - inhale - hold) / exhale)
}

/** SVG path for `cycles` breaths across `width`, between `top` (full) and `bottom` (empty). */
export function breathPath(
  inhale: number,
  exhale: number,
  { width = 1000, top = 28, bottom = 172, cycles = 2, steps = 120, hold = 0 } = {},
) {
  const cycle = inhale + hold + exhale
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    const time = progress * cycle * cycles
    const cycleTime = i === steps ? cycle : time % cycle
    const height = cycleTime >= cycle ? 0 : breathHeight(cycleTime, inhale, exhale, hold)
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

export function breathCount(inhale: number, exhale: number, durationMinutes: number, hold = 0) {
  const cycle = inhale + hold + exhale
  return cycle > 0 ? Math.floor((durationMinutes * 60) / cycle) : 0
}

/** "4s in · 7s hold · 8s out", leaving out the hold when there isn't one. */
export function rhythmLabel(inhale: number, exhale: number, hold = 0) {
  return hold > 0 ? `${inhale}s in · ${hold}s hold · ${exhale}s out` : `${inhale}s in · ${exhale}s out`
}
