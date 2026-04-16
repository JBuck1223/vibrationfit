'use client'

import React from 'react'
import { Container, Stack, Card, Spinner } from '@/lib/design-system/components'
import { Clock, CheckCircle, AlertCircle, Loader2, ListMusic } from 'lucide-react'
import { useAudioStudio } from '@/components/audio-studio'

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  completed: { label: 'Complete', icon: CheckCircle, color: 'text-[#39FF14]', bg: 'bg-[#39FF14]/15' },
  partial_success: { label: 'Partial', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
}

export default function AudioQueuePage() {
  const { activeBatches, visionLoading } = useAudioStudio()

  if (visionLoading) {
    return (
      <Container size="xl" className="py-6">
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const active = activeBatches.filter(b => ['pending', 'processing'].includes(b.status))
  const completed = activeBatches.filter(b => !['pending', 'processing'].includes(b.status))

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Generation Queue</h2>
          <p className="text-sm text-neutral-400">Track the progress of your audio generation jobs.</p>
        </div>

        {activeBatches.length === 0 ? (
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
                {active.map(batch => <BatchCard key={batch.id} batch={batch} />)}
              </section>
            )}

            {completed.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Recent</h3>
                {completed.map(batch => <BatchCard key={batch.id} batch={batch} />)}
              </section>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}

function BatchCard({ batch }: { batch: { id: string; status: string; tracks_completed: number; tracks_failed: number; total_tracks_expected: number; voice_id: string; variant_ids: string[]; created_at: string } }) {
  const meta = STATUS_META[batch.status] || STATUS_META.pending
  const StatusIcon = meta.icon
  const progress = batch.total_tracks_expected > 0
    ? Math.round((batch.tracks_completed / batch.total_tracks_expected) * 100)
    : 0
  const isActive = ['pending', 'processing'].includes(batch.status)
  const dateStr = new Date(batch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          <StatusIcon className={`w-4 h-4 ${meta.color} ${isActive && batch.status === 'processing' ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-white">
              {batch.variant_ids?.length > 0 ? batch.variant_ids.join(', ') : 'Audio Generation'}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Voice: {batch.voice_id} &middot; {dateStr}
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
      </div>
    </Card>
  )
}
