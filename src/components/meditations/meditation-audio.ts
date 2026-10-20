'use client'

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

export type ChimeKind = 'inhale' | 'exhale' | 'complete'

const CHIME_NOTES: Record<ChimeKind, number[]> = {
  inhale: [660],
  exhale: [440],
  complete: [528, 660, 792],
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

  chime(kind: ChimeKind) {
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running') return
    const at = ctx.currentTime + 0.02
    const notes = CHIME_NOTES[kind]
    const ring = kind === 'complete' ? 4 : 2.2
    const peak = (kind === 'complete' ? 0.12 : 0.09) / Math.sqrt(notes.length)

    notes.forEach((frequency, index) => {
      const start = at + index * 0.12
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
        osc.onended = () => gain.disconnect()
      }
    })
  }

  stop() {
    this.clearStopTimer()
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
