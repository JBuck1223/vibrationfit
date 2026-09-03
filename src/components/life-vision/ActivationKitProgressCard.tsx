'use client'

/**
 * ActivationKitProgressCard — shows the latest Activation Kit run for a vision
 * on /life-vision/[id]. Polls while running (the GET sync endpoint also flips
 * the async mix asset when the audio-mixer Lambda finishes).
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Mic, Music, Image as ImageIcon, CheckCircle, XCircle, Loader2, Package } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'
import { CommitVisionDialog } from './CommitVisionDialog'

interface AssetState {
  state?: 'pending' | 'generating' | 'ready' | 'failed'
  error_message?: string | null
}

interface KitRun {
  id: string
  vision_id: string
  status: 'running' | 'completed' | 'partial' | 'failed'
  settings: {
    include_voice: boolean
    include_mix: boolean
    include_board: boolean
  }
  asset_status: Record<string, AssetState>
  created_at: string
  completed_at: string | null
}

const SHOW_COMPLETED_FOR_MS = 24 * 60 * 60 * 1000

export function ActivationKitProgressCard({ visionId }: { visionId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  const [showKitDialog, setShowKitDialog] = useState(false)

  const { data: run, isLoading } = useQuery<KitRun | null>({
    queryKey: [...keys.activationKitRuns, visionId],
    refetchInterval: (query) => (query.state.data?.status === 'running' ? 5000 : false),
    queryFn: async () => {
      const { data } = await supabase
        .from('activation_kit_runs')
        .select('id, vision_id, status, settings, asset_status, created_at, completed_at')
        .eq('vision_id', visionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!data) return null

      // Running: sync async assets (mix Lambda) server-side and use the result
      if (data.status === 'running') {
        try {
          const res = await fetch(`/api/activation-kit/runs/${data.id}`)
          if (res.ok) {
            const { run } = await res.json()
            return run as KitRun
          }
        } catch {
          // fall through to the raw row
        }
      }
      return data as KitRun
    },
  })

  if (isLoading) return null

  // Hide old finished runs; without any (recent) run, offer to generate a kit
  const finishedAt = run?.completed_at ? new Date(run.completed_at).getTime() : null
  const runIsStale = run
    ? run.status !== 'running' && !!finishedAt && Date.now() - finishedAt > SHOW_COMPLETED_FOR_MS
    : true

  if (!run || runIsStale) {
    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border-2 border-[#333] bg-[#1F1F1F] px-6 py-4">
          <div className="flex items-center gap-3 flex-1">
            <Package className="w-5 h-5 text-[#BF00FF] shrink-0" />
            <p className="text-sm text-neutral-300">
              Generate an Activation Kit from this vision — voice tracks, mixes, and board images.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowKitDialog(true)}>
            Generate Kit
          </Button>
        </div>
        <CommitVisionDialog
          isOpen={showKitDialog}
          onClose={() => setShowKitDialog(false)}
          kitOnlyVisionId={visionId}
          onCommitted={() => {
            queryClient.invalidateQueries({ queryKey: keys.activationKitRuns })
          }}
        />
      </>
    )
  }

  const assets: Array<{ key: string; label: string; icon: typeof Mic; href: string; enabled: boolean }> = [
    { key: 'voice', label: 'Voice Tracks', icon: Mic, href: '/audio', enabled: run.settings.include_voice || run.settings.include_mix },
    { key: 'mix', label: 'Audio Mixes', icon: Music, href: '/audio', enabled: run.settings.include_mix },
    { key: 'board', label: 'Board Images', icon: ImageIcon, href: '/manifestations', enabled: run.settings.include_board },
  ]
  const visible = assets.filter((a) => a.enabled)
  if (visible.length === 0) return null

  return (
    <div className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] p-6">
      <div className="flex items-center gap-3 mb-4">
        <Package className="w-5 h-5 text-[#BF00FF]" />
        <h3 className="text-white font-semibold">
          {run.status === 'running' ? 'Your Activation Kit is generating' : 'Your Activation Kit'}
        </h3>
        {run.status === 'running' && <Loader2 className="w-4 h-4 text-neutral-400 animate-spin ml-auto" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {visible.map(({ key, label, icon: Icon, href }) => {
          const state = run.asset_status?.[key]?.state || 'pending'
          const ready = state === 'ready'
          const failed = state === 'failed'

          const inner = (
            <div
              className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                ready
                  ? 'border-[#39FF14]/40 bg-[#39FF14]/5 hover:border-[#39FF14]'
                  : failed
                    ? 'border-[#FF0040]/40 bg-[#FF0040]/5'
                    : 'border-[#333] bg-[#0A0A0A]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${ready ? 'text-[#39FF14]' : failed ? 'text-[#FF0040]' : 'text-neutral-500'}`} />
              <span className="text-sm text-white flex-1">{label}</span>
              {ready && <CheckCircle className="w-4 h-4 text-[#39FF14] shrink-0" />}
              {failed && <XCircle className="w-4 h-4 text-[#FF0040] shrink-0" />}
              {!ready && !failed && <Loader2 className="w-4 h-4 text-neutral-500 animate-spin shrink-0" />}
            </div>
          )

          return ready ? (
            <Link key={key} href={href}>{inner}</Link>
          ) : (
            <div key={key}>{inner}</div>
          )
        })}
      </div>

      {run.status === 'partial' && (
        <p className="mt-3 text-xs text-neutral-500">
          Some assets did not finish — you can generate them anytime from the Audio studio.
        </p>
      )}
      {run.status === 'failed' && (
        <p className="mt-3 text-xs text-[#FF0040]">
          Kit generation failed — you can generate these assets from the Audio studio.
        </p>
      )}
    </div>
  )
}
