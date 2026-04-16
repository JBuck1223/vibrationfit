'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Spinner, Button, DeleteConfirmationDialog } from '@/lib/design-system/components'
import { Clock, CheckCircle, AlertCircle, Loader2, ListMusic, Trash2, Target, BookOpen } from 'lucide-react'
import { useAudioStudio } from '@/components/audio-studio'
import { createClient } from '@/lib/supabase/client'

interface Voice {
  id: string
  name: string
}

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  completed: { label: 'Complete', icon: CheckCircle, color: 'text-[#39FF14]', bg: 'bg-[#39FF14]/15' },
  partial_success: { label: 'Partial', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
}

export default function AudioQueuePage() {
  const { allBatches, allBatchesLoading, refreshAllBatches } = useAudioStudio()
  const [voices, setVoices] = useState<Voice[]>([])
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

  const active = allBatches.filter(b => ['pending', 'processing'].includes(b.status))
  const completed = allBatches.filter(b => !['pending', 'processing'].includes(b.status))

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Generation Queue</h2>
          <p className="text-sm text-neutral-400">Track the progress of all your audio generation and mixing jobs.</p>
        </div>

        {allBatches.length === 0 ? (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-12">
            <ListMusic className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm">No generation jobs yet.</p>
            <p className="text-neutral-500 text-xs mt-1">Jobs will appear here when you generate or mix audio.</p>
          </Card>
        ) : (
          <>
            {active.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">In Progress</h3>
                {active.map(batch => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    voices={voices}
                    onDelete={(b) => { setBatchToDelete(b); setShowDeleteConfirm(true) }}
                  />
                ))}
              </section>
            )}

            {completed.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Recent</h3>
                {completed.map(batch => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    voices={voices}
                    onDelete={(b) => { setBatchToDelete(b); setShowDeleteConfirm(true) }}
                  />
                ))}
              </section>
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

function BatchCard({
  batch,
  voices,
  onDelete,
}: {
  batch: any
  voices: Voice[]
  onDelete: (batch: any) => void
}) {
  const meta = STATUS_META[batch.status] || STATUS_META.pending
  const StatusIcon = meta.icon
  const progress = batch.total_tracks_expected > 0
    ? Math.round((batch.tracks_completed / batch.total_tracks_expected) * 100)
    : 0
  const isActive = ['pending', 'processing'].includes(batch.status)
  const dateStr = new Date(batch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const voiceName = voices.find(v => v.id === batch.voice_id)?.name || batch.voice_id
  const sourceType = batch.metadata?.source_type || (batch.vision_id ? 'life_vision' : 'unknown')
  const isStory = sourceType === 'story' || batch.metadata?.content_type === 'story'
  const isCustomMix = batch.metadata?.custom_mix
  const batchLabel = isCustomMix ? 'Custom Mix' : batch.variant_ids?.join(', ') || 'Audio Generation'

  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          <StatusIcon className={`w-4 h-4 ${meta.color} ${isActive && batch.status === 'processing' ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-medium text-white">{batchLabel}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
              {meta.label}
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
          <p className="text-xs text-neutral-500">
            Voice: {voiceName} &middot; {dateStr}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 bg-neutral-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  batch.status === 'failed' ? 'bg-red-500' :
                  batch.status === 'completed' ? 'bg-[#39FF14]' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-neutral-500 flex-shrink-0">
              {batch.tracks_completed}/{batch.total_tracks_expected}
            </span>
          </div>
          {batch.tracks_failed > 0 && (
            <p className="text-[10px] text-red-400 mt-1">{batch.tracks_failed} track{batch.tracks_failed !== 1 ? 's' : ''} failed</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(batch)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
          title="Delete batch"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  )
}
