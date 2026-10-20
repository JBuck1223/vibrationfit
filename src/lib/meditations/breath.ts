/** 0 at empty lungs, 1 at full, eased so the turn at each end feels soft. */
export function breathHeight(cycleTime: number, inhale: number, exhale: number) {
  const inhaling = cycleTime < inhale
  const progress = inhaling ? cycleTime / inhale : (cycleTime - inhale) / exhale
  const eased = 0.5 - 0.5 * Math.cos(Math.min(1, Math.max(0, progress)) * Math.PI)
  return inhaling ? eased : 1 - eased
}

/** SVG path for `cycles` breaths across `width`, between `top` (full) and `bottom` (empty). */
export function breathPath(
  inhale: number,
  exhale: number,
  { width = 1000, top = 28, bottom = 172, cycles = 2, steps = 120 } = {},
) {
  const cycle = inhale + exhale
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    const time = progress * cycle * cycles
    const cycleTime = i === steps ? cycle : time % cycle
    const height = cycleTime >= cycle ? 0 : breathHeight(cycleTime, inhale, exhale)
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

export function breathCount(inhale: number, exhale: number, durationMinutes: number) {
  const cycle = inhale + exhale
  return cycle > 0 ? Math.floor((durationMinutes * 60) / cycle) : 0
}
