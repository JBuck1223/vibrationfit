'use client'

import { useEffect, useRef } from 'react'
import {
  Button,
  Card,
  Stack,
  Text,
  Textarea,
  Spinner,
} from '@/lib/design-system/components'
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Compass,
  Download,
  HelpCircle,
  Images,
  Mic,
  Music,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'
import { ACTIVATION_COPY } from '@/lib/activation/copy'

export type DeliveryPhase = 'preview' | 'immersion' | 'offer'

export interface DeliveryActivation {
  id: string
  status: string
  category: string | null
  current_state?: string | null
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
    tracks: Array<{ id: string; audio_url: string; cover_url: string | null; title: string | null }>
  } | null
  audioTracks: Array<{ id: string; audio_url: string; duration_seconds: number; section_key: string }>
  manifestations: Array<{ id: string; name: string; description: string | null; image_url: string | null }>
}

function SpokenTrack({
  track,
  generating,
  failed,
  downloadName,
  onPlay,
  onDownload,
  onRetry,
  retrying,
}: {
  track?: { audio_url: string }
  generating: boolean
  failed: boolean
  downloadName: string
  onPlay: () => void
  onDownload: () => void
  onRetry?: () => void
  retrying?: boolean
}) {
  const copy = ACTIVATION_COPY.immersion
  if (track) {
    return (
      <div className="flex flex-col gap-2">
        <audio controls src={track.audio_url} className="w-full" onPlay={onPlay} />
        <div>
          <a
            href={track.audio_url}
            download={downloadName}
            onClick={onDownload}
            className="inline-flex items-center text-xs text-neutral-400 hover:text-white"
          >
            <Download className="mr-1 h-3.5 w-3.5" /> Download audio
          </a>
        </div>
      </div>
    )
  }
  if (failed) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs text-[#FF0040]">
          <XCircle className="h-3.5 w-3.5" /> {copy.didntComeThrough}
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
      <span className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Spinner size="sm" /> {copy.creating} audio
      </span>
    )
  }
  return null
}

export function ActivationDelivery({
  phase,
  activation,
  assets,
  guideDone,
  onGuideDone,
  onEnter,
  entering,
  inspiredStep,
  inspiredSaved,
  onInspiredChange,
  onInspiredSave,
  onTrack,
  onRetryEnrich,
  retrying,
  hideStickyCta,
}: {
  phase: DeliveryPhase
  activation: DeliveryActivation
  assets: DeliveryAssets
  guideDone?: boolean
  onGuideDone?: () => void
  onEnter?: () => void
  entering?: boolean
  inspiredStep?: string
  inspiredSaved?: boolean
  onInspiredChange?: (value: string) => void
  onInspiredSave?: () => void
  onTrack?: (eventType: string, eventData?: Record<string, unknown>) => void
  onRetryEnrich?: () => void
  retrying?: boolean
  hideStickyCta?: boolean
}) {
  const preview = ACTIVATION_COPY.preview
  const copy = ACTIVATION_COPY.immersion
  const offerRef = useRef<HTMLDivElement>(null)
  const offerViewed = useRef(false)

  const categoryLabel = activation.category
    ? getVisionCategoryLabel(activation.category as VisionCategoryKey)
    : null
  const sparkQuestions: string[] =
    assets.sparkQuery?.metadata?.questions ||
    (assets.sparkQuery?.content ? assets.sparkQuery.content.split('\n').filter(Boolean) : [])
  const songTracks = (assets.song?.tracks || []).filter((t) => t.audio_url)
  const audioTracks = assets.audioTracks || []
  const visionAudio = audioTracks.find((t) => t.section_key === 'life_i_choose')
  const storyAudio = audioTracks.find((t) => t.section_key === 'future_self_story')
  const assetStatus = activation.asset_status || {}
  const audioGenerating = ['pending', 'generating'].includes(String(assetStatus.audio?.state || ''))
  const audioFailed = assetStatus.audio?.state === 'failed'
  const showOffer = phase === 'offer'
  const showImmersionChrome = phase !== 'preview'

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

  function downloadEverything() {
    const html = buildSummaryHtml({ activation, assets, sparkQuestions, categoryLabel })
    downloadText('activation-summary.html', html)
    if (activation.vision_statement) downloadText('life-i-choose.txt', activation.vision_statement)
    if (assets.story?.content) downloadText('future-self-story.txt', assets.story.content)
    if (assets.incantation?.content) downloadText('incantation.txt', assets.incantation.content)
    if (sparkQuestions.length) downloadText('spark-query.txt', sparkQuestions.join('\n\n'))
    if (activation.reflection) downloadText('reflection.txt', activation.reflection)
    onTrack?.('assets_downloaded', { file: 'everything' })
  }

  function goToOffer() {
    document.getElementById('continue')?.scrollIntoView({ behavior: 'smooth' })
  }

  function paidCta() {
    onTrack?.('paid_offer_clicked')
    window.location.href = '/#pricing'
  }

  if (phase === 'preview') {
    const writtenReady = {
      vision: !!activation.vision_statement,
      story: !!assets.story?.content,
      incantation: !!assets.incantation?.content,
      spark_query: sparkQuestions.length > 0,
    }
    return (
      <Stack gap="lg">
        <div className="pt-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[#39FF14]" />
            <Text size="sm" className="text-[#39FF14] font-semibold uppercase tracking-wider">
              {categoryLabel ? copy.categoryTitle(categoryLabel) : preview.eyebrow}
            </Text>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white">{preview.headline}</h1>
          <p className="mt-3 text-sm md:text-base text-neutral-400 leading-relaxed max-w-xl mx-auto">
            {preview.supporting}
          </p>
        </div>

        <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/20 p-5 md:p-8">
          <Stack gap="sm">
            {preview.assets.map((item) => {
              const ready = writtenReady[item.key as keyof typeof writtenReady]
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] px-4 py-3"
                >
                  <CheckCircle className={`h-5 w-5 flex-shrink-0 ${ready ? 'text-[#39FF14]' : 'text-neutral-600'}`} />
                  <Text size="sm" className="text-white font-medium">{item.label}</Text>
                  {ready && (
                    <span className="ml-auto text-xs text-[#39FF14]">Activated</span>
                  )}
                </div>
              )
            })}
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
          <Stack gap="sm">
            <Text size="sm" className="text-neutral-500 uppercase tracking-[0.3em]">{preview.arrivingNext}</Text>
            {preview.queued.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 rounded-xl border border-[#1A1A1A] bg-[#0D0D0D] px-4 py-3"
              >
                <span className="h-5 w-5 rounded-full border border-[#333] flex-shrink-0" />
                <Text size="sm" className="text-neutral-400">{item.label}</Text>
              </div>
            ))}
          </Stack>
        </Card>

        {onEnter && (
          <div className="flex justify-center pb-4">
            <Button variant="primary" size="sm" onClick={onEnter} disabled={entering}>
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

  return (
    <Stack gap="lg">
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-[#39FF14]" />
          <Text size="sm" className="text-[#39FF14] font-semibold uppercase tracking-wider">
            {categoryLabel ? copy.categoryTitle(categoryLabel) : copy.categoryFallback}
          </Text>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{copy.headline}</h1>
      </div>

      {showImmersionChrome && (
        <Card variant="outlined" className="bg-[#101010] border-[#BF00FF]/30 p-5 md:p-8">
          <Stack gap="md">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#BF00FF]" />
              <Text size="sm" className="text-white font-semibold">{copy.guideTitle}</Text>
            </div>
            <ol className="space-y-2">
              {copy.guideSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-neutral-300 leading-relaxed">
                  <span className="text-[#BF00FF] font-semibold flex-shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            {phase === 'immersion' && onGuideDone && (
              <Button variant="secondary" size="sm" onClick={onGuideDone} className="w-full sm:w-auto">
                <CheckCircle className="mr-2 h-4 w-4" />
                {copy.guideDone}
              </Button>
            )}
            {showOffer && (
              <Button variant="ghost" size="sm" onClick={goToOffer} className="w-full sm:w-auto">
                {copy.seeHow}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </Stack>
        </Card>
      )}

      <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/20 p-5 md:p-8">
        <Stack gap="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#39FF14]" />
              <Text size="sm" className="text-white font-semibold">{copy.lifeIChoose}</Text>
            </div>
            {activation.essence && (
              <span className="px-3 py-1 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-medium">
                {activation.essence}
              </span>
            )}
          </div>
          <p className="text-base md:text-lg text-neutral-100 leading-relaxed whitespace-pre-line">
            {activation.vision_statement}
          </p>
          {showImmersionChrome && (
            <SpokenTrack
              track={visionAudio}
              generating={audioGenerating && !visionAudio}
              failed={audioFailed && !visionAudio}
              downloadName="life-i-choose.mp3"
              onPlay={() => onTrack?.('audio_played', { section: 'life_i_choose' })}
              onDownload={() => onTrack?.('assets_downloaded', { file: 'life-i-choose.mp3' })}
              onRetry={onRetryEnrich}
              retrying={retrying}
            />
          )}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadText('life-i-choose.txt', activation.vision_statement || '')}
            >
              <Download className="mr-1.5 h-4 w-4" />
              {copy.download}
            </Button>
          </div>
        </Stack>
      </Card>

      {assets.story && (
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
          <Stack gap="md">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#00FFFF]" />
              <Text size="sm" className="text-white font-semibold">{copy.story}</Text>
            </div>
            <p className="text-sm md:text-base text-neutral-200 leading-relaxed whitespace-pre-line">
              {assets.story.content}
            </p>
            {showImmersionChrome && (
              <SpokenTrack
                track={storyAudio}
                generating={audioGenerating && !storyAudio}
                failed={audioFailed && !storyAudio}
                downloadName="future-self-story.mp3"
                onPlay={() => onTrack?.('audio_played', { section: 'future_self_story' })}
                onDownload={() => onTrack?.('assets_downloaded', { file: 'future-self-story.mp3' })}
                onRetry={onRetryEnrich}
                retrying={retrying}
              />
            )}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadText('future-self-story.txt', assets.story?.content || '')}
              >
                <Download className="mr-1.5 h-4 w-4" />
                {copy.download}
              </Button>
            </div>
          </Stack>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {assets.incantation && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
            <Stack gap="md">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-[#FFB701]" />
                <Text size="sm" className="text-white font-semibold">{copy.incantation}</Text>
              </div>
              <p className="text-xs text-neutral-500">{copy.incantationHint}</p>
              <p className="text-sm md:text-base text-neutral-100 leading-relaxed whitespace-pre-line italic">
                {assets.incantation.content}
              </p>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadText('incantation.txt', assets.incantation?.content || '')}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  {copy.download}
                </Button>
              </div>
            </Stack>
          </Card>
        )}

        {assets.sparkQuery && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
            <Stack gap="md">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#BF00FF]" />
                <Text size="sm" className="text-white font-semibold">{copy.sparkQuery}</Text>
              </div>
              <p className="text-xs text-neutral-500">{copy.sparkHint}</p>
              <Stack gap="sm">
                {sparkQuestions.map((q, i) => (
                  <p key={i} className="text-sm md:text-base text-neutral-100 leading-relaxed">{q}</p>
                ))}
              </Stack>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadText('spark-query.txt', sparkQuestions.join('\n\n'))}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  {copy.download}
                </Button>
              </div>
            </Stack>
          </Card>
        )}
      </div>

      {showImmersionChrome && (
        <EnrichmentCard
          copy={copy}
          assets={assets}
          assetStatus={assetStatus}
          songTracks={songTracks}
          onTrack={onTrack}
          onRetry={onRetryEnrich}
          retrying={retrying}
        />
      )}

      <div>
        <Button variant="secondary" size="sm" onClick={downloadEverything}>
          <Download className="mr-2 h-4 w-4" />
          {copy.downloadEverything}
        </Button>
      </div>

      {showOffer && (
        <div id="continue" ref={offerRef}>
          <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/30 p-5 md:p-8">
            <div className="text-center">
              <Stack gap="md">
                <h3 className="text-lg md:text-2xl font-bold text-white">{copy.offerTitle}</h3>
                <p className="text-sm md:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
                  {copy.offerBody}
                </p>
                <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#222] bg-[#0D0D0D] aspect-video flex items-center justify-center px-6">
                  <p className="text-sm text-neutral-500 leading-relaxed">{copy.offerVideoPlaceholder}</p>
                </div>
                <p className="text-[11px] uppercase tracking-wider text-neutral-600">{copy.offerVideoLabel}</p>
                <div className="flex justify-center">
                  <Button variant="primary" size="sm" onClick={paidCta}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {copy.offerCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Stack>
            </div>
          </Card>
        </div>
      )}

      {showOffer && (
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
          <Stack gap="md">
            <div>
              <Text size="sm" className="text-white font-semibold">{copy.inspiredTitle}</Text>
              <p className="text-xs text-neutral-500 mt-1">{copy.inspiredHint}</p>
            </div>
            {inspiredSaved ? (
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-neutral-200 leading-relaxed">{inspiredStep}</p>
              </div>
            ) : (
              <>
                <Textarea
                  value={inspiredStep || ''}
                  onChange={(e) => onInspiredChange?.(e.target.value)}
                  placeholder={copy.inspiredPlaceholder}
                  rows={3}
                />
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onInspiredSave}
                    disabled={!inspiredStep?.trim()}
                  >
                    {copy.inspiredSave}
                  </Button>
                </div>
              </>
            )}
          </Stack>
        </Card>
      )}

      {showOffer && !hideStickyCta && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#1A1A1A] bg-neutral-850/95 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto px-4 py-3 flex justify-end">
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

function EnrichmentCard({
  copy,
  assets,
  assetStatus,
  songTracks,
  onTrack,
  onRetry,
  retrying,
}: {
  copy: typeof ACTIVATION_COPY.immersion
  assets: DeliveryAssets
  assetStatus: DeliveryActivation['asset_status']
  songTracks: Array<{ id: string; audio_url: string; cover_url: string | null; title: string | null }>
  onTrack?: (eventType: string, eventData?: Record<string, unknown>) => void
  onRetry?: () => void
  retrying?: boolean
}) {
  const items = [
    {
      key: 'song' as const,
      icon: Music,
      label: copy.song,
      ready: songTracks.length > 0,
      failed: assetStatus.song?.state === 'failed',
    },
    {
      key: 'board' as const,
      icon: Images,
      label: copy.images,
      ready: assetStatus.board?.state === 'ready' && assets.manifestations.some((m) => m.image_url),
      failed: assetStatus.board?.state === 'failed',
    },
  ]

  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
      <Stack gap="md">
        <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">{copy.arriving}</Text>
        {items.map(({ key, icon: Icon, label, ready, failed }) => (
          <div key={key} className="border-b border-[#1A1A1A] last:border-0 pb-4 last:pb-0">
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`h-5 w-5 ${ready ? 'text-[#39FF14]' : failed ? 'text-[#FF0040]' : 'text-neutral-500'}`} />
              <Text size="sm" className="text-white font-medium">{label}</Text>
              <span className="ml-auto">
                {ready ? (
                  <CheckCircle className="h-4 w-4 text-[#39FF14]" />
                ) : failed ? (
                  <button
                    type="button"
                    onClick={onRetry}
                    disabled={retrying}
                    className="flex items-center gap-1 text-xs text-[#FF0040] hover:text-white"
                  >
                    <XCircle className="h-3.5 w-3.5" /> {retrying ? copy.retrying : copy.retry}
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Spinner size="sm" /> {copy.creating}
                  </span>
                )}
              </span>
            </div>

            {key === 'song' && (
              <div className="flex flex-col gap-3">
                {assets.song?.lyrics && (
                  <details>
                    <summary className="cursor-pointer text-sm text-neutral-400 hover:text-white select-none">
                      Read the lyrics
                    </summary>
                    <p className="mt-3 text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                      {assets.song.lyrics}
                    </p>
                  </details>
                )}
                {songTracks.map((songTrack, i) => (
                  <div key={songTrack.id} className="flex flex-col gap-2">
                    {songTracks.length > 1 && <p className="text-xs text-neutral-500">Version {i + 1}</p>}
                    <audio
                      controls
                      src={songTrack.audio_url}
                      className="w-full"
                      onPlay={() => onTrack?.('song_played', { version: i + 1 })}
                    />
                    <a
                      href={songTrack.audio_url}
                      download={`my-activation-song${songTracks.length > 1 ? `-v${i + 1}` : ''}.mp3`}
                      onClick={() => onTrack?.('assets_downloaded', { file: `my-activation-song-v${i + 1}.mp3` })}
                      className="inline-flex items-center text-xs text-neutral-400 hover:text-white"
                    >
                      <Download className="mr-1 h-3.5 w-3.5" /> Download song
                    </a>
                  </div>
                ))}
              </div>
            )}

            {key === 'board' && assets.manifestations.some((m) => m.image_url) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                {assets.manifestations.filter((m) => m.image_url).map((m) => (
                  <div key={m.id} className="rounded-xl overflow-hidden border border-[#222] bg-[#0D0D0D]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.image_url!} alt={m.name} className="w-full aspect-[4/3] object-cover" />
                    <div className="p-2.5">
                      <p className="text-xs text-neutral-200 font-medium">{m.name}</p>
                      <a
                        href={m.image_url!}
                        download
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => onTrack?.('assets_downloaded', { file: `image:${m.name}` })}
                        className="inline-flex items-center text-xs text-neutral-500 hover:text-white mt-1"
                      >
                        <Download className="mr-1 h-3 w-3" /> Save
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <p className="text-xs text-neutral-500">{copy.keepNote}</p>
      </Stack>
    </Card>
  )
}

function buildSummaryHtml(params: {
  activation: DeliveryActivation
  assets: DeliveryAssets
  sparkQuestions: string[]
  categoryLabel: string | null
}): string {
  const { activation, assets, sparkQuestions, categoryLabel } = params
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>My Activation</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.6;color:#111}
h1,h2{font-family:system-ui,sans-serif} h2{margin-top:2em}</style></head>
<body>
<h1>${esc(categoryLabel ? `${categoryLabel} Activation` : 'My Activation')}</h1>
${activation.essence ? `<p><em>${esc(activation.essence)}</em></p>` : ''}
${activation.reflection || activation.current_state ? `<h2>What was true</h2><p>${esc(activation.reflection || activation.current_state || '')}</p>` : ''}
<h2>Life I Choose</h2><p>${esc(activation.vision_statement || '')}</p>
${assets.story?.content ? `<h2>Future-Self Story</h2><p>${esc(assets.story.content)}</p>` : ''}
${assets.incantation?.content ? `<h2>Incantation</h2><p>${esc(assets.incantation.content)}</p>` : ''}
${sparkQuestions.length ? `<h2>SparkQuery</h2>${sparkQuestions.map((q) => `<p>${esc(q)}</p>`).join('')}` : ''}
</body></html>`
}
