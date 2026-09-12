'use client'

import Link from 'next/link'
import { Loader2, Package } from 'lucide-react'
import type { KitRunSummary, QueueBatch } from './AudioStudioContext'

export function kitRunBatchIds(run: KitRunSummary): string[] {
  const ids: string[] = []
  const voiceId = run.asset_status?.voice?.batch_id
  if (typeof voiceId === 'string' && voiceId) ids.push(voiceId)
  if (run.mix_batch_id) ids.push(run.mix_batch_id)
  const mixBatches = run.asset_status?.mix?.batches
  if (Array.isArray(mixBatches)) {
    for (const batch of mixBatches) {
      if (batch?.batch_id) ids.push(batch.batch_id)
    }
  }
  return [...new Set(ids)]
}

function assetState(run: KitRunSummary, key: 'voice' | 'mix' | 'board') {
  return run.asset_status?.[key]?.state
}

function phaseCopy(run: KitRunSummary): { title: string; detail: string } {
  const voice = run.asset_status?.voice?.state
  const mix = run.asset_status?.mix?.state
  const board = run.asset_status?.board?.state

  if (voice === 'generating' || voice === 'pending') {
    return {
      title: 'Narrating your vision',
      detail: 'Voice tracks first, then mixes and board images. This keeps going if you leave or lose connection.',
    }
  }
  if (mix === 'generating' || mix === 'pending') {
    return {
      title: 'Mixing your audio',
      detail: 'Background music is being mixed in. This keeps going if you leave or lose connection.',
    }
  }
  if (board === 'generating' || board === 'pending') {
    return {
      title: 'Creating board images',
      detail: 'Scenes from your vision are being generated. This keeps going if you leave or lose connection.',
    }
  }
  return {
    title: 'Your Activation Kit is generating',
    detail: 'This keeps going if you leave or lose connection. Watch progress here or in the audio queue.',
  }
}

function voiceProgress(run: KitRunSummary, batches: QueueBatch[]) {
  const batchId = run.asset_status?.voice?.batch_id
  const batch = typeof batchId === 'string' ? batches.find((b) => b.id === batchId) : undefined
  const total =
    batch?.total_tracks_expected ||
    (typeof run.asset_status?.voice?.sections_total === 'number' ? run.asset_status.voice.sections_total : 0)
  const completed = batch?.tracks_completed ?? 0
  if (!total) return null
  return { completed, total }
}

export function KitGenerationBanner({
  run,
  batches,
  href = '/audio/queue',
  showQueueLink = true,
}: {
  run: KitRunSummary
  batches: QueueBatch[]
  href?: string
  showQueueLink?: boolean
}) {
  const { title, detail } = phaseCopy(run)
  const progress = voiceProgress(run, batches)
  const pct = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0

  const voiceOn = run.settings.include_voice || run.settings.include_mix
  const mixOn = run.settings.include_mix
  const boardOn = run.settings.include_board
  const voice = assetState(run, 'voice')
  const mix = assetState(run, 'mix')
  const board = assetState(run, 'board')

  return (
    <div className="rounded-2xl border border-[#BF00FF]/30 bg-[#BF00FF]/5 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-[#BF00FF]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-[#BF00FF]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{title}</p>
            <Loader2 className="w-3.5 h-3.5 text-[#BF00FF] animate-spin shrink-0" />
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{detail}</p>

          {progress && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 max-w-xs bg-neutral-800 rounded-full h-1.5">
                <div
                  className="bg-[#BF00FF] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 shrink-0">
                {progress.completed} of {progress.total} tracks
              </span>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {voiceOn && <PhaseChip label="Voice" state={voice} />}
            {mixOn && <PhaseChip label="Mixes" state={mix} />}
            {boardOn && <PhaseChip label="Board" state={board} />}
          </div>

          {showQueueLink && (
            <Link
              href={href}
              className="inline-flex items-center gap-1 mt-2 text-xs text-[#BF00FF] hover:text-[#d24dff] transition-colors"
            >
              View audio queue
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function PhaseChip({ label, state }: { label: string; state?: string }) {
  const ready = state === 'ready'
  const failed = state === 'failed'
  const active = state === 'generating' || state === 'pending'
  return (
    <span
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
        ready
          ? 'bg-[#39FF14]/15 text-[#39FF14]'
          : failed
            ? 'bg-[#FF0040]/15 text-[#FF0040]'
            : 'bg-white/5 text-neutral-400'
      }`}
    >
      {label}
      {ready ? ' ready' : failed ? ' failed' : active ? '…' : ''}
    </span>
  )
}
