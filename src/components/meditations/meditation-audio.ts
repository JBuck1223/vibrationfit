'use client'

import { cycleLength, phaseStarts, type BreathRhythm } from '@/lib/meditations/breath'
import { sameOriginMediaUrl } from '@/lib/meditations/media-url'

const LOOP_FADE_SECONDS = 4
const CURVE_STEPS = 64

function equalPowerCurve(rising: boolean) {
  const curve = new Float32Array(CURVE_STEPS)
  for (let i = 0; i < CURVE_STEPS; i++) {
    const t = i / (CURVE_STEPS - 1)
    curve[i] = rising ? Math.sin((t * Math.PI) / 2) : Math.cos((t * Math.PI) / 2)
  }
  return curve
}

const RISING = equalPowerCurve(true)
const FALLING = equalPowerCurve(false)

function holdParam(param: AudioParam, value: number, at: number) {
  param.cancelScheduledValues(at)
  param.setValueAtTime(value, at)
}

interface Voice {
  element: HTMLAudioElement
  source: MediaElementAudioSourceNode
  gain: GainNode
}

/**
 * One looping bed routed through Web Audio.
 * Two elements overlap at the seam with equal-power curves scheduled on the
 * audio clock, so the join holds steady even while the page is in the background.
 * Level lives on a GainNode because iOS ignores HTMLAudioElement.volume.
 */
export class LoopLayer {
  private readonly output: GainNode
  private voices: [Voice, Voice] | null = null
  private activeIndex = 0
  private fading = false
  private fadeTimer: ReturnType<typeof setTimeout> | null = null
  private cleanup: (() => void) | null = null

  constructor(private readonly ctx: AudioContext, destination: AudioNode) {
    this.output = ctx.createGain()
    this.output.connect(destination)
  }

  get playing() {
    return this.voices != null
  }

  setVolume(volume: number) {
    this.output.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05)
  }

  start(url: string, volume: number) {
    this.stop()
    holdParam(this.output.gain, volume, this.ctx.currentTime)

    const make = (): Voice => {
      const element = new Audio()
      element.crossOrigin = 'anonymous'
      element.preload = 'auto'
      element.src = sameOriginMediaUrl(url)
      const source = this.ctx.createMediaElementSource(element)
      const gain = this.ctx.createGain()
      source.connect(gain)
      gain.connect(this.output)
      return { element, source, gain }
    }

    const voices: [Voice, Voice] = [make(), make()]
    holdParam(voices[0].gain.gain, 1, this.ctx.currentTime)
    holdParam(voices[1].gain.gain, 0, this.ctx.currentTime)
    this.voices = voices
    this.activeIndex = 0

    const onTime = () => this.maybeCrossfade()
    const onEnded = (event: Event) => {
      if (this.fading || !this.voices) return
      const active = this.voices[this.activeIndex]
      if (event.currentTarget !== active.element) return
      const incoming = this.voices[1 - this.activeIndex]
      holdParam(incoming.gain.gain, 1, this.ctx.currentTime)
      incoming.element.currentTime = 0
      void incoming.element.play().catch(() => {})
      this.activeIndex = 1 - this.activeIndex
    }

    for (const voice of voices) {
      voice.element.addEventListener('timeupdate', onTime)
      voice.element.addEventListener('ended', onEnded)
    }
    this.cleanup = () => {
      for (const voice of voices) {
        voice.element.removeEventListener('timeupdate', onTime)
        voice.element.removeEventListener('ended', onEnded)
      }
    }

    void voices[0].element.play().catch(() => {})
  }

  private maybeCrossfade() {
    if (!this.voices || this.fading) return
    const from = this.voices[this.activeIndex]
    const to = this.voices[1 - this.activeIndex]
    const duration = from.element.duration
    if (!Number.isFinite(duration) || duration < 1.5) return
    const fade = Math.min(LOOP_FADE_SECONDS, duration / 3)
    if (duration - from.element.currentTime > fade) return

    this.fading = true
    to.element.currentTime = 0
    void to.element.play().catch(() => {})
    const at = this.ctx.currentTime
    from.gain.gain.cancelScheduledValues(at)
    to.gain.gain.cancelScheduledValues(at)
    from.gain.gain.setValueCurveAtTime(FALLING, at, fade)
    to.gain.gain.setValueCurveAtTime(RISING, at, fade)
    this.fadeTimer = setTimeout(() => this.finishCrossfade(), fade * 1000 + 50)
  }

  private finishCrossfade() {
    if (this.fadeTimer) clearTimeout(this.fadeTimer)
    this.fadeTimer = null
    if (!this.voices || !this.fading) return
    const from = this.voices[this.activeIndex]
    const to = this.voices[1 - this.activeIndex]
    const at = this.ctx.currentTime
    holdParam(from.gain.gain, 0, at)
    holdParam(to.gain.gain, 1, at)
    from.element.pause()
    from.element.currentTime = 0
    this.activeIndex = 1 - this.activeIndex
    this.fading = false
  }

  pause() {
    if (!this.voices) return
    // Land any seam in progress so resume starts from one clean voice.
    if (this.fading) this.finishCrossfade()
    this.voices[this.activeIndex].element.pause()
  }

  resume() {
    if (!this.voices) return
    void this.voices[this.activeIndex].element.play().catch(() => {})
  }

  stop() {
    if (this.fadeTimer) clearTimeout(this.fadeTimer)
    this.fadeTimer = null
    this.fading = false
    this.cleanup?.()
    this.cleanup = null
    for (const voice of this.voices || []) {
      voice.element.pause()
      voice.element.removeAttribute('src')
      voice.element.load()
      voice.source.disconnect()
      voice.gain.disconnect()
    }
    this.voices = null
  }
}

export type ChimeKind = 'inhale' | 'hold' | 'exhale' | 'complete'

const CHIME_NOTES: Record<ChimeKind, number[]> = {
  inhale: [660],
  hold: [550],
  exhale: [440],
  complete: [528, 660, 792],
}

export interface ChimePlan {
  rhythm: BreathRhythm
  /** Seconds of settling before the first breath. */
  leadIn: number
  durationSeconds: number
}

export interface SessionSound {
  musicUrl: string | null
  musicVolume: number
  binauralUrl: string | null
  binauralVolume: number
}

/**
 * Owns the AudioContext for a meditation: music and binaural beds under a
 * master fade, plus soft synthesized chimes that sit outside the fade.
 * `start` must run inside the click that begins a session.
 */
export class MeditationAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private music: LoopLayer | null = null
  private binaural: LoopLayer | null = null
  private stopTimer: ReturnType<typeof setTimeout> | null = null
  private chimePlan: ChimePlan | null = null
  private chimeOrigin = 0
  private chimesOn = false
  private chimeVoices = new Set<{ osc: OscillatorNode; gain: GainNode }>()

  private ensure() {
    if (this.ctx) return this.ctx
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    // Without this, iOS routes Web Audio through the ringer switch and goes silent.
    if (session) session.type = 'playback'
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()
    const master = ctx.createGain()
    master.connect(ctx.destination)
    this.ctx = ctx
    this.master = master
    this.music = new LoopLayer(ctx, master)
    this.binaural = new LoopLayer(ctx, master)
    return ctx
  }

  start(sound: SessionSound, fadeInSeconds: number) {
    const ctx = this.ensure()
    void ctx.resume()
    this.clearStopTimer()
    const at = ctx.currentTime
    holdParam(this.master!.gain, 0.0001, at)
    this.master!.gain.exponentialRampToValueAtTime(1, at + Math.max(0.1, fadeInSeconds))

    if (sound.musicUrl) this.music!.start(sound.musicUrl, sound.musicVolume)
    else this.music!.stop()
    if (sound.binauralUrl) this.binaural!.start(sound.binauralUrl, sound.binauralVolume)
    else this.binaural!.stop()
  }

  setMusicVolume(volume: number) {
    this.music?.setVolume(volume)
  }

  setBinauralVolume(volume: number) {
    this.binaural?.setVolume(volume)
  }

  pause() {
    this.music?.pause()
    this.binaural?.pause()
    void this.ctx?.suspend()
  }

  resume() {
    void this.ctx?.resume()
    this.music?.resume()
    this.binaural?.resume()
  }

  fadeOut(seconds: number) {
    if (!this.ctx || !this.master) return
    this.clearStopTimer()
    const at = this.ctx.currentTime
    holdParam(this.master.gain, Math.max(0.0001, this.master.gain.value), at)
    this.master.gain.exponentialRampToValueAtTime(0.0001, at + seconds)
    this.stopTimer = setTimeout(() => this.stopBeds(), seconds * 1000 + 100)
  }

  /**
   * Book every chime for the session on the audio clock. requestAnimationFrame
   * and timers stall when the screen locks; the audio clock keeps running, and
   * it freezes with the session on pause because pause suspends the context.
   */
  planChimes(plan: ChimePlan, enabled: boolean) {
    const ctx = this.ensure()
    this.chimePlan = plan
    this.chimeOrigin = ctx.currentTime + plan.leadIn
    this.chimesOn = enabled
    this.scheduleChimes()
  }

  setChimesEnabled(enabled: boolean) {
    this.chimesOn = enabled
    this.scheduleChimes()
  }

  /**
   * Realign chimes to the session clock, e.g. after iOS interrupted audio while the screen was off.
   * `elapsedSeconds` counts from the first breath, so it is negative while settling in.
   */
  syncChimes(elapsedSeconds: number) {
    if (!this.ctx || !this.chimePlan) return
    this.chimeOrigin = this.ctx.currentTime - elapsedSeconds
    this.scheduleChimes()
  }

  stopChimes() {
    this.chimePlan = null
    this.clearChimes()
  }

  private scheduleChimes() {
    this.clearChimes()
    const ctx = this.ctx
    const plan = this.chimePlan
    if (!ctx || !plan || !this.chimesOn) return

    const cycle = cycleLength(plan.rhythm)
    const starts = phaseStarts(plan.rhythm)
    const now = ctx.currentTime
    if (cycle > 0) {
      for (let cycleStart = 0; cycleStart < plan.durationSeconds; cycleStart += cycle) {
        for (const { phase, offset } of starts) {
          const sessionTime = cycleStart + offset
          if (sessionTime >= plan.durationSeconds) break
          const at = this.chimeOrigin + sessionTime
          if (at >= now) this.tone(phase === 'holdOut' ? 'hold' : phase, at)
        }
      }
    }
    const end = this.chimeOrigin + plan.durationSeconds
    if (end >= now) this.tone('complete', end)
  }

  private tone(kind: ChimeKind, at: number) {
    const ctx = this.ctx!
    const notes = CHIME_NOTES[kind]
    const ring = kind === 'complete' ? 4 : 2.2
    const peak = (kind === 'complete' ? 0.12 : 0.09) / Math.sqrt(notes.length)

    notes.forEach((frequency, index) => {
      const start = at + 0.02 + index * 0.12
      // A quiet inharmonic partial gives the tone a bowl-like shimmer.
      for (const [ratio, level] of [[1, 1], [2.76, 0.18]] as const) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = frequency * ratio
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(peak * level, start + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + ring / ratio)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + ring + 0.1)
        const voice = { osc, gain }
        this.chimeVoices.add(voice)
        osc.onended = () => {
          gain.disconnect()
          this.chimeVoices.delete(voice)
        }
      }
    })
  }

  private clearChimes() {
    for (const { osc, gain } of this.chimeVoices) {
      osc.onended = null
      try {
        osc.stop()
      } catch {
        // Already stopped.
      }
      osc.disconnect()
      gain.disconnect()
    }
    this.chimeVoices.clear()
  }

  stop() {
    this.clearStopTimer()
    this.stopChimes()
    this.stopBeds()
  }

  close() {
    this.stop()
    void this.ctx?.close()
    this.ctx = null
    this.master = null
    this.music = null
    this.binaural = null
  }

  private stopBeds() {
    this.music?.stop()
    this.binaural?.stop()
  }

  private clearStopTimer() {
    if (this.stopTimer) clearTimeout(this.stopTimer)
    this.stopTimer = null
  }
}
