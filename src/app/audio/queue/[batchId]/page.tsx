'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Badge, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle, Clock, AlertCircle, ArrowLeft, Play, RefreshCw,
  Target, BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { getVisionCategoryLabel, isValidVisionCategory } from '@/lib/design-system/vision-categories'

type BatchStatus = 'pending' | 'processing' | 'completed' | 'partial_success' | 'failed'

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
  const router = useRouter()
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
    switch (status) {
      case 'processing':
        return (
          <Badge variant="info" className="text-sm flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            In Progress
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="success" className="text-sm flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Complete
          </Badge>
        )
      case 'partial_success':
        return (
          <Badge variant="warning" className="text-sm flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Partial Success
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="error" className="text-sm flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="info" className="text-sm">
            Pending
          </Badge>
        )
    }
  }

  const getStatusIcon = (status: BatchStatus) => {
    switch (status) {
      case 'processing':
        return <Spinner size="md" />
      case 'completed':
        return <CheckCircle className="w-12 h-12" style={{ color: '#39FF14' }} />
      case 'partial_success':
        return <AlertCircle className="w-12 h-12 text-yellow-400" />
      case 'failed':
        return <AlertCircle className="w-12 h-12 text-red-400" />
      default:
        return <Clock className="w-12 h-12 text-neutral-400" />
    }
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
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!batch) {
    return (
      <Container size="xl" className="py-6">
        <Card variant="elevated" className="text-center py-12">
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

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/audio/queue">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Queue
            </Link>
          </Button>
          {isStory ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400">
              <BookOpen className="w-3 h-3" />
              Story
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
              <Target className="w-3 h-3" />
              Life Vision
            </span>
          )}
        </div>

        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                {getStatusIcon(batch.status)}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                Audio Generation Queue
              </h1>
              <div className="text-sm text-neutral-400 mb-3">
                {new Date(batch.created_at).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
              <div className="flex justify-center">
                {getStatusBadge(batch.status)}
              </div>
            </div>
          </div>
        </div>

        <Card variant="elevated" className="!p-6 md:!p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-1">
                  Generation Progress
                </h2>
                <p className="text-sm md:text-base text-neutral-400">
                  {isCombinedOnlyBatch
                    ? actuallyCompleted > 0
                      ? 'Combined track ready'
                      : 'Creating combined track...'
                    : `${actuallyCompleted} of ${totalTracks} tracks completed`}
                  {failedTracks.length > 0 && (
                    <span className="text-red-400 ml-2">
                      ({failedTracks.length} failed)
                    </span>
                  )}
                </p>
              </div>
              {['pending', 'processing'].includes(batch.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAutoRefreshEnabled(!autoRefreshEnabled)
                    if (!autoRefreshEnabled) loadBatchStatus()
                  }}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${autoRefreshEnabled ? 'animate-spin' : ''}`}
                  />
                  {autoRefreshEnabled ? 'Auto-refreshing' : 'Auto-refresh off'}
                </Button>
              )}
            </div>

            <div className="relative">
              <div className="w-full h-4 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-700">
              {batch.metadata?.custom_mix ? (
                <>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3">
                    Custom Mix Details:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {mixDetails.backgroundTrack && (
                      <Badge variant="info" className="text-xs">
                        Background: {mixDetails.backgroundTrack}
                      </Badge>
                    )}
                    {mixDetails.mixRatio && (
                      <Badge variant="info" className="text-xs">
                        Ratio: {mixDetails.mixRatio}
                      </Badge>
                    )}
                    {mixDetails.binauralTrack && (
                      <Badge variant="accent" className="text-xs">
                        Binaural: {mixDetails.binauralTrack}
                        {mixDetails.binauralVolume
                          ? ` (${mixDetails.binauralVolume}%)`
                          : ''}
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3">
                    Generation Details:
                  </h3>
                  <div className="space-y-3">
                    {voiceName && (
                      <div>
                        <span className="text-xs text-neutral-500">Voice:</span>
                        <div className="text-sm text-white mt-1">{voiceName}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-neutral-500">Tracks:</span>
                      <div className="text-sm text-white mt-1">
                        {batch.total_tracks_expected} tracks
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500">Variants:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
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
                            <Badge key={variant} variant="info" className="text-xs">
                              {variantName}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {((batch.status === 'completed' &&
              actuallyCompleted >= totalTracks &&
              failedTracks.length === 0) ||
              (isCombinedOnlyBatch &&
                completedTracks.some(t => t.sectionKey === 'full'))) && (
              <div className="pt-4 border-t border-neutral-700">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 font-medium text-center flex flex-col sm:flex-row items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    All tracks generated successfully!
                  </p>
                </div>
              </div>
            )}

            {batch.status === 'partial_success' && (
              <div className="pt-4 border-t border-neutral-700">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 font-medium text-center flex flex-col sm:flex-row items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {actuallyCompleted} of {batch.total_tracks_expected} tracks
                    completed successfully
                  </p>
                  <p className="text-yellow-300 text-sm text-center mt-1">
                    {failedTracks.length} track
                    {failedTracks.length !== 1 ? 's' : ''} failed
                  </p>
                </div>
              </div>
            )}

            {batch.status === 'failed' && batch.error_message && (
              <div className="pt-4 border-t border-neutral-700">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 font-medium">Error:</p>
                  <p className="text-red-300 text-sm mt-1">
                    {batch.error_message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {tracks.length > 0 && (
          <Card variant="default" className="!p-4 md:!p-6">
            <button
              onClick={() => setShowTrackDetails(!showTrackDetails)}
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-base md:text-lg font-medium text-white">
                  Track Details
                </span>
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
              <span className="text-neutral-400">
                {showTrackDetails ? '\u25B2' : '\u25BC'}
              </span>
            </button>

            {showTrackDetails && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
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
                      className={`p-3 md:p-4 rounded-lg border-2 transition-colors ${
                        isFailed
                          ? 'border-red-700 bg-red-900/20'
                          : isComplete
                            ? 'border-green-700 bg-green-900/20'
                            : 'border-neutral-700 bg-neutral-900/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm md:text-base font-medium text-white truncate">
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                <Link href="/audio">
                  <Play className="w-4 h-4 mr-2" />
                  Listen to Audio
                </Link>
              </Button>
            )}
        </div>
      </Stack>

      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 pt-6 pb-20 md:pb-4">
            <Card className="max-w-md w-full my-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
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
    </Container>
  )
}
