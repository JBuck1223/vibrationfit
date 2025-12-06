'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Badge, Spinner, Stack } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Clock, AlertCircle, ArrowLeft, Play, RefreshCw } from 'lucide-react'
import Link from 'next/link'

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
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
  vision_id: string
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

export default function AudioQueuePage({ 
  params 
}: { 
  params: Promise<{ id: string; batchId: string }> 
}) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [batchId, setBatchId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [batch, setBatch] = useState<Batch | null>(null)
  const [tracks, setTracks] = useState<TrackJob[]>([])
  const [showTrackDetails, setShowTrackDetails] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
      setBatchId(p.batchId)
    })()
  }, [params])

  useEffect(() => {
    if (!visionId || !batchId) return
    loadBatchStatus()
  }, [visionId, batchId])

  // Auto-refresh while processing
  useEffect(() => {
    if (!batchId || !autoRefreshEnabled) return
    if (!batch || !['pending', 'processing'].includes(batch.status)) return

    const interval = setInterval(() => {
      loadBatchStatus()
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [batchId, batch?.status, autoRefreshEnabled])

  const cancelBatch = async () => {
    if (!batch) return
    
    setShowCancelDialog(false)
    setCancelling(true)
    const supabase = createClient()
    
    try {
      // Update batch status to cancelled
      const { error: batchError } = await supabase
        .from('audio_generation_batches')
        .update({
          status: 'failed',
          error_message: 'Cancelled by user',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId)
      
      if (batchError) {
        console.error('Failed to cancel batch:', batchError)
        alert('Failed to cancel batch. Please try again.')
        setCancelling(false)
        return
      }
      
      // Update any pending/processing tracks to failed
      if (batch.audio_set_ids && batch.audio_set_ids.length > 0) {
        await supabase
          .from('audio_tracks')
          .update({
            status: 'failed',
            error_message: 'Batch cancelled by user'
          })
          .in('audio_set_id', batch.audio_set_ids)
          .in('status', ['pending', 'processing'])
      }
      
      console.log('✅ Batch cancelled successfully')
      
      // Reload batch status
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
    
    // Load batch
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

    // Load tracks if audio sets exist
    if (batchData.audio_set_ids && batchData.audio_set_ids.length > 0) {
      const { data: tracksData } = await supabase
        .from('audio_tracks')
        .select('id, section_key, status, mix_status, created_at, audio_set_id, audio_url, voice_id, s3_key')
        .in('audio_set_id', batchData.audio_set_ids)
        .order('created_at', { ascending: true })

      if (tracksData) {
        // Get audio set info
        const { data: setsData } = await supabase
          .from('audio_sets')
          .select('id, name, variant')
          .in('id', batchData.audio_set_ids)

        const setMap = new Map(setsData?.map(s => [s.id, { name: s.name, variant: s.variant }]) || [])

        const formattedTracks = tracksData.map((track: any) => {
          const setInfo = setMap.get(track.audio_set_id)
          return {
            id: track.id,
            sectionKey: track.section_key,
            title: prettySectionTitle(track.section_key),
            variant: setInfo?.variant || 'unknown',
            status: track.status,
            mixStatus: track.mix_status,
            setName: setInfo?.name || 'Unknown Set',
            createdAt: track.created_at,
            audioUrl: track.audio_url,
            voiceId: track.voice_id,
            s3Key: track.s3_key
          }
        })

        setTracks(formattedTracks)
      }
    }

    setLoading(false)
  }

  function prettySectionTitle(sectionKey: string): string {
    const map: Record<string, string> = {
      forward: 'Forward',
      fun: 'Fun / Recreation',
      travel: 'Travel / Adventure',
      home: 'Home / Environment',
      family: 'Family / Parenting',
      love: 'Love / Romance',
      health: 'Health / Vitality',
      money: 'Money / Wealth',
      work: 'Work / Career',
      social: 'Social / Friends',
      stuff: 'Possessions / Stuff',
      giving: 'Giving / Legacy',
      spirituality: 'Spirituality',
      conclusion: 'Conclusion',
    }
    return map[sectionKey] || sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  }

  const getStatusBadge = (status: BatchStatus) => {
    switch (status) {
      case 'processing':
        return <Badge variant="info" className="text-sm">⏳ In Progress</Badge>
      case 'completed':
        return <Badge variant="success" className="text-sm">✓ Complete</Badge>
      case 'partial_success':
        return <Badge variant="warning" className="text-sm">⚠ Partial Success</Badge>
      case 'failed':
        return <Badge variant="error" className="text-sm">✗ Failed</Badge>
      default:
        return <Badge variant="info" className="text-sm">Pending</Badge>
    }
  }

  const getStatusIcon = (status: BatchStatus) => {
    switch (status) {
      case 'processing':
        return <Spinner size="md" />
      case 'completed':
        return <CheckCircle className="w-12 h-12 text-green-400" />
      case 'partial_success':
        return <AlertCircle className="w-12 h-12 text-yellow-400" />
      case 'failed':
        return <AlertCircle className="w-12 h-12 text-red-400" />
      default:
        return <Clock className="w-12 h-12 text-neutral-400" />
    }
  }

  const progressPercentage = batch 
    ? (batch.tracks_completed / batch.total_tracks_expected) * 100 
    : 0

  const completedTracks = tracks.filter(t => 
    t.status === 'completed' && (t.mixStatus === 'completed' || t.mixStatus === 'not_required')
  )
  const processingTracks = tracks.filter(t => 
    t.status === 'processing' || t.status === 'pending' || 
    t.mixStatus === 'pending' || t.mixStatus === 'mixing'
  )
  const failedTracks = tracks.filter(t => t.status === 'failed')

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!batch) {
    return (
      <Container size="xl">
        <Card variant="elevated" className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Batch Not Found</h2>
          <p className="text-neutral-400 mb-6">The audio generation batch could not be found.</p>
          <Button variant="primary" asChild>
            <Link href={`/life-vision/${visionId}/audio-generate`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Audio Studio
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Link href="/dashboard" className="hover:text-primary-500 transition-colors">Dashboard</Link>
          <span>›</span>
          <Link href="/life-vision" className="hover:text-primary-500 transition-colors">Life Vision</Link>
          <span>›</span>
          <Link href={`/life-vision/${visionId}/audio-generate`} className="hover:text-primary-500 transition-colors">Audio Studio</Link>
          <span>›</span>
          <span className="text-white">Generation Queue</span>
        </div>

        {/* Hero Header */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="text-center">
              <div className="mb-4">
                {getStatusIcon(batch.status)}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Audio Generation Queue
              </h1>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {getStatusBadge(batch.status)}
                <span className="text-sm text-neutral-400">
                  Started {new Date(batch.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card variant="elevated" className="p-6 md:p-8">
          <div className="space-y-6">
            {/* Progress Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-1">Generation Progress</h2>
                <p className="text-sm md:text-base text-neutral-400">
                  {batch.tracks_completed} of {batch.total_tracks_expected} tracks completed
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
                  <RefreshCw className={`w-4 h-4 mr-2 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
                  {autoRefreshEnabled ? 'Auto-refreshing' : 'Auto-refresh off'}
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full h-4 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs md:text-sm text-neutral-400 flex-wrap gap-2">
                <span className="text-green-400">{batch.tracks_completed} completed</span>
                {batch.tracks_failed > 0 && (
                  <span className="text-red-400">{batch.tracks_failed} failed</span>
                )}
                {batch.tracks_pending > 0 && (
                  <span>{batch.tracks_pending} pending</span>
                )}
              </div>
            </div>

            {/* Variants Info */}
            <div className="pt-4 border-t border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-400 mb-3">Generating Variants:</h3>
              <div className="flex flex-wrap gap-2">
                {batch.variant_ids.map((variant) => {
                  const variantName = variant === 'standard' ? 'Voice Only' :
                                     variant === 'sleep' ? 'Sleep' :
                                     variant === 'energy' ? 'Energy' :
                                     variant === 'meditation' ? 'Meditation' :
                                     variant
                  return (
                    <Badge key={variant} variant="info" className="text-xs">
                      {variantName}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* Success Message */}
            {batch.status === 'completed' && (
              <div className="pt-4 border-t border-neutral-700">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 font-medium text-center">
                    ✓ All tracks generated successfully!
                  </p>
                </div>
              </div>
            )}

            {/* Partial Success Message */}
            {batch.status === 'partial_success' && (
              <div className="pt-4 border-t border-neutral-700">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 font-medium text-center">
                    ⚠ {batch.tracks_completed} of {batch.total_tracks_expected} tracks completed successfully
                  </p>
                  <p className="text-yellow-300 text-sm text-center mt-1">
                    {batch.tracks_failed} track{batch.tracks_failed > 1 ? 's' : ''} failed
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {batch.status === 'failed' && batch.error_message && (
              <div className="pt-4 border-t border-neutral-700">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 font-medium">Error:</p>
                  <p className="text-red-300 text-sm mt-1">{batch.error_message}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Track Details */}
        {tracks.length > 0 && (
          <Card variant="default" className="p-4 md:p-6">
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
                    <Badge variant="success" className="text-xs">
                      {completedTracks.length} ✓
                    </Badge>
                  )}
                  {processingTracks.length > 0 && (
                    <Badge variant="info" className="text-xs">
                      {processingTracks.length} ⏳
                    </Badge>
                  )}
                  {failedTracks.length > 0 && (
                    <Badge variant="error" className="text-xs">
                      {failedTracks.length} ✗
                    </Badge>
                  )}
                </div>
              </div>
              <span className="text-neutral-400">{showTrackDetails ? '▲' : '▼'}</span>
            </button>
            
            {showTrackDetails && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {tracks.map((track) => {
                  const isProcessing = track.status === 'processing' || track.status === 'pending'
                  const isMixing = track.mixStatus === 'pending' || track.mixStatus === 'mixing'
                  const isComplete = track.status === 'completed' && (track.mixStatus === 'completed' || track.mixStatus === 'not_required')
                  const isFailed = track.status === 'failed'
                  
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
                          <div className="text-sm md:text-base font-medium text-white truncate">{track.title}</div>
                          <div className="text-xs text-neutral-400 mt-0.5">{track.setName}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {isProcessing && (
                            <Badge variant="info" className="text-xs flex items-center gap-1 whitespace-nowrap">
                              <Spinner size="sm" className="w-3 h-3" />
                              {track.status === 'pending' ? 'Queued' : 'Generating'}
                            </Badge>
                          )}
                          {isMixing && !isProcessing && (
                            <Badge variant="info" className="text-xs flex items-center gap-1 whitespace-nowrap">
                              <Spinner size="sm" className="w-3 h-3" />
                              Mixing
                            </Badge>
                          )}
                          {isComplete && (
                            <Badge variant="success" className="text-xs whitespace-nowrap">✓ Complete</Badge>
                          )}
                          {isFailed && (
                            <Badge variant="error" className="text-xs whitespace-nowrap">✗ Failed</Badge>
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" asChild className="flex-1">
            <Link href={`/life-vision/${visionId}/audio-generate?refresh=1`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Audio Studio
            </Link>
          </Button>
          
          {/* Cancel button for active batches */}
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
          
          {batch.audio_set_ids.length > 0 && ['completed', 'partial_success'].includes(batch.status) && (
            <Button variant="primary" asChild className="flex-1">
              <Link href={`/life-vision/${visionId}/audio-sets`}>
                <Play className="w-4 h-4 mr-2" />
                Play Generated Audio
              </Link>
            </Button>
          )}
        </div>
      </Stack>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 pt-6 pb-20 md:pb-4">
            <Card className="max-w-md w-full my-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Cancel Generation?</h3>
                <p className="text-neutral-300 mb-6">
                  Are you sure you want to cancel this audio generation batch? Any in-progress generations will be stopped immediately.
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

