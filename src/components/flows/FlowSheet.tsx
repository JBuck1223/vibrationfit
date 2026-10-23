'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ARRIVAL_STATES, feelingsForState, getFlow } from '@/lib/flows/catalog'
import type { ArrivalState, FlowContext, FlowDefinition } from '@/lib/flows/types'
import { useManifestationsSnapshot } from '@/components/dashboard/widgets/queries'
import { useActiveFlow } from '@/hooks/useActiveFlow'

interface FlowSheetProps {
  state: ArrivalState
  onClose: () => void
}

function ManifestationPicker({ value, onChange }: { value: string | null; onChange: (id: string, name: string) => void }) {
  const { data, isLoading } = useManifestationsSnapshot()
  const items = data?.items ?? []
  if (isLoading) return <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
  if (items.length === 0) {
    return (
      <p className="text-sm text-white/65">
        You don&apos;t have an active manifestation yet.{' '}
        <Link href="/manifestations/new" className="text-[#39FF14] underline-offset-2 hover:underline">
          Create one
        </Link>{' '}
        and come back.
      </p>
    )
  }
  return (
    <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.slice(0, 8).map((m) => {
        const selected = value === m.id
        return (
          <li key={m.id} className="w-[112px] shrink-0">
            <button
              type="button"
              onClick={() => onChange(m.id, m.name ?? 'Manifestation')}
              aria-pressed={selected}
              className={cn(
                'relative block h-[112px] w-full overflow-hidden rounded-2xl border text-left transition-colors',
                selected ? 'border-[#39FF14]' : 'border-white/10 hover:border-white/30',
              )}
            >
              {m.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute bottom-2 left-2 right-2 line-clamp-2 text-xs font-medium text-white">{m.name}</span>
              {selected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#39FF14] text-black">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function FlowCard({ flow, onStart, starting }: { flow: FlowDefinition; onStart: (ctx: FlowContext) => void; starting: boolean }) {
  const [ctx, setCtx] = React.useState<FlowContext>({})
  const blocked = flow.needs === 'manifestation' && !ctx.manifestationId
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-lg font-semibold text-white">{flow.title}</h3>
      <p className="mt-1 text-sm text-white/70">{flow.promise}</p>
      <ol className="mt-4 space-y-2">
        {flow.steps.map((step, i) => (
          <li key={step.id} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/80">
              {i + 1}
            </span>
            <span className="text-white/85">
              {step.title}
              {step.optional && <span className="ml-1.5 text-xs text-white/45">optional</span>}
            </span>
          </li>
        ))}
      </ol>
      {flow.needs === 'manifestation' && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">What feels most alive?</p>
          <ManifestationPicker value={ctx.manifestationId ?? null} onChange={(id, name) => setCtx({ manifestationId: id, manifestationName: name })} />
        </div>
      )}
      <button
        type="button"
        onClick={() => onStart(ctx)}
        disabled={blocked || starting}
        className="btn btn-primary mt-5 w-full !py-3 text-[15px] disabled:opacity-50"
      >
        {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Start {flow.title}
        {!starting && <ArrowRight className="ml-2 h-4 w-4" />}
      </button>
    </div>
  )
}

/** The paths for one arrival state, as a bottom sheet on phones and a dialog on desktop. */
export function FlowSheet({ state, onClose }: FlowSheetProps) {
  const router = useRouter()
  const { checkIn } = useActiveFlow()
  const meta = ARRIVAL_STATES.find((s) => s.state === state)!
  const feelings = feelingsForState(state)
  const [feelingId, setFeelingId] = React.useState<string | null>(null)
  const feeling = feelings.find((f) => f.id === feelingId) ?? null
  const flow = feeling?.flowId ? getFlow(feeling.flowId) : null

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const start = async (flow: FlowDefinition, ctx: FlowContext) => {
    await checkIn.mutateAsync({ state, feeling: feeling?.id, flowId: flow.id, context: ctx })
    onClose()
    const first = flow.steps[0]
    // A first step with choices is picked in the flow bar; otherwise go straight there.
    if (first && !first.choices && first.href) {
      router.push(typeof first.href === 'function' ? first.href(ctx) : first.href)
    }
  }

  // "Not sure": record the check-in and let VIVA help them name it.
  const notSure = async () => {
    await checkIn.mutateAsync({ state, feeling: feeling?.id })
    onClose()
    router.push(`/viva?draft=${encodeURIComponent('I\u2019m not sure exactly what I\u2019m feeling right now. Can you help me figure it out?')}`)
  }

  const exploreOnly = async () => {
    await checkIn.mutateAsync({ state, feeling: feeling?.id })
    onClose()
    router.push('/tools')
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={meta.greenLine}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-chrome relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] md:max-w-lg md:rounded-3xl md:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: meta.color }}>
              {meta.greenLine}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">{meta.label}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">What&apos;s it like right now?</p>
        <ul className="mb-4 flex flex-wrap gap-2">
          {feelings.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setFeelingId(f.id)}
                aria-pressed={feelingId === f.id}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  feelingId === f.id ? 'text-white' : 'border-white/15 text-white/80 hover:border-white/35 hover:text-white',
                )}
                style={feelingId === f.id ? { borderColor: meta.color, background: meta.tint } : undefined}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>

        {feeling && flow && (
          <FlowCard
            key={flow.id}
            flow={flow}
            starting={checkIn.isPending && checkIn.variables?.flowId === flow.id}
            onStart={(ctx) => void start(flow, ctx)}
          />
        )}
        {feeling && !flow && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-lg font-semibold text-white">Let&apos;s figure it out together</h3>
            <p className="mt-1 text-sm text-white/70">VIVA will help you name what you&apos;re feeling, then point you to what will help most.</p>
            <button
              type="button"
              onClick={() => void notSure()}
              disabled={checkIn.isPending}
              className="btn btn-accent mt-5 w-full !py-3 text-[15px] disabled:opacity-50"
            >
              Talk with VIVA <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => void exploreOnly()}
          className="mt-4 w-full rounded-2xl py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          I know what I want — explore all tools
        </button>
      </div>
    </div>
  )
}
