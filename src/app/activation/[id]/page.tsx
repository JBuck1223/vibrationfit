'use client'

/**
 * Activation Immersion screen.
 *
 * Start Here guide → the four core assets (Life I Choose, Future-Self Story,
 * Incantation, SparkQuery) → enrichment queue (guided audio, personal song,
 * vision images arrive live) → downloads → post-immersion offer → optional
 * inspired next step. Entry is never blocked on enrichment.
 */

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Stack,
  Text,
  Textarea,
  Spinner,
} from '@/lib/design-system/components'
import {
  Sparkles,
  BookOpen,
  Mic,
  HelpCircle,
  Headphones,
  Music,
  Images,
  Download,
  CheckCircle,
  XCircle,
  ArrowRight,
  Compass,
} from 'lucide-react'
import { getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'

interface AssetState {
  state: 'pending' | 'generating' | 'ready' | 'failed'
  mureka_task_id?: string
  [key: string]: unknown
}

interface ActivationPayload {
  activation: {
    id: string
    status: string
    category: string | null
    vision_statement: string | null
    essence: string | null
    inspired_next_step: string | null
    entered_at: string | null
    asset_status: Record<string, AssetState>
    song_id: string | null
  }
  assets: {
    story: { id: string; title: string; content: string } | null
    incantation: { id: string; title: string; content: string } | null
    sparkQuery: { id: string; title: string; content: string; metadata?: { questions?: string[] } } | null
    song: { id: string; title: string; status: string; tracks: Array<{ id: string; audio_url: string; cover_url: string | null; title: string | null }> } | null
    audioTrack: { id: string; audio_url: string; duration_seconds: number } | null
    manifestations: Array<{ id: string; name: string; description: string | null; image_url: string | null }>
  }
}

const GUIDE_STEPS = [
  'Read your Life I Choose — slowly, like it\'s already true.',
  'Experience your Future-Self Story. Let yourself be there.',
  'Repeat your Incantation out loud, three times.',
  'Ask your SparkQuery and sit with it for one quiet minute.',
  'Notice what possibility opens. That feeling is the activation.',
]

export default function ActivationImmersionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [data, setData] = useState<ActivationPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guideDone, setGuideDone] = useState(false)
  const [inspiredStep, setInspiredStep] = useState('')
  const [inspiredSaved, setInspiredSaved] = useState(false)
  const enrichFired = useRef(false)
  const openedTracked = useRef(false)
  const storyViewTracked = useRef(false)

  const track = useCallback((eventType: string, eventData?: Record<string, unknown>) => {
    fetch('/api/activation/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, activationId: id, eventData }),
    }).catch(() => {})
  }, [id])

  const load = useCallback(async () => {
    const res = await fetch(`/api/activation/${id}`)
    if (res.status === 401) {
      router.replace('/activation')
      return null
    }
    if (!res.ok) throw new Error('Could not load your Activation')
    const payload = (await res.json()) as ActivationPayload
    setData(payload)
    return payload
  }, [id, router])

  // ---- Initial load: track open, kick off enrichment ----
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const payload = await load()
        if (!payload || cancelled) return

        if (!['ready', 'entered'].includes(payload.activation.status)) {
          router.replace(`/activation/experience?id=${id}`)
          return
        }
        if (payload.activation.inspired_next_step) {
          setInspiredStep(payload.activation.inspired_next_step)
          setInspiredSaved(true)
        }
        if (!openedTracked.current) {
          openedTracked.current = true
          track('activation_opened')
        }
        if (!enrichFired.current) {
          enrichFired.current = true
          fetch(`/api/activation/${id}/enrich`, { method: 'POST' })
            .then(() => load())
            .catch(() => {})
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your Activation')
      }
    }
    init()
    return () => { cancelled = true }
  }, [id, load, router, track])

  // ---- Poll while enrichment is in flight ----
  const assetStatus = data?.activation.asset_status || {}
  const enrichmentPending = (['audio', 'song', 'board'] as const).some(
    (k) => !assetStatus[k] || ['pending', 'generating'].includes(assetStatus[k]?.state),
  )

  useEffect(() => {
    if (!data || !enrichmentPending) return
    const interval = setInterval(async () => {
      // Nudge the Mureka poll endpoint so finished songs land in song_tracks
      const taskId = assetStatus.song?.mureka_task_id
      if (assetStatus.song?.state === 'generating' && taskId && data.activation.song_id) {
        fetch(`/api/songs/poll/${taskId}?song_id=${data.activation.song_id}`).catch(() => {})
      }
      try { await load() } catch { /* transient */ }
    }, 8000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.activation.id, enrichmentPending, assetStatus.song?.state])

  async function saveInspiredStep() {
    if (!inspiredStep.trim()) return
    await fetch(`/api/activation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspired_next_step: inspiredStep }),
    }).catch(() => {})
    setInspiredSaved(true)
  }

  function downloadText(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    track('assets_downloaded', { file: filename })
  }

  if (error) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const { activation, assets } = data
  const categoryLabel = activation.category
    ? getVisionCategoryLabel(activation.category as VisionCategoryKey)
    : null
  const sparkQuestions: string[] =
    assets.sparkQuery?.metadata?.questions ||
    (assets.sparkQuery?.content ? assets.sparkQuery.content.split('\n').filter(Boolean) : [])
  const songTrack = assets.song?.tracks?.[0] || null

  const enrichmentItems: Array<{
    key: 'audio' | 'song' | 'board'
    icon: typeof Headphones
    label: string
    ready: boolean
    failed: boolean
  }> = [
    {
      key: 'audio', icon: Headphones, label: 'Vision Audio',
      ready: assetStatus.audio?.state === 'ready' && !!assets.audioTrack,
      failed: assetStatus.audio?.state === 'failed',
    },
    {
      key: 'song', icon: Music, label: 'Your Song',
      ready: !!songTrack,
      failed: assetStatus.song?.state === 'failed',
    },
    {
      key: 'board', icon: Images, label: 'Vision Images',
      ready: assetStatus.board?.state === 'ready' && assets.manifestations.some((m) => m.image_url),
      failed: assetStatus.board?.state === 'failed',
    },
  ]

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-[#39FF14]" />
            <Text size="sm" className="text-[#39FF14] font-semibold uppercase tracking-wider">
              {categoryLabel ? `${categoryLabel} Activation` : 'Your Activation'}
            </Text>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">You're in.</h1>
        </div>

        {/* Start Here guide */}
        <Card variant="outlined" className="bg-[#101010] border-[#BF00FF]/30 p-5 md:p-8">
          <Stack gap="md">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#BF00FF]" />
              <Text size="sm" className="text-white font-semibold">Start Here — your first Activation takes about 3 minutes</Text>
            </div>
            <ol className="space-y-2">
              {GUIDE_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-neutral-300 leading-relaxed">
                  <span className="text-[#BF00FF] font-semibold flex-shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            {!guideDone && (
              <Button variant="secondary" size="sm" onClick={() => setGuideDone(true)} className="w-full sm:w-auto">
                <CheckCircle className="mr-2 h-4 w-4" />
                I've completed my first Activation
              </Button>
            )}
          </Stack>
        </Card>

        {/* 1. Life I Choose */}
        <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/20 p-5 md:p-8">
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#39FF14]" />
                <Text size="sm" className="text-white font-semibold">Life I Choose</Text>
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
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadText('life-i-choose.txt', activation.vision_statement || '')}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Download
              </Button>
            </div>
          </Stack>
        </Card>

        {/* 2. Future-Self Story */}
        {assets.story && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
            <Stack gap="md">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#00FFFF]" />
                <Text size="sm" className="text-white font-semibold">Future-Self Story</Text>
              </div>
              <details
                onToggle={(e) => {
                  if ((e.target as HTMLDetailsElement).open && !storyViewTracked.current) {
                    storyViewTracked.current = true
                    track('story_viewed')
                  }
                }}
              >
                <summary className="cursor-pointer text-sm text-[#00FFFF] hover:underline select-none">
                  Read your story
                </summary>
                <p className="mt-4 text-sm md:text-base text-neutral-200 leading-relaxed whitespace-pre-line">
                  {assets.story.content}
                </p>
              </details>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadText('future-self-story.txt', assets.story?.content || '')}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Download
                </Button>
              </div>
            </Stack>
          </Card>
        )}

        {/* 3 + 4. Incantation & SparkQuery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {assets.incantation && (
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
              <Stack gap="md">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-[#FFB701]" />
                  <Text size="sm" className="text-white font-semibold">Incantation</Text>
                </div>
                <p className="text-xs text-neutral-500">Speak it out loud. Rhythm builds identity.</p>
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
                    Download
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
                  <Text size="sm" className="text-white font-semibold">SparkQuery</Text>
                </div>
                <p className="text-xs text-neutral-500">
                  A question to ask the universe that opens you to new mental possibilities.
                </p>
                <Stack gap="sm">
                  {sparkQuestions.map((q, i) => (
                    <p key={i} className="text-sm md:text-base text-neutral-100 leading-relaxed">
                      {q}
                    </p>
                  ))}
                </Stack>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadText('spark-query.txt', sparkQuestions.join('\n\n'))}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </Stack>
            </Card>
          )}
        </div>

        {/* Enrichment queue */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
              Arriving for you now
            </Text>

            {enrichmentItems.map(({ key, icon: Icon, label, ready, failed }) => (
              <div key={key} className="border-b border-[#1A1A1A] last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 ${ready ? 'text-[#39FF14]' : failed ? 'text-[#FF0040]' : 'text-neutral-500'}`} />
                  <Text size="sm" className="text-white font-medium">{label}</Text>
                  <span className="ml-auto">
                    {ready ? (
                      <CheckCircle className="h-4 w-4 text-[#39FF14]" />
                    ) : failed ? (
                      <span className="flex items-center gap-1 text-xs text-[#FF0040]">
                        <XCircle className="h-3.5 w-3.5" /> didn't come through
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <Spinner size="sm" /> creating
                      </span>
                    )}
                  </span>
                </div>

                {key === 'audio' && ready && assets.audioTrack && (
                  <div className="flex flex-col gap-2">
                    <audio
                      controls
                      src={assets.audioTrack.audio_url}
                      className="w-full"
                      onPlay={() => track('audio_played')}
                    />
                    <div>
                      <a
                        href={assets.audioTrack.audio_url}
                        download="activation-audio.mp3"
                        onClick={() => track('assets_downloaded', { file: 'activation-audio.mp3' })}
                        className="inline-flex items-center text-xs text-neutral-400 hover:text-white"
                      >
                        <Download className="mr-1 h-3.5 w-3.5" /> Download audio
                      </a>
                    </div>
                  </div>
                )}

                {key === 'song' && songTrack && (
                  <div className="flex flex-col gap-2">
                    <audio
                      controls
                      src={songTrack.audio_url}
                      className="w-full"
                      onPlay={() => track('song_played')}
                    />
                    <div>
                      <a
                        href={songTrack.audio_url}
                        download="my-activation-song.mp3"
                        onClick={() => track('assets_downloaded', { file: 'my-activation-song.mp3' })}
                        className="inline-flex items-center text-xs text-neutral-400 hover:text-white"
                      >
                        <Download className="mr-1 h-3.5 w-3.5" /> Download song
                      </a>
                    </div>
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
                            onClick={() => track('assets_downloaded', { file: `image:${m.name}` })}
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

            <p className="text-xs text-neutral-500">
              Everything here is yours to keep — download any of it, any time. No
              need to wait on this page; your Activation stays saved in your account.
            </p>
          </Stack>
        </Card>

        {/* Offer (after the guided first experience) */}
        {guideDone && (
          <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/30 p-5 md:p-8">
            <div className="text-center">
              <Stack gap="md">
                <h3 className="text-lg md:text-2xl font-bold text-white">
                  You've entered one chosen reality. Now make this a way of life.
                </h3>
                <p className="text-sm md:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
                  Vibration Fit is the living system behind what you just experienced:
                  VIVA coaching whenever you need it, new Activations for every area of
                  your life, your Manifestations, community, and the Alignment Gym —
                  across all 12 life categories.
                </p>
                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      track('paid_offer_clicked')
                      window.location.href = '/#pricing'
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Continue With Vibration Fit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Stack>
            </div>
          </Card>
        )}

        {/* Optional inspired next step */}
        {guideDone && (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
            <Stack gap="md">
              <div>
                <Text size="sm" className="text-white font-semibold">What feels inspired now?</Text>
                <p className="text-xs text-neutral-500 mt-1">
                  Totally optional. If an action is calling you from inside this new
                  reality, capture it here.
                </p>
              </div>
              {inspiredSaved ? (
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-[#39FF14] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-neutral-200 leading-relaxed">{inspiredStep}</p>
                </div>
              ) : (
                <>
                  <Textarea
                    value={inspiredStep}
                    onChange={(e) => setInspiredStep(e.target.value)}
                    placeholder="One thing I feel inspired to do..."
                    rows={3}
                  />
                  <div>
                    <Button variant="secondary" size="sm" onClick={saveInspiredStep} disabled={!inspiredStep.trim()}>
                      Save my inspired step
                    </Button>
                  </div>
                </>
              )}
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
