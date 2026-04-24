'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Spinner, Button, DeleteConfirmationDialog } from '@/lib/design-system/components'
import { Clock, CheckCircle, AlertCircle, Loader2, ListMusic, Trash2, Target, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useAudioStudio } from '@/components/audio-studio'
import { createClient } from '@/lib/supabase/client'
import { getVisionCategoryLabel, isValidVisionCategory } from '@/lib/design-system/vision-categories'

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

/**
 * Story jobs set `content_type` on the batch row; metadata alone is not always present.
 * Keeps source filters and badges consistent.
 */
function isStoryBatch(batch: {
  content_type?: string | null
  metadata?: Record<string, unknown> | null
}): boolean {
  const ct = batch.content_type
  if (ct === 'story' || ct === 'focus_story') return true
  const meta = batch.metadata
  if (!meta) return false
  if (meta.source_type === 'story') return true
  if (meta.content_type === 'story') return true
  return false
}

/** Single variant id -> user-facing label (aligned with /audio listen set names). */
function formatVariantIdLabel(variantId: string): string {
  if (variantId === 'standard') return 'Voice Only'
  if (variantId === 'personal') return 'Personal Recording'
  if (variantId === 'custom' || variantId.startsWith('custom-')) return 'Custom mix'
  return variantId.charAt(0).toUpperCase() + variantId.slice(1)
}

function formatVariantIdsList(variantIds: string[] | undefined): string {
  if (!variantIds?.length) return 'Audio Generation'
  return variantIds.map(formatVariantIdLabel).join(', ')
}

/**
 * Prefer stored audio_set_name (same as generated audio set titles), then custom-mix ratio hint, then variant labels.
 */
function getBatchDisplayTitle(batch: { metadata?: Record<string, unknown>; variant_ids?: string[] }): string {
  const raw = batch.metadata?.audio_set_name
  if (typeof raw === 'string' && raw.trim()) return raw.trim()

  const meta = batch.metadata
  if (meta && meta.custom_mix === true) {
    const vv = meta.voice_volume
    const bv = meta.bg_volume
    const bin = meta.binaural_volume
    if (vv !== undefined && bv !== undefined) {
      // Order: voice %, background %, optional frequency %
      const parts = [Math.round(Number(vv)), Math.round(Number(bv))]
      if (bin !== undefined && Number(bin) > 0) parts.push(Math.round(Number(bin)))
      return `Custom mix (${parts.join('/')})`
    }
    return 'Custom mix'
  }

  return formatVariantIdsList(batch.variant_ids)
}

function sectionKeyLabel(key: string): string {
  if (key === 'full') return 'Full narrative'
  if (isValidVisionCategory(key)) return getVisionCategoryLabel(key)
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * Custom-mix summary: Voice, then Background, then Frequency (if any); then · then scope (e.g. All vision sections & Combined Full Track).
 */
function formatCustomMixDetailLine(
  meta: Record<string, unknown>,
  sectionsRequested: Array<{ sectionKey: string }> | undefined,
  trackNames: { backgrounds: Record<string, string>; binaurals: Record<string, string> },
  isStoryScope: boolean,
): string {
  const bgId = meta.background_track_id as string | undefined
  const binId = meta.binaural_track_id as string | undefined
  const vv = meta.voice_volume
  const bv = meta.bg_volume
  const binVol = meta.binaural_volume
  const bgName = bgId ? trackNames.backgrounds[bgId] : undefined
  const binName = binId ? trackNames.binaurals[binId] : undefined

  const mixChunks: string[] = []

  if (vv !== undefined) {
    mixChunks.push(`Voice: ${Math.round(Number(vv))}% voice`)
  }

  if (bv !== undefined && Number(bv) > 0) {
    const pct = Math.round(Number(bv))
    if (bgName) {
      mixChunks.push(`Background: ${pct}% ${bgName}`)
    } else {
      mixChunks.push(`Background: ${pct}%`)
    }
  }

  if (binName && binVol !== undefined && Number(binVol) > 0) {
    mixChunks.push(`Frequency: ${Math.round(Number(binVol))}% ${binName}`)
  }

  const scopeChunks: string[] = []
  if (isStoryScope) {
    scopeChunks.push('Full story')
  } else if (meta.mix_all_sections === true) {
    scopeChunks.push('All vision sections')
  } else {
    const sel = meta.selected_sections as string[] | null | undefined
    if (Array.isArray(sel) && sel.length > 0) {
      scopeChunks.push(`Sections: ${sel.map(sectionKeyLabel).join(', ')}`)
    } else if (sectionsRequested?.length) {
      const keys = sectionsRequested.map(s => s.sectionKey)
      if (keys.length === 1 && keys[0] === 'full') {
        scopeChunks.push('Full narrative')
      } else {
        scopeChunks.push(`Sections: ${keys.map(sectionKeyLabel).join(', ')}`)
      }
    }
  }

  const fmt = meta.output_format as string | undefined
  const multiSection = !!(sectionsRequested && sectionsRequested.length > 1)
  if (fmt === 'combined') {
    scopeChunks.push('Combined Full Track')
  } else if (fmt === 'both' && multiSection) {
    scopeChunks.push('Combined Full Track')
  } else if (fmt === 'individual' && multiSection) {
    scopeChunks.push('Individual sections')
  }

  const mixStr = mixChunks.join(' + ')
  const scopeStr = scopeChunks.join(' & ')
  if (mixStr && scopeStr) return `${mixStr} · ${scopeStr}`
  if (mixStr) return mixStr
  return scopeStr
}

export default function AudioQueuePage() {
  const { allBatches, allBatchesLoading, refreshAllBatches } = useAudioStudio()
  const [voices, setVoices] = useState<Voice[]>([])
  const [mixTrackNames, setMixTrackNames] = useState<{
    backgrounds: Record<string, string>
    binaurals: Record<string, string>
  }>({ backgrounds: {}, binaurals: {} })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadVoices()
    refreshAllBatches()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadMixTrackNames() {
      const custom = allBatches.filter(b => b.metadata?.custom_mix)
      const bgIds = [...new Set(custom.map(b => b.metadata?.background_track_id).filter(Boolean) as string[])]
      const binIds = [...new Set(custom.map(b => b.metadata?.binaural_track_id).filter(Boolean) as string[])]
      if (bgIds.length === 0 && binIds.length === 0) {
        if (!cancelled) setMixTrackNames({ backgrounds: {}, binaurals: {} })
        return
      }
      const supabase = createClient()
      const backgrounds: Record<string, string> = {}
      const binaurals: Record<string, string> = {}
      if (bgIds.length > 0) {
        const { data } = await supabase.from('audio_background_tracks').select('id, display_name').in('id', bgIds)
        data?.forEach((row: { id: string; display_name: string }) => {
          backgrounds[row.id] = row.display_name
        })
      }
      if (binIds.length > 0) {
        const { data } = await supabase.from('audio_background_tracks').select('id, display_name').in('id', binIds)
        data?.forEach((row: { id: string; display_name: string }) => {
          binaurals[row.id] = row.display_name
        })
      }
      if (!cancelled) setMixTrackNames({ backgrounds, binaurals })
    }
    loadMixTrackNames()
    return () => { cancelled = true }
  }, [allBatches])

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
      const story = isStoryBatch(b)
      if (sourceFilter === 'story' && !story) return false
      if (sourceFilter === 'life_vision' && story) return false
    }

    return true
  })

  const active = filteredBatches.filter(b => ['pending', 'processing'].includes(b.status))
  const completed = filteredBatches.filter(b => !['pending', 'processing'].includes(b.status))

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <h1 className="sr-only">Generation Queue</h1>

        {allBatches.length === 0 ? (
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center py-12">
            <ListMusic className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm">No generation jobs yet.</p>
            <p className="text-neutral-500 text-xs mt-1">Jobs will appear here when you generate or mix audio.</p>
          </Card>
        ) : (
          <>
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
                {active.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">In Progress</h3>
                    {active.map(batch => (
                      <Link key={batch.id} href={`/audio/queue/${batch.id}`} className="block">
                        <BatchCard
                          batch={batch}
                          voices={voices}
                          mixTrackNames={mixTrackNames}
                          onDelete={(b) => { setBatchToDelete(b); setShowDeleteConfirm(true) }}
                        />
                      </Link>
                    ))}
                  </section>
                )}

                {completed.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Recent</h3>
                    {completed.map(batch => (
                      <Link key={batch.id} href={`/audio/queue/${batch.id}`} className="block">
                        <BatchCard
                          batch={batch}
                          voices={voices}
                          mixTrackNames={mixTrackNames}
                          onDelete={(b) => { setBatchToDelete(b); setShowDeleteConfirm(true) }}
                        />
                      </Link>
                    ))}
                  </section>
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

function BatchCard({
  batch,
  voices,
  mixTrackNames,
  onDelete,
}: {
  batch: any
  voices: Voice[]
  mixTrackNames: { backgrounds: Record<string, string>; binaurals: Record<string, string> }
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
  const story = isStoryBatch(batch)
  const batchLabel = getBatchDisplayTitle(batch)
  const customMixDetail =
    batch.metadata?.custom_mix === true
      ? formatCustomMixDetailLine(
          batch.metadata as Record<string, unknown>,
          batch.sections_requested as Array<{ sectionKey: string }> | undefined,
          mixTrackNames,
          story,
        )
      : ''

  return (
    <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-4 hover:border-neutral-600 transition-colors cursor-pointer">
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
            {story ? (
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
          {customMixDetail ? (
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-3">{customMixDetail}</p>
          ) : null}
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
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(batch) }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
          title="Delete batch"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  )
}
