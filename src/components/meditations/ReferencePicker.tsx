'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Link2, Loader2, Pause, Play, Trash2, Upload, X } from 'lucide-react'
import { Button, Input } from '@/lib/design-system/components'
import { REFERENCE_CLIP_SECONDS } from '@/lib/meditations/constants'
import { sameOriginMediaUrl } from '@/lib/meditations/media-url'
import { extractYoutubeAudio } from '@/lib/songs/extract-youtube-client'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { usePreview } from './SoundPicker'

export interface MeditationReference {
  id: string
  title: string
  source_url: string
  youtube_url: string | null
  clip_url: string
  clip_start: number
  created_at: string
}

interface LoadedSource {
  url: string
  title: string
  youtubeUrl: string | null
}

interface ReferencePickerProps {
  selectedId: string | null
  onSelect: (reference: MeditationReference | null) => void
  disabled?: boolean
}

interface WaveSurferLike {
  destroy: () => void
  pause: () => void
  isPlaying: () => boolean
  on: (event: string, handler: () => void) => void
  getDuration: () => number
  registerPlugin: <T>(plugin: T) => T
}

interface RegionLike {
  start: number
  end: number
  play: (stopAtEnd?: boolean) => void
}

function formatSeconds(value: number) {
  const seconds = Math.max(0, Math.floor(value))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function ReferencePicker({ selectedId, onSelect, disabled }: ReferencePickerProps) {
  const [references, setReferences] = useState<MeditationReference[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [source, setSource] = useState<LoadedSource | null>(null)
  const [title, setTitle] = useState('')
  const [clipStart, setClipStart] = useState(0)
  const [loadingSource, setLoadingSource] = useState(false)
  const [saving, setSaving] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const waveformRef = useRef<HTMLDivElement | null>(null)
  const wavesurferRef = useRef<WaveSurferLike | null>(null)
  const regionRef = useRef<RegionLike | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const preview = usePreview()

  const loadReferences = useCallback(async () => {
    const response = await fetch('/api/meditations/references')
    const data = await response.json().catch(() => ({}))
    if (response.ok) setReferences(data.references || [])
  }, [])

  useEffect(() => {
    loadReferences().finally(() => setLoadingList(false))
  }, [loadReferences])

  useEffect(() => {
    if (!source || !waveformRef.current) return
    let cancelled = false
    let ws: WaveSurferLike | null = null

    async function init() {
      const WaveSurfer = (await import('wavesurfer.js')).default
      const RegionsPlugin = (await import('wavesurfer.js/dist/plugins/regions.js')).default
      if (cancelled || !waveformRef.current || !source) return

      ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#555',
        progressColor: '#BF00FF',
        cursorColor: '#BF00FF',
        height: 64,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        url: sameOriginMediaUrl(source.url),
      }) as unknown as WaveSurferLike
      const regions = ws.registerPlugin(RegionsPlugin.create()) as unknown as {
        addRegion: (options: Record<string, unknown>) => RegionLike
        on: (event: string, handler: (region: RegionLike) => void) => void
      }

      ws.on('ready', () => {
        const duration = ws!.getDuration()
        regionRef.current = regions.addRegion({
          start: 0,
          end: Math.min(REFERENCE_CLIP_SECONDS, duration),
          color: 'rgba(191, 0, 255, 0.18)',
          drag: true,
          resize: false,
        })
        setClipStart(0)
      })
      regions.on('region-updated', (region) => {
        regionRef.current = region
        setClipStart(region.start)
      })
      regions.on('region-out', () => ws?.pause())
      ws.on('play', () => setPlaying(true))
      ws.on('pause', () => setPlaying(false))
      wavesurferRef.current = ws
    }

    void init()
    return () => {
      cancelled = true
      ws?.destroy()
      wavesurferRef.current = null
      regionRef.current = null
      setPlaying(false)
    }
  }, [source])

  function clearSource() {
    setSource(null)
    setTitle('')
    setYoutubeUrl('')
    setError(null)
  }

  async function loadYoutube() {
    const url = youtubeUrl.trim()
    if (!url) return
    setLoadingSource(true)
    setError(null)
    try {
      const result = await extractYoutubeAudio(url)
      setSource({ url: result.audio_url, title: result.title || 'YouTube reference', youtubeUrl: url })
      setTitle(result.title || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load that link')
    } finally {
      setLoadingSource(false)
    }
  }

  async function uploadFile(file: File) {
    setLoadingSource(true)
    setError(null)
    try {
      const { url } = await uploadUserFile('customTracks', file)
      const name = file.name.replace(/\.[^.]+$/, '')
      setSource({ url, title: name, youtubeUrl: null })
      setTitle(name)
      setYoutubeUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that file')
    } finally {
      setLoadingSource(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function toggleClipPreview() {
    const ws = wavesurferRef.current
    if (!ws) return
    if (ws.isPlaying()) {
      ws.pause()
      return
    }
    preview.stop()
    regionRef.current?.play(true)
  }

  async function saveReference() {
    if (!source) return
    setSaving(true)
    setError(null)
    wavesurferRef.current?.pause()
    try {
      const response = await fetch('/api/meditations/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: source.url,
          start: clipStart,
          title: title.trim() || source.title,
          youtube_url: source.youtubeUrl,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not save the reference')
      setReferences((current) => [data.reference, ...current])
      onSelect(data.reference)
      clearSource()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the reference')
    } finally {
      setSaving(false)
    }
  }

  async function removeReference(reference: MeditationReference) {
    if (selectedId === reference.id) onSelect(null)
    if (preview.previewUrl === reference.clip_url) preview.stop()
    setReferences((current) => current.filter((item) => item.id !== reference.id))
    await fetch(`/api/meditations/references?id=${reference.id}`, { method: 'DELETE' }).catch(() => {})
  }

  const busy = disabled || loadingSource || saving

  return (
    <div className="space-y-4">
      {loadingList ? (
        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-neutral-500" /></div>
      ) : references.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Your references</p>
          <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800">
            {references.map((reference) => {
              const selected = reference.id === selectedId
              const previewing = preview.previewUrl === reference.clip_url
              return (
                <div key={reference.id} className={`flex items-center gap-2 px-2 py-1.5 ${selected ? 'bg-[#BF00FF]/10' : ''}`}>
                  <button
                    type="button"
                    onClick={() => preview.toggle(reference.clip_url)}
                    aria-label={previewing ? `Stop preview of ${reference.title}` : `Preview ${reference.title}`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      previewing ? 'bg-[#00FFFF] text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    {previewing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(selected ? null : reference)}
                    className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
                  >
                    <span className={`min-w-0 flex-1 truncate text-sm ${selected ? 'text-[#BF00FF]' : 'text-white'}`}>
                      {reference.title}
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-[#BF00FF]" />}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeReference(reference)}
                    aria-label={`Delete ${reference.title}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {source ? (
        <div className="space-y-3 rounded-xl border border-neutral-800 bg-black/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wider text-neutral-500">Pick a {REFERENCE_CLIP_SECONDS}-second section</p>
            <button type="button" onClick={clearSource} aria-label="Discard" className="text-neutral-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={waveformRef} className="min-w-0 overflow-hidden rounded-lg" />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleClipPreview}
              className="flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 transition-colors hover:border-neutral-500"
            >
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              Preview section
            </button>
            <span className="text-xs tabular-nums text-neutral-500">
              {formatSeconds(clipStart)} – {formatSeconds(clipStart + REFERENCE_CLIP_SECONDS)}
            </span>
          </div>
          <Input
            label="Reference name"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Slow piano drift"
            disabled={busy}
          />
          <Button variant="accent" size="sm" onClick={saveReference} loading={saving} disabled={busy}>
            Save reference
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Add a reference</p>
          <div className="flex min-w-0 gap-2">
            <div className="relative min-w-0 flex-1">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="url"
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void loadYoutube() }}
                placeholder="Paste a YouTube link"
                disabled={busy}
                className="h-11 w-full rounded-full border border-neutral-700 bg-black/40 pl-9 pr-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#BF00FF]/50 focus:outline-none disabled:opacity-50"
              />
            </div>
            <Button variant="outline" size="sm" onClick={loadYoutube} disabled={busy || !youtubeUrl.trim()}>
              {loadingSource && youtubeUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load'}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void uploadFile(file)
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            {loadingSource && !youtubeUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload an MP3 or WAV
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-[#FF0040]">{error}</p>}
    </div>
  )
}
