'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Textarea, Input, Stack, VIVALoadingOverlay } from '@/lib/design-system/components'
import { Loader2, Music2, Pause, Play, RefreshCw, Save, X, Youtube } from 'lucide-react'
import { cn } from '@/lib/design-system/components/shared-utils'
import { ReferenceLibraryPicker, type ReferenceTrack } from '@/components/audio-studio/ReferenceLibraryPicker'
import { extractYoutubeAudio } from '@/lib/songs/extract-youtube-client'

interface SongRegeneratePanelProps {
  initialLyrics: string
  initialStylePrompt?: string | null
  isGenerating: boolean
  error?: string | null
  savedReference?: {
    youtube_url?: string
    title?: string
    clip_url?: string
    start?: number
    end?: number
    mureka_file_id?: string
  } | null
  onSaveLyrics: (lyrics: string, stylePrompt: string) => Promise<boolean>
  onGenerate: (options: {
    lyrics: string
    style_prompt?: string
    reference_id?: string
    reference_meta?: {
      youtube_url?: string
      title?: string
      clip_url?: string
      start?: number
      end?: number
      mureka_file_id?: string
    }
  }) => Promise<boolean>
}

export function SongRegeneratePanel({
  initialLyrics,
  initialStylePrompt,
  isGenerating,
  error,
  savedReference,
  onSaveLyrics,
  onGenerate,
}: SongRegeneratePanelProps) {
  const [lyrics, setLyrics] = useState(initialLyrics)
  const [stylePrompt, setStylePrompt] = useState(initialStylePrompt || '')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const [youtubeUrl, setYoutubeUrl] = useState(savedReference?.youtube_url || '')
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [regionStart, setRegionStart] = useState(savedReference?.start ?? 0)
  const [regionEnd, setRegionEnd] = useState(savedReference?.end ?? 30)
  const [isPlaying, setIsPlaying] = useState(false)
  const [referenceId, setReferenceId] = useState<string | null>(savedReference?.mureka_file_id || null)
  const [referenceTitle, setReferenceTitle] = useState<string | null>(savedReference?.title || null)
  const [referenceClipUrl, setReferenceClipUrl] = useState<string | null>(savedReference?.clip_url || null)

  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)
  const regionRef = useRef<any>(null)

  useEffect(() => {
    setLyrics(initialLyrics)
  }, [initialLyrics])

  useEffect(() => {
    setStylePrompt(initialStylePrompt || '')
  }, [initialStylePrompt])

  const loadYoutubeAudio = async () => {
    if (!youtubeUrl.trim()) return
    setAudioLoading(true)
    setAudioError(null)
    setAudioUrl(null)
    setReferenceId(null)

    try {
      const { audio_url, title } = await extractYoutubeAudio(youtubeUrl)
      setAudioUrl(audio_url)
      setRegionEnd(30)
      setReferenceTitle(title || null)
      setReferenceId(null)
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Failed to load audio')
    } finally {
      setAudioLoading(false)
    }
  }

  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return

    let ws: any = null

    const initWavesurfer = async () => {
      const WaveSurfer = (await import('wavesurfer.js')).default
      const RegionsPlugin = (await import('wavesurfer.js/dist/plugins/regions.js')).default

      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
      }

      ws = WaveSurfer.create({
        container: waveformRef.current!,
        waveColor: '#555',
        progressColor: '#39FF14',
        cursorColor: '#39FF14',
        height: 80,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        url: audioUrl,
      })

      const regions = ws.registerPlugin(RegionsPlugin.create())

      ws.on('ready', () => {
        const duration = ws.getDuration()
        const initialEnd = Math.min(30, duration)
        const region = regions.addRegion({
          start: 0,
          end: initialEnd,
          color: 'rgba(57, 255, 20, 0.15)',
          drag: true,
          resize: true,
        })
        regionRef.current = region
        setRegionStart(0)
        setRegionEnd(initialEnd)
      })

      regions.on('region-updated', (region: any) => {
        let start = region.start
        let end = region.end

        if (end - start > 30) {
          end = start + 30
          region.setOptions({ start, end })
        }
        if (end - start < 5) {
          end = start + 5
          region.setOptions({ start, end })
        }

        regionRef.current = region
        setRegionStart(start)
        setRegionEnd(end)
        setReferenceId(null)
      })

      regions.on('region-out', () => ws.pause())
      ws.on('play', () => setIsPlaying(true))
      ws.on('pause', () => setIsPlaying(false))
      wavesurferRef.current = ws
    }

    initWavesurfer()
    return () => { if (ws) ws.destroy() }
  }, [audioUrl])

  const togglePreview = () => {
    const ws = wavesurferRef.current
    const region = regionRef.current
    if (!ws) return
    if (isPlaying) {
      ws.pause()
      return
    }
    if (region) region.play(true)
    else {
      ws.setTime(regionStart)
      ws.play()
    }
  }

  const handleSave = async () => {
    if (!lyrics.trim()) return
    setSaving(true)
    setSaveMessage(null)
    const ok = await onSaveLyrics(lyrics.trim(), stylePrompt.trim())
    setSaving(false)
    setSaveMessage(ok ? 'Saved' : 'Save failed')
    setTimeout(() => setSaveMessage(null), 2500)
  }

  const handleGenerate = async () => {
    if (!lyrics.trim() || isGenerating) return

    let refId = referenceId
    if (audioUrl && !refId) {
      const refResponse = await fetch('/api/songs/upload-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: audioUrl,
          start: regionStart,
          end: regionEnd,
          title: referenceTitle || undefined,
          youtube_url: youtubeUrl || undefined,
        }),
      })
      if (!refResponse.ok) {
        const refErr = await refResponse.json().catch(() => ({}))
        setAudioError(refErr.error || 'Reference track upload failed')
        return
      }
      const refData = await refResponse.json()
      refId = refData.reference_id
      setReferenceId(refId)
      setReferenceClipUrl(refData.clip_url || null)
    }

    await onGenerate({
      lyrics: lyrics.trim(),
      style_prompt: stylePrompt.trim() || undefined,
      reference_id: refId || undefined,
      reference_meta: refId ? {
        youtube_url: youtubeUrl || undefined,
        title: referenceTitle || undefined,
        clip_url: referenceClipUrl || undefined,
        start: regionStart,
        end: regionEnd,
        mureka_file_id: refId,
      } : undefined,
    })
  }

  return (
    <Card variant="glass" className="p-8">
      <div className="mb-6 text-center">
        <p className="text-base font-semibold text-white">Create More Versions</p>
        <p className="mt-1 text-sm text-neutral-400">
          Edit lyrics, swap reference track, or generate new takes
        </p>
      </div>

      <div>
        <Stack gap="md">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Lyrics</label>
              <Textarea
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder="[Verse 1]&#10;Your lyrics here..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Style prompt
                <span className="ml-1 font-normal text-neutral-500">(optional if using reference track)</span>
              </label>
              <Input
                value={stylePrompt}
                onChange={e => setStylePrompt(e.target.value)}
                placeholder="uplifting, emotional, modern indie"
              />
            </div>

            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Reference track</label>

              <ReferenceLibraryPicker
                className="mb-2"
                onSelect={(ref: ReferenceTrack) => {
                  if (ref.youtube_url) setYoutubeUrl(ref.youtube_url)
                  setAudioUrl(null)
                  if (ref.title) setReferenceTitle(ref.title)
                  if (ref.mureka_file_id) setReferenceId(ref.mureka_file_id)
                  if (ref.clip_url) setReferenceClipUrl(ref.clip_url)
                  setRegionStart(Number(ref.clip_start) || 0)
                  setRegionEnd(Number(ref.clip_end) || 30)
                }}
              />

              {referenceId && !audioUrl && (referenceTitle || savedReference?.title) && (
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-[#39FF14]/20 bg-[#39FF14]/5 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <Music2 className="h-4 w-4 text-[#39FF14]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-200">{referenceTitle || savedReference?.title}</p>
                    <p className="text-[10px] text-neutral-500">
                      {regionStart.toFixed(0)}s – {regionEnd.toFixed(0)}s · Ready to use
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setReferenceId(null); setReferenceClipUrl(null); loadYoutubeAudio() }}
                      className="rounded px-2 py-1 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Change section
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReferenceId(null); setReferenceTitle(null); setReferenceClipUrl(null); setYoutubeUrl('') }}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              <VIVALoadingOverlay
                isVisible={audioLoading}
                className="!absolute !inset-0 !rounded-2xl"
                size="sm"
                messages={[
                  'Extracting audio from YouTube...',
                  'Processing the reference track...',
                  'Almost ready...',
                ]}
                cycleDuration={5000}
              />
              {!referenceId && (
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-700 bg-black/40 px-3 focus-within:border-[#39FF14]/50">
                    <Youtube className="h-4 w-4 shrink-0 text-neutral-500" />
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                      onKeyDown={e => { if (e.key === 'Enter') loadYoutubeAudio() }}
                    />
                  </div>
                  <Button variant="ghost" onClick={loadYoutubeAudio} disabled={!youtubeUrl.trim() || audioLoading}>
                    {audioLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load'}
                  </Button>
                </div>
              )}

              {audioError && <p className="mt-2 text-xs text-red-400">{audioError}</p>}

              {audioUrl && (
                <div className="mt-3 space-y-2">
                  {referenceTitle && (
                    <p className="truncate text-xs font-medium text-neutral-300">{referenceTitle}</p>
                  )}
                  <div ref={waveformRef} className="rounded-lg border border-neutral-700 bg-black/40 p-2" />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={togglePreview}
                      className="flex items-center gap-1.5 rounded-full border border-neutral-600 px-3 py-1 text-xs text-neutral-300 transition-colors hover:border-neutral-400"
                    >
                      {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      Preview
                    </button>
                    <span className="text-xs text-neutral-500">
                      {regionStart.toFixed(1)}s – {regionEnd.toFixed(1)}s
                    </span>
                    <button
                      type="button"
                      onClick={() => { setAudioUrl(null); setYoutubeUrl(''); setReferenceId(null) }}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {(error || saveMessage) && (
              <p className={cn('text-sm', error ? 'text-red-400' : 'text-primary-500')}>
                {error || saveMessage}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving || !lyrics.trim()}>
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Save Changes
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating || !lyrics.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Generate More Versions
                  </>
                )}
              </Button>
            </div>
          </Stack>
        </div>
    </Card>
  )
}
