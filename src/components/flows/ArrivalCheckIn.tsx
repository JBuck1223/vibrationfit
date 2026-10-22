'use client'

import { GLASS_CARD, glassTint } from '@/lib/app-shell/glass'
import React from 'react'
import { ArrowRight, Compass } from 'lucide-react'
import { ARRIVAL_STATES, getFlow } from '@/lib/flows/catalog'
import type { ArrivalState } from '@/lib/flows/types'
import { useActiveFlow } from '@/hooks/useActiveFlow'
import { FlowSheet } from './FlowSheet'

/**
 * "How are you arriving today?" on Home. Three human-language choices, each
 * tagged with where it sits on the Green Line. Once they've checked in today
 * it collapses to a one-line card: the flow in progress, or their state.
 */
export function ArrivalCheckIn() {
  const { data, isLoading } = useActiveFlow()
  const [open, setOpen] = React.useState<ArrivalState | null>(null)
  const [changing, setChanging] = React.useState(false)

  const run = data?.run ?? null
  const checkin = data?.todayCheckin ?? null
  const flow = getFlow(run?.flow_id)
  const stepIndex = flow && run?.current_step ? flow.steps.findIndex((s) => s.id === run.current_step) : -1

  if (isLoading) return <div className="h-[132px] animate-pulse rounded-3xl bg-white/5" />

  const showChoices = changing || (!run && !checkin)

  return (
    <section aria-label="How are you arriving today?">
      {showChoices ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Compass className="h-4 w-4 text-[#39FF14]" />
              How are you arriving today?
            </h2>
            {changing && (
              <button type="button" onClick={() => setChanging(false)} className="text-sm text-white/60 hover:text-white">
                Cancel
              </button>
            )}
          </div>
          <ul className="grid gap-3 md:grid-cols-3">
            {ARRIVAL_STATES.map((s) => (
              <li key={s.state}>
                <button
                  type="button"
                  onClick={() => setOpen(s.state)}
                  className="flex h-full w-full flex-col items-start gap-2 rounded-3xl border p-4 text-left transition-transform active:scale-[0.98]"
style={{ ...glassTint(s.tint), borderColor: `${s.color}55` }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: s.color }}>
                    {s.greenLine}
                  </span>
                  <span className="text-[15px] font-medium leading-snug text-white">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : run && flow ? (
        <div className={`${GLASS_CARD} flex items-center gap-4 p-4`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(57,255,20,0.16)] text-[#39FF14]">
            <Compass className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">You&apos;re on a path</p>
            <p className="truncate text-[15px] font-semibold text-white">
              {flow.title} · Step {Math.max(1, stepIndex + 1)} of {flow.steps.length}
            </p>
          </div>
          <button type="button" onClick={() => setChanging(true)} className="text-sm text-white/60 hover:text-white">
            Change
          </button>
        </div>
      ) : (
        <div className={`${GLASS_CARD} flex items-center gap-4 p-4`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
            <Compass className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Today</p>
            <p className="truncate text-[15px] font-semibold text-white">
              You arrived {ARRIVAL_STATES.find((s) => s.state === checkin?.state)?.greenLine.toLowerCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setChanging(true)}
            className="flex items-center gap-1 text-sm font-medium text-[#39FF14] hover:text-white"
          >
            Find a path <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {open && (
        <FlowSheet
          state={open}
          onClose={() => {
            setOpen(null)
            setChanging(false)
          }}
        />
      )}
    </section>
  )
}
