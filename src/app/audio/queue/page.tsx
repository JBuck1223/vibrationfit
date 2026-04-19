'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Badge, Spinner, Button, DeleteConfirmationDialog, PageHero, Icon } from '@/lib/design-system/components'
import { Clock, CheckCircle, AlertCircle, Loader2, ListMusic, Trash2, Target, BookOpen, Mic, Moon, Zap, Sparkles, Music, Plus, AudioLines, Headphones } from 'lucide-react'
import { useAudioStudio } from '@/components/audio-studio'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Voice {
  id: string
  name: string
}

export default function AudioQueuePage() {
  const { allBatches, allBatchesLoading, refreshAllBatches } = useAudioStudio()
  const [voices, setVoices] = useState<Voice[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadVoices()
    refreshAllBatches()
  }, [])

  async function loadVoices() {
    try {
      const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await resp.json()
      setVoices((data.voices || []).map((v: any) => ({
        id: v.id,
        name: v.brandName || v.name,
      })))
    } catch {}
  }

  async function handleDelete() {
    if (!batchToDelete) return
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('audio_generation_batches')
        .delete()
        .eq('id', batchToDelete.id)
      if (error) throw error
      await refreshAllBatches()
      setShowDeleteConfirm(false)
      setBatchToDelete(null)
    } catch (error) {
      console.error('Failed to delete batch:', error)
      alert('Failed to delete generation batch. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (allBatchesLoading && allBatches.length === 0) {
    return (
      <Container size="xl" className="py-6">
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const STATUS_CHIPS = [
    { key: 'all', label: 'All' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
  ]
  const SOURCE_CHIPS = [
    { key: 'all', label: 'All Sources' },
    { key: 'life_vision', label: 'Life Vision' },
    { key: 'story', label: 'Story' },
  ]

  const filteredBatches = allBatches.filter(b => {
    if (statusFilter === 'in_progress' && !['pending', 'processing'].includes(b.status)) return false
    if (statusFilter === 'completed' && b.status !== 'completed') return false
    if (statusFilter === 'failed' && !['failed', 'partial_success'].includes(b.status)) return false

    if (sourceFilter !== 'all') {
      const batchSource = b.metadata?.source_type || (b.vision_id ? 'life_vision' : 'unknown')
      const isStory = batchSource === 'story' || b.metadata?.content_type === 'story'
      if (sourceFilter === 'story' && !isStory) return false
      if (sourceFilter === 'life_vision' && isStory) return false
    }

    return true
  })

  const hasActiveBatches = filteredBatches.some(b => ['pending', 'processing'].includes(b.status))
  const active = filteredBatches.filter(b => ['pending', 'processing'].includes(b.status))
  const completed = filteredBatches.filter(b => !['pending', 'processing'].includes(b.status))

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <PageHero
          title="Generation Queue"
          subtitle={hasActiveBatches
            ? 'Monitor your in-progress audio generations'
            : 'View your recent audio generation history'}
        />

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/audio/generate">
            <Card variant="elevated" hover className="bg-gradient-to-br from-[#199D67]/20 via-[#14B8A6]/10 to-[#8B5CF6]/20 border-[#39FF14]/30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <AudioLines className="w-6 h-6 text-[#39FF14]" />
                </div>
                <p className="text-white text-lg">Generate Audio</p>
              </div>
            </Card>
          </Link>
          <Link href="/audio/record">
            <Card variant="elevated" hover className="bg-gradient-to-br from-[#D03739]/20 via-[#8B5CF6]/10 to-[#14B8A6]/20 border-[#D03739]/30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#D03739]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-[#D03739]" />
                </div>
                <p className="text-white text-lg">Record Audio</p>
              </div>
            </Card>
          </Link>
          <Link href="/audio">
            <Card variant="elevated" hover className="bg-gradient-to-br from-[#8B5CF6]/20 via-[#14B8A6]/10 to-[#199D67]/20 border-[#8B5CF6]/30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#8B5CF6]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <p className="text-white text-lg">Listen</p>
              </div>
            </Card>
          </Link>
        </div>

        {allBatches.length === 0 ? (
          <Card variant="elevated" className="p-8 md:p-12 text-center">
            <CheckCircle className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Generations Yet</h3>
            <p className="text-neutral-400 mb-6">Start generating audio to see your queue here.</p>
            <Button variant="primary" asChild>
              <Link href="/audio/generate">
                <Plus className="w-4 h-4 mr-2" />
                Generate Audio
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            {/* Filter Chips */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {STATUS_CHIPS.map(chip => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setStatusFilter(chip.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === chip.key
                        ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="w-px h-5 bg-neutral-700 hidden sm:block" />
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {SOURCE_CHIPS.map(chip => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setSourceFilter(chip.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      sourceFilter === chip.key
                        ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredBatches.length === 0 ? (
              <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-8">
                <p className="text-neutral-400 text-sm">No jobs match the selected filters.</p>
              </Card>
            ) : (
              <>
                {/* Active Batches */}
                {active.length > 0 && (
                  <Card variant="elevated" className="bg-blue-500/5 border-blue-500/30">
                    <div className="flex flex-col items-center text-center mb-4">
                      <h2 className="text-xl font-semibold text-white">Generation Queue</h2>
                      <p className="text-sm text-neutral-400 mt-1">
                        {active.length} job{active.length !== 1 ? 's' : ''} in progress
                      </p>
                    </div>
                    <div className="flex flex-col gap-4">
                      {active.map(batch => (
                        <BatchCard
                          key={batch.id}
                          batch={batch}
                          voices={voices}
                          onDelete={(b) => { setBatchToDelete(b); setShowDeleteConfirm(true) }}
                        />
                      ))}
                    </div>
                  </Card>
                )}

                {/* Completed Batches */}
                {completed.length > 0 && (
                  <Card variant="elevated">
                    <div className="flex flex-col items-center text-center mb-4">
                      <h2 className="text-xl font-semibold text-white">Recent Generations</h2>
                    </div>
                    <div className="flex flex-col gap-4">
                      {completed.map(batch => (
                        <BatchCard
                          key={batch.id}
                          batch={batch}
                          voices={voices}
                          onDelete={(b) => { setBatchToDelete(b); setShowDeleteConfirm(true) }}
                        />
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </Stack>

      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setBatchToDelete(null) }}
        onConfirm={handleDelete}
        title="Delete Generation Batch"
        message="This will permanently delete this generation batch and any associated tracks. This action cannot be undone."
        isDeleting={deleting}
      />
    </Container>
  )
}

function getVariantIcon(variantId: string) {
  if (variantId === 'standard') return (
    <div className="p-1.5 rounded-lg bg-primary-500/20">
      <Mic className="w-4 h-4 text-primary-500" />
    </div>
  )
  if (variantId === 'sleep') return (
    <div className="p-1.5 rounded-lg bg-blue-500/20">
      <Moon className="w-4 h-4 text-blue-400" />
    </div>
  )
  if (variantId === 'energy') return (
    <div className="p-1.5 rounded-lg bg-yellow-500/20">
      <Zap className="w-4 h-4 text-yellow-400" />
    </div>
  )
  if (variantId === 'meditation') return (
    <div className="p-1.5 rounded-lg bg-purple-500/20">
      <Sparkles className="w-4 h-4 text-purple-400" />
    </div>
  )
  return (
    <div className="p-1.5 rounded-lg bg-neutral-500/20">
      <Music className="w-4 h-4 text-neutral-400" />
    </div>
  )
}

function BatchCard({
  batch,
  voices,
  onDelete,
}: {
  batch: any
  voices: Voice[]
  onDelete: (batch: any) => void
}) {
  const isActive = ['pending', 'processing'].includes(batch.status)
  const progressPercent = batch.total_tracks_expected > 0
    ? Math.round((batch.tracks_completed / batch.total_tracks_expected) * 100)
    : 0
  const voiceName = voices.find(v => v.id === batch.voice_id)?.name || batch.voice_id
  const sourceType = batch.metadata?.source_type || (batch.vision_id ? 'life_vision' : 'unknown')
  const isStory = sourceType === 'story' || batch.metadata?.content_type === 'story'
  const isCustomMix = batch.metadata?.custom_mix
  const variantLabel = isCustomMix
    ? 'Custom Mix'
    : (batch.variant_ids || []).map((v: string) => v === 'standard' ? 'Voice Only' : v.charAt(0).toUpperCase() + v.slice(1)).join(', ') || 'Audio Generation'

  return (
    <div className="relative">
      <Card variant="default" hover className="cursor-default !py-4 !px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {getVariantIcon(batch.variant_ids?.[0] || 'standard')}

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-medium">{variantLabel}</p>
                <span className="inline-flex md:hidden">
                  <Badge
                    variant={
                      batch.status === 'completed' ? 'success' :
                      batch.status === 'failed' ? 'error' :
                      batch.status === 'partial_success' ? 'warning' :
                      'info'
                    }
                    className="text-xs"
                  >
                    {batch.status === 'processing' ? 'In Progress' :
                     batch.status === 'pending' ? 'Queued' :
                     batch.status === 'completed' ? 'Complete' :
                     batch.status === 'failed' ? 'Failed' :
                     batch.status === 'partial_success' ? 'Partial' :
                     batch.status}
                  </Badge>
                </span>
                {isStory ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400">
                    <BookOpen className="w-2.5 h-2.5" />
                    Story
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                    <Target className="w-2.5 h-2.5" />
                    Life Vision
                  </span>
                )}
              </div>

              <div className="text-sm text-neutral-400">
                Tracks: {batch.tracks_completed}/{batch.total_tracks_expected}
                {batch.tracks_failed > 0 && (
                  <span className="text-red-400 ml-2">({batch.tracks_failed} failed)</span>
                )}
              </div>

              <div className="text-xs text-neutral-500">
                {new Date(batch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {' \u2022 '} {new Date(batch.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>

              <div className="text-xs text-neutral-400">
                Voice: {voiceName}
              </div>

              {isActive && (
                <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex md:flex-col md:items-end md:gap-2">
            <Badge
              variant={
                batch.status === 'completed' ? 'success' :
                batch.status === 'failed' ? 'error' :
                batch.status === 'partial_success' ? 'warning' :
                'info'
              }
              className="text-xs"
            >
              {batch.status === 'processing' ? 'In Progress' :
               batch.status === 'pending' ? 'Queued' :
               batch.status === 'completed' ? 'Complete' :
               batch.status === 'failed' ? 'Failed' :
               batch.status === 'partial_success' ? 'Partial' :
               batch.status}
            </Badge>
          </div>
        </div>
      </Card>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete(batch)
        }}
        className="absolute top-3 right-3 md:bottom-3 md:top-auto p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors z-10"
        aria-label="Delete generation"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
