'use client'

import { useId, useMemo } from 'react'
import { breathHeight, breathPath } from '@/lib/meditations/breath'

const WIDTH = 1000
const TOP = 36
const BOTTOM = 164

interface BreathWaveProps {
  inhale: number
  exhale: number
  /** Seconds into the session. Negative while settling in. */
  elapsed: number
  className?: string
}

/** Two breaths of the pattern with a glowing ball riding the curve. */
export function BreathWave({ inhale, exhale, elapsed, className }: BreathWaveProps) {
  const id = useId().replace(/:/g, '')
  const cycle = inhale + exhale
  const path = useMemo(() => breathPath(inhale, exhale, { width: WIDTH, top: TOP, bottom: BOTTOM }), [inhale, exhale])

  const time = Math.max(0, elapsed)
  const cycleTime = cycle > 0 ? time % cycle : 0
  const height = elapsed < 0 ? 0 : breathHeight(cycleTime, inhale, exhale)
  const x = cycle > 0 ? ((time % (cycle * 2)) / (cycle * 2)) * WIDTH : 0
  const y = BOTTOM - height * (BOTTOM - TOP)

  return (
    <svg viewBox={`0 0 ${WIDTH} 200`} className={className ?? 'w-full h-auto'} role="img" aria-label="Breathing wave">
      <defs>
        <linearGradient id={`${id}-stroke`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#00FFFF" />
          <stop offset="100%" stopColor="#39FF14" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${id}-travelled`}>
          <rect x="0" y="0" width={x} height="200" />
        </clipPath>
      </defs>
      <path d={path} fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="4" strokeLinecap="round" />
      <path
        d={path}
        fill="none"
        stroke={`url(#${id}-stroke)`}
        strokeWidth="5"
        strokeLinecap="round"
        clipPath={`url(#${id}-travelled)`}
        filter={`url(#${id}-glow)`}
      />
      <circle cx={x} cy={y} r={22 + height * 18} fill="#39FF14" opacity={0.12 + height * 0.18} filter={`url(#${id}-glow)`} />
      <circle cx={x} cy={y} r="13" fill="#39FF14" filter={`url(#${id}-glow)`} />
      <circle cx={x} cy={y} r="5" fill="#ffffff" opacity="0.9" />
    </svg>
  )
}

/** Static thumbnail of a pattern for library cards. */
export function PatternThumb({ inhale, exhale }: { inhale: number; exhale: number }) {
  const id = useId().replace(/:/g, '')
  const path = useMemo(() => breathPath(inhale, exhale, { width: 200, top: 8, bottom: 52, cycles: 2, steps: 60 }), [inhale, exhale])
  return (
    <svg viewBox="0 0 200 60" className="w-full h-10" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${id}-thumb`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#00FFFF" />
          <stop offset="100%" stopColor="#39FF14" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke={`url(#${id}-thumb)`} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
