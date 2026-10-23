'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { FLOWS, getFlow } from '@/lib/flows/catalog'
import type { FlowRunRow } from '@/lib/flows/types'
import { useActiveFlow } from '@/hooks/useActiveFlow'

function labelFor(link: string): string {
  if (link.startsWith('/journal')) return 'Your journal entry'
  if (link.startsWith('/story')) return 'Your activation'
  if (link.startsWith('/daily-paper')) return 'Today’s Daily Paper'
  if (link.startsWith('/abundance')) return 'Your abundance entry'
  if (link.startsWith('/life-vision')) return 'Your Life Vision'
  if (link.startsWith('/vibe-tribe')) return 'Your Tribe post'
  return 'What you made'
}

/** The felt ending of a flow: what it meant, what was made, and one gentle next path. */
export function FlowComplete({ run }: { run: FlowRunRow }) {
  const { update, checkIn } = useActiveFlow()
  const flow = getFlow(run.flow_id)
  if (!flow) return null

  const artifacts = Object.values(run.steps ?? {})
    .map((s) => s.artifact_link)
    .filter((l): l is string => Boolean(l))
  const next = FLOWS.find((f) => f.id === flow.nextFlowIds[0]) ?? null

  const dismiss = () => void update.mutateAsync({ runId: run.id, action: 'seen' })

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={flow.completion.headline}>
      <button type="button" aria-label="Close" onClick={dismiss} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-chrome relative w-full rounded-t-3xl p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] text-center md:max-w-md md:rounded-3xl">
        <button type="button" onClick={dismiss} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(57,255,20,0.16)] text-[#39FF14]">
          <Sparkles className="h-7 w-7" />
        </span>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">{flow.title} · complete</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">{flow.completion.headline}</h2>
        <p className="mt-2 text-sm text-white/75">{flow.completion.body}</p>

        {artifacts.length > 0 && (
          <ul className="mt-5 space-y-2 text-left">
            {artifacts.map((link) => (
              <li key={link}>
                <Link
                  href={link}
                  onClick={dismiss}
                  className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white hover:border-white/25"
                >
                  {labelFor(link)} <ArrowRight className="h-4 w-4 text-white/50" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {next && (
          <button
            type="button"
            onClick={async () => {
              await update.mutateAsync({ runId: run.id, action: 'seen' })
              await checkIn.mutateAsync({ state: next.state, flowId: next.id })
            }}
            className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left hover:border-white/25"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">When you&apos;re ready</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-white">
              {next.title} <ArrowRight className="h-4 w-4 text-[#39FF14]" />
            </span>
          </button>
        )}

        <button type="button" onClick={dismiss} className="mt-3 w-full rounded-2xl py-3 text-sm text-white/65 hover:text-white">
          Done for now
        </button>
      </div>
    </div>
  )
}
