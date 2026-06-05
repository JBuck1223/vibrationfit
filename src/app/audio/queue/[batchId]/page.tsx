'use client'

import React, { useEffect, useState } from 'react'
import { Container, Card, Button, Badge, Spinner, Stack } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Play,
  RefreshCw,
  Target,
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { getVisionCategoryLabel, isValidVisionCategory } from '@/lib/design-system/vision-categories'
import { IntensiveAudioStepCompletionWatcher } from '@/components/intensive/IntensiveAudioStepCompletionWatcher'

type BatchStatus = 'pending' | 'processing' | 'completed' | 'partial_success' | 'failed'

/** Matches /audio/queue list cards for consistent status treatment */
const STATUS_META: Record<
  BatchStatus,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/15',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
  },
  completed: {
    label: 'Complete',
    icon: CheckCircle,
    color: 'text-[#39FF14]',
    bg: 'bg-[#39FF14]/15',
  },
  partial_success: {
    label: 'Partial',
    icon: AlertCircle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
  },
}

interface Batch {
  id: string
  status: BatchStatus
  tracks_completed: number
  tracks_failed: number
  tracks_pending: number
  total_tracks_expected: number
  audio_set_ids: string[]
  variant_ids: string[]
  voice_id: string
  sections_requested?: Array<{ sectionKey: string; text: string }>
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
  vision_id: string
  content_type?: string
  content_id?: string
  metadata?: {
    custom_mix?: boolean
    output_format?: 'individual' | 'combined' | 'both'
    background_track_id?: string
    mix_ratio_id?: string
    binaural_track_id?: string
    binaural_volume?: number
    [key: string]: unknown
  }
}

interface TrackJob {
  id: string
  sectionKey: string
  title: string
  variant: string
  status: string
  mixStatus?: string
  setName: string
  createdAt: string
  audioUrl?: string
  voiceId?: string
  s3Key?: string
}

export default function AudioQueueBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const [batchId, setBatchId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [batch, setBatch] = useState<Batch | null>(null)
  const [tracks, setTracks] = useState<TrackJob[]>([])
  const [showTrackDetails, setShowTrackDetails] = useState(true)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [mixDetails, setMixDetails] = useState<{
    backgroundTrack?: string
    mixRatio?: string
    binauralTrack?: string
    binauralVolume?: number
  }>({})
  const [voiceName, setVoiceName] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      const p = await params
      setBatchId(p.batchId)
    })()
  }, [params])

  useEffect(() => {
    if (!batchId) return
    loadBatchStatus()
  }, [batchId])

  useEffect(() => {
    if (!batchId || !autoRefreshEnabled) return

    const hasActiveTracks = tracks.some(
      t =>
        t.status === 'pending' ||
        t.status === 'processing' ||
        t.mixStatus === 'pending' ||
        t.mixStatus === 'mixing',
    )

    const shouldPoll =
      batch &&
      (['pending', 'processing'].includes(batch.status) || hasActiveTracks)

    if (!shouldPoll) return

    const interval = setInterval(() => {
      loadBatchStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [batchId, batch?.status, tracks, autoRefreshEnabled])

  const isStory =
    batch?.content_type === 'story' || batch?.content_type === 'focus_story'

  const cancelBatch = async () => {
    if (!batch) return

    setShowCancelDialog(false)
    setCancelling(true)
    const supabase = createClient()

    try {
      const { error: batchError } = await supabase
        .from('audio_generation_batches')
        .update({
          status: 'failed',
          error_message: 'Cancelled by user',
          completed_at: new Date().toISOString(),
        })
        .eq('id', batchId)

      if (batchError) {
        console.error('Failed to cancel batch:', batchError)
        alert('Failed to cancel batch. Please try again.')
        setCancelling(false)
        return
      }

      if (batch.audio_set_ids && batch.audio_set_ids.length > 0) {
        await supabase
          .from('audio_tracks')
          .update({
            status: 'failed',
            error_message: 'Batch cancelled by user',
          })
          .in('audio_set_id', batch.audio_set_ids)
          .in('status', ['pending', 'processing'])
      }

      await loadBatchStatus()
      setAutoRefreshEnabled(false)
    } catch (error) {
      console.error('Error cancelling batch:', error)
      alert('An error occurred while cancelling. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const loadBatchStatus = async () => {
    const supabase = createClient()

    const { data: batchData, error: batchError } = await supabase
      .from('audio_generation_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (batchError || !batchData) {
      console.error('Failed to load batch:', batchError)
      setLoading(false)
      return
    }

    setBatch(batchData)

    if (batchData.voice_id) {
      try {
        const voiceResp = await fetch('/api/audio/voices', { cache: 'no-store' })
        const voiceData = await voiceResp.json()
        const voice = (voiceData.voices || []).find(
          (v: any) => v.id === batchData.voice_id,
        )
        if (voice) setVoiceName(voice.brandName || voice.name)
      } catch {}
    }

    if (batchData.metadata?.custom_mix) {
      const details: any = {}
      if (batchData.metadata.background_track_id) {
        const { data: bgTrack } = await supabase
          .from('audio_background_tracks')
          .select('display_name')
          .eq('id', batchData.metadata.background_track_id)
          .single()
        if (bgTrack) details.backgroundTrack = bgTrack.display_name
      }
      if (batchData.metadata.mix_ratio_id) {
        const { data: ratio } = await supabase
          .from('audio_mix_ratios')
          .select('voice_volume, bg_volume')
          .eq('id', batchData.metadata.mix_ratio_id)
          .single()
        if (ratio) details.mixRatio = `${ratio.voice_volume}% / ${ratio.bg_volume}%`
      }
      if (batchData.metadata.binaural_track_id) {
        const { data: binTrack } = await supabase
          .from('audio_background_tracks')
          .select('display_name')
          .eq('id', batchData.metadata.binaural_track_id)
          .single()
        if (binTrack) {
          details.binauralTrack = binTrack.display_name
          details.binauralVolume = batchData.metadata.binaural_volume
        }
      }
      setMixDetails(details)
    }

    const requestedSections =
      batchData.sections_requested?.map((s: any) => s.sectionKey) || []
    const variants = batchData.variant_ids || ['standard']
    const batchOutputFormat = batchData.metadata?.output_format
    const isCombinedOnly = batchOutputFormat === 'combined'

    const expectedTracks: TrackJob[] = []
    if (!isCombinedOnly) {
      for (const sectionKey of requestedSections) {
        for (const variant of variants) {
          const variantName =
            variant === 'standard'
              ? 'Voice Only'
              : variant === 'sleep'
                ? 'Sleep'
                : variant === 'energy'
                  ? 'Energy'
                  : variant === 'meditation'
                    ? 'Meditation'
                    : variant
          expectedTracks.push({
            id: `${sectionKey}-${variant}-pending`,
            sectionKey,
            title: prettySectionTitle(sectionKey),
            variant,
            status: 'pending',
            mixStatus: undefined,
            setName: variantName,
            createdAt: batchData.created_at,
          })
        }
      }
    }

    const includesFullTrack =
      (batchOutputFormat === 'both' || batchOutputFormat === 'combined') &&
      requestedSections.length > 1
    if (includesFullTrack) {
      expectedTracks.push({
        id: 'full-custom-pending',
        sectionKey: 'full',
        title: prettySectionTitle('full'),
        variant: 'custom',
        status: 'pending',
        mixStatus: undefined,
        setName: 'Combined Full Track',
        createdAt: batchData.created_at,
      })
    }

    let audioSetIds = batchData.audio_set_ids || []

    if (audioSetIds.length === 0 && batchData.metadata?.custom_mix) {
      const customVariantPrefix = `custom-${batchId.slice(0, 8)}`
      const query = supabase
        .from('audio_sets')
        .select('id')
        .eq('voice_id', batchData.voice_id)
        .like('variant', `${customVariantPrefix}%`)
        .limit(1)

      if (batchData.vision_id) {
        query.eq('vision_id', batchData.vision_id)
      } else if (batchData.content_id) {
        query.eq('content_id', batchData.content_id)
      }

      const { data: foundSets } = await query
      if (foundSets && foundSets.length > 0) {
        audioSetIds = foundSets.map(s => s.id)
      }
    }

    if (audioSetIds.length > 0) {
      const { data: tracksData } = await supabase
        .from('audio_tracks')
        .select(
          'id, section_key, status, mix_status, created_at, audio_set_id, audio_url, voice_id, s3_key',
        )
        .in('audio_set_id', audioSetIds)
        .order('created_at', { ascending: true })

      if (tracksData) {
        const { data: setsData } = await supabase
          .from('audio_sets')
          .select('id, name, variant')
          .in('id', audioSetIds)

        const setMap = new Map(
          setsData?.map(s => [s.id, { name: s.name, variant: s.variant }]) || [],
        )

        for (const track of tracksData) {
          const setInfo = setMap.get(track.audio_set_id)
          const variant = setInfo?.variant || 'standard'

          if (
            requestedSections.length > 0 &&
            track.section_key !== 'full' &&
            !requestedSections.includes(track.section_key)
          ) {
            continue
          }

          const isCustomVariant = variant.startsWith('custom')
          const index = expectedTracks.findIndex(
            et =>
              et.sectionKey === track.section_key &&
              (et.variant === variant ||
                (isCustomVariant && et.variant === 'custom')),
          )

          if (index >= 0) {
            expectedTracks[index] = {
              id: track.id,
              sectionKey: track.section_key,
              title: prettySectionTitle(track.section_key),
              variant,
              status: track.status,
              mixStatus: track.mix_status,
              setName: setInfo?.name || 'Unknown Set',
              createdAt: track.created_at,
              audioUrl: track.audio_url,
              voiceId: track.voice_id,
              s3Key: track.s3_key,
            }
          }
        }
      }
    }

    const { VISION_CATEGORIES } = await import(
      '@/lib/design-system/vision-categories'
    )
    const categoryOrder = new Map<string, number>(
      VISION_CATEGORIES.map(cat => [cat.key, cat.order]),
    )
    expectedTracks.sort((a, b) => {
      const orderA = categoryOrder.get(a.sectionKey) ?? 99
      const orderB = categoryOrder.get(b.sectionKey) ?? 99
      return orderA - orderB
    })

    setTracks(expectedTracks)
    setLoading(false)
  }

  function prettySectionTitle(sectionKey: string): string {
    if (sectionKey === 'full') return isStory ? 'Full Story' : 'Full Life Vision'
    if (isValidVisionCategory(sectionKey)) return getVisionCategoryLabel(sectionKey as any)
    return sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)
  }

  const getStatusBadge = (status: BatchStatus) => {
    const m = STATUS_META[status]
    const Icon = m.icon
    const variant =
      status === 'completed'
        ? 'success'
        : status === 'failed'
          ? 'error'
          : status === 'partial_success'
            ? 'warning'
            : 'info'
    const label =
      status === 'processing'
        ? 'In Progress'
        : status === 'partial_success'
          ? 'Partial Success'
          : m.label
    return (
      <Badge variant={variant} className="text-xs flex items-center gap-1.5 font-medium">
        <Icon className={`w-3.5 h-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {label}
      </Badge>
    )
  }

  const completedTracks = tracks.filter(
    t =>
      t.status === 'completed' &&
      (t.mixStatus === 'completed' ||
        t.mixStatus === 'not_required' ||
        !t.mixStatus),
  )
  const processingTracks = tracks.filter(
    t =>
      t.status === 'processing' ||
      t.status === 'pending' ||
      t.mixStatus === 'pending' ||
      t.mixStatus === 'mixing',
  )
  const failedTracks = tracks.filter(
    t => t.status === 'failed' || t.mixStatus === 'failed',
  )

  const isCombinedOnlyBatch = batch?.metadata?.output_format === 'combined'
  const totalTracks = isCombinedOnlyBatch
    ? 1
    : batch?.total_tracks_expected || 1
  const actuallyCompleted = completedTracks.length
  const tracksLeftToComplete = totalTracks - actuallyCompleted
  const stillProcessing = processingTracks.length
  const hasFailed = failedTracks.length

  const effectiveCompleted =
    tracks.length < totalTracks &&
    stillProcessing === 0 &&
    hasFailed === 0
      ? 0
      : actuallyCompleted

  const progressPercentage = (effectiveCompleted / totalTracks) * 100

  if (loading) {
    return (
      <Container size="xl" className="mx-auto max-w-2xl pt-2 pb-4">
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!batch) {
    return (
      <Container size="xl" className="mx-auto max-w-2xl pt-2 pb-4">
        <Card variant="outlined" className="border-[#1F1F1F] bg-[#101010] text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Batch Not Found</h2>
          <p className="text-neutral-400 mb-6">
            The audio generation batch could not be found.
          </p>
          <Button variant="primary" asChild>
            <Link href="/audio/queue">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queue
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const progressBarFill =
    batch.status === 'failed'
      ? 'bg-[#FF0040]'
      : batch.status === 'completed'
        ? 'bg-[#39FF14]'
        : 'bg-blue-500'

  const createdAtFormatted = new Date(batch.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <Container size="xl" className="mx-auto max-w-2xl pt-2 pb-3 sm:pb-4">
      <Stack gap="md">
        <h1 className="sr-only">Audio generation job</h1>

        <Card
          variant="outlined"
          className="rounded-2xl border-[#1F1F1F] bg-[#101010] p-4 sm:p-5"
        >
          <div className="space-y-5">
            <div className="flex flex-col gap-2 border-b border-[#1F1F1F] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] leading-snug">
                <time dateTime={batch.created_at} className="tabular-nums text-neutral-400">
                  {createdAtFormatted}
                </time>
                {isStory ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-medium text-teal-400">
                    <BookOpen className="h-2.5 w-2.5" />
                    Story
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
                    <Target className="h-2.5 w-2.5" />
                    Life Vision
                  </span>
                )}
              </div>
              <div className="flex shrink-0 sm:justify-end">{getStatusBadge(batch.status)}</div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xs font-medium text-neutral-500">Progress</h2>
                <p className="mt-0.5 text-sm text-neutral-300">
                  {isCombinedOnlyBatch
                    ? actuallyCompleted > 0
                      ? 'Combined track ready'
                      : 'Creating combined track...'
                    : `${actuallyCompleted} of ${totalTracks} tracks completed`}
                  {failedTracks.length > 0 && (
                    <span className="ml-1.5 text-red-400/95">
                      ({failedTracks.length} failed)
                    </span>
                  )}
                </p>
              </div>
              {['pending', 'processing'].includes(batch.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-neutral-400"
                  onClick={() => {
                    setAutoRefreshEnabled(!autoRefreshEnabled)
                    if (!autoRefreshEnabled) loadBatchStatus()
                  }}
                >
                  <RefreshCw
                    className={`mr-1.5 h-3.5 w-3.5 ${autoRefreshEnabled ? 'animate-spin' : ''}`}
                  />
                  {autoRefreshEnabled ? 'Auto-refreshing' : 'Auto-refresh off'}
                </Button>
              )}
            </div>

            <div className="relative">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${progressBarFill}`}
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                />
              </div>
            </div>

            {batch.audio_set_ids.length > 0 &&
              ['completed', 'partial_success'].includes(batch.status) && (
                <div className="flex justify-center">
                  <Button variant="primary" asChild>
                    <Link href={
                      isStory
                        ? `/audio/stories?storyId=${batch.content_id || ''}`
                        : `/audio?audioSetId=${batch.audio_set_ids[0]}`
                    }>
                      <Play className="w-4 h-4 mr-2" />
                      Listen to Audio
                    </Link>
                  </Button>
                </div>
              )}

            <div className="border-t border-[#1F1F1F] pt-4">
              {batch.metadata?.custom_mix ? (
                <>
                  <h3 className="mb-2.5 text-xs font-medium text-neutral-500">Mix</h3>
                  <div className="divide-y divide-[#333333] rounded-lg border border-[#333333] bg-[#0a0a0a]">
                    {mixDetails.backgroundTrack && (
                      <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 text-sm">
                        <span className="text-neutral-500">Background</span>
                        <span className="truncate text-right text-neutral-200">
                          {mixDetails.backgroundTrack}
                        </span>
                      </div>
                    )}
                    {mixDetails.mixRatio && (
                      <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 text-sm">
                        <span className="text-neutral-500">Ratio</span>
                        <span className="text-neutral-200">{mixDetails.mixRatio}</span>
                      </div>
                    )}
                    {mixDetails.binauralTrack && (
                      <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 text-sm">
                        <span className="text-neutral-500">Binaural</span>
                        <span className="truncate text-right text-neutral-200">
                          {mixDetails.binauralTrack}
                          {mixDetails.binauralVolume != null
                            ? ` (${mixDetails.binauralVolume}%)`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mb-2.5 text-xs font-medium text-neutral-500">Details</h3>
                  <div className="divide-y divide-[#333333] rounded-lg border border-[#333333] bg-[#0a0a0a]">
                    {voiceName && (
                      <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 text-sm">
                        <span className="text-neutral-500">Voice</span>
                        <span className="truncate text-right text-neutral-200">{voiceName}</span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 text-sm">
                      <span className="text-neutral-500">Tracks</span>
                      <span className="text-neutral-200">{batch.total_tracks_expected}</span>
                    </div>
                    <div className="px-3 py-2.5">
                      <span className="text-xs text-neutral-500">Variants</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {batch.variant_ids.map(variant => {
                          const variantName =
                            variant === 'standard'
                              ? 'Voice Only'
                              : variant === 'sleep'
                                ? 'Sleep'
                                : variant === 'energy'
                                  ? 'Energy'
                                  : variant === 'meditation'
                                    ? 'Meditation'
                                    : variant
                          return (
                            <span
                              key={variant}
                              className="rounded-md border border-[#333333] bg-[#101010] px-2 py-0.5 text-[11px] text-neutral-300"
                            >
                              {variantName}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {batch.status === 'partial_success' && (
              <div className="border-t border-[#1F1F1F] pt-4">
                <div className="rounded-lg border border-orange-500/25 bg-orange-500/[0.06] px-3 py-2.5 text-sm">
                  <p className="flex items-center gap-2 font-medium text-orange-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {actuallyCompleted} of {batch.total_tracks_expected} tracks completed
                  </p>
                  <p className="mt-1 text-xs text-orange-300/85">
                    {failedTracks.length} track
                    {failedTracks.length !== 1 ? 's' : ''} failed
                  </p>
                </div>
              </div>
            )}

            {batch.status === 'failed' && batch.error_message && (
              <div className="border-t border-[#1F1F1F] pt-4">
                <div className="rounded-lg border border-[#FF0040]/25 bg-[#FF0040]/[0.06] px-3 py-2.5">
                  <p className="text-sm font-medium text-[#FF0040]">Could not complete</p>
                  <p className="mt-1 text-sm text-red-300/90">{batch.error_message}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {tracks.length > 0 && (
          <Card
            variant="outlined"
            className="rounded-2xl border-[#1F1F1F] bg-[#101010] !p-3 sm:!p-4 md:!p-5"
          >
            <button
              type="button"
              onClick={() => setShowTrackDetails(!showTrackDetails)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-medium text-neutral-500">Tracks</span>
                <div className="flex gap-2">
                  {completedTracks.length > 0 && (
                    <Badge
                      variant="success"
                      className="text-xs flex items-center gap-1"
                    >
                      {completedTracks.length}{' '}
                      <CheckCircle className="w-3 h-3" />
                    </Badge>
                  )}
                  {tracksLeftToComplete > 0 && (
                    <Badge
                      variant="info"
                      className="text-xs flex items-center gap-1"
                    >
                      {tracksLeftToComplete} <Clock className="w-3 h-3" />
                    </Badge>
                  )}
                  {failedTracks.length > 0 && (
                    <Badge
                      variant="error"
                      className="text-xs flex items-center gap-1"
                    >
                      {failedTracks.length}{' '}
                      <AlertCircle className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
              </div>
              {showTrackDetails ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              )}
            </button>

            {showTrackDetails && (
              <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-0.5">
                {tracks.map(track => {
                  const isProcessing =
                    track.status === 'processing' || track.status === 'pending'
                  const isMixing =
                    track.mixStatus === 'pending' ||
                    track.mixStatus === 'mixing'
                  const isComplete =
                    track.status === 'completed' &&
                    (track.mixStatus === 'completed' ||
                      track.mixStatus === 'not_required' ||
                      !track.mixStatus)
                  const isFailed =
                    track.status === 'failed' || track.mixStatus === 'failed'

                  return (
                    <div
                      key={track.id}
                      className={`rounded-xl border p-2.5 transition-colors md:p-3 ${
                        isFailed
                          ? 'border-[#FF0040]/25 bg-[#FF0040]/[0.06]'
                          : isComplete
                            ? 'border-[#39FF14]/20 bg-[#39FF14]/[0.04]'
                            : 'border-[#1F1F1F] bg-[#0a0a0a] hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium text-neutral-100 md:text-[15px]">
                            {track.title}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {track.status === 'pending' && (
                            <Badge
                              variant="info"
                              className="text-xs flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Clock className="w-3 h-3" />
                              Queued
                            </Badge>
                          )}
                          {track.status === 'processing' && (
                            <Badge
                              variant="info"
                              className="text-xs flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Spinner size="sm" />
                              Generating
                            </Badge>
                          )}
                          {isMixing && !isProcessing && (
                            <Badge
                              variant="info"
                              className="text-xs flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Spinner size="sm" />
                              Mixing
                            </Badge>
                          )}
                          {isComplete && (
                            <Badge
                              variant="success"
                              className="text-xs whitespace-nowrap flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </Badge>
                          )}
                          {isFailed && (
                            <Badge
                              variant="error"
                              className="text-xs whitespace-nowrap flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          {['pending', 'processing'].includes(batch.status) && (
            <Button
              variant="danger"
              onClick={() => setShowCancelDialog(true)}
              disabled={cancelling}
              className="flex-1"
            >
              {cancelling ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Cancelling...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Cancel Batch
                </>
              )}
            </Button>
          )}

          {batch.audio_set_ids.length > 0 &&
            ['completed', 'partial_success'].includes(batch.status) && (
              <Button variant="primary" asChild>
                <Link href={
                  isStory
                    ? `/audio/stories?storyId=${batch.content_id || ''}`
                    : `/audio?audioSetId=${batch.audio_set_ids[0]}`
                }>
                  <Play className="w-4 h-4 mr-2" />
                  Listen to Audio
                </Link>
              </Button>
            )}
        </div>
      </Stack>

      {showCancelDialog && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 pb-20 pt-6 md:pb-4">
            <Card
              variant="outlined"
              className="my-auto w-full max-w-md rounded-2xl border-[#1F1F1F] bg-[#101010] p-6"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-500/15">
                  <AlertCircle className="h-7 w-7 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Cancel Generation?
                </h3>
                <p className="text-neutral-300 mb-6">
                  Are you sure you want to cancel this audio generation batch?
                  Any in-progress generations will be stopped immediately.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1"
                    disabled={cancelling}
                  >
                    Keep Running
                  </Button>
                  <Button
                    onClick={cancelBatch}
                    loading={cancelling}
                    disabled={cancelling}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    {cancelling ? 'Cancelling...' : 'Stop Generation'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      <IntensiveAudioStepCompletionWatcher />
    </Container>
  )
}
