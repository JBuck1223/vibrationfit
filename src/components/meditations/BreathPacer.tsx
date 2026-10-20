'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, BellOff, Minus, Play, Plus, Save, X } from 'lucide-react'
import { Button, Container, Input, Stack } from '@/lib/design-system/components'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import {
  BREATH_MAX_SECONDS,
  BREATH_MIN_SECONDS,
  BREATH_PRESETS,
  BREATH_STORAGE_KEY,
  CUSTOM_PRESET_ID,
  DEFAULT_BINAURAL_VOLUME,
  DEFAULT_MUSIC_VOLUME,
  DURATION_MAX_MINUTES,
  DURATION_MIN_MINUTES,
  DURATION_OPTIONS,
  END_FADE_SECONDS,
  LEAD_IN_SECONDS,
  AUTO_DURATION_MINUTES,
  AUTO_EXHALE_SECONDS,
  AUTO_INHALE_SECONDS,
} from '@/lib/meditations/constants'
import { breathCount } from '@/lib/meditations/breath'
import type { MeditationBinauralOption, MeditationCard, MeditationMusicOption } from '@/lib/meditations/catalog'
import { BREATH_VISUALS, DEFAULT_VISUAL, isBreathVisual, VisualGlyph, VisualPreview, type BreathVisualKind } from './BreathVisuals'
import { FocusSession, type FocusSessionConfig } from './FocusSession'
import { MeditationAudio, type ChimeKind } from './meditation-audio'
import { MeditationLibrary } from './MeditationLibrary'
import { BinauralPicker, MusicPicker, musicKey, usePreview } from './SoundPicker'
import { TrackStudio } from './TrackStudio'

interface Catalog {
  music: MeditationMusicOption[]
  binaurals: MeditationBinauralOption[]
  mine: MeditationCard[]
  community: MeditationCard[]
}

interface ActiveSession {
  config: FocusSessionConfig
  musicUrl: string | null
  binauralUrl: string | null
  musicVolume: number
  binauralVolume: number
  fromComposer: boolean
}

interface StoredPrefs {
  mode?: 'auto' | 'custom'
  preset?: string
  inhale?: number
  exhale?: number
  duration?: number
  music?: string
  binaural?: string
  musicVolume?: number
  binauralVolume?: number
  chimes?: boolean
  visual?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function unit(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback
}

function presetFor(inhale: number, exhale: number) {
  return BREATH_PRESETS.find((preset) => preset.inhale === inhale && preset.exhale === exhale)?.id ?? CUSTOM_PRESET_ID
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

export function BreathPacer() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [preset, setPreset] = useState<string>(BREATH_PRESETS[0].id)
  const [customInhale, setCustomInhale] = useState(AUTO_INHALE_SECONDS)
  const [customExhale, setCustomExhale] = useState(AUTO_EXHALE_SECONDS)
  const [duration, setDuration] = useState(AUTO_DURATION_MINUTES)
  const [musicId, setMusicId] = useState('')
  const [musicVolume, setMusicVolume] = useState(DEFAULT_MUSIC_VOLUME)
  const [binauralId, setBinauralId] = useState('')
  const [binauralVolume, setBinauralVolume] = useState(DEFAULT_BINAURAL_VOLUME)
  const [trackMeta, setTrackMeta] = useState<{ bpm: number | null; mood: string | null } | null>(null)
  const [chimes, setChimes] = useState(true)
  const [visual, setVisual] = useState<BreathVisualKind>(DEFAULT_VISUAL)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [session, setSession] = useState<ActiveSession | null>(null)
  const [runId, setRunId] = useState(0)

  const audioRef = useRef<MeditationAudio | null>(null)
  const composerRef = useRef<HTMLDivElement | null>(null)
  const preview = usePreview()

  const loadCatalog = useCallback(async () => {
    const response = await fetch('/api/meditations')
    if (!response.ok) throw new Error('Could not load meditations')
    const data = await response.json() as Catalog
    setCatalog(data)
    return data
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BREATH_STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as StoredPrefs
        const inhale = saved.inhale ? clamp(saved.inhale, BREATH_MIN_SECONDS, BREATH_MAX_SECONDS) : AUTO_INHALE_SECONDS
        const exhale = saved.exhale ? clamp(saved.exhale, BREATH_MIN_SECONDS, BREATH_MAX_SECONDS) : AUTO_EXHALE_SECONDS
        setCustomInhale(inhale)
        setCustomExhale(exhale)
        if (saved.preset && (saved.preset === CUSTOM_PRESET_ID || BREATH_PRESETS.some((item) => item.id === saved.preset))) {
          setPreset(saved.preset)
        } else if (saved.mode === 'custom') {
          setPreset(CUSTOM_PRESET_ID)
        }
        if (saved.duration) setDuration(clamp(saved.duration, DURATION_MIN_MINUTES, DURATION_MAX_MINUTES))
        if (typeof saved.music === 'string') setMusicId(saved.music)
        if (typeof saved.binaural === 'string') setBinauralId(saved.binaural)
        setMusicVolume(unit(saved.musicVolume, DEFAULT_MUSIC_VOLUME))
        setBinauralVolume(unit(saved.binauralVolume, DEFAULT_BINAURAL_VOLUME))
        if (typeof saved.chimes === 'boolean') setChimes(saved.chimes)
        if (isBreathVisual(saved.visual)) setVisual(saved.visual)
      }
    } catch {
      // Storage can be unavailable or hold a bad value; the defaults stand.
    }
    setPrefsLoaded(true)
    loadCatalog()
      .catch(() => setError('Could not load meditations'))
      .finally(() => setLoading(false))
  }, [loadCatalog])

  useEffect(() => {
    if (!prefsLoaded) return
    const prefs: StoredPrefs = {
      preset,
      inhale: customInhale,
      exhale: customExhale,
      duration,
      music: musicId,
      binaural: binauralId,
      musicVolume,
      binauralVolume,
      chimes,
      visual,
    }
    try {
      localStorage.setItem(BREATH_STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // Private mode or full storage; preferences just won't persist.
    }
  }, [prefsLoaded, preset, customInhale, customExhale, duration, musicId, binauralId, musicVolume, binauralVolume, chimes, visual])

  useEffect(() => () => audioRef.current?.close(), [])

  const activePreset = BREATH_PRESETS.find((item) => item.id === preset) || null
  const inhale = activePreset ? activePreset.inhale : customInhale
  const exhale = activePreset ? activePreset.exhale : customExhale

  const music = useMemo(
    () => catalog?.music.find((option) => musicKey(option) === musicId) || null,
    [catalog, musicId],
  )
  const binaural = useMemo(
    () => catalog?.binaurals.find((option) => option.id === binauralId) || null,
    [catalog, binauralId],
  )

  function flash(message: string) {
    setNotice(message)
    setError(null)
  }

  function begin(next: ActiveSession) {
    preview.stop()
    useGlobalAudioStore.getState().pause()
    const audio = audioRef.current ?? new MeditationAudio()
    audioRef.current = audio
    audio.start(
      {
        musicUrl: next.musicUrl,
        musicVolume: next.musicVolume,
        binauralUrl: next.binauralUrl,
        binauralVolume: next.binauralVolume,
      },
      LEAD_IN_SECONDS,
    )
    setSession(next)
    setRunId((id) => id + 1)
  }

  function startComposer() {
    begin({
      config: {
        title: title.trim(),
        inhale,
        exhale,
        durationMinutes: duration,
        musicTitle: music?.title || null,
        binauralTitle: binaural?.title || null,
      },
      musicUrl: music?.url || null,
      binauralUrl: binaural?.url || null,
      musicVolume,
      binauralVolume,
      fromComposer: true,
    })
  }

  function playCard(card: MeditationCard) {
    begin({
      config: {
        title: card.title,
        inhale: card.inhaleSeconds,
        exhale: card.exhaleSeconds,
        durationMinutes: card.durationMinutes,
        musicTitle: card.musicUrl ? card.musicTitle : null,
        binauralTitle: card.binauralUrl ? card.binauralTitle : null,
      },
      musicUrl: card.musicUrl,
      binauralUrl: card.binauralUrl,
      musicVolume: card.musicVolume,
      binauralVolume: card.binauralVolume,
      fromComposer: false,
    })
  }

  function setSessionVolume(kind: 'music' | 'binaural', volume: number) {
    if (kind === 'music') audioRef.current?.setMusicVolume(volume)
    else audioRef.current?.setBinauralVolume(volume)
    if (session?.fromComposer) {
      if (kind === 'music') setMusicVolume(volume)
      else setBinauralVolume(volume)
    }
    setSession((current) => {
      if (!current) return current
      return kind === 'music' ? { ...current, musicVolume: volume } : { ...current, binauralVolume: volume }
    })
  }

  const closeSession = useCallback(() => {
    audioRef.current?.fadeOut(1.2)
    setSession(null)
  }, [])

  const handlePhase = useCallback((kind: ChimeKind) => {
    if (chimes) audioRef.current?.chime(kind)
  }, [chimes])

  const handleComplete = useCallback(() => {
    audioRef.current?.fadeOut(END_FADE_SECONDS)
    if (chimes) audioRef.current?.chime('complete')
  }, [chimes])

  function loadIntoComposer(card: MeditationCard, asCopy: boolean) {
    const nextPreset = presetFor(card.inhaleSeconds, card.exhaleSeconds)
    setPreset(nextPreset)
    if (nextPreset === CUSTOM_PRESET_ID) {
      setCustomInhale(card.inhaleSeconds)
      setCustomExhale(card.exhaleSeconds)
    }
    setDuration(card.durationMinutes)

    const options = catalog?.music || []
    const byId = card.musicSongTrackId
      ? options.find((option) => option.source === 'generated' && option.id === card.musicSongTrackId)
      : card.musicBackgroundTrackId
        ? options.find((option) => option.source === 'background' && option.id === card.musicBackgroundTrackId)
        : null
    const byUrl = card.musicUrl ? options.find((option) => option.url === card.musicUrl) : null
    const option = byId || byUrl || null
    setMusicId(option ? musicKey(option) : '')
    setMusicVolume(card.musicVolume)
    setBinauralId(card.binauralTrackId || '')
    setBinauralVolume(card.binauralVolume)
    setTrackMeta(card.bpm || card.mood ? { bpm: card.bpm, mood: card.mood } : null)
    setTitle(card.title)
    setEditingId(asCopy ? null : card.id)
    setError(null)
    setNotice(asCopy ? `Copied “${card.title}”. Save it to keep your own version.` : null)
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function newMeditation() {
    setEditingId(null)
    setTitle('')
    setNotice(null)
    setError(null)
  }

  async function save(asNew: boolean) {
    const name = title.trim()
    if (!name) {
      setError('Give this meditation a name to save it')
      return
    }
    setSaving(true)
    setError(null)
    const generated = music?.source === 'generated'
    const payload = {
      title: name,
      inhale_seconds: inhale,
      exhale_seconds: exhale,
      duration_minutes: duration,
      music_background_track_id: music?.source === 'background' ? music.id : null,
      music_song_track_id: generated ? music.id : null,
      music_volume: musicVolume,
      binaural_track_id: binaural?.id || null,
      binaural_volume: binauralVolume,
      bpm: generated ? trackMeta?.bpm ?? null : null,
      mood: generated ? trackMeta?.mood ?? null : null,
    }
    const updating = editingId && !asNew
    try {
      const response = await fetch(updating ? `/api/meditations/${editingId}` : '/api/meditations', {
        method: updating ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data.error || 'Could not save')
      setEditingId(data.id)
      flash(updating ? 'Changes saved' : 'Saved to your library')
      await loadCatalog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function updateCard(card: MeditationCard, body: { is_favorite?: boolean; is_shared?: boolean }) {
    setCatalog((current) => current && {
      ...current,
      mine: current.mine.map((item) => item.id === card.id
        ? {
            ...item,
            isFavorite: body.is_favorite ?? item.isFavorite,
            isShared: body.is_shared ?? item.isShared,
          }
        : item),
    })
    const response = await fetch(`/api/meditations/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const data = await readJson(response)
      setError(data.error || 'Could not update')
    } else if (typeof body.is_shared === 'boolean') {
      flash(body.is_shared ? `“${card.title}” is shared with members` : `“${card.title}” is private again`)
    }
    await loadCatalog().catch(() => {})
  }

  async function deleteCard(card: MeditationCard) {
    const response = await fetch(`/api/meditations/${card.id}`, { method: 'DELETE' })
    if (!response.ok) {
      const data = await readJson(response)
      setError(data.error || 'Could not delete')
      return
    }
    if (editingId === card.id) setEditingId(null)
    flash(`Deleted “${card.title}”`)
    await loadCatalog().catch(() => {})
  }

  async function handleTrackCreated(track: { songTrackId: string | null; title: string; bpm: number; mood: string }) {
    const next = await loadCatalog()
    const created = next.music.find((option) => option.source === 'generated' && option.id === track.songTrackId)
      || next.music.find((option) => option.source === 'generated' && option.title === track.title)
    if (created) {
      setMusicId(musicKey(created))
      setTrackMeta({ bpm: track.bpm, mood: track.mood || null })
    }
    if (!title.trim()) setTitle(track.title)
  }

  const editingCard = editingId ? catalog?.mine.find((card) => card.id === editingId) : null
  const breaths = breathCount(inhale, exhale, duration)
  const customDuration = !(DURATION_OPTIONS as readonly number[]).includes(duration)

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div
          ref={composerRef}
          className="relative scroll-mt-24 overflow-hidden rounded-2xl border-2 border-neutral-800 bg-[#0B0B0B]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(50% 60% at 85% 0%, rgba(0,255,255,0.10), transparent 70%), radial-gradient(40% 50% at 0% 100%, rgba(57,255,20,0.08), transparent 70%)',
            }}
          />

          <div className="relative grid gap-8 p-4 md:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-7">
              {editingCard && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#00FFFF]/30 bg-[#00FFFF]/5 px-3 py-2">
                  <p className="min-w-0 truncate text-sm text-[#00FFFF]">Editing “{editingCard.title}”</p>
                  <button
                    type="button"
                    onClick={newMeditation}
                    className="flex shrink-0 items-center gap-1 text-xs text-neutral-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                    Start fresh
                  </button>
                </div>
              )}

              <section>
                <SectionLabel>Rhythm</SectionLabel>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
                  {BREATH_PRESETS.map((item) => (
                    <RhythmTile
                      key={item.id}
                      selected={preset === item.id}
                      label={item.label}
                      detail={`${item.inhale} · ${item.exhale}`}
                      onClick={() => setPreset(item.id)}
                    />
                  ))}
                  <RhythmTile
                    selected={preset === CUSTOM_PRESET_ID}
                    label="Custom"
                    detail={`${customInhale} · ${customExhale}`}
                    onClick={() => setPreset(CUSTOM_PRESET_ID)}
                  />
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {activePreset ? activePreset.hint : 'Set your own in-breath and out-breath'}
                </p>
                {preset === CUSTOM_PRESET_ID && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Stepper label="Breathe in" value={customInhale} min={BREATH_MIN_SECONDS} max={BREATH_MAX_SECONDS} unit="s" onChange={setCustomInhale} />
                    <Stepper label="Breathe out" value={customExhale} min={BREATH_MIN_SECONDS} max={BREATH_MAX_SECONDS} unit="s" onChange={setCustomExhale} />
                  </div>
                )}
              </section>

              <section>
                <SectionLabel>Length</SectionLabel>
                <div className="flex flex-wrap items-center gap-2">
                  {DURATION_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setDuration(minutes)}
                      className={`h-11 min-w-14 rounded-full px-4 text-sm tabular-nums transition-colors ${
                        duration === minutes
                          ? 'bg-[#39FF14] font-semibold text-black'
                          : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      {minutes} min
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <RoundStep
                      label="One minute shorter"
                      disabled={duration <= DURATION_MIN_MINUTES}
                      onClick={() => setDuration((value) => clamp(value - 1, DURATION_MIN_MINUTES, DURATION_MAX_MINUTES))}
                    >
                      <Minus className="h-4 w-4" />
                    </RoundStep>
                    <span
                      className={`min-w-14 text-center text-sm tabular-nums ${
                        customDuration ? 'font-semibold text-[#39FF14]' : 'text-neutral-500'
                      }`}
                    >
                      {duration} min
                    </span>
                    <RoundStep
                      label="One minute longer"
                      disabled={duration >= DURATION_MAX_MINUTES}
                      onClick={() => setDuration((value) => clamp(value + 1, DURATION_MIN_MINUTES, DURATION_MAX_MINUTES))}
                    >
                      <Plus className="h-4 w-4" />
                    </RoundStep>
                  </div>
                </div>
              </section>

              <section>
                <SectionLabel>Visual</SectionLabel>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
                  {BREATH_VISUALS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setVisual(option.id)}
                      aria-pressed={visual === option.id}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition-all duration-300 hover:-translate-y-0.5 ${
                        visual === option.id
                          ? 'border-[#39FF14]/60 bg-[#39FF14]/10 shadow-[0_0_24px_rgba(57,255,20,0.15)]'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <span className="flex h-8 items-center justify-center">
                        <VisualGlyph kind={option.id} />
                      </span>
                      <span className={`text-xs font-semibold ${visual === option.id ? 'text-[#39FF14]' : 'text-white'}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {BREATH_VISUALS.find((option) => option.id === visual)?.hint}
                </p>
              </section>

              <section>
                <SectionLabel>Sound</SectionLabel>
                <div className="space-y-3">
                  <MusicPicker
                    options={catalog?.music || []}
                    value={musicId}
                    onChange={(key) => {
                      setMusicId(key)
                      setTrackMeta(null)
                    }}
                    volume={musicVolume}
                    onVolume={setMusicVolume}
                    preview={preview}
                  />
                  <BinauralPicker
                    options={catalog?.binaurals || []}
                    value={binauralId}
                    onChange={setBinauralId}
                    volume={binauralVolume}
                    onVolume={setBinauralVolume}
                    preview={preview}
                  />
                </div>
              </section>
            </div>

            <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-neutral-800 bg-black/70 p-4 md:p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Your session</p>
                  <button
                    type="button"
                    onClick={() => setChimes((on) => !on)}
                    aria-pressed={chimes}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                      chimes ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {chimes ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                    {chimes ? 'Chimes on' : 'Chimes off'}
                  </button>
                </div>

                <div className="my-3 md:my-5">
                  <VisualPreview kind={visual} inhale={inhale} exhale={exhale} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat value={`${inhale}s`} label="in" />
                  <Stat value={`${exhale}s`} label="out" />
                  <Stat value={`${duration}m`} label={`${breaths} breaths`} />
                </div>

                {(music || binaural) && (
                  <p className="mt-4 truncate text-center text-xs text-neutral-400">
                    {[music?.title, binaural?.title].filter(Boolean).join(' · ')}
                  </p>
                )}

                <button
                  type="button"
                  onClick={startComposer}
                  className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00FFFF] to-[#39FF14] text-base font-semibold text-black shadow-[0_0_40px_rgba(57,255,20,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_60px_rgba(57,255,20,0.4)] active:opacity-80"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Begin
                </button>

                <div className="mt-6 border-t border-neutral-800 pt-5">
                  <Input
                    label="Name"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Evening stillness"
                    maxLength={80}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => save(false)} loading={saving} disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {editingId ? 'Save changes' : 'Save to library'}
                    </Button>
                    {editingId && (
                      <Button variant="ghost" size="sm" onClick={() => save(true)} disabled={saving}>
                        Save as new
                      </Button>
                    )}
                  </div>
                  {notice && !error && <p className="mt-3 text-sm text-[#39FF14]">{notice}</p>}
                  {error && <p className="mt-3 text-sm text-[#FF0040]">{error}</p>}
                </div>
              </div>
            </aside>
          </div>
        </div>

        <TrackStudio onCreated={handleTrackCreated} />

        <MeditationLibrary
          loading={loading}
          mine={catalog?.mine || []}
          community={catalog?.community || []}
          editingId={editingId}
          onPlay={playCard}
          onEdit={(card) => loadIntoComposer(card, false)}
          onRemix={(card) => loadIntoComposer(card, true)}
          onUpdate={updateCard}
          onDelete={deleteCard}
        />
      </Stack>

      {session && (
        <FocusSession
          config={session.config}
          runId={runId}
          chimes={chimes}
          onChimesChange={setChimes}
          visual={visual}
          onVisualChange={setVisual}
          musicVolume={session.musicVolume}
          binauralVolume={session.binauralVolume}
          onMusicVolume={(volume) => setSessionVolume('music', volume)}
          onBinauralVolume={(volume) => setSessionVolume('binaural', volume)}
          onPause={() => audioRef.current?.pause()}
          onResume={() => audioRef.current?.resume()}
          onPhase={handlePhase}
          onComplete={handleComplete}
          onRestart={() => begin(session)}
          onClose={closeSession}
        />
      )}
    </Container>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">{children}</p>
}

function RhythmTile({
  selected,
  label,
  detail,
  onClick,
}: {
  selected: boolean
  label: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border-2 px-3 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
        selected
          ? 'border-[#39FF14]/60 bg-[#39FF14]/10 shadow-[0_0_24px_rgba(57,255,20,0.15)]'
          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
      }`}
    >
      <span className={`block text-sm font-semibold ${selected ? 'text-[#39FF14]' : 'text-white'}`}>{label}</span>
      <span className="block text-xs tabular-nums text-neutral-400">{detail}</span>
    </button>
  )
}

function RoundStep({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-neutral-300 transition-colors hover:bg-white/10 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3">
      <p className="mb-2 text-xs text-neutral-400">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <RoundStep label={`${label} shorter`} disabled={value <= min} onClick={() => onChange(clamp(value - 1, min, max))}>
          <Minus className="h-4 w-4" />
        </RoundStep>
        <span className="text-xl font-semibold tabular-nums text-white">{value}{unit}</span>
        <RoundStep label={`${label} longer`} disabled={value >= max} onClick={() => onChange(clamp(value + 1, min, max))}>
          <Plus className="h-4 w-4" />
        </RoundStep>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-2">
      <p className="text-lg font-semibold tabular-nums text-white">{value}</p>
      <p className="truncate text-[11px] text-neutral-500">{label}</p>
    </div>
  )
}
