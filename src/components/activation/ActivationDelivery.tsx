'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Button,
  Stack,
  Text,
  Spinner,
  AudioPlayer,
  EmbeddedPlayer,
  Video,
} from '@/lib/design-system/components'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { PlainLyricsDisplay, SyncedLyricsDisplay } from '@/components/audio-studio/SyncedLyricsDisplay'
import { convertMurekaLyrics, type MurekaLyricsSection, type SyncedLyrics } from '@/lib/utils/lyrics-alignment'
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  Copy,
  Download,
  HelpCircle,
  Images,
  Map,
  Mic,
  Music,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'
import { ACTIVATION_COPY } from '@/lib/activation/copy'
import { ACTIVATION_IMMERSION_OFFER_VIDEO } from '@/lib/activation/videos'
import { toast } from 'sonner'
import { ActivationMediaPick } from '@/components/activation/ActivationMediaPick'
import type { ActivationGenreId, ActivationVoiceId } from '@/lib/activation/media-options'

function deliveryGlow(color: string): { borderColor: string; boxShadow: string } {
  return {
    borderColor: `${color}40`,
    boxShadow: `0 0 40px ${color}24, 0 18px 40px rgba(0, 0, 0, 0.45)`,
  }
}

function DeliverySurface({
  id,
  glow,
  padded = 'lg',
  className = '',
  children,
}: {
  id?: string
  glow?: string
  padded?: 'lg' | 'md'
  className?: string
  children: ReactNode
}) {
  return (
    <div
      id={id}
      className={`scroll-mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] ${
        padded === 'md' ? 'p-5 md:p-6' : 'p-5 md:p-8'
      } ${className}`}
      style={glow ? deliveryGlow(glow) : undefined}
    >
      {children}
    </div>
  )
}

export type DeliveryPhase = 'preview' | 'immersion' | 'offer'

export interface DeliveryActivation {
  id: string
  status: string
  category: string | null
  first_name?: string | null
  current_state?: string | null
  dream_response?: Record<string, string> | null
  reflection?: string | null
  vision_statement: string | null
  essence: string | null
  inspired_next_step: string | null
  opened_at?: string | null
  entered_at: string | null
  asset_status: Record<string, { state?: string; mureka_task_id?: string; [key: string]: unknown }>
  song_id?: string | null
}

export interface DeliveryAssets {
  story: { id: string; title: string; content: string } | null
  incantation: { id: string; title: string; content: string } | null
  sparkQuery: { id: string; title: string; content: string; metadata?: { questions?: string[] } } | null
  song: {
    id: string
    title: string
    lyrics: string | null
    status: string
    tracks: Array<{
      id: string
      audio_url: string
      cover_url: string | null
      title: string | null
      duration_ms?: number | null
      metadata?: Record<string, unknown> | null
    }>
  } | null
  audioTracks: Array<{ id: string; audio_url: string; duration_seconds: number; section_key: string }>
  manifestations: Array<{ id: string; name: string; description: string | null; image_url: string | null }>
}

function ActivationPlayBeacon({
  trackIds,
  eventType,
  onTrack,
}: {
  trackIds: string[]
  eventType: string
  onTrack?: (eventType: string, eventData?: Record<string, unknown>) => void
}) {
  const storeTracks = useGlobalAudioStore((s) => s.tracks)
  const isPlaying = useGlobalAudioStore((s) => s.isPlaying)
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || !isPlaying || trackIds.length === 0) return
    if (storeTracks.some((t) => trackIds.includes(t.id))) {
      fired.current = true
      onTrack?.(eventType)
    }
  }, [isPlaying, storeTracks, trackIds, eventType, onTrack])

  return null
}

const CREATING_WAVE = [0.35, 0.62, 0.9, 0.48, 0.78, 1, 0.55, 0.84, 0.42, 0.7, 0.95, 0.5, 0.8, 0.38, 0.66, 0.92, 0.58, 0.74]

function useCreatingProgress(estimatedMs: number) {
  const started = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const tick = () => setElapsed(Date.now() - started.current)
    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [])

  const t = Math.min(elapsed / estimatedMs, 1)
  const eased = 1 - Math.pow(1 - t, 3)
  const progress = t < 1
    ? 8 + eased * 84
    : 92 + Math.min((elapsed - estimatedMs) / 90000, 1) * 6

  return { progress, elapsed }
}

function CreatingStage({
  kind,
  color,
  lines,
  estimatedMs,
}: {
  kind: 'player' | 'song' | 'board'
  color: string
  lines: readonly string[]
  estimatedMs: number
}) {
  const { progress, elapsed } = useCreatingProgress(estimatedMs)
  const line = lines[Math.min(lines.length - 1, Math.floor(elapsed / 6000))] || lines[0]

  const bar = (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-[width] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow: `0 0 18px ${color}`,
        }}
      />
    </div>
  )

  const waveform = (
    <div className="flex h-16 items-end justify-center gap-1" aria-hidden>
      {CREATING_WAVE.map((peak, i) => (
        <span
          key={i}
          className="w-1.5 origin-bottom rounded-full"
          style={{
            height: `${Math.round(peak * 64)}px`,
            backgroundColor: color,
            opacity: 0.35 + peak * 0.65,
            animation: 'activation-creating-bar 1.15s ease-in-out infinite',
            animationDelay: `${(i % 7) * 0.12}s`,
          }}
        />
      ))}
    </div>
  )

  if (kind === 'board') {
    return (
      <div role="status" aria-live="polite" className="space-y-4">
        <CreatingKeyframes />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/50"
            >
              <div
                className="absolute inset-y-0 w-1/2"
                style={{
                  background: `linear-gradient(90deg, transparent, ${color}33, transparent)`,
                  animation: 'activation-creating-sweep 2.4s ease-in-out infinite',
                  animationDelay: `${i * 0.35}s`,
                }}
              />
            </div>
          ))}
        </div>
        {bar}
        <p className="text-center text-sm text-neutral-300">{line}</p>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={kind === 'player' ? 'mx-auto w-full max-w-md' : 'w-full'}
    >
      <CreatingKeyframes />
      <div
        className="rounded-2xl border bg-black/50 px-5 py-6"
        style={{
          borderColor: `${color}55`,
          boxShadow: `0 0 36px ${color}22`,
        }}
      >
        {kind === 'song' && (
          <div className="relative mx-auto mb-5 aspect-square w-40 overflow-hidden rounded-xl border border-white/10 bg-black/60">
            <div
              className="absolute inset-y-0 w-1/2"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}44, transparent)`,
                animation: 'activation-creating-sweep 2.2s ease-in-out infinite',
              }}
            />
            <Music className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/30" />
          </div>
        )}
        {waveform}
        <div className="mt-5">{bar}</div>
        <p className="mt-3 text-center text-sm text-neutral-200">{line}</p>
      </div>
    </div>
  )
}

function CreatingKeyframes() {
  return (
    <style>{`
      @keyframes activation-creating-bar {
        0%, 100% { transform: scaleY(0.28); }
        50% { transform: scaleY(1); }
      }
      @keyframes activation-creating-sweep {
        0% { transform: translateX(-130%); }
        100% { transform: translateX(280%); }
      }
    `}</style>
  )
}

function SpokenAudio({
  track,
  title,
  generating,
  failed,
  onRetry,
  retrying,
  mapActivityType,
  color,
}: {
  track?: { id: string; audio_url: string; duration_seconds: number; section_key: string }
  title: string
  generating: boolean
  failed: boolean
  onRetry?: () => void
  retrying?: boolean
  mapActivityType: 'vision_audio' | 'story_audio'
  color: string
}) {
  const copy = ACTIVATION_COPY.immersion
  if (track) {
    return (
      <div className="w-full md:w-72 mx-auto">
        <AudioPlayer
          track={{
            id: track.id,
            title,
            artist: '',
            duration: track.duration_seconds || 0,
            url: track.audio_url,
          }}
          compact
          showInfo={false}
          mapActivityType={mapActivityType}
        />
      </div>
    )
  }
  if (failed) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs text-[#FF0040]">
          <XCircle className="h-3.5 w-3.5" /> {copy.failed}
        </span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} disabled={retrying}>
            {retrying ? copy.retrying : copy.retry}
          </Button>
        )}
      </div>
    )
  }
  if (generating) {
    return (
      <CreatingStage
        kind="player"
        color={color}
        lines={copy.creatingAudioLines}
        estimatedMs={40000}
      />
    )
  }
  return null
}

export function ActivationDelivery({
  phase,
  activation,
  assets,
  onEnter,
  entering,
  onTrack,
  onRetryEnrich,
  retrying,
  hideStickyCta,
}: {
  phase: DeliveryPhase
  activation: DeliveryActivation
  assets: DeliveryAssets
  onEnter?: (choices: { voiceId: ActivationVoiceId; genreId: ActivationGenreId }) => void
  entering?: boolean
  onTrack?: (eventType: string, eventData?: Record<string, unknown>) => void
  onRetryEnrich?: () => void
  retrying?: boolean
  hideStickyCta?: boolean
}) {
  const preview = ACTIVATION_COPY.preview
  const copy = ACTIVATION_COPY.immersion
  const offerRef = useRef<HTMLDivElement>(null)
  const offerViewed = useRef(false)
  const [voiceId, setVoiceId] = useState<ActivationVoiceId>('nova')
  const [genreId, setGenreId] = useState<ActivationGenreId>('unstoppable')
  const [packing, setPacking] = useState(false)

  const categoryLabel = activation.category
    ? getVisionCategoryLabel(activation.category as VisionCategoryKey)
    : null
  const firstName = activation.first_name?.trim() || null
  const sparkQuestions: string[] =
    assets.sparkQuery?.metadata?.questions ||
    (assets.sparkQuery?.content ? assets.sparkQuery.content.split('\n').filter(Boolean) : [])
  const songTracks = (assets.song?.tracks || []).filter((t) => t.audio_url)
  const audioTracks = assets.audioTracks || []
  const visionAudio = audioTracks.find((t) => t.section_key === 'life_i_choose')
  const storyAudio = audioTracks.find((t) => t.section_key === 'future_self_story')
  const assetStatus = activation.asset_status || {}
  const showOffer = phase !== 'preview'

  useEffect(() => {
    if (!showOffer || !offerRef.current) return
    const node = offerRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !offerViewed.current) {
          offerViewed.current = true
          onTrack?.('offer_video_viewed')
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [showOffer, onTrack])

  function downloadText(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    onTrack?.('assets_downloaded', { file: filename })
  }

  async function downloadEverything() {
    if (packing) return
    if (activation.id === 'preview') {
      toast.error(copy.downloadPreviewUnavailable)
      return
    }
    setPacking(true)
    try {
      const res = await fetch(`/api/activation/${activation.id}/download`, { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as { url?: string; filename?: string; error?: string }
      if (!res.ok || !data.url) {
        throw new Error(data.error || copy.downloadFailed)
      }
      const a = document.createElement('a')
      a.href = data.url
      a.download = data.filename || 'Activation.zip'
      a.rel = 'noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
      onTrack?.('assets_downloaded', { file: 'everything' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.downloadFailed)
    } finally {
      setPacking(false)
    }
  }

  function paidCta() {
    onTrack?.('paid_offer_clicked')
    window.location.href = `/checkout?product=membership&planType=solo&activation=${activation.id}`
  }

  if (phase === 'preview') {
    const writtenReady = {
      vision: !!activation.vision_statement,
      story: !!assets.story?.content,
      incantation: !!assets.incantation?.content,
      spark_query: sparkQuestions.length > 0,
      song: !!assets.song?.lyrics,
    }
    return (
      <Stack gap="lg">
        <div className="pt-2 text-center">
          <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
            {preview.headline(firstName, categoryLabel)}
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-base leading-[1.75] text-neutral-400 md:text-lg">
            {preview.supporting}
          </p>
        </div>

        <DeliverySurface glow="#39FF14" padded="md">
          <Stack gap="sm">
            {preview.assets.map((item) => {
              const ready = writtenReady[item.key as keyof typeof writtenReady]
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                >
                  <CheckCircle className={`h-5 w-5 flex-shrink-0 ${ready ? 'text-[#39FF14]' : 'text-neutral-600'}`} />
                  <Text size="sm" className="text-white font-medium">{item.label}</Text>
                  {ready && (
                    <span className="ml-auto text-xs text-[#39FF14]">{preview.readyLabel}</span>
                  )}
                </div>
              )
            })}
          </Stack>
        </DeliverySurface>

        <DeliverySurface padded="md">
          <ActivationMediaPick
            voiceId={voiceId}
            genreId={genreId}
            onChange={(choices) => {
              setVoiceId(choices.voiceId)
              setGenreId(choices.genreId)
            }}
          />
        </DeliverySurface>

        {onEnter && (
          <div className="flex justify-center pb-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEnter({ voiceId, genreId })}
              disabled={entering}
            >
              {entering ? (
                <>
                  <Spinner variant="primary" size="sm" className="mr-2" />
                  {preview.entering}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {preview.enter}
                </>
              )}
            </Button>
          </div>
        )}
      </Stack>
    )
  }

  const audioFailed = assetStatus.audio?.state === 'failed' && !visionAudio && !storyAudio
  const songReady = songTracks.length > 0
  const songFailed = assetStatus.song?.state === 'failed' && !songReady
  const boardReady = assets.manifestations.some((m) => m.image_url)
  const boardFailed = assetStatus.board?.state === 'failed' && !boardReady

  function downloadUrl(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    a.rel = 'noreferrer'
    a.click()
    onTrack?.('assets_downloaded', { file: filename })
  }

  return (
    <Stack gap="lg">
      <div className="pt-2 text-center">
        <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          Your{' '}
          {categoryLabel ? (
            <>
              <span className="hp-display text-[#39FF14]">{categoryLabel}</span>{' '}
            </>
          ) : null}
          Activation
        </h1>
      </div>

      <ActivationMap copy={copy} />

      <AssetSection
        id="life-i-choose"
        icon={Sparkles}
        color="#39FF14"
        title={copy.lifeIChoose}
        hint={copy.lifeIChooseHint}
        text={activation.vision_statement || ''}
        downloadName="life-i-choose.txt"
        onDownload={downloadText}
        copy={copy}
        media={
          <SpokenAudio
            track={visionAudio}
            title={copy.lifeIChoose}
            generating={!visionAudio && !audioFailed}
            failed={audioFailed && !visionAudio}
            onRetry={onRetryEnrich}
            retrying={retrying}
            mapActivityType="vision_audio"
            color="#39FF14"
          />
        }
      >
        <p className="text-base md:text-lg text-neutral-100 leading-relaxed whitespace-pre-line">
          {activation.vision_statement}
        </p>
      </AssetSection>

      {assets.story && (
        <AssetSection
          id="future-self-story"
          icon={BookOpen}
          color="#00FFFF"
          title={copy.story}
          hint={copy.storyHint}
          text={assets.story.content}
          downloadName="future-self-story.txt"
          onDownload={downloadText}
          copy={copy}
          media={
            <SpokenAudio
              track={storyAudio}
              title={copy.story}
              generating={!storyAudio && !audioFailed}
              failed={audioFailed && !storyAudio}
              onRetry={onRetryEnrich}
              retrying={retrying}
              mapActivityType="story_audio"
              color="#00FFFF"
            />
          }
        >
          <p className="text-base md:text-lg text-neutral-200 leading-relaxed whitespace-pre-line">
            {assets.story.content}
          </p>
        </AssetSection>
      )}

      {assets.incantation && (
        <AssetSection
          id="incantation"
          icon={Mic}
          color="#FFB701"
          title={copy.incantation}
          hint={copy.incantationHint}
          text={assets.incantation.content}
          downloadName="incantation.txt"
          onDownload={downloadText}
          copy={copy}
        >
          <p className="text-base md:text-lg text-neutral-100 leading-relaxed whitespace-pre-line italic">
            {assets.incantation.content}
          </p>
        </AssetSection>
      )}

      {assets.sparkQuery && (
        <AssetSection
          id="spark-query"
          icon={HelpCircle}
          color="#BF00FF"
          title={copy.sparkQuery}
          hint={copy.sparkHint}
          text={sparkQuestions.join('\n\n')}
          downloadName="spark-query.txt"
          onDownload={downloadText}
          copy={copy}
        >
          <Stack gap="sm">
            {sparkQuestions.map((q, i) => (
              <p key={i} className="text-base md:text-lg text-neutral-100 leading-relaxed">{q}</p>
            ))}
          </Stack>
        </AssetSection>
      )}

      <SongSection
        copy={copy}
        lyrics={assets.song?.lyrics || null}
        songTitle={assets.song?.title || copy.song}
        categoryLabel={categoryLabel}
        tracks={songTracks}
        ready={songReady}
        failed={songFailed}
        onTrack={onTrack}
        onRetry={onRetryEnrich}
        retrying={retrying}
      />

      <BoardSection
        copy={copy}
        manifestations={assets.manifestations}
        ready={boardReady}
        failed={boardFailed}
        onRetry={onRetryEnrich}
        retrying={retrying}
        onDownloadUrl={downloadUrl}
      />

      <DeliverySurface>
        <Stack gap="lg">
          <SectionHeading icon={Download} color="#39FF14" title={copy.keepTitle} hint={copy.keepBody} />
          <div className="flex justify-center">
            <Button variant="secondary" size="sm" onClick={downloadEverything} disabled={packing}>
              {packing ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {copy.downloadingEverything}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {copy.downloadEverything}
                </>
              )}
            </Button>
          </div>
        </Stack>
      </DeliverySurface>

      {showOffer && (
        <div id="continue" ref={offerRef}>
          <DeliverySurface glow="#39FF14" padded="md">
            <div className="text-center">
              <Stack gap="md">
                <h3 className="text-lg md:text-2xl font-bold text-white">{copy.offerTitle}</h3>
                <p className="mx-auto max-w-4xl text-base leading-relaxed text-neutral-400 md:text-lg">
                  {copy.offerBody}
                </p>
                <VideoSlot
                  label={copy.offerVideoLabel}
                  src={ACTIVATION_IMMERSION_OFFER_VIDEO.src}
                  poster={ACTIVATION_IMMERSION_OFFER_VIDEO.poster}
                  trackingId="activation-offer-video"
                  compact
                />
                <div className="flex justify-center">
                  <Button variant="primary" size="sm" onClick={paidCta}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {copy.offerCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Stack>
            </div>
          </DeliverySurface>
        </div>
      )}

      {showOffer && !hideStickyCta && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-7xl px-4 py-3 flex justify-center">
            <Button variant="primary" size="sm" onClick={paidCta}>
              {copy.offerCta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Stack>
  )
}

function CopyControl({
  text,
  copy,
}: {
  text: string
  copy: typeof ACTIVATION_COPY.immersion
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!text.trim()) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
      {copied ? copy.copied : copy.copyLabel}
    </Button>
  )
}

function VideoSlot({
  label,
  src,
  poster,
  trackingId,
  compact,
}: {
  label: string
  src: string
  poster: string
  trackingId: string
  compact?: boolean
}) {
  return (
    <div className={`mx-auto w-full ${compact ? 'max-w-xl' : 'mt-8 max-w-3xl'}`}>
      <Video
        src={src}
        poster={poster}
        trackingId={trackingId}
        saveProgress={false}
        variant="card"
        className="border-white/10"
      />
      <p className="mt-2 text-center text-[11px] uppercase tracking-wider text-neutral-600">{label}</p>
    </div>
  )
}

const MAP_STOP_COLORS: Record<string, string> = {
  'life-i-choose': '#39FF14',
  'future-self-story': '#00FFFF',
  incantation: '#FFB701',
  'spark-query': '#BF00FF',
  song: '#FF4D8D',
  'vision-board': '#00FFFF',
}

function ActivationMap({
  copy,
}: {
  copy: typeof ACTIVATION_COPY.immersion
}) {
  return (
    <DeliverySurface id="activation-map" glow="#BF00FF">
      <Stack gap="lg">
        <SectionHeading
          icon={Map}
          color="#BF00FF"
          title={copy.mapTitle}
          hint={
            <>
              {copy.mapLead.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </>
          }
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {copy.mapStops.map((stop, i) => {
            const color = MAP_STOP_COLORS[stop.id] || '#BF00FF'
            return (
              <button
                key={stop.id}
                type="button"
                onClick={() => document.getElementById(stop.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-xl border border-white/10 bg-black/40 p-5 text-left transition-all duration-200 hover:border-white/30 hover:bg-black/60"
              >
                <span className="text-sm font-semibold" style={{ color }}>
                  {i + 1}
                </span>
                <p className="mt-2 text-lg font-semibold text-white">{stop.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">{stop.use}</p>
              </button>
            )
          })}
        </div>
      </Stack>
    </DeliverySurface>
  )
}

function SectionHeading({
  icon: Icon,
  color,
  title,
  hint,
  status,
}: {
  icon: typeof Sparkles
  color: string
  title: string
  hint?: ReactNode
  status?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1A`, color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-xl font-bold leading-tight text-white md:text-2xl">{title}</h2>
      </div>
      {status && <div className="mt-2">{status}</div>}
      {hint && (
        <div className="mt-2 max-w-3xl space-y-3 text-base leading-relaxed text-neutral-400">
          {typeof hint === 'string' ? <p>{hint}</p> : hint}
        </div>
      )}
    </div>
  )
}

function EnrichmentStatus({
  ready,
  failed,
  copy,
}: {
  ready: boolean
  failed: boolean
  copy: typeof ACTIVATION_COPY.immersion
}) {
  if (ready) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#39FF14]">
        <CheckCircle className="h-3.5 w-3.5" />
        {copy.ready}
      </span>
    )
  }
  if (failed) {
    return <span className="text-xs text-[#FF0040]">{copy.failedLabel}</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
      <Spinner size="sm" />
      {copy.creating}
    </span>
  )
}

function AssetSection({
  id,
  icon,
  color,
  title,
  hint,
  text,
  downloadName,
  onDownload,
  copy,
  media,
  children,
}: {
  id: string
  icon: typeof Sparkles
  color: string
  title: string
  hint: string
  text: string
  downloadName: string
  onDownload: (filename: string, content: string) => void
  copy: typeof ACTIVATION_COPY.immersion
  media?: ReactNode
  children: ReactNode
}) {
  return (
    <DeliverySurface id={id} glow={color}>
      <Stack gap="lg">
        <SectionHeading icon={icon} color={color} title={title} hint={hint} />
        {media}
        {children}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <CopyControl text={text} copy={copy} />
          <Button variant="ghost" size="sm" onClick={() => onDownload(downloadName, text)}>
            <Download className="mr-1.5 h-4 w-4" />
            {copy.download}
          </Button>
        </div>
      </Stack>
    </DeliverySurface>
  )
}

function SongSection({
  copy,
  lyrics,
  songTitle,
  categoryLabel,
  tracks,
  ready,
  failed,
  onTrack,
  onRetry,
  retrying,
}: {
  copy: typeof ACTIVATION_COPY.immersion
  lyrics: string | null
  songTitle: string
  categoryLabel: string | null
  tracks: Array<{
    id: string
    audio_url: string
    cover_url: string | null
    title: string | null
    duration_ms?: number | null
    metadata?: Record<string, unknown> | null
  }>
  ready: boolean
  failed: boolean
  onTrack?: (eventType: string, eventData?: Record<string, unknown>) => void
  onRetry?: () => void
  retrying?: boolean
}) {
  const playerTracks: AudioTrack[] = tracks.map((t, i) => {
    const lyricsSections = t.metadata?.lyrics_sections
    const synced = Array.isArray(lyricsSections) && lyricsSections.length
      ? convertMurekaLyrics(lyricsSections as MurekaLyricsSection[])
      : undefined
    return {
      id: t.id,
      title: songTitle,
      artist: categoryLabel || '',
      duration: t.duration_ms ? t.duration_ms / 1000 : 0,
      url: t.audio_url,
      thumbnail: t.cover_url || undefined,
      versionLabel: tracks.length > 1 ? (t.title || `Version ${i + 1}`) : undefined,
      syncedLyrics: synced,
      plainLyrics: lyrics || undefined,
    }
  })

  const storeTracks = useGlobalAudioStore((s) => s.tracks)
  const storeIndex = useGlobalAudioStore((s) => s.currentIndex)
  const isThisSet =
    storeTracks.length === playerTracks.length &&
    playerTracks.length > 0 &&
    storeTracks[0]?.id === playerTracks[0]?.id
  const activeTrack = isThisSet ? storeTracks[storeIndex] : playerTracks[0]
  const syncedLyrics = activeTrack?.syncedLyrics as SyncedLyrics | undefined
  const plainLyrics = lyrics || undefined
  const hasCover = playerTracks.some((t) => t.thumbnail)

  return (
    <DeliverySurface id="song" glow="#FF4D8D">
      <Stack gap="lg">
        <SectionHeading
          icon={Music}
          color="#FF4D8D"
          title={copy.song}
          hint={copy.songHint}
          status={ready || failed ? <EnrichmentStatus ready={ready} failed={failed} copy={copy} /> : undefined}
        />
        {playerTracks.length === 0 && !failed && (
          <div className={plainLyrics ? 'grid gap-4 lg:grid-cols-2 lg:items-start' : undefined}>
            <CreatingStage
              kind="song"
              color="#FF4D8D"
              lines={copy.creatingSongLines}
              estimatedMs={90000}
            />
            {plainLyrics ? <PlainLyricsDisplay lyrics={plainLyrics} /> : null}
          </div>
        )}
        {playerTracks.length > 0 && (
          <>
            <ActivationPlayBeacon
              trackIds={playerTracks.map((t) => t.id)}
              eventType="song_played"
              onTrack={onTrack}
            />
            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
              <EmbeddedPlayer
                tracks={playerTracks}
                setName={songTitle}
                contentCategory="music"
                mapActivityType="song_listen"
                trackCount={playerTracks.length}
                enableArtworkLightbox={hasCover}
                hideArtwork={!hasCover}
              />
              {syncedLyrics ? (
                <SyncedLyricsDisplay syncedLyrics={syncedLyrics} plainText={plainLyrics} />
              ) : plainLyrics ? (
                <PlainLyricsDisplay lyrics={plainLyrics} />
              ) : null}
            </div>
          </>
        )}
        {playerTracks.length === 0 && failed && plainLyrics && (
          <PlainLyricsDisplay lyrics={plainLyrics} />
        )}
        {failed && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-[#FF0040]">{copy.failed}</p>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} disabled={retrying}>
                {retrying ? copy.retrying : copy.retry}
              </Button>
            )}
          </div>
        )}
      </Stack>
    </DeliverySurface>
  )
}

function BoardSection({
  copy,
  manifestations,
  ready,
  failed,
  onRetry,
  retrying,
  onDownloadUrl,
}: {
  copy: typeof ACTIVATION_COPY.immersion
  manifestations: DeliveryAssets['manifestations']
  ready: boolean
  failed: boolean
  onRetry?: () => void
  retrying?: boolean
  onDownloadUrl: (url: string, filename: string) => void
}) {
  return (
    <DeliverySurface id="vision-board" glow="#00FFFF">
      <Stack gap="lg">
        <SectionHeading
          icon={Images}
          color="#00FFFF"
          title={copy.images}
          hint={copy.imagesHint}
          status={ready || failed ? <EnrichmentStatus ready={ready} failed={failed} copy={copy} /> : undefined}
        />
        {!ready && !failed && (
          <CreatingStage
            kind="board"
            color="#00FFFF"
            lines={copy.creatingBoardLines}
            estimatedMs={45000}
          />
        )}
        {ready && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {manifestations.filter((m) => m.image_url).map((m) => (
              <div key={m.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.image_url!} alt={m.name} className="aspect-[4/3] w-full object-cover" />
                <div className="p-2.5">
                  <p className="text-xs font-medium text-neutral-200">{m.name}</p>
                  <button
                    type="button"
                    onClick={() => onDownloadUrl(m.image_url!, `${m.name}.jpg`)}
                    className="mt-1 inline-flex items-center text-xs text-neutral-500 hover:text-white"
                  >
                    <Download className="mr-1 h-3 w-3" /> {copy.download}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {failed && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-[#FF0040]">{copy.failed}</p>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} disabled={retrying}>
                {retrying ? copy.retrying : copy.retry}
              </Button>
            )}
          </div>
        )}
      </Stack>
    </DeliverySurface>
  )
}

