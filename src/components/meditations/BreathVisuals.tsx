'use client'

import { useEffect, useId, useState } from 'react'
import { breathHeight, cycleLength, type BreathRhythm } from '@/lib/meditations/breath'
import { BreathWave } from './BreathWave'

/** Server and client trig differ in the last digits; round so hydration matches. */
function f(value: number) {
  return Math.round(value * 100) / 100
}

export const BREATH_VISUALS = [
  { id: 'wave', label: 'Wave', hint: 'A ball rides the curve of each breath' },
  { id: 'bloom', label: 'Bloom', hint: 'Petals open as you breathe in' },
  { id: 'ring', label: 'Ring', hint: 'A circle fills and empties' },
  { id: 'tide', label: 'Tide', hint: 'Water rises and falls in a glass' },
  { id: 'stars', label: 'Stars', hint: 'A constellation expands and gathers' },
] as const

export type BreathVisualKind = (typeof BREATH_VISUALS)[number]['id']

export const DEFAULT_VISUAL: BreathVisualKind = 'wave'

export function isBreathVisual(value: unknown): value is BreathVisualKind {
  return BREATH_VISUALS.some((visual) => visual.id === value)
}

export interface VisualFrame {
  /** 0 at empty lungs, 1 at full. */
  height: number
  /** Seconds into the session, used for slow drift. */
  time: number
}

/** Glowing sphere that swells with the breath; sits behind the wave layout. */
export function OrbVisual({ height }: VisualFrame) {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(57,255,20,0.55), rgba(0,255,255,0.25) 55%, transparent 70%)',
          opacity: 0.25 + height * 0.5,
          transform: `scale(${0.7 + height * 0.45})`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-[#00FFFF]/25"
        style={{ transform: `scale(${0.62 + height * 0.38})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-[8%] rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.22), rgba(57,255,20,0.35) 35%, rgba(0,255,255,0.18) 70%, rgba(0,0,0,0.6) 100%)',
          boxShadow: `0 0 ${40 + height * 60}px rgba(57,255,20,${0.25 + height * 0.3})`,
          transform: `scale(${0.55 + height * 0.45})`,
        }}
      />
    </>
  )
}

const PETALS = 6

/** Overlapping petals that fan out from one circle into a flower. */
export function BloomVisual({ height, time }: VisualFrame) {
  const id = useId().replace(/:/g, '')
  const spread = 6 + height * 30
  const radius = 26 + height * 12
  const turn = height * 60 + time * 2

  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-lime`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#39FF14" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#39FF14" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id={`${id}-cyan`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#00FFFF" stopOpacity="0.15" />
        </radialGradient>
        <filter id={`${id}-soft`}>
          <feGaussianBlur stdDeviation={f(0.4 + (1 - height) * 1.2)} />
        </filter>
      </defs>
      <circle cx="100" cy="100" r={60 + height * 30} fill={`url(#${id}-cyan)`} opacity={0.08 + height * 0.1} filter={`url(#${id}-soft)`} />
      <g transform={`rotate(${turn} 100 100)`} style={{ mixBlendMode: 'screen' }} filter={`url(#${id}-soft)`}>
        {Array.from({ length: PETALS }, (_, index) => {
          const angle = (index / PETALS) * Math.PI * 2
          return (
            <circle
              key={index}
              cx={f(100 + Math.cos(angle) * spread)}
              cy={f(100 + Math.sin(angle) * spread)}
              r={radius}
              fill={`url(#${id}-${index % 2 === 0 ? 'lime' : 'cyan'})`}
              stroke={index % 2 === 0 ? '#39FF14' : '#00FFFF'}
              strokeOpacity={f(0.25 + height * 0.45)}
              strokeWidth="0.8"
              opacity={0.6}
            />
          )
        })}
      </g>
    </svg>
  )
}

/** An arc that sweeps around the circle on the in-breath and unwinds on the out-breath. */
export function RingVisual({ height }: VisualFrame) {
  const id = useId().replace(/:/g, '')
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const angle = height * Math.PI * 2 - Math.PI / 2
  const dotX = f(100 + Math.cos(angle) * radius)
  const dotY = f(100 + Math.sin(angle) * radius)

  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-arc`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#00FFFF" />
          <stop offset="100%" stopColor="#39FF14" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r={radius} fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="6" />
      {Array.from({ length: 60 }, (_, index) => {
        const tick = (index / 60) * Math.PI * 2 - Math.PI / 2
        const lit = index / 60 <= height
        return (
          <line
            key={index}
            x1={f(100 + Math.cos(tick) * 92)}
            y1={f(100 + Math.sin(tick) * 92)}
            x2={f(100 + Math.cos(tick) * (index % 5 === 0 ? 97 : 95))}
            y2={f(100 + Math.sin(tick) * (index % 5 === 0 ? 97 : 95))}
            stroke={lit ? '#39FF14' : '#ffffff'}
            strokeOpacity={lit ? 0.7 : 0.12}
            strokeWidth="1"
          />
        )
      })}
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={`url(#${id}-arc)`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${f(circumference * height)} ${f(circumference)}`}
        transform="rotate(-90 100 100)"
        filter={`url(#${id}-glow)`}
      />
      <circle cx={dotX} cy={dotY} r="7" fill="#39FF14" filter={`url(#${id}-glow)`} />
      <circle cx={dotX} cy={dotY} r="2.5" fill="#ffffff" />
      <circle cx="100" cy="100" r={radius - 14} fill="#00FFFF" opacity={0.03 + height * 0.06} />
    </svg>
  )
}

function surface(level: number, amplitude: number, phase: number, frequency: number) {
  let d = `M0,200 L0,${level.toFixed(1)}`
  for (let x = 0; x <= 200; x += 5) {
    const y = level + Math.sin((x / 200) * Math.PI * 2 * frequency + phase) * amplitude
    d += ` L${x},${y.toFixed(1)}`
  }
  return `${d} L200,200 Z`
}

/** A round glass whose water level follows the breath, with a drifting surface. */
export function TideVisual({ height, time }: VisualFrame) {
  const id = useId().replace(/:/g, '')
  const level = 182 - height * 150
  const swell = 3 + (1 - Math.abs(height - 0.5) * 2) * 3

  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-glass`}>
          <circle cx="100" cy="100" r="88" />
        </clipPath>
        <linearGradient id={`${id}-water`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#39FF14" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#00FFFF" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="88" fill="#ffffff" fillOpacity="0.03" />
      <g clipPath={`url(#${id}-glass)`}>
        <path d={surface(level - 2, swell, time * 0.9 + 1.4, 1.5)} fill="#00FFFF" opacity="0.25" />
        <path d={surface(level, swell * 0.8, time * 1.3, 1)} fill={`url(#${id}-water)`} />
        {Array.from({ length: 6 }, (_, index) => {
          const rise = ((time * (6 + index) + index * 37) % 140) / 140
          const y = 190 - rise * (190 - level)
          return (
            <circle
              key={index}
              cx={f(45 + index * 22 + Math.sin(time + index) * 4)}
              cy={f(y)}
              r={1.2 + (index % 3) * 0.6}
              fill="#ffffff"
              opacity={f(0.35 * (1 - rise))}
            />
          )
        })}
      </g>
      <circle cx="100" cy="100" r="88" fill="none" stroke="#00FFFF" strokeOpacity="0.3" strokeWidth="1.5" />
    </svg>
  )
}

const STAR_RINGS = [
  { count: 8, radius: 0.35, size: 2.6, speed: 4 },
  { count: 14, radius: 0.62, size: 2, speed: -2.5 },
  { count: 20, radius: 0.9, size: 1.5, speed: 1.5 },
]

/** Three rings of stars that drift apart on the in-breath and gather on the out-breath. */
export function StarsVisual({ height, time }: VisualFrame) {
  const id = useId().replace(/:/g, '')
  const reach = 22 + height * 66

  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r={8 + height * 10} fill="#39FF14" opacity={0.18 + height * 0.2} filter={`url(#${id}-glow)`} />
      <g filter={`url(#${id}-glow)`}>
        {STAR_RINGS.map((ring, ringIndex) => {
          const radius = reach * ring.radius
          const offset = (time * ring.speed * Math.PI) / 180
          const points = Array.from({ length: ring.count }, (_, index) => {
            const angle = (index / ring.count) * Math.PI * 2 + offset
            return [f(100 + Math.cos(angle) * radius), f(100 + Math.sin(angle) * radius)] as const
          })
          return (
            <g key={ringIndex}>
              <polygon
                points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
                fill="none"
                stroke="#00FFFF"
                strokeOpacity={0.05 + height * 0.12}
                strokeWidth="0.6"
              />
              {points.map(([x, y], index) => (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={f(ring.size * (0.7 + 0.3 * Math.sin(time * 1.5 + index * 1.7 + ringIndex)))}
                  fill={(index + ringIndex) % 3 === 0 ? '#39FF14' : '#ffffff'}
                  opacity={0.5 + height * 0.5}
                />
              ))}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

/** The non-wave visuals, keyed by kind. The wave layout is composed by its host. */
export function ShapeVisual({ kind, frame }: { kind: Exclude<BreathVisualKind, 'wave'>; frame: VisualFrame }) {
  switch (kind) {
    case 'bloom':
      return <BloomVisual {...frame} />
    case 'ring':
      return <RingVisual {...frame} />
    case 'tide':
      return <TideVisual {...frame} />
    case 'stars':
      return <StarsVisual {...frame} />
  }
}

/** Looping preview of any visual for the composer, on its own clock. */
export function VisualPreview({ kind, rhythm }: { kind: BreathVisualKind; rhythm: BreathRhythm }) {
  const { inhale, exhale, hold = 0, holdOut = 0 } = rhythm
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const origin = performance.now()
    let frame = 0
    const tick = (now: number) => {
      setElapsed((now - origin) / 1000)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inhale, exhale, hold, holdOut])

  if (kind === 'wave') {
    return <BreathWave rhythm={rhythm} elapsed={elapsed} />
  }

  const cycle = cycleLength(rhythm)
  const height = cycle > 0 ? breathHeight(elapsed % cycle, rhythm) : 0
  return (
    <div className="relative mx-auto aspect-square w-40 md:w-48">
      <ShapeVisual kind={kind} frame={{ height, time: elapsed }} />
    </div>
  )
}

/** Small static glyph of each visual for the picker tiles. */
export function VisualGlyph({ kind }: { kind: BreathVisualKind }) {
  if (kind === 'wave') {
    return (
      <svg viewBox="0 0 40 24" className="h-6 w-10" aria-hidden="true">
        <path d="M2,18 C10,18 10,6 18,6 C26,6 26,18 38,18" fill="none" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="6" r="3" fill="#39FF14" />
      </svg>
    )
  }
  return (
    <div className="relative h-8 w-8">
      <ShapeVisual kind={kind} frame={{ height: 0.75, time: 8 }} />
    </div>
  )
}
