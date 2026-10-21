'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, BellOff, Pause, Play, RotateCcw, Shapes, SlidersHorizontal, X } from 'lucide-react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Button } from '@/lib/design-system/components'
import {
  BREATH_PHASE_ORDER,
  breathHeight,
  breathPhase,
  cycleLength,
  formatClock,
  rhythmLabel,
  type BreathPhase,
  type BreathRhythm,
} from '@/lib/meditations/breath'
import { LEAD_IN_SECONDS } from '@/lib/meditations/constants'
import { isNativeShell } from '@/lib/mobile/native-shell'
import { BreathWave } from './BreathWave'
import { BREATH_VISUALS, OrbVisual, ShapeVisual, VisualGlyph, type BreathVisualKind } from './BreathVisuals'
import { useWakeLock } from './useWakeLock'

export interface FocusSessionConfig {
  title: string
  rhythm: BreathRhythm
  durationMinutes: number
  musicTitle: string | null
  binauralTitle: string | null
}

type Status = 'running' | 'paused' | 'complete'

const PHASE_HEADLINE: Record<BreathPhase, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  holdOut: 'Hold',
}

interface FocusSessionProps {
  config: FocusSessionConfig
  /** Changes on every (re)start so the clock resets. */
  runId: number
  chimes: boolean
  onChimesChange: (on: boolean) => void
  visual: BreathVisualKind
  onVisualChange: (visual: BreathVisualKind) => void
  musicVolume: number
  binauralVolume: number
  onMusicVolume: (volume: number) => void
  onBinauralVolume: (volume: number) => void
  onPause: () => void
  onResume: () => void
  /** Seconds into the session, sent when the screen comes back so sound can realign. */
  onClockSync: (elapsedSeconds: number) => void
  onComplete: () => void
  onRestart: () => void
  onClose: () => void
}

function pulse() {
  if (isNativeShell()) {
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.(12)
  }
}

export function FocusSession({
  config,
  runId,
  chimes,
  onChimesChange,
  visual,
  onVisualChange,
  musicVolume,
  binauralVolume,
  onMusicVolume,
  onBinauralVolume,
  onPause,
  onResume,
  onClockSync,
  onComplete,
  onRestart,
  onClose,
}: FocusSessionProps) {
  const { rhythm, durationMinutes } = config
  const cycle = cycleLength(rhythm)
  const durationSeconds = durationMinutes * 60

  const [status, setStatus] = useState<Status>('running')
  const [elapsed, setElapsed] = useState(-LEAD_IN_SECONDS)
  const [panel, setPanel] = useState<'mixer' | 'visual' | null>(null)
  const clock = useRef({ origin: 0, pausedAt: 0, pausedTotal: 0 })
  const lastPhase = useRef(-1)
  const finished = useRef(false)
  const callbacks = useRef({ onClockSync, onComplete })
  callbacks.current = { onClockSync, onComplete }

  useWakeLock(status === 'running')

  const readElapsed = useCallback((now: number) => {
    const { origin, pausedTotal } = clock.current
    return (now - origin - pausedTotal) / 1000 - LEAD_IN_SECONDS
  }, [])

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setElapsed(durationSeconds)
    setStatus('complete')
    pulse()
    callbacks.current.onComplete()
  }, [durationSeconds])

  // Reset on every new run.
  useEffect(() => {
    clock.current = { origin: performance.now(), pausedAt: 0, pausedTotal: 0 }
    lastPhase.current = -1
    finished.current = false
    setElapsed(-LEAD_IN_SECONDS)
    setStatus('running')
  }, [runId])

  useEffect(() => {
    if (status !== 'running') return
    let frame = 0
    const tick = (now: number) => {
      const next = readElapsed(now)
      if (next >= durationSeconds) {
        finish()
        return
      }
      if (next >= 0 && cycle > 0) {
        const current = breathPhase(next % cycle, rhythm).phase
        const phase = Math.floor(next / cycle) * BREATH_PHASE_ORDER.length + BREATH_PHASE_ORDER.indexOf(current)
        if (phase !== lastPhase.current) {
          lastPhase.current = phase
          pulse()
        }
      }
      setElapsed(next)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    // requestAnimationFrame stops in a hidden tab; make sure the session still ends on time.
    const remaining = (durationSeconds - readElapsed(performance.now())) * 1000
    const backstop = setTimeout(finish, Math.max(0, remaining))
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(backstop)
    }
  }, [status, runId, cycle, rhythm, durationSeconds, readElapsed, finish])

  // iOS can interrupt audio while the screen is off, so the audio clock may fall behind the session clock.
  useEffect(() => {
    if (status !== 'running') return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        callbacks.current.onClockSync(readElapsed(performance.now()))
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [status, readElapsed])

  const togglePause = useCallback(() => {
    if (status === 'running') {
      clock.current.pausedAt = performance.now()
      setStatus('paused')
      onPause()
    } else if (status === 'paused') {
      clock.current.pausedTotal += performance.now() - clock.current.pausedAt
      setStatus('running')
      onResume()
      callbacks.current.onClockSync(readElapsed(performance.now()))
    }
  }, [status, onPause, onResume, readElapsed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === ' ' && status !== 'complete') {
        event.preventDefault()
        togglePause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, togglePause, status])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const settling = elapsed < 0
  const time = Math.max(0, elapsed)
  const cycleTime = cycle > 0 ? time % cycle : 0
  const current = breathPhase(cycleTime, rhythm)
  const height = status === 'complete' || settling ? 0 : breathHeight(cycleTime, rhythm)
  const phaseLeft = Math.max(1, Math.ceil(current.left))
  const progress = Math.min(1, time / durationSeconds)
  const breaths = cycle > 0 ? Math.floor(time / cycle) : 0
  const hasSound = Boolean(config.musicTitle || config.binauralTitle)

  let headline = PHASE_HEADLINE[current.phase]
  let detail = `${phaseLeft}`
  if (settling) {
    headline = 'Settle in'
    detail = `${Math.ceil(-elapsed)}`
  } else if (status === 'paused') {
    headline = 'Paused'
    detail = ''
  } else if (status === 'complete') {
    headline = 'Complete'
    detail = ''
  }

  const soundLine = [config.musicTitle, config.binauralTitle].filter(Boolean).join(' · ')

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-black text-white"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={config.title || 'Breathing session'}
    >
      {/* Ambient light that swells with each breath. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(60% 50% at 50% 42%, rgba(0,255,255,${0.06 + height * 0.12}) 0%, rgba(57,255,20,${0.03 + height * 0.08}) 45%, transparent 75%)`,
        }}
      />

      <header className="relative z-10 flex items-start justify-between gap-3 px-4 md:px-8">
        <div className="min-w-0">
          <p className="truncate text-base md:text-lg font-semibold">{config.title || 'Breathe'}</p>
          <p className="truncate text-xs md:text-sm text-neutral-400">
            {rhythmLabel(rhythm)} · {durationMinutes} min{soundLine ? ` · ${soundLine}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasSound && (
            <IconButton label="Sound levels" active={panel === 'mixer'} onClick={() => setPanel((open) => (open === 'mixer' ? null : 'mixer'))}>
              <SlidersHorizontal className="h-5 w-5" />
            </IconButton>
          )}
          <IconButton label="Change visual" active={panel === 'visual'} onClick={() => setPanel((open) => (open === 'visual' ? null : 'visual'))}>
            <Shapes className="h-5 w-5" />
          </IconButton>
          <IconButton label={chimes ? 'Turn chimes off' : 'Turn chimes on'} active={chimes} onClick={() => onChimesChange(!chimes)}>
            {chimes ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </IconButton>
          <IconButton label="End session" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
      </header>

      {panel === 'visual' && (
        <div className="relative z-10 mx-4 mt-3 flex gap-1 overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950/90 p-2 backdrop-blur md:ml-auto md:mr-8 md:w-fit">
          {BREATH_VISUALS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={visual === option.id}
              onClick={() => onVisualChange(option.id)}
              className={`flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-colors ${
                visual === option.id ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex h-8 items-center justify-center">
                <VisualGlyph kind={option.id} />
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}

      {panel === 'mixer' && hasSound && (
        <div className="relative z-10 mx-4 mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/90 p-4 backdrop-blur md:ml-auto md:mr-8 md:w-80">
          {config.musicTitle && (
            <LevelSlider label={config.musicTitle} value={musicVolume} onChange={onMusicVolume} />
          )}
          {config.binauralTitle && (
            <LevelSlider label={config.binauralTitle} value={binauralVolume} onChange={onBinauralVolume} />
          )}
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 md:gap-10">
        <div
          className={`relative flex aspect-square items-center justify-center ${
            visual === 'wave' ? 'w-[min(72vw,340px)] md:w-[min(40vh,380px)]' : 'w-[min(86vw,460px)] md:w-[min(58vh,520px)]'
          }`}
        >
          {visual === 'wave' ? (
            <OrbVisual height={height} time={time} />
          ) : (
            <ShapeVisual kind={visual} frame={{ height, time: elapsed + LEAD_IN_SECONDS }} />
          )}
        </div>

        <div className="text-center" aria-live="polite">
          <p className="text-lg md:text-xl font-medium tracking-tight text-white/90">
            {headline}
            {detail && <span className="ml-3 font-light tabular-nums text-neutral-400">{detail}</span>}
          </p>
          {status === 'complete' && (
            <p className="mt-1 text-sm text-neutral-400">
              {breaths} breaths · {durationMinutes} min
            </p>
          )}
        </div>

        {visual === 'wave' && (
          <div className="w-full max-w-3xl">
            <BreathWave rhythm={rhythm} elapsed={status === 'complete' ? 0 : elapsed} />
          </div>
        )}
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-3xl px-4 md:px-8">
        <div className="mb-2 flex items-center justify-between text-xs tabular-nums text-neutral-400">
          <span>{formatClock(time)}</span>
          <span>{status === 'complete' ? 'Done' : `${formatClock(durationSeconds - time)} left`}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00FFFF] to-[#39FF14]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-5 flex items-center justify-center gap-3">
          {status === 'complete' ? (
            <>
              <Button variant="primary" size="sm" onClick={onRestart}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Breathe again
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Done
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={togglePause}
              aria-label={status === 'paused' ? 'Resume' : 'Pause'}
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#39FF14]/40 bg-[#39FF14]/10 text-[#39FF14] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#39FF14]/20 active:opacity-80"
            >
              {status === 'paused' ? <Play className="h-7 w-7 translate-x-0.5" /> : <Pause className="h-7 w-7" />}
            </button>
          )}
        </div>
      </footer>
    </div>,
    document.body,
  )
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
        active ? 'text-[#39FF14] bg-[#39FF14]/10' : 'text-neutral-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function LevelSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block py-1.5">
      <span className="mb-1 block truncate text-xs text-neutral-400">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="w-full accent-[#39FF14]"
      />
    </label>
  )
}
